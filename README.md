# Data Balancing and Augmentation Strategies for Lithography Hotspot Detection

**BEVD402L — AI and Machine Learning for IC | Digital Assignment II | Group 11**

Reg. Nos.: 23BVD1066 (Priyanuj Boruah), 23BVD1067 (Kartik Aggarwal)

## 0. Deliverables (start here)

| File | What it is |
|---|---|
| [report/23BVD1066_DA_2_AIMLIIC.pdf](report/23BVD1066_DA_2_AIMLIIC.pdf) | **Submission-ready PDF** — IEEE-format conference-style report (7 pages), named per Section 10 of the assignment brief |
| [report/23BVD1066_DA_2_AIMLIIC.docx](report/23BVD1066_DA_2_AIMLIIC.docx) | Same report content in editable Word (.docx) form (12 pages, single-column) |
| [report/report.tex](report/report.tex) / [report/build_docx.js](report/build_docx.js) | Source files — LaTeX for the PDF, docx-js script for the Word version (both generated from the same underlying results) |
| [report/slides.pptx](report/slides.pptx) | 15-slide presentation deck summarizing the project and findings |
| [report/study_guide.pdf](report/study_guide.pdf) | Beginner-friendly study guide (11 pages) — explains AI/ML and this project from zero prior knowledge |
| [ROADMAP.md](ROADMAP.md) | Plain-language walkthrough of what was built, why, and what's left for you to do |
| `results/tables/*.csv`, `results/figures/*.png` | Raw experiment results and generated figures |

Submit `23BVD1066_DA_2_AIMLIIC.pdf` via the Microsoft Forms link before the deadline. If a different student ends up uploading, rename the PDF (and optionally the docx) to use **their** registration number instead — the naming convention is `Reg.No._DA_2_AIMLIIC`.

## 1. Research Question

Which data-balancing strategy provides the most effective improvement for
highly imbalanced ICCAD-12 lithography hotspot detection? We systematically
compare **random undersampling**, **random oversampling**, **oversampling +
augmentation**, **balanced mini-batch sampling**, and a **combined**
under/oversampling strategy against a **no-balancing baseline**, using an
identical lightweight-CNN classification backbone across all conditions.

## 2. Repository Layout

```
├── data/
│   ├── extracted/iccad-official/iccad{1..5}/{train,test}/{*_hs,*_nhs}/*.png  (raw dataset)
│   └── cache/iccad{1..5}.npz                                                  (preprocessed 64x64 arrays)
├── src/
│   ├── preprocess.py       # resize+cache raw PNGs -> .npz per benchmark
│   ├── model.py             # LightweightCNN backbone (~8.6k params)
│   ├── balancing.py         # 6 data-balancing/augmentation strategies
│   ├── metrics.py           # confusion matrix + balanced accuracy etc.
│   ├── train.py              # train_and_evaluate() for one (benchmark, strategy)
│   ├── run_experiments.py   # full experiment grid + ratio ablation -> results/tables/*.csv
│   └── plots.py               # generates all figures in results/figures/
├── results/
│   ├── tables/               # main_results.csv, ablation_ratio.csv, average_summary.csv
│   └── figures/               # all PNG plots used in the report
├── report/                   # IEEE-format conference paper (LaTeX + compiled PDF) and slides
├── ref_repo/                  # cloned faculty-referenced GitHub repo (baseline/reference notebooks)
└── requirements.txt
```

## 3. Dataset

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
(never merged), per the assignment brief. The test split is **never**
balanced or augmented in any experiment — only training data is modified —
so reported metrics always reflect the true deployment class skew.

## 4. Setup / Reproduction

```bash
pip install -r requirements.txt

cd src
python preprocess.py          # one-time: resize raw PNGs to 64x64 and cache as .npz
python run_experiments.py     # runs main strategy grid + class-ratio ablation
python plots.py                # generates all figures/tables in results/
```

Everything runs on CPU (no GPU required); the full grid (5 benchmarks x 6
strategies, plus the ratio-ablation sweep) trains in well under two hours on
a modern multi-core laptop.

## 5. Method Summary

**Common baseline / backbone (all strategies share it):** a lightweight CNN
re-implemented in PyTorch, structurally mirroring the reference paper's
custom CNN (two "Basic Blocks" of 3x Conv(3x3,12)+BatchNorm+ELU+MaxPool,
separated by an extra pooling stage, then Flatten->Dropout(0.3)->FC(10)->
FC(1,sigmoid)), rescaled to a 64x64 single-channel input (~8.6k parameters)
so the full 5-benchmark x multi-strategy grid is tractable on CPU. See
`src/model.py` and the report's Methodology section for the full
justification of this deviation from the reference's 224x224x3 input.

**Balancing / augmentation strategies compared** (`src/balancing.py`):

1. **none** — natural class imbalance (baseline).
2. **rus** — random undersampling of the majority (NHS) class.
3. **ros** — random oversampling of the minority (HS) class (duplication).
4. **ros_aug** — oversampling of HS combined with on-the-fly augmentation
   (horizontal/vertical flip, 90/180/270-degree rotation) so duplicated
   minority images are not exact pixel copies.
5. **balanced_batch** — dataset size unchanged; a `WeightedRandomSampler`
   forces every mini-batch toward ~50:50 HS:NHS.
6. **combo** — moderate undersampling of NHS + augmented oversampling of
   HS, meeting in the middle.

**Ablation:** the target HS:NHS ratio is swept over {0.1, 0.25, 0.5, 0.75,
1.0} for `rus`, `ros_aug`, and `combo` on all five benchmarks, to quantify
how progressively altering the class distribution trades recall off
against specificity/balanced accuracy.

## 6. Metrics Reported

Balanced Accuracy (primary), Precision, Recall/Sensitivity, Specificity,
F1-score, and the full confusion matrix (TP/FP/FN/TN), for every
(benchmark, strategy) pair, plus the 5-benchmark average — as required by
the assignment rubric.

## 7. Academic Integrity Note

The lightweight-CNN architecture and the ICCAD-12 dataset source are taken
from the faculty-supplied reference work (V. Borisov & J. Scheible, SMACD
2018, reproduced in the linked GitHub repo) and used strictly as the
common baseline/reference point, per assignment Section 2. All balancing
and augmentation strategies, the experiment design, the ratio ablation,
and all code in `src/` were independently implemented by Group 11; no
code, trained models, features, or results from any other group were
used.
