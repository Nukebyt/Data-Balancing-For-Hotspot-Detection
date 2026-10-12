# Data Balancing and Augmentation Strategies for Lithography Hotspot Detection

**BEVD402L — AI and Machine Learning for IC | Digital Assignment II/III | Group 11**

Reg. Nos.: 23BVD1066 (Priyanuj Boruah), 23BVD1067 (Kartik Aggarwal)

This repository now contains the **DA3 revision** of our DA2 submission,
incorporating every piece of reviewer feedback given for Group 11 plus the
"common to all groups" feedback (see `DA2 Hotspot Detection_Feedback
(G1–G19).pdf`).

## 0. Deliverables (start here)

| File | What it is |
|---|---|
| `report/G11_DA3_DoubleColumn.docx` | **Submission-ready** revised paper, IEEE double-column format |
| `report/G11_DA3_SingleColumn.docx` | Same revised paper, single-column format |
| `report/report.tex` / `report/report.pdf` | LaTeX source and compiled PDF (authoritative double-column version both Word docs are built from) |
| `report/slides.pptx` | Presentation deck — includes the GitHub link slide and a feedback-addressed/novelty slide |
| `report/study_guide.pdf` | Beginner-friendly study guide explaining the project from zero prior AI/ML knowledge |
| `ROADMAP.md` | Plain-language walkthrough of what was revised, why, and what's left for you to do |
| `results/tables/*.csv`, `results/figures/*.png` | Raw experiment results (DA3) and generated figures |
| `results/tables/da2_archive/` | Archived DA2 results, kept for before/after comparison |

See `ROADMAP.md` for the full list of remaining manual steps (plagiarism
report, AI-content report, GitHub push, Microsoft Forms submission) that
only you can do.

## 1. Research Question

Which data-balancing strategy provides the most effective improvement for
highly imbalanced ICCAD-12 lithography hotspot detection? We systematically
compare **random undersampling**, **random oversampling**, **oversampling +
augmentation**, **balanced mini-batch sampling**, and **three combined**
under/oversampling variants against a **no-balancing baseline**, using an
identical lightweight-CNN classification backbone across all conditions.

## 2. What changed in the DA3 revision

| Feedback (G11-specific) | What we did |
|---|---|
| Add a validation split and equalise gradient updates | `src/data_split.py` carves a fixed 15% validation split from training data only; `src/train.py` trains every strategy for an identical number of gradient-update *steps* (not epochs) per benchmark, and selects the best checkpoint on validation before touching the test set once |
| Add seeds | Main grid now runs 3 seeds (42, 123, 2024) per (benchmark, strategy); `src/aggregate_results.py` reports mean ± std and paired significance tests |
| Test combined strategies and PR-AUC | Two new combined variants added (`combo_mild`, `combo_batch_aug`) alongside the original `combo`; PR-AUC (average precision) now reported for every run (`src/metrics.py`) |
| Justify layout-valid augmentations physically | New report subsection: Manhattan-geometry closure under 90°/flip, local-diffraction-physics invariance, and an explicit anisotropy caveat |
| Explain mechanistically why undersampling fails | New learning-curve diagnostic (`run_learning_curves` in `src/run_experiments.py`, `results/figures/learning_curves_b5.png`) — see the report's Mechanistic Analysis section; this also **revised our own DA2 conclusion** once the gradient-update confound was fixed |

| Feedback (common to all groups) | What we did |
|---|---|
| Report mean ± std over 3–5 seeds + statistical test | Done, see above |
| Compare against published ICCAD-12 results | New "Comparison with Published Results" section, citing real, web-verified papers with honestly-caveated aggregate numbers (no fabricated figures) |
| Select on validation only, test once | Done, see above |
| Work allocation table, limitations, reproducibility | Updated for DA3 tasks |
| Every claim cited/measured, citation supports the sentence | Literature review expanded and audited |
| 30–35+ references | 40 references, all web-verified, all cited in-text (see `report/report.tex` bibliography) |

## 3. Repository Layout

```
├── data/
│   ├── extracted/iccad-official/iccad{1..5}/{train,test}/{*_hs,*_nhs}/*.png  (raw dataset, gitignored)
│   └── cache/iccad{1..5}.npz                                                  (preprocessed 64x64 arrays, gitignored)
├── src/
│   ├── preprocess.py        # resize+cache raw PNGs -> .npz per benchmark
│   ├── model.py              # LightweightCNN backbone (~8.6k params)
│   ├── data_split.py         # DA3: deterministic train/validation carve-out
│   ├── balancing.py          # 8 data-balancing/augmentation strategies
│   ├── metrics.py            # confusion matrix, balanced accuracy, PR-AUC
│   ├── train.py               # DA3: step-based training, checkpoint selection, learning curves
│   ├── run_experiments.py    # DA3: multi-seed main grid + ratio ablation + learning curves
│   ├── aggregate_results.py  # DA3: mean/std aggregation + paired significance tests
│   ├── plots.py                # generates all figures in results/figures/
│   └── fill_report_tables.py # generates report/tables_generated.tex from the CSVs
├── results/
│   ├── tables/                # main_results_seeds.csv, ablation_ratio.csv, significance_tests.json, ...
│   │   └── da2_archive/        # archived DA2 (pre-revision) results, for comparison
│   └── figures/                # all PNG plots used in the report
├── report/                    # LaTeX/PDF/DOCX/PPTX deliverables + build scripts
├── ref_repo/                   # cloned faculty-referenced GitHub repo (baseline/reference notebooks, gitignored)
└── requirements.txt
```

