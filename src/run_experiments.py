"""
DA3 experiment grid for Group 11 (Data Balancing and Augmentation
Strategies for Hotspot Detection).

Changes versus the DA2 grid (see report for full rationale):
  - A validation split is carved from each benchmark's training data
    (src/data_split.py) and used for checkpoint selection; the test
    split is touched exactly once per run, after the checkpoint is
    already fixed.
  - Every strategy for a given benchmark trains for an identical,
    pre-computed number of gradient-update steps (src/train.py
    compute_total_steps), removing the DA2 confound where RUS received
    far fewer updates per epoch than ROS/ROS+Aug simply because its
    resampled dataset was smaller.
  - The main comparison is run over 3 seeds per (benchmark, strategy)
    so mean +/- std and a paired significance test can be reported.
  - Three combined strategies are now compared (combo, combo_mild,
    combo_batch_aug), not one.
  - PR-AUC is recorded for every run (via src/metrics.py), alongside
    balanced accuracy / recall / specificity / F1 / precision.
  - A focused multi-seed learning-curve export (Part C) captures
    train-loss and validation-recall trajectories for baseline, RUS
    and balanced-batch on Benchmark 5, to support the mechanistic
    explanation of why undersampling fails there.

Part A (main grid, multi-seed) and Part B (ratio ablation, single
seed, as in DA2 -- explicitly documented as a remaining limitation)
both still treat the five benchmarks completely independently and
never merge them, per the assignment brief.
"""
import os
import csv
import json
import time
import numpy as np

from train import train_and_evaluate, compute_total_steps
from balancing import STRATEGY_NAMES
from data_split import split_train_val

CACHE_DIR = os.path.join("..", "data", "cache")
RESULTS_DIR = os.path.join("..", "results", "tables")
BENCHMARKS = ["iccad1", "iccad2", "iccad3", "iccad4", "iccad5"]
MAIN_STRATEGIES = [
    "none", "rus", "ros", "ros_aug", "balanced_batch",
    "combo", "combo_mild", "combo_batch_aug",
]
SEEDS = [42, 123, 2024]
ABLATION_SEED = 42  # single seed for the ratio sweep, as in DA2 (documented limitation)


def load_benchmark(name):
    d = np.load(os.path.join(CACHE_DIR, f"{name}.npz"))
    return d["train_hs"], d["train_nhs"], d["test_hs"], d["test_nhs"]


def append_row(csv_path, row):
    file_exists = os.path.exists(csv_path)
    with open(csv_path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(row.keys()))
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


def run_main_grid():
    csv_path = os.path.join(RESULTS_DIR, "main_results_seeds.csv")
    done = set()
    if os.path.exists(csv_path):
        with open(csv_path, newline="") as f:
            for r in csv.DictReader(f):
                done.add((r["benchmark"], r["strategy"], r["seed"]))

    for bench in BENCHMARKS:
        hs_tr_full, nhs_tr_full, hs_te, nhs_te = load_benchmark(bench)
        hs_tr, nhs_tr, hs_val, nhs_val = split_train_val(hs_tr_full, nhs_tr_full)
        total_steps = compute_total_steps(len(hs_tr) + len(nhs_tr))
        print(
            f"[{bench}] train={len(hs_tr)+len(nhs_tr)} val={len(hs_val)+len(nhs_val)} "
            f"test={len(hs_te)+len(nhs_te)} total_steps={total_steps}"
        )
        for strat in MAIN_STRATEGIES:
            for seed in SEEDS:
                key = (bench, strat, str(seed))
                if key in done:
                    print(f"[skip] {bench}/{strat}/seed={seed} already done")
                    continue
                print(f"[run ] {bench}/{strat}/seed={seed} ...")
                t0 = time.time()
                m = train_and_evaluate(
                    hs_tr, nhs_tr, hs_val, nhs_val, hs_te, nhs_te,
                    total_steps=total_steps, strategy=strat, target_ratio=1.0, seed=seed,
                )
                dt = time.time() - t0
                row = {
                    "benchmark": bench, "strategy": strat,
                    "strategy_name": STRATEGY_NAMES[strat], "seed": seed,
                }
                row.update(m)
                row["wall_time_sec"] = round(dt, 2)
                append_row(csv_path, row)
                print(
                    f"[done] {bench}/{strat}/seed={seed}: BalAcc={m['balanced_accuracy']:.4f} "
                    f"Recall={m['recall_sensitivity']:.4f} Spec={m['specificity']:.4f} "
                    f"PR-AUC={m.get('pr_auc', float('nan')):.4f} (best_step={m['best_step']}/{total_steps}) ({dt:.1f}s)"
                )


