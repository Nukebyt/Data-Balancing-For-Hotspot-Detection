"""
Generate LaTeX table snippets directly from the experiment CSVs, so the
numbers in the report are always exactly what the experiment grid
produced (no manual transcription).

Writes:
  report/tables_generated.tex  -- included via \\input{} from report.tex
"""
import os
import json
import pandas as pd

TABLES_DIR = os.path.join("..", "results", "tables")
OUT_PATH = os.path.join("..", "report", "tables_generated.tex")

STRAT_ORDER = [
    "none", "rus", "ros", "ros_aug", "balanced_batch",
    "combo", "combo_mild", "combo_batch_aug",
]
STRAT_LATEX = {
    "none": "Baseline",
    "rus": "RUS",
    "ros": "ROS",
    "ros_aug": "ROS+Aug",
    "balanced_batch": "Bal.\\ Batch",
    "combo": "Combo(50\\%)",
    "combo_mild": "Combo(25\\%)",
    "combo_batch_aug": "Combo(B+A)",
}
BENCH_ORDER = ["iccad1", "iccad2", "iccad3", "iccad4", "iccad5"]
BENCH_LATEX = {"iccad1": "B1", "iccad2": "B2", "iccad3": "B3", "iccad4": "B4", "iccad5": "B5"}


def fmt(x):
    return f"{x:.3f}"


def fmt_ms(mean, std):
    return f"{mean:.3f}$\\pm${std:.3f}"


def build_main_table(df):
    """Balanced Accuracy mean +/- std per benchmark + 15-sample average."""
    lines = []
    lines.append(r"\begin{table}[H]")
    lines.append(r"\centering")
    lines.append(r"\small")
    lines.append(r"\caption{Balanced Accuracy (mean $\pm$ std over 3 seeds) per strategy on every ICCAD-12 benchmark, plus the overall average (5 benchmarks $\times$ 3 seeds = 15 runs). Highest mean per column is \textbf{bolded}.}")
    lines.append(r"\label{tab:main}")
    lines.append(r"\begin{tabular}{l" + "c" * (len(BENCH_ORDER) + 1) + "}")
    lines.append(r"\toprule")
    header = ["Strategy"] + [BENCH_LATEX.get(b, b) for b in BENCH_ORDER] + [r"\textbf{Avg}"]
    lines.append(" & ".join(header) + r" \\")
    lines.append(r"\midrule")

    per_bench = df.groupby(["benchmark", "strategy"], observed=True)["balanced_accuracy"].agg(["mean", "std"]).reset_index()
    per_bench["std"] = per_bench["std"].fillna(0.0)
    best_ba = {b: per_bench[per_bench.benchmark == b]["mean"].max() for b in BENCH_ORDER}

    overall = df.groupby("strategy", observed=True)["balanced_accuracy"].agg(["mean", "std"])
    best_avg = overall["mean"].max()

    for strat in STRAT_ORDER:
        row = [STRAT_LATEX[strat]]
        for b in BENCH_ORDER:
            r = per_bench[(per_bench.benchmark == b) & (per_bench.strategy == strat)].iloc[0]
            s = fmt(r["mean"])
            if abs(r["mean"] - best_ba[b]) < 1e-9:
                s = r"\textbf{" + s + "}"
            row.append(s)
        a = overall.loc[strat]
        avg_s = fmt(a["mean"])
        if abs(a["mean"] - best_avg) < 1e-9:
            avg_s = r"\textbf{" + avg_s + "}"
        row.append(avg_s)
        lines.append(" & ".join(row) + r" \\")
    lines.append(r"\bottomrule")
    lines.append(r"\end{tabular}")
    lines.append(r"\end{table}")
    return "\n".join(lines)


def build_avg_all_metrics_table(df):
    """All metrics, mean +/- std across the full 15-run sample, per strategy."""
    metrics = ["balanced_accuracy", "recall_sensitivity", "specificity", "f1_score", "precision", "pr_auc"]
    lines = []
    lines.append(r"\begin{table}[H]")
    lines.append(r"\centering")
    lines.append(r"\small")
    lines.append(r"\caption{All metrics, mean $\pm$ std across all 5 benchmarks $\times$ 3 seeds (15 runs), per strategy. Highest mean per column is \textbf{bolded}.}")
    lines.append(r"\label{tab:avgmetrics}")
    lines.append(r"\begin{tabular}{lcccccc}")
    lines.append(r"\toprule")
    lines.append(r"Strategy & BalAcc & Recall & Spec. & F1 & Prec. & PR-AUC \\")
    lines.append(r"\midrule")
    mean = df.groupby("strategy", observed=True)[metrics].mean()
    std = df.groupby("strategy", observed=True)[metrics].std()
    bestcol = {c: mean[c].max() for c in metrics}
    for strat in STRAT_ORDER:
        cells = []
        for c in metrics:
            m, s = mean.loc[strat, c], std.loc[strat, c]
            cell = fmt(m)
            if abs(m - bestcol[c]) < 1e-9:
                cell = r"\textbf{" + cell + "}"
            cells.append(cell)
        lines.append(f"{STRAT_LATEX[strat]} & " + " & ".join(cells) + r" \\")
    lines.append(r"\bottomrule")
    lines.append(r"\end{tabular}")
    lines.append(r"\end{table}")
    return "\n".join(lines)


