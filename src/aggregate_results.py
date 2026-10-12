"""
Aggregate the multi-seed main-grid results into mean +/- std per
(benchmark, strategy), and run paired statistical significance tests
on balanced accuracy between the strategies we actually claim a
difference between in the report (DA3 feedback: "use a statistical
test when claiming that one method beats another").

Each (benchmark, seed) pair is treated as one paired observation, so a
comparison between two strategies has 5 benchmarks x 3 seeds = 15
paired samples. We report both a paired t-test (parametric) and a
Wilcoxon signed-rank test (non-parametric, more appropriate for a
sample this small / possibly non-normal), and only call a difference
"significant" in the report text when both agree at alpha=0.05.
"""
import os
import json
import numpy as np
import pandas as pd
from scipy import stats

TABLES_DIR = os.path.join("..", "results", "tables")
STRAT_ORDER = [
    "none", "rus", "ros", "ros_aug", "balanced_batch",
    "combo", "combo_mild", "combo_batch_aug",
]
METRICS = [
    "balanced_accuracy", "recall_sensitivity", "specificity",
    "f1_score", "precision", "pr_auc",
]


def load_seeded():
    path = os.path.join(TABLES_DIR, "main_results_seeds.csv")
    df = pd.read_csv(path)
    df["strategy"] = pd.Categorical(df["strategy"], categories=STRAT_ORDER, ordered=True)
    return df


def aggregate_mean_std(df):
    agg = df.groupby(["benchmark", "strategy"], observed=True)[METRICS].agg(["mean", "std"])
    agg.columns = [f"{m}_{stat}" for m, stat in agg.columns]
    agg = agg.reset_index()
    return agg


def overall_average(df):
    """Per-strategy average across all 5 benchmarks AND all 3 seeds (15 obs)."""
    agg = df.groupby("strategy", observed=True)[METRICS].agg(["mean", "std"])
    agg.columns = [f"{m}_{stat}" for m, stat in agg.columns]
    return agg


def paired_test(df, strat_a, strat_b, metric="balanced_accuracy"):
    """Pairs on (benchmark, seed); returns dict with both test results."""
    pivot = df.pivot_table(index=["benchmark", "seed"], columns="strategy", values=metric)
    paired = pivot[[strat_a, strat_b]].dropna()
    a = paired[strat_a].values
    b = paired[strat_b].values
    t_stat, t_p = stats.ttest_rel(a, b)
    try:
        w_stat, w_p = stats.wilcoxon(a, b)
    except ValueError:
        # all differences zero, or too few pairs
        w_stat, w_p = float("nan"), float("nan")
    return {
        "metric": metric,
        "strategy_a": strat_a,
        "strategy_b": strat_b,
        "n_pairs": len(paired),
        "mean_a": float(np.mean(a)),
        "mean_b": float(np.mean(b)),
        "mean_diff": float(np.mean(a) - np.mean(b)),
        "ttest_stat": float(t_stat),
        "ttest_p": float(t_p),
        "wilcoxon_stat": float(w_stat) if not np.isnan(w_stat) else None,
        "wilcoxon_p": float(w_p) if not np.isnan(w_p) else None,
        "significant_both_alpha05": bool(t_p < 0.05 and (not np.isnan(w_p)) and w_p < 0.05),
    }


if __name__ == "__main__":
    df = load_seeded()

    per_bench = aggregate_mean_std(df)
    per_bench.to_csv(os.path.join(TABLES_DIR, "main_results_agg_per_benchmark.csv"), index=False)

    overall = overall_average(df)
    overall.to_csv(os.path.join(TABLES_DIR, "main_results_agg_overall.csv"))
    print(overall[[c for c in overall.columns if c.endswith("_mean")]])

    ba_comparisons = [
        ("balanced_batch", "none"),
        ("balanced_batch", "rus"),
        ("balanced_batch", "combo"),
        ("balanced_batch", "combo_mild"),
        ("balanced_batch", "combo_batch_aug"),
        ("combo", "none"),
        ("rus", "none"),
    ]
    prauc_comparisons = [
        ("ros", "rus"),
        ("balanced_batch", "rus"),
        ("ros", "none"),
        ("ros", "ros_aug"),
        ("balanced_batch", "none"),
        ("combo_batch_aug", "rus"),
    ]
    tests = (
        [paired_test(df, a, b, metric="balanced_accuracy") for a, b in ba_comparisons]
        + [paired_test(df, a, b, metric="pr_auc") for a, b in prauc_comparisons]
    )
    with open(os.path.join(TABLES_DIR, "significance_tests.json"), "w") as f:
        json.dump(tests, f, indent=2)
    for t in tests:
        sig = "SIGNIFICANT" if t["significant_both_alpha05"] else "not significant"
        print(
            f"{t['strategy_a']} vs {t['strategy_b']} ({t['metric']}): "
            f"mean {t['mean_a']:.4f} vs {t['mean_b']:.4f}, diff={t['mean_diff']:+.4f}, "
            f"paired-t p={t['ttest_p']:.4g}, wilcoxon p={t['wilcoxon_p']}, {sig}"
        )
    print("Wrote significance_tests.json, main_results_agg_per_benchmark.csv, main_results_agg_overall.csv")