def run_ratio_ablation():
    csv_path = os.path.join(RESULTS_DIR, "ablation_ratio.csv")
    done = set()
    if os.path.exists(csv_path):
        with open(csv_path, newline="") as f:
            for r in csv.DictReader(f):
                done.add((r["benchmark"], r["strategy"], r["target_ratio"]))

    ratios = [0.1, 0.25, 0.5, 0.75, 1.0]
    strategies = ["rus", "ros_aug", "combo"]

    for bench in BENCHMARKS:
        hs_tr_full, nhs_tr_full, hs_te, nhs_te = load_benchmark(bench)
        hs_tr, nhs_tr, hs_val, nhs_val = split_train_val(hs_tr_full, nhs_tr_full)
        total_steps = compute_total_steps(len(hs_tr) + len(nhs_tr))
        for strat in strategies:
            for ratio in ratios:
                key = (bench, strat, str(ratio))
                if key in done:
                    print(f"[skip] {bench}/{strat}/ratio={ratio} already done")
                    continue
                print(f"[run ] {bench}/{strat}/ratio={ratio} ...")
                t0 = time.time()
                m = train_and_evaluate(
                    hs_tr, nhs_tr, hs_val, nhs_val, hs_te, nhs_te,
                    total_steps=total_steps, strategy=strat, target_ratio=ratio, seed=ABLATION_SEED,
                )
                dt = time.time() - t0
                row = {
                    "benchmark": bench, "strategy": strat,
                    "strategy_name": STRATEGY_NAMES[strat], "target_ratio": ratio,
                }
                row.update(m)
                row["wall_time_sec"] = round(dt, 2)
                append_row(csv_path, row)
                print(
                    f"[done] {bench}/{strat}/ratio={ratio}: "
                    f"BalAcc={m['balanced_accuracy']:.4f} Recall={m['recall_sensitivity']:.4f} "
                    f"({dt:.1f}s)"
                )


def run_learning_curves():
    """Part C: multi-seed learning curves for the mechanistic
    undersampling-failure analysis (baseline/RUS/balanced-batch on the
    most extreme benchmark, B5)."""
    out_path = os.path.join(RESULTS_DIR, "learning_curves_b5.json")
    if os.path.exists(out_path):
        print("[skip] learning_curves_b5.json already exists")
        return

    bench = "iccad5"
    hs_tr_full, nhs_tr_full, hs_te, nhs_te = load_benchmark(bench)
    hs_tr, nhs_tr, hs_val, nhs_val = split_train_val(hs_tr_full, nhs_tr_full)
    total_steps = compute_total_steps(len(hs_tr) + len(nhs_tr))

    results = {}
    for strat in ["none", "rus", "balanced_batch"]:
        results[strat] = {}
        for seed in SEEDS:
            print(f"[curve] {bench}/{strat}/seed={seed} ...")
            m, curve = train_and_evaluate(
                hs_tr, nhs_tr, hs_val, nhs_val, hs_te, nhs_te,
                total_steps=total_steps, strategy=strat, target_ratio=1.0, seed=seed,
                return_curve=True,
            )
            results[strat][str(seed)] = {"curve": curve, "final_metrics": m}

    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print("Wrote", out_path)


if __name__ == "__main__":
    os.makedirs(RESULTS_DIR, exist_ok=True)
    print("===== PART A: main strategy comparison (multi-seed) =====")
    run_main_grid()
    print("===== PART B: class-ratio ablation (single seed) =====")
    run_ratio_ablation()
    print("===== PART C: learning curves for mechanistic analysis =====")
    run_learning_curves()
    print("ALL EXPERIMENTS COMPLETE")
