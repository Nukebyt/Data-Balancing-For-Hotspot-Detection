# Project Roadmap — Group 11 DA-2 (Data Balancing and Augmentation Strategies for Hotspot Detection)

This document is the "plain-language walkthrough" of the project: what the
assignment actually asks for, what decisions we made and why, what has been
built, what still needs to happen, and how everything maps back to the
15-day timeline and the 30-mark rubric in `DA2_BVD_AIML_4.9.2026.pdf`. Read
`README.md` for the terse repo/usage reference; read this file for the
reasoning behind it.

---

## 1. What we were actually assigned

- **Course context:** BEVD402L (AI & ML for IC), Fall 2026-27, Dr. G. Lakshmi
  Priya. All 19 groups in the class solve the *same* base problem
  (lithography hotspot detection on the ICCAD-12 dataset, binary HS/NHS
  classification, common lightweight-CNN baseline, balanced accuracy as the
  primary metric) but each group gets a distinct **research angle**.
- **Group 11's angle** (Reg. Nos. 23BVD1066, 23BVD1067): *Data
  Balancing and Augmentation Strategies for Hotspot Detection*.
  - Research question: *"Which data-balancing strategy provides the most
    effective improvement for highly imbalanced ICCAD-12 hotspot
    detection?"*
  - Required focus: systematically compare undersampling, oversampling,
    augmentation, balanced mini-batches, or combinations of these.
  - Minimum expected investigation: don't just report balanced accuracy —
    also report hotspot recall, specificity, F1-score, and explicitly
    discuss the *effect of the altered class distribution* (i.e. what
    happens as you dial the resampling ratio up and down).
- **Hard constraints from the brief** (Sections 3-5 of the assignment):
  - Use all **five** ICCAD-12 benchmarks, report each **separately**, plus
    the overall average. Never merge them for the primary experiments.
  - Balancing/augmentation may only touch the **training** split — the test
    split must stay in its natural, imbalanced form, or the metrics would
    be meaningless.
  - Must include a controlled baseline-vs-proposed comparison, plus at
    least one ablation/controlled comparative experiment.
  - Must be built independently — no code, features, models, or results
    from any of the other 18 groups.
  - Final submission = IEEE-style conference paper + slides + source code
    with README + documented experimental settings.

## 2. What "sources" we pulled in, and why

1. **`Reference Paper.pdf`** (already provided) and the identical
   `ref_repo/Report.pdf` we cloned — Borisov & Scheible-style project
   ("Lithography Hotspot Detection using Deep Learning", IIT Bombay course
   project). This is the *faculty-referenced baseline*: it defines the
   lightweight custom-CNN architecture (two "basic blocks" of 3x Conv(3x3,
   12 filters) + BatchNorm + ELU + MaxPool, ~12.9k parameters) and the
   evaluation protocol (balanced accuracy, confusion matrix, etc.) that the
   assignment explicitly tells every group to treat as their baseline/
   reference point — "must not simply reproduce its methodology" is the
   key instruction, i.e. we reuse the *architecture family* and *dataset*,
   but our actual research contribution (the balancing/augmentation
   comparison) is our own.
