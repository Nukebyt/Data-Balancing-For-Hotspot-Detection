"""
Data-balancing and augmentation strategies compared in this study
(Group 11: "Data Balancing and Augmentation Strategies for Hotspot
Detection").

Each strategy takes the raw imbalanced training arrays
(hs_imgs, nhs_imgs) -- uint8 arrays of shape (N, H, W) -- and a numpy
RandomState, and returns a torch Dataset used for training. Test data
is NEVER touched by any strategy: balancing/augmentation is applied
only to the training split, evaluation is always on the natural,
untouched, imbalanced test set (this is essential -- otherwise
reported metrics would not reflect real deployment class skew).

Strategies:
  none        - natural imbalance (this is the common baseline)
  rus         - random undersampling of the majority (NHS) class
  ros         - random oversampling of the minority (HS) class (plain duplication)
  ros_aug     - oversampling of HS combined with online augmentation
                (horizontal/vertical flip + 90-degree rotations), so
                duplicated minority samples are not exact pixel copies
  balanced_batch - dataset unchanged in size; a WeightedRandomSampler
                forces each mini-batch to be ~50:50 HS:NHS at draw time
  combo       - moderate (50%) undersampling of NHS + augmented
                oversampling of HS, meeting in the middle
  combo_mild  - same idea as `combo` but with milder (75%-retained)
                undersampling of NHS, to test sensitivity of the
                combined strategy to how aggressively the majority
                class is trimmed (DA3 feedback: "test combined
                strategies" -- plural)
  combo_batch_aug - a third combination: balanced mini-batch sampling
                (no physical duplication/discarding at all) plus
                stochastic on-the-fly augmentation applied whenever a
                minority sample is drawn, so the sampling-level and
                augmentation-level ideas are combined without ever
                altering the stored dataset

An `target_ratio` parameter (HS:NHS) controls how aggressively a
strategy re-balances the class distribution; this is swept in the
ablation study (ratio sweep) in run_experiments.py.

All strategies are applied ONLY to the training portion of a
benchmark; a held-out validation split (carved out once, independent
of strategy and seed -- see `src/data_split.py`) and the test split are
never touched by any balancing/augmentation logic, so checkpoint
selection and final reporting both reflect genuinely unseen,
naturally-imbalanced data (DA3 feedback: validation split / test used
once).
"""
import numpy as np
import torch
from torch.utils.data import Dataset, WeightedRandomSampler

AUG_FLIP_H = "flip_h"
AUG_FLIP_V = "flip_v"
AUG_ROT90 = "rot90"
AUG_ROT180 = "rot180"
AUG_ROT270 = "rot270"
AUG_OPS = [AUG_FLIP_H, AUG_FLIP_V, AUG_ROT90, AUG_ROT180, AUG_ROT270]


def _apply_aug(img, op, rng):
    if op == AUG_FLIP_H:
        return img[:, ::-1].copy()
    if op == AUG_FLIP_V:
        return img[::-1, :].copy()
    if op == AUG_ROT90:
        return np.rot90(img, 1).copy()
    if op == AUG_ROT180:
        return np.rot90(img, 2).copy()
    if op == AUG_ROT270:
        return np.rot90(img, 3).copy()
    return img


class ArrayDataset(Dataset):
    """Simple in-memory (image uint8 HxW, label float) dataset.

    `augment_flags` may be a boolean array (always/never augment that
    row) or a float array of per-row augmentation probabilities in
    [0, 1]; both are handled identically since a random draw is always
    compared against the stored value (`False`/`0.0` never triggers,
    `True`/`1.0` always triggers).
    """

    def __init__(self, images, labels, augment_flags=None, rng_seed=0):
        self.images = images
        self.labels = np.asarray(labels, dtype=np.float32)
        self.augment_flags = augment_flags
        self.rng = np.random.RandomState(rng_seed)

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img = self.images[idx]
        if self.augment_flags is not None and self.rng.random() < self.augment_flags[idx]:
            op = AUG_OPS[self.rng.randint(len(AUG_OPS))]
            img = _apply_aug(img, op, self.rng)
        x = torch.from_numpy(img.astype(np.float32) / 255.0).unsqueeze(0)
        y = torch.tensor(self.labels[idx], dtype=torch.float32)
        return x, y


def _build_plain(hs, nhs):
    images = np.concatenate([hs, nhs], axis=0)
    labels = np.concatenate([np.ones(len(hs)), np.zeros(len(nhs))])
    return images, labels


