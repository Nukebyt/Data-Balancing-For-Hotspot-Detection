"""Generate all figures/tables used in the DA3 report from the experiment CSVs."""
import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

RESULTS_DIR = os.path.join("..", "results")
TABLES_DIR = os.path.join(RESULTS_DIR, "tables")
FIG_DIR = os.path.join(RESULTS_DIR, "figures")

BENCH_LABELS = {"iccad1": "B1", "iccad2": "B2", "iccad3": "B3", "iccad4": "B4", "iccad5": "B5"}
BENCH_ORDER = ["iccad1", "iccad2", "iccad3", "iccad4", "iccad5"]
STRAT_ORDER = [
    "none", "rus", "ros", "ros_aug", "balanced_batch",
    "combo", "combo_mild", "combo_batch_aug",
]
STRAT_LABELS = {
    "none": "Baseline",
    "rus": "RUS",
    "ros": "ROS",
    "ros_aug": "ROS+Aug",
    "balanced_batch": "Bal.Batch",
    "combo": "Combo(50%)",
    "combo_mild": "Combo(25%)",
    "combo_batch_aug": "Combo(Batch+Aug)",
}
COLORS = {
    "none": "#8c8c8c",
    "rus": "#4c72b0",
    "ros": "#55a868",
    "ros_aug": "#c44e52",
    "balanced_batch": "#8172b2",
    "combo": "#ccb974",
    "combo_mild": "#64b5cd",
    "combo_batch_aug": "#e07b39",
}


def load_main():
    df = pd.read_csv(os.path.join(TABLES_DIR, "main_results_seeds.csv"))
    df["strategy"] = pd.Categorical(df["strategy"], categories=STRAT_ORDER, ordered=True)
    df = df.sort_values(["benchmark", "strategy", "seed"])
    return df


def _mean_std(df, metric):
    g = df.groupby(["benchmark", "strategy"], observed=True)[metric].agg(["mean", "std"]).reset_index()
    g["std"] = g["std"].fillna(0.0)
    return g


def plot_metric_grouped(df, metric, ylabel, fname, ylim=(0, 1.05)):
    g = _mean_std(df, metric)
    x = np.arange(len(BENCH_ORDER))
    n = len(STRAT_ORDER)
    width = 0.8 / n
    fig, ax = plt.subplots(figsize=(13, 6))
    for i, strat in enumerate(STRAT_ORDER):
        means, stds = [], []
        for b in BENCH_ORDER:
            row = g[(g.benchmark == b) & (g.strategy == strat)]
            means.append(row["mean"].values[0] if len(row) else np.nan)
            stds.append(row["std"].values[0] if len(row) else 0.0)
        ax.bar(
            x + (i - (n - 1) / 2) * width, means, width, yerr=stds, capsize=2,
            label=STRAT_LABELS[strat], color=COLORS[strat],
        )
    ax.set_xticks(x)
    ax.set_xticklabels([BENCH_LABELS[b] for b in BENCH_ORDER])
    ax.set_ylabel(ylabel)
    ax.set_xlabel("ICCAD-12 Benchmark")
    ax.set_title(f"{ylabel} by Strategy across Benchmarks (mean ± std over 3 seeds)")
    if ylim:
        ax.set_ylim(*ylim)
    ax.legend(fontsize=8, ncol=4, loc="lower center", bbox_to_anchor=(0.5, -0.32))
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, fname), dpi=160)
    plt.close(fig)


def plot_average_summary(df):
    metrics = ["balanced_accuracy", "recall_sensitivity", "specificity", "f1_score", "pr_auc"]
    metric_labels = ["Balanced Acc.", "Recall", "Specificity", "F1-score", "PR-AUC"]
    avg = df.groupby("strategy", observed=True)[metrics].mean().reindex(STRAT_ORDER)
    std = df.groupby("strategy", observed=True)[metrics].std().reindex(STRAT_ORDER)

    fig, ax = plt.subplots(figsize=(11, 6))
    x = np.arange(len(STRAT_ORDER))
    width = 0.16
    for i, (m, lab) in enumerate(zip(metrics, metric_labels)):
        ax.bar(x + (i - 2) * width, avg[m].values, width, yerr=std[m].values, capsize=2, label=lab)
    ax.set_xticks(x)
    ax.set_xticklabels([STRAT_LABELS[s] for s in STRAT_ORDER], rotation=20, ha="right")
    ax.set_ylabel("Score (mean ± std, 5 benchmarks × 3 seeds)")
    ax.set_title("Average Performance Across All 5 ICCAD-12 Benchmarks and 3 Seeds")
    ax.set_ylim(0, 1.05)
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, "average_summary.png"), dpi=160)
    plt.close(fig)

    out = avg.add_suffix("_mean").join(std.add_suffix("_std"))
    out.to_csv(os.path.join(TABLES_DIR, "average_summary.csv"))
    return out