2. **GitHub repo** `Intelectron6/Lithography-Hotspot-Detection` (the link
   your professor's email included) — cloned into `ref_repo/`. It contains
   the two Jupyter notebooks (`LHD_CustomModel.ipynb`,
   `LHD_TransferLearning.ipynb`) implementing that reference work, and —
   critically — its README links to the actual **ICCAD-12 dataset** on
   Google Drive (`iccad_official.rar`, ~68.5 MB). We downloaded and
   extracted this; it is the real, complete 5-benchmark dataset, and the
   per-class image counts we verified after extraction match the
   reference paper's published statistics table.
3. We did **not** copy any of that repo's code. We only (a) read its
   notebooks to confirm the exact dataset folder structure
   (`iccad{1..5}/{train,test}/{train_hs,train_nhs,test_hs,test_nhs}`) and
   the reference CNN's layer-by-layer definition, and (b) used its dataset
   link. All balancing/augmentation logic, the training loop, the metrics
   code, the experiment grid, and the ablation are original to this repo.

## 3. Engineering decisions and the reasoning behind them

- **Framework: PyTorch, not TensorFlow/Keras** (the reference used Keras).
  The installed Python here is very new (3.14), and TensorFlow does not
  currently ship wheels for it, while PyTorch does. Re-implementing the
  same architecture in PyTorch is a faithful, defensible substitution —
  it's noted explicitly in the report so it isn't mistaken for an
  oversight.
- **Input resolution: 64x64 grayscale, not 224x224x3.** The raw PNGs are
  1200x1200 grayscale. Running the full grid — 5 benchmarks x 6 strategies
  x several ablation ratios, on a CPU-only machine, with test sets up to
  ~48k images per benchmark — at 224x224x3 would take many hours to days.
  64x64x1 keeps every experiment fast enough to run the *entire* grid in
  about an hour or two, while still preserving the coarse geometric shape
  information (lines/corners/spacing) that actually drives hotspot
  classification. This is a deliberate, documented trade-off, not an
  accident — and it's consistent with the assignment's own emphasis on
  "computational efficiency" as one of the acceptable research angles.
- **Model size stayed in the same regime as the reference:** our backbone
  has ~8.6k trainable parameters (reference: ~12.9k) — same order of
  magnitude, same block structure, just re-scaled pooling to match the
  smaller input. This keeps the "common baseline" comparison fair and
  meaningful.
- **Six balancing/augmentation strategies**, all sharing the identical
  backbone/hyperparameters so that only the *training-data distribution*
  differs between runs (this isolates the effect the research question is
  actually about):
  1. `none` — natural imbalance (this *is* the common baseline run).
  2. `rus` — random undersampling of the majority (NHS) class.
  3. `ros` — random oversampling of the minority (HS) class by duplication.
  4. `ros_aug` — oversampling combined with on-the-fly flip/90-rotation
     augmentation, so duplicated hotspot samples aren't exact pixel
     copies (flip/rotation is a standard, literature-supported
     augmentation for layout-pattern images).
  5. `balanced_batch` — dataset left untouched; a weighted sampler forces
     every mini-batch toward ~50:50 HS:NHS at draw time (an "online"
     alternative to physically duplicating data).
  6. `combo` — moderate undersampling of NHS *plus* augmented
     oversampling of HS, meeting in the middle — this is the "suitable
     combination" the assignment explicitly invites.
- **Ablation:** for the three resampling-based strategies (`rus`,
  `ros_aug`, `combo`) we sweep the target HS:NHS ratio across
  {0.1, 0.25, 0.5, 0.75, 1.0} on all five benchmarks, and plot how
  recall, specificity, and balanced accuracy move as the class
  distribution is progressively altered — this directly satisfies the
  brief's "effect of the altered class distribution" requirement and
  counts as our required ablation/controlled comparative experiment.

## 4. Build log / phase status

| Phase | What it covers | Status |
|---|---|---|
| 1. Sourcing | Read assignment + reference paper; clone reference repo; download & extract ICCAD-12 dataset (5 benchmarks, verified class counts) | **Done** |
| 2. Data pipeline | `src/preprocess.py` — resize all PNGs to 64x64 grayscale, cache per benchmark as `.npz` (avoids re-decoding ~165k images on every experiment run) | **Done** (all 5 benchmarks cached) |
| 3. Model | `src/model.py` — lightweight CNN backbone, verified at 8,649 parameters | **Done** |
| 4. Balancing strategies | `src/balancing.py` — all 6 strategies implemented (none/rus/ros/ros_aug/balanced_batch/combo) | **Done** |
| 5. Metrics | `src/metrics.py` — confusion matrix, balanced accuracy, precision, recall/sensitivity, specificity, F1 | **Done** |
| 6. Training loop | `src/train.py` — trains one (benchmark, strategy) pair, times training/inference, returns full metrics dict; smoke-tested end-to-end on Benchmark 1 | **Done** |
| 7. Experiment grid | `src/run_experiments.py` — Part A: 5 benchmarks x 6 strategies main comparison (30 runs); Part B: ratio-ablation sweep (3 strategies x 5 ratios x 5 benchmarks, 75 runs); writes incrementally to CSV | **Done** — all 105 runs completed in `results/tables/main_results.csv` and `ablation_ratio.csv` |
| 8. Plots & tables | `src/plots.py` + `src/fill_report_tables.py` — class-distribution chart, grouped bar charts per metric, average-summary chart, confusion-matrix grid, ratio-ablation trade-off curves, auto-generated LaTeX tables from the real CSVs | **Done** — all figures in `results/figures/`, tables in `report/tables_generated.tex` |
| 9. Report | IEEE-format conference paper (LaTeX/MiKTeX), covering intro, related work (9 cited papers), dataset/imbalance analysis, methodology, results per benchmark + average, confusion-matrix analysis, ratio-ablation discussion, limitations & future work, conclusion — all discussion text written from the actual experiment numbers, not templated | **Done** — `report/report.pdf` (7 pages) |
| 10. Slides | 15-slide deck (`report/slides.pptx`, built with pptxgenjs, "Midnight Executive" navy/ice/hotspot-red palette): title, agenda, problem, imbalance, research question, backbone, strategies, protocol, 2 results charts, 2 key-finding deep-dives, ablation, conclusions, thank-you | **Done** — schema-validated; visual QA pending a LibreOffice install on this machine |
| 11. Beginner study guide | `report/study_guide.pdf` (11 pages) — explains ML/CNN/classification metrics from zero, then walks through this project's problem, method, and results in plain language, with a glossary | **Done** |
| 12. Final packaging | Rename the final report PDF per the submission convention (`Reg.No._DA_2_AIMLIIC`) using **the uploading student's own registration number**, fill in the Work Allocation table, have one student submit via the Microsoft Forms link before 20/09/2026 11:00 PM | **Last step — you do this yourself** |

## 5. Mapping onto the official 15-day timeline

We're compressing the brief's Day 1-15 plan into one continuous build
session; roughly:

- Days 1-3 (problem understanding, literature survey, dataset/imbalance
  analysis) → captured in Section 1-2 above and in the report's
  Introduction/Related-Work/Dataset sections.
- Days 4-5 (baseline implementation + evaluation) → `none` strategy row in
  `main_results.csv` *is* the baseline run, using the shared backbone.
  Confusion matrix outputs are produced by `plots.py`.
- Days 6-9 (proposed methodology design + implementation + tuning + main
  experiments) → `balancing.py` + `run_experiments.py` Part A.
- Day 10 (ablation/comparative experiments) → `run_experiments.py` Part B
  (ratio ablation).
- Days 11-13 (additional experiments, quantitative analysis, discussion) →
  `plots.py` outputs + the report's Results/Discussion sections.
- Days 14-15 (final report, slides, submission) → LaTeX report + slide
  deck + this repo as the "source code / notebook with README".

## 6. What you (the group) still need to do

1. Skim the generated report once it's produced and make sure it reads in
   your own voice — add your own analysis sentences where you want to,
   especially in the Discussion/Limitations section, since markers value
   independent interpretation over generated text.
2. Review the **Work Allocation table** (Section IX of the report) — it was
   filled in with a reasonable split of tasks between the two of you, but
   swap the specific items around if they don't match what you actually
   each worked on.
3. Double check the **citations** (9 papers) — seeded with the reference
   paper plus its own references (Borisov & Scheible 2018; Liao et al.
   2022; Yang et al. 2017) plus additional imbalance-learning papers
   (SMOTE, focal loss, data augmentation survey) relevant to your specific
   angle; confirm they render correctly and add any papers your professor
   specifically expects you to have read.
4. Both `report.pdf` and `report.docx` have been renamed to
   `23BVD1066_DA_2_AIMLIIC.{pdf,docx}` in `report/`. Have Priyanuj (or
   whichever of you is uploading) submit the PDF via the Microsoft Forms
   link before **20/09/2026, 11:00 PM**.
