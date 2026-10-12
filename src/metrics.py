"""Evaluation metrics required by the assignment rubric."""
import numpy as np
from sklearn.metrics import average_precision_score


def confusion_counts(y_true, y_pred):
    """Positive class = Hotspot (HS) = 1."""
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    return tp, fp, fn, tn


def compute_metrics(y_true, y_pred, y_prob=None):
    """
    y_prob (optional): predicted P(hotspot) in [0,1] for every sample,
    same order as y_true/y_pred. When given, also reports PR-AUC
    (average precision), which -- unlike ROC-AUC -- is sensitive to
    the positive-class base rate and is therefore the appropriate
    threshold-free ranking metric to report alongside balanced
    accuracy on a severely imbalanced positive class (DA3 feedback).
    """
    tp, fp, fn, tn = confusion_counts(y_true, y_pred)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0  # sensitivity
    specificity = tn / (fp + tn) if (fp + tn) > 0 else 0.0
    f1 = (
        2 * precision * recall / (precision + recall)
        if (precision + recall) > 0
        else 0.0
    )
    balanced_acc = (recall + specificity) / 2
    accuracy = (tp + tn) / max(1, (tp + fp + fn + tn))
    out = {
        "TP": tp,
        "FP": fp,
        "FN": fn,
        "TN": tn,
        "accuracy": accuracy,
        "precision": precision,
        "recall_sensitivity": recall,
        "specificity": specificity,
        "f1_score": f1,
        "balanced_accuracy": balanced_acc,
    }
    if y_prob is not None:
        y_true_arr = np.asarray(y_true)
        if y_true_arr.sum() == 0 or y_true_arr.sum() == len(y_true_arr):
            out["pr_auc"] = float("nan")  # undefined with a single class present
        else:
            out["pr_auc"] = float(average_precision_score(y_true_arr, np.asarray(y_prob)))
    return out