def plot_confusion_matrices(df):
    """Confusion-matrix cell counts summed across the 3 seeds (so each
    cell reflects 3x the per-seed test-set size, for a stable visual)."""
    sums = df.groupby(["benchmark", "strategy"], observed=True)[["TP", "FP", "FN", "TN"]].sum().reset_index()
    fig, axes = plt.subplots(len(STRAT_ORDER), len(BENCH_ORDER), figsize=(15, 20))
    for i, strat in enumerate(STRAT_ORDER):
        for j, bench in enumerate(BENCH_ORDER):
            row = sums[(sums.benchmark == bench) & (sums.strategy == strat)].iloc[0]
            cm = np.array([[row.TP, row.FN], [row.FP, row.TN]])
            cm_norm = cm / cm.sum(axis=1, keepdims=True)
            ax = axes[i, j]
            ax.imshow(cm_norm, cmap="Blues", vmin=0, vmax=1)
            for r in range(2):
                for c in range(2):
                    ax.text(c, r, f"{int(cm[r,c])}", ha="center", va="center", fontsize=6,
                            color="white" if cm_norm[r, c] > 0.5 else "black")
            ax.set_xticks([0, 1]); ax.set_yticks([0, 1])
            if i == len(STRAT_ORDER) - 1:
                ax.set_xticklabels(["HS", "NHS"], fontsize=7)
            else:
                ax.set_xticklabels([])
            if j == 0:
                ax.set_yticklabels(["HS", "NHS"], fontsize=7)
                ax.set_ylabel(STRAT_LABELS[strat], fontsize=8)
            else:
                ax.set_yticklabels([])
            if i == 0:
                ax.set_title(BENCH_LABELS[bench], fontsize=10)
    fig.suptitle("Confusion Matrices, summed over 3 seeds (rows=Actual, cols=Predicted)", y=1.0)
    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, "confusion_matrices_grid.png"), dpi=150)
    plt.close(fig)


def plot_ratio_ablation():
    path = os.path.join(TABLES_DIR, "ablation_ratio.csv")
    if not os.path.exists(path):
        print("ablation_ratio.csv not found, skipping ablation plots")
        return
    df = pd.read_csv(path)
    strategies = df["strategy"].unique()
    for strat in strategies:
        sub = df[df.strategy == strat]
        fig, ax = plt.subplots(figsize=(8, 5))
        for bench in BENCH_ORDER:
            s = sub[sub.benchmark == bench].sort_values("target_ratio")
            ax.plot(s.target_ratio, s.balanced_accuracy, marker="o", label=f"{BENCH_LABELS[bench]} BalAcc")
        ax.set_xlabel("Target HS:NHS ratio")
        ax.set_ylabel("Balanced Accuracy")
        ax.set_title(f"Effect of Target Class Ratio — {strat}")
        ax.legend(fontsize=8)
        ax.grid(alpha=0.3)
        fig.tight_layout()
        fig.savefig(os.path.join(FIG_DIR, f"ablation_ratio_{strat}.png"), dpi=150)
        plt.close(fig)

        fig, ax = plt.subplots(figsize=(8, 5))
        for bench in BENCH_ORDER:
            s = sub[sub.benchmark == bench].sort_values("target_ratio")
            ax.plot(s.target_ratio, s.recall_sensitivity, marker="o", linestyle="-", label=f"{BENCH_LABELS[bench]} Recall")
            ax.plot(s.target_ratio, s.specificity, marker="x", linestyle="--", label=f"{BENCH_LABELS[bench]} Specificity")
        ax.set_xlabel("Target HS:NHS ratio")
        ax.set_ylabel("Score")
        ax.set_title(f"Recall vs Specificity Trade-off — {strat}")
        ax.legend(fontsize=6, ncol=2)
        ax.grid(alpha=0.3)
        fig.tight_layout()
        fig.savefig(os.path.join(FIG_DIR, f"ablation_tradeoff_{strat}.png"), dpi=150)
        plt.close(fig)