def make_dataset(strategy, hs, nhs, rng, target_ratio=1.0, combo_undersample_frac=0.5):
    """
    Build a training Dataset (and optional WeightedRandomSampler) for
    the given strategy.

    target_ratio: desired HS:NHS ratio after balancing (1.0 = fully
    balanced 1:1). Only used by strategies that actively resample.

    Returns: (dataset, sampler_or_None)
    """
    n_hs, n_nhs = len(hs), len(nhs)

    if strategy == "none":
        images, labels = _build_plain(hs, nhs)
        ds = ArrayDataset(images, labels, augment_flags=None)
        return ds, None

    if strategy == "rus":
        # undersample majority (NHS) down to target_ratio * n_hs
        target_nhs = max(1, min(n_nhs, int(round(n_hs / target_ratio))))
        idx = rng.choice(n_nhs, size=target_nhs, replace=False)
        images, labels = _build_plain(hs, nhs[idx])
        ds = ArrayDataset(images, labels, augment_flags=None)
        return ds, None

    if strategy == "ros":
        target_hs = max(n_hs, int(round(target_ratio * n_nhs)))
        extra = target_hs - n_hs
        if extra > 0:
            idx = rng.choice(n_hs, size=extra, replace=True)
            hs_aug = np.concatenate([hs, hs[idx]], axis=0)
        else:
            hs_aug = hs
        images, labels = _build_plain(hs_aug, nhs)
        ds = ArrayDataset(images, labels, augment_flags=None)
        return ds, None

    if strategy == "ros_aug":
        target_hs = max(n_hs, int(round(target_ratio * n_nhs)))
        extra = target_hs - n_hs
        if extra > 0:
            idx = rng.choice(n_hs, size=extra, replace=True)
            hs_extra = hs[idx]
            hs_all = np.concatenate([hs, hs_extra], axis=0)
            # mark the *synthetic* duplicates for augmentation; keep
            # originals untouched (a "real" copy of each minority
            # sample is always seen unmodified at least once)
            aug_flags = np.concatenate(
                [np.zeros(n_hs, dtype=bool), np.ones(extra, dtype=bool)]
            )
        else:
            hs_all = hs
            aug_flags = np.zeros(n_hs, dtype=bool)
        images = np.concatenate([hs_all, nhs], axis=0)
        labels = np.concatenate([np.ones(len(hs_all)), np.zeros(len(nhs))])
        full_aug_flags = np.concatenate([aug_flags, np.zeros(len(nhs), dtype=bool)])
        ds = ArrayDataset(images, labels, augment_flags=full_aug_flags)
        return ds, None

    if strategy == "balanced_batch":
        images, labels = _build_plain(hs, nhs)
        ds = ArrayDataset(images, labels, augment_flags=None)
        class_count = np.array([n_nhs, n_hs], dtype=np.float64)  # index0=NHS,1=HS
        weight_per_class = 1.0 / class_count
        sample_weights = np.where(labels == 1, weight_per_class[1], weight_per_class[0])
        sampler = WeightedRandomSampler(
            weights=torch.from_numpy(sample_weights),
            num_samples=len(labels),
            replacement=True,
        )
        return ds, sampler

    if strategy in ("combo", "combo_mild"):
        frac = combo_undersample_frac if strategy == "combo" else 0.75
        return _combo(hs, nhs, rng, target_ratio, frac), None

    if strategy == "combo_batch_aug":
        images, labels = _build_plain(hs, nhs)
        aug_prob = np.concatenate(
            [np.full(n_hs, 0.6, dtype=np.float64), np.zeros(n_nhs, dtype=np.float64)]
        )
        ds = ArrayDataset(images, labels, augment_flags=aug_prob)
        class_count = np.array([n_nhs, n_hs], dtype=np.float64)
        weight_per_class = 1.0 / class_count
        sample_weights = np.where(labels == 1, weight_per_class[1], weight_per_class[0])
        sampler = WeightedRandomSampler(
            weights=torch.from_numpy(sample_weights),
            num_samples=len(labels),
            replacement=True,
        )
        return ds, sampler

    raise ValueError(f"Unknown strategy: {strategy}")


def _combo(hs, nhs, rng, target_ratio, undersample_frac):
    n_hs, n_nhs = len(hs), len(nhs)
    # 1) moderately undersample NHS
    target_nhs = max(n_hs, int(round(n_nhs * undersample_frac)))
    target_nhs = min(target_nhs, n_nhs)
    idx_nhs = rng.choice(n_nhs, size=target_nhs, replace=False)
    nhs_sub = nhs[idx_nhs]
    # 2) then augmented-oversample HS to hit target_ratio against the reduced NHS
    target_hs = max(n_hs, int(round(target_ratio * target_nhs)))
    extra = target_hs - n_hs
    if extra > 0:
        idx_hs = rng.choice(n_hs, size=extra, replace=True)
        hs_extra = hs[idx_hs]
        hs_all = np.concatenate([hs, hs_extra], axis=0)
        aug_flags = np.concatenate(
            [np.zeros(n_hs, dtype=bool), np.ones(extra, dtype=bool)]
        )
    else:
        hs_all = hs
        aug_flags = np.zeros(n_hs, dtype=bool)
    images = np.concatenate([hs_all, nhs_sub], axis=0)
    labels = np.concatenate([np.ones(len(hs_all)), np.zeros(len(nhs_sub))])
    full_aug_flags = np.concatenate([aug_flags, np.zeros(len(nhs_sub), dtype=bool)])
    return ArrayDataset(images, labels, augment_flags=full_aug_flags)


STRATEGY_NAMES = {
    "none": "Baseline (No Balancing)",
    "rus": "Random Undersampling (RUS)",
    "ros": "Random Oversampling (ROS)",
    "ros_aug": "Oversampling + Augmentation",
    "balanced_batch": "Balanced Mini-Batch Sampling",
    "combo": "Combined (50% Undersample + Aug-Oversample)",
    "combo_mild": "Combined-Mild (25% Undersample + Aug-Oversample)",
    "combo_batch_aug": "Combined (Balanced-Batch + Augmentation)",
}
