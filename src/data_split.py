"""
Deterministic train/validation carve-out (DA3 feedback: "add a
validation split ... select models/thresholds on validation, use test
once at the end").

The validation split is cut from the TRAINING portion of a benchmark
only -- the test split is never touched. It uses a fixed split seed
that is the same for every strategy and every experiment seed, so all
conditions being compared share an identical validation set and the
comparison stays fair; only the strategy-specific resampling /
augmentation (applied downstream, in `src/balancing.py`) differs
between conditions.
"""
import numpy as np

VAL_SPLIT_SEED = 20260926  # fixed, independent of the training/strategy seed
VAL_FRACTION = 0.15


def split_train_val(hs, nhs, val_fraction=VAL_FRACTION, split_seed=VAL_SPLIT_SEED):
    """
    Stratified split of the raw (pre-balancing) training arrays into a
    training pool and a held-out validation pool. Both classes are
    split independently so the validation set's class ratio matches
    the natural training ratio (i.e. the validation set stays
    naturally imbalanced too, like the test set).

    Returns: (hs_train, nhs_train, hs_val, nhs_val)
    """
    rng = np.random.RandomState(split_seed)

    n_hs = len(hs)
    n_hs_val = max(1, int(round(n_hs * val_fraction))) if n_hs > 1 else 0
    hs_perm = rng.permutation(n_hs)
    hs_val_idx, hs_train_idx = hs_perm[:n_hs_val], hs_perm[n_hs_val:]

    n_nhs = len(nhs)
    n_nhs_val = max(1, int(round(n_nhs * val_fraction)))
    nhs_perm = rng.permutation(n_nhs)
    nhs_val_idx, nhs_train_idx = nhs_perm[:n_nhs_val], nhs_perm[n_nhs_val:]

    return (
        hs[hs_train_idx],
        nhs[nhs_train_idx],
        hs[hs_val_idx],
        nhs[nhs_val_idx],
    )