def plot_class_distribution():
    import glob
    npz_files = sorted(glob.glob(os.path.join("..", "data", "cache", "*.npz")))
    benches, hs_counts, nhs_counts = [], [], []
    for f in npz_files:
        name = os.path.splitext(os.path.basename(f))[0]
        d = np.load(f)
        benches.append(BENCH_LABELS.get(name, name))
        hs_counts.append(len(d["train_hs"]) + len(d["test_hs"]))
        nhs_counts.append(len(d["train_nhs"]) + len(d["test_nhs"]))
    x = np.arange(len(benches))
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(x, nhs_counts, label="Non-Hotspot (NHS)", color="#4c72b0")
    ax.bar(x, hs_counts, bottom=0, label="Hotspot (HS)", color="#c44e52")
    ax.set_yscale("log")
    ax.set_xticks(x); ax.set_xticklabels(benches)
    ax.set_ylabel("Number of images (log scale)")
    ax.set_title("ICCAD-12 Class Distribution per Benchmark (train+test)")
    ax.legend()
    for xi, (h, n) in enumerate(zip(hs_counts, nhs_counts)):
        ax.text(xi, n, f"{n}:{h}\n({n/h:.1f}:1)", ha="center", va="bottom", fontsize=8)
    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, "class_distribution.png"), dpi=160)
    plt.close(fig)


def plot_learning_curves():
    """Mechanistic diagnostic: train loss & val recall/specificity vs
    step, for baseline/RUS/balanced-batch on Benchmark 5, across all 3
    seeds (thin lines = individual seeds, thick = mean)."""
    path = os.path.join(TABLES_DIR, "learning_curves_b5.json")
    if not os.path.exists(path):
        print("learning_curves_b5.json not found, skipping learning-curve plots")
        return
    with open(path) as f:
        data = json.load(f)

    strat_colors = {"none": "#8c8c8c", "rus": "#4c72b0", "balanced_batch": "#8172b2"}
    strat_labels = {"none": "Baseline", "rus": "RUS", "balanced_batch": "Balanced-Batch"}

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    for strat, seeds in data.items():
        all_steps, all_loss, all_recall = [], [], []
        for seed, payload in seeds.items():
            curve = payload["curve"]
            steps = [c["step"] for c in curve]
            loss = [c["train_loss"] for c in curve]
            recall = [c["val_recall"] for c in curve]
            axes[0].plot(steps, loss, color=strat_colors[strat], alpha=0.25, linewidth=1)
            axes[1].plot(steps, recall, color=strat_colors[strat], alpha=0.25, linewidth=1)
            all_steps.append(steps); all_loss.append(loss); all_recall.append(recall)
        mean_loss = np.mean(all_loss, axis=0)
        mean_recall = np.mean(all_recall, axis=0)
        axes[0].plot(all_steps[0], mean_loss, color=strat_colors[strat], linewidth=2.5, label=strat_labels[strat])
        axes[1].plot(all_steps[0], mean_recall, color=strat_colors[strat], linewidth=2.5, label=strat_labels[strat])

    axes[0].set_yscale("log")
    axes[0].set_xlabel("Training step"); axes[0].set_ylabel("Training loss (log scale)")
    axes[0].set_title("Training Loss vs. Step (Benchmark 5)")
    axes[0].legend(); axes[0].grid(alpha=0.3)

    axes[1].set_xlabel("Training step"); axes[1].set_ylabel("Validation Recall")
    axes[1].set_title("Validation Recall vs. Step (Benchmark 5)")
    axes[1].set_ylim(-0.05, 1.05)
    axes[1].legend(); axes[1].grid(alpha=0.3)

    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, "learning_curves_b5.png"), dpi=160)
    plt.close(fig)


if __name__ == "__main__":
    os.makedirs(FIG_DIR, exist_ok=True)
    plot_class_distribution()
    df = load_main()
    plot_metric_grouped(df, "balanced_accuracy", "Balanced Accuracy", "balanced_accuracy_grouped.png")
    plot_metric_grouped(df, "recall_sensitivity", "Hotspot Recall (Sensitivity)", "recall_grouped.png")
    plot_metric_grouped(df, "specificity", "Specificity", "specificity_grouped.png")
    plot_metric_grouped(df, "f1_score", "F1-score", "f1_grouped.png")
    plot_metric_grouped(df, "pr_auc", "PR-AUC", "pr_auc_grouped.png")
    avg = plot_average_summary(df)
    print(avg)
    plot_confusion_matrices(df)
    plot_ratio_ablation()
    plot_learning_curves()
    print("All plots written to", FIG_DIR)