def build_confusion_summary(df):
    lines = []
    lines.append(r"\begin{table}[H]")
    lines.append(r"\centering")
    lines.append(r"\small")
    lines.append(r"\caption{Confusion matrix totals (TP/FP/FN/TN) per strategy, summed across all 5 benchmarks and all 3 seeds.}")
    lines.append(r"\label{tab:cm}")
    lines.append(r"\begin{tabular}{lrrrr}")
    lines.append(r"\toprule")
    lines.append(r"Strategy & TP & FP & FN & TN \\")
    lines.append(r"\midrule")
    for strat in STRAT_ORDER:
        sub = df[df.strategy == strat]
        tp, fp, fn, tn = sub.TP.sum(), sub.FP.sum(), sub.FN.sum(), sub.TN.sum()
        lines.append(f"{STRAT_LATEX[strat]} & {tp} & {fp} & {fn} & {tn}" + r" \\")
    lines.append(r"\bottomrule")
    lines.append(r"\end{tabular}")
    lines.append(r"\end{table}")
    return "\n".join(lines)


def build_param_timing_table(df):
    lines = []
    lines.append(r"\begin{table}[H]")
    lines.append(r"\centering")
    lines.append(r"\small")
    lines.append(r"\caption{Average training set size, training time, and per-image inference time per strategy.}")
    lines.append(r"\label{tab:timing}")
    lines.append(r"\begin{tabular}{lrrr}")
    lines.append(r"\toprule")
    lines.append(r"Strategy & Train N & Train (s) & Infer (ms/img) \\")
    lines.append(r"\midrule")
    g = df.groupby("strategy", observed=True)[
        ["n_train_samples", "train_time_sec", "infer_time_ms_per_image"]
    ].mean()
    for strat in STRAT_ORDER:
        r = g.loc[strat]
        lines.append(
            f"{STRAT_LATEX[strat]} & {r.n_train_samples:.0f} & {r.train_time_sec:.1f} & {r.infer_time_ms_per_image:.3f}" + r" \\"
        )
    lines.append(r"\bottomrule")
    lines.append(r"\end{tabular}")
    lines.append(r"\end{table}")
    return "\n".join(lines)


def build_significance_table():
    path = os.path.join(TABLES_DIR, "significance_tests.json")
    if not os.path.exists(path):
        return "% significance_tests.json not found -- run src/aggregate_results.py first"
    with open(path) as f:
        tests = json.load(f)
    lines = []
    lines.append(r"\begin{table}[H]")
    lines.append(r"\centering")
    lines.append(r"\small")
    lines.append(r"\caption{Paired significance tests on balanced accuracy (15 paired observations: 5 benchmarks $\times$ 3 seeds). A difference is called significant only when both tests agree at $\alpha=0.05$.}")
    lines.append(r"\label{tab:sig}")
    lines.append(r"\begin{tabular}{llcccc}")
    lines.append(r"\toprule")
    lines.append(r"A & B & Mean A & Mean B & $p$ (t-test) & Sig.? \\")
    lines.append(r"\midrule")
    for t in tests:
        a_lab = STRAT_LATEX.get(t["strategy_a"], t["strategy_a"])
        b_lab = STRAT_LATEX.get(t["strategy_b"], t["strategy_b"])
        sig = r"\textbf{Yes}" if t["significant_both_alpha05"] else "No"
        lines.append(
            f"{a_lab} & {b_lab} & {t['mean_a']:.3f} & {t['mean_b']:.3f} & {t['ttest_p']:.3g} & {sig}" + r" \\"
        )
    lines.append(r"\bottomrule")
    lines.append(r"\end{tabular}")
    lines.append(r"\end{table}")
    return "\n".join(lines)


if __name__ == "__main__":
    main_path = os.path.join(TABLES_DIR, "main_results_seeds.csv")
    df = pd.read_csv(main_path)
    df["strategy"] = pd.Categorical(df["strategy"], categories=STRAT_ORDER, ordered=True)

    parts = [
        "% AUTO-GENERATED by src/fill_report_tables.py -- do not hand-edit, re-run the script instead.",
        build_main_table(df),
        "",
        build_avg_all_metrics_table(df),
        "",
        build_significance_table(),
        "",
        build_confusion_summary(df),
        "",
        build_param_timing_table(df),
    ]
    with open(OUT_PATH, "w") as f:
        f.write("\n\n".join(parts))
    print("Wrote", OUT_PATH)
