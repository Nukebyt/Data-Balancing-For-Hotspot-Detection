"""
Train/evaluate a LightweightCNN on one (benchmark, strategy, seed)
triple.

DA3 revisions versus the DA2 version of this file:
  - Training is now STEP-based, not epoch-based: every strategy for a
    given benchmark trains for an identical, pre-computed
    `total_steps` (derived once from the baseline/natural training
    set size for that benchmark), so strategies that shrink (RUS) or
    grow (ROS/ROS+Aug/Combo) the physical dataset size no longer get
    fewer or more gradient updates than the baseline just because of
    that size change ("equalise gradient updates across strategies").
  - A held-out validation split (see src/data_split.py) is evaluated
    periodically during training; the checkpoint with the best
    validation balanced accuracy is kept, and the TEST set is touched
    exactly once, after training, with that single selected
    checkpoint ("select on validation, use test once at the end").
  - Returns predicted probabilities (not just thresholded labels) on
    both validation and test, so PR-AUC can be computed.
  - Returns the full validation learning curve (step, loss, balanced
    accuracy, recall) for later mechanistic diagnostics (e.g. why RUS
    fails) -- see src/run_experiments.py's learning-curve export.
"""
import time
import numpy as np
import torch
from torch.utils.data import DataLoader

from model import LightweightCNN, count_params
from balancing import make_dataset, ArrayDataset
from metrics import compute_metrics

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
BATCH_SIZE = 32
N_CHECKPOINTS = 8  # how many times during training we evaluate on validation


def set_seed(seed):
    np.random.seed(seed)
    torch.manual_seed(seed)


def compute_total_steps(n_baseline_train, batch_size=BATCH_SIZE, epoch_equivalent=8):
    """Shared step budget for ALL strategies on a given benchmark, derived
    once from the natural (baseline) training-set size, so every
    strategy receives the same number of gradient updates regardless
    of how much its own resampled dataset has grown or shrunk."""
    steps_per_epoch = max(1, -(-n_baseline_train // batch_size))  # ceil div
    return steps_per_epoch * epoch_equivalent


def _make_loader(ds, sampler, shuffle):
    if sampler is not None:
        return DataLoader(ds, batch_size=BATCH_SIZE, sampler=sampler, num_workers=0)
    return DataLoader(ds, batch_size=BATCH_SIZE, shuffle=shuffle, num_workers=0)


@torch.no_grad()
def _evaluate(model, loader):
    model.eval()
    all_probs, all_labels = [], []
    t0 = time.time()
    for xb, yb in loader:
        xb = xb.to(DEVICE)
        probs = torch.sigmoid(model(xb))
        all_probs.append(probs.cpu().numpy())
        all_labels.append(yb.numpy())
    dt = time.time() - t0
    y_prob = np.concatenate(all_probs)
    y_true = np.concatenate(all_labels)
    y_pred = (y_prob >= 0.5).astype(int)
    return y_true, y_pred, y_prob, dt


def train_and_evaluate(
    hs_train,
    nhs_train,
    hs_val,
    nhs_val,
    hs_test,
    nhs_test,
    total_steps,
    strategy="none",
    target_ratio=1.0,
    combo_undersample_frac=0.5,
    batch_size=BATCH_SIZE,
    lr=1e-3,
    seed=42,
    return_curve=False,
):
    set_seed(seed)
    rng = np.random.RandomState(seed)

    train_ds, sampler = make_dataset(
        strategy,
        hs_train,
        nhs_train,
        rng,
        target_ratio=target_ratio,
        combo_undersample_frac=combo_undersample_frac,
    )
    train_loader = _make_loader(train_ds, sampler, shuffle=True)

    val_images = np.concatenate([hs_val, nhs_val], axis=0)
    val_labels = np.concatenate([np.ones(len(hs_val)), np.zeros(len(nhs_val))])
    val_loader = DataLoader(ArrayDataset(val_images, val_labels), batch_size=256, shuffle=False)

    test_images = np.concatenate([hs_test, nhs_test], axis=0)
    test_labels = np.concatenate([np.ones(len(hs_test)), np.zeros(len(nhs_test))])
    test_loader = DataLoader(ArrayDataset(test_images, test_labels), batch_size=256, shuffle=False)

    img_size = hs_train.shape[1]
    model = LightweightCNN(in_ch=1, img_size=img_size).to(DEVICE)
    n_params = count_params(model)

    opt = torch.optim.NAdam(model.parameters(), lr=lr)
    loss_fn = torch.nn.BCEWithLogitsLoss()

    checkpoint_every = max(1, total_steps // N_CHECKPOINTS)
    best_val_bal_acc = -1.0
    best_state = None
    best_step = 0
    curve = []  # list of dicts: step, train_loss, val_balanced_accuracy, val_recall, val_specificity

    t0 = time.time()
    model.train()
    step = 0
    running_loss = 0.0
    running_n = 0
    train_iter = iter(train_loader)
    while step < total_steps:
        try:
            xb, yb = next(train_iter)
        except StopIteration:
            train_iter = iter(train_loader)
            xb, yb = next(train_iter)
        xb, yb = xb.to(DEVICE), yb.to(DEVICE)
        opt.zero_grad()
        logits = model(xb)
        loss = loss_fn(logits, yb)
        loss.backward()
        opt.step()
        running_loss += loss.item() * len(yb)
        running_n += len(yb)
        step += 1

        if step % checkpoint_every == 0 or step == total_steps:
            y_true_v, y_pred_v, y_prob_v, _ = _evaluate(model, val_loader)
            m_v = compute_metrics(y_true_v, y_pred_v, y_prob_v)
            curve.append(
                {
                    "step": step,
                    "train_loss": running_loss / max(1, running_n),
                    "val_balanced_accuracy": m_v["balanced_accuracy"],
                    "val_recall": m_v["recall_sensitivity"],
                    "val_specificity": m_v["specificity"],
                }
            )
            running_loss, running_n = 0.0, 0
            if m_v["balanced_accuracy"] >= best_val_bal_acc:
                best_val_bal_acc = m_v["balanced_accuracy"]
                best_state = {k: v.detach().clone() for k, v in model.state_dict().items()}
                best_step = step
            model.train()
    train_time = time.time() - t0

    # restore the checkpoint selected on validation, then touch test ONCE
    if best_state is not None:
        model.load_state_dict(best_state)
    y_true_val, y_pred_val, y_prob_val, _ = _evaluate(model, val_loader)
    val_metrics = compute_metrics(y_true_val, y_pred_val, y_prob_val)

    y_true, y_pred, y_prob, infer_time = _evaluate(model, test_loader)
    metrics = compute_metrics(y_true, y_pred, y_prob)
    metrics["train_time_sec"] = train_time
    metrics["infer_time_sec_total"] = infer_time
    metrics["infer_time_ms_per_image"] = 1000.0 * infer_time / max(1, len(y_true))
    metrics["n_params"] = n_params
    metrics["n_train_samples"] = len(train_ds)
    metrics["total_steps"] = total_steps
    metrics["best_step"] = best_step
    metrics["val_balanced_accuracy"] = val_metrics["balanced_accuracy"]
    metrics["val_recall_sensitivity"] = val_metrics["recall_sensitivity"]
    metrics["val_pr_auc"] = val_metrics.get("pr_auc", float("nan"))

    if return_curve:
        return metrics, curve
    return metrics