## 4. Dataset

The ICCAD-12 benchmark dataset (5 benchmarks, PNG layout-clip images,
Hotspot=HS vs Non-Hotspot=NHS) was obtained from the Google Drive link
published in the reference GitHub repository
(https://github.com/Intelectron6/Lithography-Hotspot-Detection, `iccad_official.rar`)
and extracted to `data/extracted/iccad-official/`. Class counts:

| Benchmark | Train HS | Train NHS | Test HS | Test NHS | Test Imbalance |
|---|---|---|---|---|---|
| ICCAD-1 | 99 | 340 | 226 | 4679 | ~20.7 : 1 |
| ICCAD-2 | 174 | 5285 | 498 | 41298 | ~82.9 : 1 |
| ICCAD-3 | 909 | 4643 | 1808 | 46333 | ~25.6 : 1 |
| ICCAD-4 | 95 | 4452 | 177 | 31890 | ~180.2 : 1 |
| ICCAD-5 | 26 | 2716 | 41 | 19327 | ~471.4 : 1 |

All five benchmarks are treated **separately** for the primary experiments
(never merged), per the assignment brief. A 15% validation split is carved
from the training portion only (`src/data_split.py`); the test split is
**never** balanced, augmented, or touched during training/model-selection
in any experiment.

## 5. Setup / Reproduction

```bash
pip install -r requirements.txt

cd src
python preprocess.py           # one-time: resize raw PNGs to 64x64 and cache as .npz
python run_experiments.py      # DA3: multi-seed main grid + ablation + learning curves
python aggregate_results.py    # mean/std aggregation + paired significance tests
python plots.py                 # generates all figures in results/
python fill_report_tables.py    # generates report/tables_generated.tex
```

Everything runs on CPU (no GPU required). The full DA3 grid (5 benchmarks ×
8 strategies × 3 seeds, plus the ratio-ablation sweep and learning-curve
diagnostics) is substantially larger than the DA2 grid; budget roughly
2-3 hours on a modern multi-core laptop.

## 6. Method Summary

**Common baseline / backbone (all strategies share it):** a lightweight CNN
re-implemented in PyTorch (~8.6k parameters), structurally mirroring the
reference paper's custom CNN. See `src/model.py` and the report's
Methodology section.

**Balancing / augmentation strategies compared** (`src/balancing.py`):

1. **none** — natural class imbalance (baseline).
2. **rus** — random undersampling of the majority (NHS) class.
3. **ros** — random oversampling of the minority (HS) class (duplication).
4. **ros_aug** — oversampling of HS combined with on-the-fly augmentation.
5. **balanced_batch** — a `WeightedRandomSampler` forces every mini-batch
   toward ~50:50 HS:NHS; dataset size never changes.
6. **combo** — 50% undersampling of NHS + augmented oversampling of HS.
7. **combo_mild** — the same idea with milder (25%) undersampling.
8. **combo_batch_aug** — balanced-batch sampling + stochastic augmentation
   of drawn minority samples, with no physical duplication at all.

**Training protocol (DA3):** every strategy for a given benchmark trains
for an identical number of gradient-update steps (derived from the
baseline's natural training-set size), with the checkpoint selected on a
held-out validation split and the test split touched exactly once.

**Multi-seed + statistics:** the main grid repeats every condition under 3
seeds; `aggregate_results.py` reports mean ± std and paired t-test/Wilcoxon
significance tests (both must agree at α=0.05 for us to call a difference
significant).

**Ablation:** the target HS:NHS ratio is swept over {0.1, 0.25, 0.5, 0.75,
1.0} for `rus`, `ros_aug`, and `combo` on all five benchmarks (single seed,
documented as a remaining limitation).

## 7. Metrics Reported

Balanced Accuracy (primary), Precision, Recall/Sensitivity, Specificity,
F1-score, PR-AUC, and the full confusion matrix (TP/FP/FN/TN), for every
(benchmark, strategy, seed) triple, plus mean ± std across benchmarks and
seeds — as required by the assignment rubric.

## 8. Academic Integrity Note

The lightweight-CNN architecture and the ICCAD-12 dataset source are taken
from the faculty-supplied reference work (V. Borisov & J. Scheible, SMACD
2018, reproduced in the linked GitHub repo) and used strictly as the
common baseline/reference point. All balancing/augmentation strategies,
the experiment design, the validation/step/seed protocol, the statistical
testing, and all code in `src/` were independently implemented by Group
11. The expanded literature review (40 references) was compiled and
cross-checked against live web sources rather than generated from memory;
every reference is cited in the text it supports. No code, trained
models, features, or results from any other group were used.
