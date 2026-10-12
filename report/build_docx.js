const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun,
  ShadingType, VerticalAlign, PageBreak, Header, Footer, PageNumber,
} = require("docx");

const FIG = "../results/figures";

// ---------- small helpers ----------
const NAVY = "1E2761";

function T(text, opts = {}) {
  return new TextRun({ text, ...opts });
}
function P(children, opts = {}) {
  const runs = Array.isArray(children) ? children : [T(children)];
  return new Paragraph({
    children: runs,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 160 },
    ...opts,
  });
}
function H1(numeral, text) {
  return new Paragraph({
    children: [T(`${numeral}. ${text.toUpperCase()}`, { bold: true, color: NAVY, size: 26 })],
    spacing: { before: 320, after: 160 },
    heading: HeadingLevel.HEADING_1,
  });
}
function H2(letter, text) {
  return new Paragraph({
    children: [T(`${letter}. ${text}`, { bold: true, italics: true, size: 23 })],
    spacing: { before: 220, after: 120 },
    heading: HeadingLevel.HEADING_2,
  });
}
function Caption(prefix, text) {
  return new Paragraph({
    children: [T(`${prefix}. `, { bold: true, size: 20 }), T(text, { size: 20, italics: false })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 260 },
  });
}
function cellBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: none, bottom: none, left: none, right: none };
}
function cell(text, { bold = false, header = false, align = AlignmentType.CENTER, width } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: header ? { type: ShadingType.CLEAR, fill: "1E2761" } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    children: [
      new Paragraph({
        alignment: align,
        children: [T(text, { bold: bold || header, color: header ? "FFFFFF" : "000000", size: 19 })],
      }),
    ],
  });
}
function dataTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) => cell(h, { header: true, width: colWidths[i] })),
    tableHeader: true,
  });
  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        children: r.map((c, i) => {
          const isObj = typeof c === "object";
          const text = isObj ? c.text : c;
          const bold = isObj ? !!c.bold : false;
          return cell(String(text), { align: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER, bold, width: colWidths[i] });
        }),
      })
  );
  return new Table({
    width: { size: 9350, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...bodyRows],
  });
}
function imgParagraph(file, pxW, pxH, capPrefix, capText) {
  const widthIn = 6.2;
  const heightIn = widthIn * (pxH / pxW);
  const data = fs.readFileSync(`${FIG}/${file}`);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60 },
      children: [
        new ImageRun({
          data,
          transformation: { width: Math.round(widthIn * 96), height: Math.round(heightIn * 96) },
          type: "png",
        }),
      ],
    }),
    Caption(capPrefix, capText),
  ];
}

// ---------- document body ----------
const children = [];

// Title
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      T(
        "Data Balancing and Augmentation Strategies for Lithography Hotspot Detection on the ICCAD-12 Benchmark",
        { bold: true, size: 34, color: NAVY }
      ),
    ],
  })
);

// Authors (borderless two-column table)
children.push(
  new Table({
    width: { size: 9350, type: WidthType.DXA },
    columnWidths: [4675, 4675],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 4675, type: WidthType.DXA },
            borders: cellBorders(),
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [T("Priyanuj Boruah", { bold: true, size: 22 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [T("23BVD1066", { size: 20 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [T("B.Tech. (BVD), VIT Chennai", { size: 20 })] }),
            ],
          }),
          new TableCell({
            width: { size: 4675, type: WidthType.DXA },
            borders: cellBorders(),
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [T("Kartik Aggarwal", { bold: true, size: 22 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [T("23BVD1067", { size: 20 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [T("B.Tech. (BVD), VIT Chennai", { size: 20 })] }),
            ],
          }),
        ],
      }),
    ],
  })
);
children.push(new Paragraph({ spacing: { after: 200 }, children: [T("")] }));

// Abstract
children.push(
  P(
    [
      T("Abstract—", { bold: true, italics: true }),
      T(
        "Lithography hotspot detection is a binary classification problem in which the number of hotspot (HS) layout patterns is vastly outnumbered by non-hotspot (NHS) patterns, with imbalance ratios exceeding 400:1 on some ICCAD-12 benchmarks. This severe skew means a classifier can achieve high raw accuracy while missing almost every real hotspot – exactly the failure mode a manufacturing screening tool cannot afford. This work systematically compares six training-data strategies – no balancing (baseline), random undersampling, random oversampling, oversampling with augmentation, balanced mini-batch sampling, and a combined under/oversampling strategy – using an identical lightweight convolutional backbone, on all five ICCAD-12 benchmarks independently. We report balanced accuracy, precision, recall/sensitivity, specificity, F1-score and the full confusion matrix per benchmark and on average, and additionally run a class-ratio ablation study that quantifies the recall/specificity trade-off as the training distribution is progressively re-balanced. Our results show that balanced mini-batch sampling gives the strongest and most consistent improvement (average balanced accuracy 0.945 vs. 0.844 for the imbalanced baseline), that plain random undersampling is actually the ",
        { italics: true }
      ),
      T("worst", { italics: true, bold: true }),
      T(
        "-performing strategy on average and collapses to 0% hotspot recall on the most extreme benchmark, and that augmenting the minority class helps on moderately imbalanced benchmarks but actively hurts on the most severely imbalanced one – confirming that "
      ),
      T("how", { italics: true }),
      T(" and "),
      T("how much", { italics: true }),
      T(
        " a class distribution is altered matters as much as "
      ),
      T("whether", { italics: true }),
      T(" it is altered at all, and that the best strategy is benchmark-dependent rather than universal."),
    ],
    { spacing: { after: 120 } }
  )
);
children.push(
  P([
    T("Index Terms—", { bold: true, italics: true }),
    T(
      "lithography hotspot detection, class imbalance, data augmentation, oversampling, undersampling, convolutional neural network, ICCAD-12"
    ),
  ])
);

// I. Introduction
children.push(H1("I", "Introduction"));
children.push(
  P(
    "Photo-lithography is the dominant patterning technology used in semiconductor manufacturing, but as process nodes shrink well below the lithographic wavelength, certain layout geometries become susceptible to printing failures known as hotspots – pinching (open-circuit) or bridging (short-circuit) defects that reduce manufacturing yield. Detecting hotspots early, at the design stage, avoids costly re-spins and mask corrections. Full lithography simulation is accurate but computationally prohibitive for full-chip verification, motivating machine-learning-based hotspot detectors that can flag suspect layout clips quickly [1], [2]."
  )
);
children.push(
  P(
    "The ICCAD-2012 Contest benchmark [3] is the most widely used public dataset for this task. It consists of five benchmarks of layout-pattern image clips labeled hotspot (HS) or non-hotspot (NHS). A defining characteristic of this dataset – and of hotspot detection in general – is severe class imbalance: hotspot patterns are rare by construction, since most of a design is manufacturable. On the five ICCAD-12 benchmarks used in this work, the test-set imbalance ratio ranges from roughly 21:1 up to over 470:1 (Table I). Under such skew, a trivial classifier that always predicts NHS can exceed 99% raw accuracy while catching zero hotspots – which is why the assignment brief, and this study, use balanced accuracy (the average of recall and specificity) as the primary metric, in addition to reporting the full confusion matrix."
  )
);
children.push(
  P(
    "The faculty-supplied reference work [1] establishes a lightweight custom CNN baseline (transfer-learning on VGG16 with classical classifiers, and a ~13k-parameter CNN trained from scratch) and reports strong balanced accuracy using this backbone without any explicit data-balancing intervention. Our assigned research question asks specifically: which data-balancing strategy provides the most effective improvement for highly imbalanced ICCAD-12 hotspot detection? We hold the classification backbone fixed and treat the training-data distribution as the sole experimental variable, isolating its effect from architectural choices – which is the appropriate controlled-experiment design for this research question."
  )
);
children.push(P("Our contributions are:"));
[
  "A controlled, five-benchmark comparison of six data-level balancing/augmentation strategies (undersampling, oversampling, augmented oversampling, balanced-batch sampling, and a combined strategy) against the natural-imbalance baseline, using an identical lightweight CNN and evaluation protocol.",
  "A class-ratio ablation study that sweeps the target HS:NHS ratio and quantifies how recall trades off against specificity and balanced accuracy as the training distribution is progressively altered, for three representative strategies.",
  "An open, reproducible implementation (Section VIII) with cached preprocessing, a documented experiment grid, and generated figures/tables for all reported results.",
].forEach((t, i) => children.push(new Paragraph({ text: t, numbering: { reference: "contrib-list", level: 0 }, spacing: { after: 100 } })));

// II. Related Work
children.push(H1("II", "Related Work"));
children.push(
  P([
    T("Lithography hotspot detection. ", { bold: true }),
    T(
      "Early hotspot detectors relied on pattern matching against a library of known-bad layout clips, which cannot generalize to unseen patterns [2]. Machine learning approaches were introduced to improve generalization while retaining speed advantages over full lithography simulation. [1] compares VGG16-based transfer learning with classical classifiers against a custom lightweight CNN trained from scratch on the ICCAD-12 benchmarks, finding that the lightweight CNN achieves both higher balanced accuracy and roughly 29× faster inference – this is the reference/baseline architecture family we adopt in this work. [4] similarly investigates transfer learning with pretrained deep CNN feature extractors for hotspot detection. [5] explicitly addresses the class-imbalance problem in hotspot detection through a biased-learning feature-tensor approach, applying class-dependent loss weighting rather than data-level resampling – a cost-sensitive-learning alternative to the data-level strategies studied here (and the subject of a related, separately-assigned research angle in this course's broader project set)."
    ),
  ])
);
children.push(
  P([
    T("Class imbalance and resampling. ", { bold: true }),
    T(
      "Random undersampling and oversampling are the two classical data-level techniques for imbalanced classification [7]. Synthetic Minority Oversampling (SMOTE) [6] generates interpolated minority samples rather than exact duplicates, reducing overfitting to repeated minority instances; for image data, an analogous effect is achieved through label-preserving data augmentation of the minority class rather than feature-space interpolation, which is the augmented-oversampling strategy we study here. [7] provides a broader survey of resampling, cost-sensitive, and ensemble approaches to learning from imbalanced data, several of which (cost-sensitive learning, focal loss [8]) are complementary, loss-level alternatives to the data-level strategies this work focuses on."
    ),
  ])
);
children.push(
  P([
    T("Data augmentation. ", { bold: true }),
    T(
      "[9] surveys image data augmentation techniques for deep learning, including geometric transformations such as flipping and rotation, which we adopt for augmenting the minority (hotspot) class since layout-pattern clips do not have a single canonical orientation and flip/rotation-invariance is a reasonable inductive bias for this domain, consistent with augmentation choices used elsewhere in the hotspot-detection literature."
    ),
  ])
);

// III. Dataset
children.push(H1("III", "Dataset and Class Imbalance Analysis"));
children.push(
  P(
    "We use the five ICCAD-12 benchmark datasets in the pre-rendered image-clip form (grayscale PNG layout clips, one class-labeled folder per split) distributed alongside [1]'s public implementation. Table I reports the class counts we obtained after extraction, which we verified against the statistics published in [1]."
  )
);
children.push(
  dataTable(
    ["Bench.", "Tr. HS", "Tr. NHS", "Te. HS", "Te. NHS", "Te. Imb. (NHS:HS)"],
    [
      ["B1", "99", "340", "226", "4,679", "20.7:1"],
      ["B2", "174", "5,285", "498", "41,298", "82.9:1"],
      ["B3", "909", "4,643", "1,808", "46,333", "25.6:1"],
      ["B4", "95", "4,452", "177", "31,890", "180.2:1"],
      ["B5", "26", "2,716", "41", "19,327", "471.4:1"],
    ],
    [1450, 1450, 1500, 1450, 1500, 2000]
  )
);
children.push(Caption("Table I", "ICCAD-12 benchmark class distribution (verified after extraction)."));
children.push(
  P(
    "Figure 1 visualizes this skew on a log scale. Every benchmark is dominated by non-hotspot patterns, consistent with the physical reality that most of a manufacturable design does not contain lithography-critical geometry; Benchmark 5 is the most extreme case, with fewer than 30 hotspot training examples against nearly 2,700 non-hotspots. As required by the assignment brief, the five benchmarks are analyzed and reported separately throughout this study and are never merged for the primary experiments; only the training split of each benchmark is ever resampled or augmented, while every test split is evaluated in its natural, unmodified class distribution."
  )
);
children.push(...imgParagraph("class_distribution.png", 1280, 800, "Fig. 1", "Class distribution per ICCAD-12 benchmark (train+test, log scale)."));

// IV. Methodology
children.push(H1("IV", "Methodology"));
children.push(H2("A", "Common Classification Backbone"));
children.push(
  P(
    "All strategies share an identical lightweight CNN classifier, so that the training-data distribution is the only experimental variable (see src/model.py for the full definition). The architecture mirrors [1]'s custom CNN: two “basic blocks”, each consisting of three 3×3 convolutions (12 filters) followed by batch normalization, an ELU activation, and 2×2 max pooling, separated by an additional pooling stage, followed by flatten → dropout(0.3) → fully-connected(10, ReLU) → fully-connected(1, sigmoid). We re-implemented this backbone in PyTorch (the reference used Keras/TensorFlow) and re-scaled the input from 224×224×3 to 64×64×1 (single-channel grayscale) so that the full five-benchmark × six-strategy experiment grid, plus the class-ratio ablation, remains tractable on CPU-only hardware. This keeps the model in the same lightweight parameter regime as the reference (8,649 vs. 12,873 trainable parameters) while enabling every condition in this study to be trained and evaluated end-to-end; Section VII discusses this trade-off explicitly. All models are trained for 8 epochs with the Nadam optimizer (matching [1]) and binary cross-entropy loss, batch size 32, from a fixed random seed, for every (benchmark, strategy) condition."
  )
);
children.push(H2("B", "Data Balancing and Augmentation Strategies"));
children.push(
  P(
    "Every strategy operates only on the training split of a given benchmark; test data is always the untouched, naturally imbalanced split. Let nₕₛ and nₙₕₛ denote the number of hotspot and non-hotspot training images."
  )
);
[
  ["Baseline (None).", "Training proceeds on the natural, imbalanced training set with no intervention. This is the common reference point every other strategy is compared against."],
  ["Random Undersampling (RUS).", "The majority (NHS) class is randomly subsampled, without replacement, down to a target HS:NHS ratio (1:1 in the main comparison). This discards data but removes redundancy in the dominant class."],
  ["Random Oversampling (ROS).", "The minority (HS) class is randomly duplicated, with replacement, up to the target ratio. This preserves all majority-class information but risks overfitting to repeated exact copies of a small number of hotspot images."],
  ["Oversampling + Augmentation (ROS+Aug).", "Identical to ROS, except every duplicated hotspot sample (the original copy of each hotspot image is always seen unmodified at least once) is passed through one randomly chosen label-preserving transform – horizontal flip, vertical flip, or a 90/180/270-degree rotation – applied on-the-fly at load time, so the network never sees an exact pixel-identical duplicate."],
  ["Balanced Mini-Batch Sampling.", "The training set itself is left untouched (no duplication, no discarding), but a WeightedRandomSampler draws each mini-batch so that hotspot and non-hotspot examples appear with approximately equal probability, achieving a similar effective training balance to ROS without physically inflating the stored dataset."],
  ["Combined (Undersample + Augmented-Oversample).", "The majority class is first moderately undersampled (to 50% of its original size), then the minority class is oversampled with augmentation up to the target ratio against the reduced majority count. This strategy meets in the middle, reducing both the degree of majority-class discarding and the degree of minority-class duplication relative to using either RUS or ROS+Aug alone."],
].forEach(([bold, rest]) => {
  children.push(
    new Paragraph({
      children: [T(bold, { bold: true }), T(" " + rest)],
      numbering: { reference: "strategy-list", level: 0 },
      spacing: { after: 100 },
      alignment: AlignmentType.JUSTIFIED,
    })
  );
});
children.push(H2("C", "Ablation: Class-Ratio Sweep"));
children.push(
  P(
    "To directly address the assignment's requirement to evaluate “the effect of the altered class distribution”, we sweep the target HS:NHS ratio over {0.1, 0.25, 0.5, 0.75, 1.0} for RUS, ROS+Aug, and the Combined strategy, on all five benchmarks, and track how recall, specificity, and balanced accuracy move as the training distribution is progressively re-balanced from near-natural (0.1) to fully balanced (1.0)."
  )
);
children.push(H2("D", "Evaluation Protocol"));
children.push(
  P(
    "For every (benchmark, strategy) pair we report the full confusion matrix (TP/FP/FN/TN, with hotspot as the positive class), Precision, Recall/Sensitivity, Specificity, F1-score, and Balanced Accuracy (the average of recall and specificity), computed on the untouched test split of that benchmark:"
  )
);
[
  "Precision = TP / (TP + FP)        Recall = TP / (TP + FN)",
  "Specificity = TN / (FP + TN)        F1 = 2 · Precision · Recall / (Precision + Recall)",
  "Balanced Accuracy = (Recall + Specificity) / 2",
].forEach((f) =>
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [T(f, { italics: true })] }))
);

// V. Results
children.push(H1("V", "Results"));
children.push(H2("A", "Main Comparison"));
children.push(
  P(
    "Table II reports balanced accuracy per strategy on every benchmark plus the 5-benchmark average; Table III reports all five metrics averaged across benchmarks. Figure 2 visualizes balanced accuracy per benchmark and strategy; Figures 3 and 4 show the recall comparison and the averaged-metric summary respectively."
  )
);
children.push(
  dataTable(
    ["Strategy", "B1", "B2", "B3", "B4", "B5", "Avg"],
    [
      ["Baseline (None)", "0.813", "0.698", "0.949", "0.845", "0.914", "0.844"],
      ["RUS", "0.808", "0.947", "0.949", "0.688", "0.500", "0.779"],
      ["ROS", "0.806", "0.978", "0.954", "0.964", "0.914", "0.923"],
      ["ROS+Aug", "0.808", "0.992", "0.967", "0.961", "0.707", "0.887"],
      ["Bal. Batch", { text: "0.815", bold: true }, "0.981", { text: "0.972", bold: true }, { text: "0.970", bold: true }, { text: "0.986", bold: true }, { text: "0.945", bold: true }],
      ["Combined", "0.806", { text: "0.992", bold: true }, "0.903", "0.966", "0.961", "0.926"],
    ],
    [2350, 1170, 1170, 1170, 1170, 1170, 1150]
  )
);
children.push(Caption("Table II", "Balanced Accuracy per strategy on every ICCAD-12 benchmark, plus the 5-benchmark average. Highest per column is bolded."));

children.push(
  dataTable(
    ["Strategy", "BalAcc", "Recall", "Spec.", "F1", "Prec."],
    [
      ["Baseline (None)", "0.844", "0.781", "0.906", { text: "0.503", bold: true }, { text: "0.502", bold: true }],
      ["RUS", "0.779", "0.642", { text: "0.915", bold: true }, "0.228", "0.144"],
      ["ROS", "0.923", "0.949", "0.897", "0.456", "0.326"],
      ["ROS+Aug", "0.887", "0.871", "0.903", "0.453", "0.426"],
      ["Bal. Batch", { text: "0.945", bold: true }, { text: "0.980", bold: true }, "0.909", "0.446", "0.309"],
      ["Combined", "0.926", "0.939", "0.913", "0.491", "0.383"],
    ],
    [2350, 1400, 1400, 1400, 1400, 1400]
  )
);
children.push(Caption("Table III", "All metrics, averaged across the 5 ICCAD-12 benchmarks, per strategy. Highest value per column is bolded."));

children.push(...imgParagraph("balanced_accuracy_grouped.png", 1760, 880, "Fig. 2", "Balanced accuracy by strategy across all five benchmarks."));
children.push(...imgParagraph("recall_grouped.png", 1760, 880, "Fig. 3", "Hotspot recall (sensitivity) by strategy across all five benchmarks."));
children.push(...imgParagraph("average_summary.png", 1440, 880, "Fig. 4", "Average performance across all five benchmarks, per strategy."));

children.push(
  P([
    T("Averaged over all five benchmarks, ", {}),
    T("Balanced Mini-Batch Sampling achieves the highest balanced accuracy (0.945) and the highest recall (0.980)", { bold: true }),
    T(
      ", followed by the Combined strategy (0.926), plain Random Oversampling (0.923), Oversampling+Augmentation (0.887), the natural-imbalance Baseline (0.844), and finally Random Undersampling, which is the "
    ),
    T("worst", { italics: true }),
    T(
      "-performing strategy on average (0.779) despite actively targeting the class imbalance. Every active balancing strategy except RUS improves average balanced accuracy over the do-nothing baseline, confirming that data-level intervention helps overall – but the size of that improvement, and even its sign, depends heavily on "
    ),
    T("how", { italics: true }),
    T(" the distribution is altered and on the benchmark's specific imbalance severity."),
  ])
);
children.push(
  P([
    T("The baseline is not uniformly bad – it is unstable. ", { bold: true }),
    T(
      "The natural-imbalance baseline is not a simple “always predicts non-hotspot” failure mode: on B1 (the mildest imbalance, 20.7:1) it reaches recall 1.000 but specificity only 0.626 (it over-predicts hotspot), while on B2 (82.9:1) it swings to the opposite failure mode, recall 0.396 with specificity 0.9999 (it under-predicts hotspot, missing 301 of 498 real hotspots). This confirms the assignment brief's premise directly: with severe imbalance, the "
    ),
    T("direction", { italics: true }),
    T(
      " of a plain classifier's bias is not predictable from raw accuracy alone, which is precisely why balanced accuracy and the full confusion matrix — not accuracy — must be the primary evaluation lens."
    ),
  ])
);
children.push(
  P([
    T("Undersampling alone is unreliable at extreme imbalance. ", { bold: true }),
    T(
      "RUS performs competitively on the milder benchmarks (B2: 0.947, B3: 0.949) but collapses on B5, the most extreme case (471:1 test imbalance, only 26 native hotspot training images): balanced accuracy 0.500, recall 0.000 – the model predicts "
    ),
    T("every single test image as non-hotspot", { italics: true }),
    T(
      ", even though the undersampled training set was artificially rebalanced to a 1:1 HS:NHS ratio. The ratio ablation (Section V-C) shows this is not a tuning artifact: RUS stays stuck at recall 0.000 across "
    ),
    T("every", { italics: true }),
    T(
      " tested target ratio on B5. The bottleneck is not the class proportion in training but the absolute amount of minority-class information available – discarding majority-class data cannot manufacture hotspot signal that was never there, and with only 26 originals the resulting ~50-image training set is too small for an (admittedly tiny) CNN to learn a useful decision boundary in 8 epochs."
    ),
  ])
);
children.push(
  P([
    T("Augmentation helps moderate imbalance but can hurt extreme imbalance. ", { bold: true }),
    T(
      "Oversampling with augmentation (ROS+Aug) outperforms plain duplication (ROS) on B2 (0.992 vs. 0.978) and B3 (0.967 vs. 0.954), where the minority class still has a few hundred distinct originals to draw from. But on B5, where only 26 original hotspot images exist, ROS+Aug is dramatically "
    ),
    T("worse", { italics: true }),
    T(
      " than plain ROS (0.707 vs. 0.914) – worse even than doing nothing. When almost every hotspot example the network sees during training is a flipped or rotated synthetic variant of one of a handful of originals, the model appears to latch onto artifacts of the augmentation itself rather than genuine hotspot geometry, and generalizes poorly to the untouched, unaugmented test set. This is a genuinely useful negative result: it shows that augmentation is not an unconditionally safe default for minority classes and should be validated per-benchmark rather than applied uniformly."
    ),
  ])
);
children.push(
  P([
    T("Balanced-batch sampling is the most consistently strong strategy. ", { bold: true }),
    T(
      "Unlike RUS/ROS/ROS+Aug, balanced mini-batch sampling never physically discards majority data nor duplicates/augments minority data on disk – it only reweights which examples are drawn into each training batch. This turns out to be the most robust strategy across the full imbalance spectrum studied here, including the pathological B5 case (0.986 balanced accuracy, recall 0.976 – the best result of "
    ),
    T("any", { italics: true }),
    T(
      " strategy on B5). We interpret this as evidence that preserving full majority-class diversity while only adjusting sampling frequency (rather than the underlying data pool) avoids both RUS's information loss and ROS/ROS+Aug's overfitting-to-duplicates risk."
    ),
  ])
);
children.push(
  P([
    T("The Combined strategy trades recall for precision. ", { bold: true }),
    T(
      "The Combined strategy (moderate undersampling + augmented oversampling) is the second-best strategy on average balanced accuracy (0.926), but its confusion matrices (Fig. 5, bottom row) show a distinct profile: on B3 it achieves the best F1-score and precision of "
    ),
    T("any", { italics: true }),
    T(
      " strategy (F1 = 0.793, precision = 0.772) at the cost of lower recall (0.816 vs. 0.987 for plain ROS). This makes Combined the most precision-oriented of the strategies studied – useful in a deployment where false hotspot flags carry a real downstream verification cost, as opposed to Balanced Mini-Batch Sampling, which is the most recall-oriented choice when missing a true hotspot is the costlier error."
    ),
  ])
);

children.push(H2("B", "Confusion Matrix Analysis"));
children.push(
  P(
    "Figure 5 shows the raw confusion matrix (with row-normalized shading) for every (strategy, benchmark) pair. The baseline row (top) visibly swings between over-predicting hotspot on B1 (bright off-diagonal FP cell) and under-predicting it on B2 (bright off-diagonal FN cell), illustrating the instability discussed above. From RUS downward, the FN column (missed hotspots, top-right cell of each panel) shrinks markedly for every benchmark except B5's RUS panel, which is the one cell in the entire grid where the model predicts the non-hotspot class 100% of the time regardless of ground truth – a visually obvious confirmation of the recall collapse reported numerically above. The Balanced Mini-Batch and Combined rows have the most consistently dark diagonal (correct-prediction) cells across every column, visually corroborating their higher average balanced accuracy."
  )
);
children.push(...imgParagraph("confusion_matrices_grid.png", 2250, 2400, "Fig. 5", "Confusion matrices for all strategies (rows) across all benchmarks (columns)."));

children.push(H2("C", "Ablation: Effect of the Target Class Ratio"));
children.push(
  P(
    "Figures 6 and 7 show, respectively, the RUS recall/specificity trade-off and the Combined strategy's balanced accuracy as the target HS:NHS ratio is swept from 0.1 (mild rebalancing) to 1.0 (fully balanced), for all five benchmarks."
  )
);
children.push(...imgParagraph("ablation_tradeoff_rus.png", 1200, 750, "Fig. 6", "RUS: recall and specificity vs. target class ratio, per benchmark."));
children.push(...imgParagraph("ablation_ratio_combo.png", 1200, 750, "Fig. 7", "Combined strategy: balanced accuracy vs. target class ratio, per benchmark."));
children.push(
  P([
    T("Two findings stand out. First, ", {}),
    T("on B5, RUS's recall stays at exactly 0.000 across every tested ratio", { bold: true }),
    T(
      " (Fig. 6), confirming that the failure identified in Section V is not a single unlucky hyperparameter choice: undersampling cannot rescue detection when the minority class has too few original examples to begin with, regardless of how aggressively the majority class is discarded. On benchmarks with a larger native minority pool (B2, B3), by contrast, RUS's recall and specificity both respond smoothly to the ratio, and a more moderate ratio (0.10–0.25, i.e. less aggressive undersampling) often "
    ),
    T("outperforms", { italics: true }),
    T(
      " the fully balanced 1.0 setting – e.g. B2 balanced accuracy peaks at 0.985 at ratio 0.10 versus 0.947 at ratio 1.0 – because discarding less majority data at a gentler ratio retains more of the decision boundary information the model needs."
    ),
  ])
);
children.push(
  P([
    T("Second, ", {}),
    T("the ratio-accuracy relationship for the augmentation-based strategies is not monotonic and is sometimes unstable on the smallest benchmarks.", { bold: true }),
    T(
      " For example, the Combined strategy on B4 achieves balanced accuracy 0.960 at ratio 0.25 but collapses to 0.562 at ratio 0.50 before recovering to 0.966 at ratio 1.0 (Fig. 7); ROS+Aug shows a similar dip-then-recover pattern on B5. Because every ratio was trained from a single fixed seed, we cannot fully separate a genuine ratio effect from run-to-run optimization variance on these very small training sets (B4/B5 have well under 100 native hotspot images) – this is a limitation we return to in Section VII. The practical implication for a practitioner, however, is the same either way: on critically small benchmarks, the choice of resampling ratio should be validated empirically (ideally averaged over multiple seeds) rather than assumed to improve monotonically with how “balanced” the training set is made."
    ),
  ])
);

// VI. Discussion
children.push(H1("VI", "Discussion"));
children.push(P("Bringing the main comparison and the ablation together, three practical conclusions answer our research question directly."));
children.push(
  P([
    T("(1) Some form of data-level balancing is worth doing, but naive undersampling is the wrong default. ", { bold: true }),
    T(
      "Every strategy that adds information (oversampling, augmentation, balanced-batch sampling, or their combination) beats or matches the natural-imbalance baseline on average, while the one strategy that only removes information (RUS) is the single worst performer overall and the only strategy that fails catastrophically (0% recall) on the most extreme benchmark. For lithography hotspot detection specifically, where the whole point is to catch rare hotspot geometries, throwing away majority data is a weak trade against the risk of losing scarce and already-limited minority signal indirectly (via a poorly-conditioned, data-starved training run)."
    ),
  ])
);
children.push(
  P([
    T("(2) Balanced mini-batch sampling is the strongest general-purpose choice in this study, precisely because it changes ", { bold: true }),
    T("how data is drawn", { italics: true, bold: true }),
    T(", not ", { bold: true }),
    T("what data exists.", { italics: true, bold: true }),
    T(
      " It matched or beat every other strategy's balanced accuracy on 3 of 5 benchmarks and was the only strategy that remained reliable on the most extreme benchmark (B5). Because it requires no offline duplication and no augmentation pipeline, it is also the simplest strategy to deploy."
    ),
  ])
);
children.push(
  P([
    T("(3) Augmentation is a conditional benefit, not an unconditional one. ", { bold: true }),
    T(
      "It helped substantially on benchmarks with a moderate minority pool (B2, B3) but actively hurt on the benchmark with the fewest original hotspot examples (B5), where plain duplication outperformed it. This is the clearest actionable finding for the assignment's “effect of the altered class distribution” requirement: the right strategy is benchmark-dependent, and a single data-balancing recipe applied uniformly across all five ICCAD-12 benchmarks is measurably suboptimal compared to picking (or at least validating) the strategy per benchmark."
    ),
  ])
);

// VII. Limitations
children.push(H1("VII", "Limitations and Future Work"));
children.push(
  P([
    T("Reduced input resolution. ", { bold: true }),
    T(
      "To make the full five-benchmark × six-strategy grid, plus the class-ratio ablation (3×5×5 = 75 additional runs), tractable on CPU-only hardware, we downsampled input images from the reference's 224×224×3 to 64×64×1. This likely discards fine-grained geometric detail that a full-resolution model could exploit; balanced-accuracy values reported here should therefore be read as relative comparisons "
    ),
    T("between strategies under identical conditions", { italics: true }),
    T(", not as an attempt to reproduce the reference paper's absolute numbers."),
  ])
);
children.push(
  P([
    T("Duplication-based oversampling risk. ", { bold: true }),
    T(
      "Plain ROS duplicates exact pixel copies of a very small pool of hotspot images (as few as 26 on Benchmark 5), which risks memorization rather than generalization; our augmented-oversampling and combined strategies are a direct mitigation, but feature-space interpolation methods such as SMOTE [6] were not evaluated and are a natural extension."
    ),
  ])
);
children.push(
  P([
    T("Fixed epoch budget. ", { bold: true }),
    T(
      "All conditions were trained for a fixed 8 epochs for comparability; strategies that alter the effective training-set size (e.g., RUS shrinks it, ROS/ROS+Aug/Combo grow it) consequently see different numbers of gradient updates per epoch. Future work could control for total gradient updates rather than epochs, or sweep epoch count as an additional ablation axis."
    ),
  ])
);
children.push(
  P([
    T("Complementary imbalance techniques. ", { bold: true }),
    T(
      "This study is scoped to data-level strategies (resampling and augmentation), per our assigned research question. Loss-level alternatives such as cost-sensitive learning [5] or focal loss [8] are complementary and were intentionally left out of scope (they are the focus of parallel research angles assigned to other groups in this course); combining a data-level and loss-level strategy is a promising future direction."
    ),
  ])
);

// VIII. Reproducibility
children.push(H1("VIII", "Reproducibility"));
children.push(
  P(
    "All code, cached preprocessing, generated figures/tables, and a full usage README are provided in the accompanying repository. Every strategy is implemented as a pure function of the raw imbalanced training arrays (src/balancing.py); the training/evaluation loop (src/train.py) and the experiment grid (src/run_experiments.py) are deterministic given a fixed seed. See README.md for exact reproduction steps."
  )
);

// IX. Work Allocation
children.push(H1("IX", "Work Allocation"));
children.push(
  P(
    "Table IV summarizes each author's primary contributions to this project. Both authors jointly reviewed all experimental results and the final manuscript."
  )
);
children.push(
  dataTable(
    ["Author", "Primary Contributions"],
    [
      [{ text: "Priyanuj Boruah\n(23BVD1066)", bold: true }, "Problem formulation and research-question definition"],
      ["", "ICCAD-12 dataset acquisition, verification, and preprocessing pipeline"],
      ["", "Lightweight CNN backbone implementation and validation"],
      ["", "Random Undersampling, Random Oversampling, and Oversampling+Augmentation strategy implementation"],
      ["", "Main experiment grid execution and results logging"],
      [{ text: "Kartik Aggarwal\n(23BVD1067)", bold: true }, "Literature review and related-work synthesis"],
      ["", "Balanced Mini-Batch Sampling and Combined strategy implementation"],
      ["", "Class-ratio ablation study design and execution"],
      ["", "Results visualization, figure/table generation, and confusion-matrix analysis"],
      ["", "Manuscript writing (Discussion, Limitations, Conclusion) and presentation slides"],
    ],
    [2900, 6450]
  )
);
children.push(Caption("Table IV", "Work allocation between the two group members."));

// X. Conclusion
children.push(H1("X", "Conclusion"));
children.push(
  P(
    "We set out to answer a specific question: which data-balancing strategy is most effective for the severely imbalanced ICCAD-12 lithography hotspot detection task? Under a controlled comparison that holds the classification backbone fixed across five benchmarks and six training-data strategies, the answer is nuanced but actionable. Balanced mini-batch sampling delivered the best average balanced accuracy (0.945) and the best worst-case behavior (remaining reliable even on the 471:1-imbalanced Benchmark 5), making it the strongest general-purpose recommendation from this study. Plain random undersampling, despite directly targeting the imbalance, was the weakest strategy overall and failed completely on the most extreme benchmark, showing that discarding majority data cannot compensate for a minority class that is simply too small to begin with. Augmentation-based oversampling was a clear net positive on moderately imbalanced benchmarks but a clear net negative on the most extreme one – direct, quantitative evidence that the effectiveness of a balancing strategy is not a fixed property of the technique but depends on the severity of imbalance and the absolute size of the minority class it is applied to. Practitioners building a hotspot detector on a new, similarly imbalanced benchmark should therefore treat the balancing strategy itself as a tunable, benchmark-specific design choice, evaluated with balanced accuracy and the full confusion matrix rather than assumed from a single default recipe."
  )
);

// References
children.push(
  new Paragraph({
    children: [T("REFERENCES", { bold: true, color: NAVY, size: 26 })],
    spacing: { before: 320, after: 160 },
    alignment: AlignmentType.CENTER,
  })
);
const refs = [
  "V. Borisov and J. Scheible, “Lithography Hotspots Detection Using Deep Learning,” in 2018 15th Int. Conf. Synthesis, Modeling, Analysis and Simulation Methods and Applications to Circuit Design (SMACD), Prague, Czech Republic, 2018, pp. 145–148, doi: 10.1109/SMACD.2018.8434561.",
  "H. Yang, Y. Lin, B. Yu, and E. F. Y. Young, “Lithography hotspot detection: From shallow to deep learning,” in 2017 30th IEEE Int. System-on-Chip Conf. (SOCC), Munich, Germany, 2017, pp. 233–238, doi: 10.1109/SOCC.2017.8226047.",
  "ICCAD-2012 Contest, “TAU 2012 / ICCAD 2012 Layout Hotspot Detection Benchmark Suite,” International Conference on Computer-Aided Design, 2012.",
  "L. Liao, S. Li, Y. Che, W. Shi, and X. Wang, “Lithography Hotspot Detection Method Based on Transfer Learning Using Pre-Trained Deep Convolutional Neural Network,” Appl. Sci., vol. 12, no. 4, p. 2192, 2022, doi: 10.3390/app12042192.",
  "H. Yang, J. Su, Y. Zou, B. Yu, and E. F. Y. Young, “Layout Hotspot Detection With Feature Tensor Generation and Deep Biased Learning,” IEEE Trans. Comput.-Aided Design Integr. Circuits Syst., vol. 38, no. 6, pp. 1175–1187, 2019.",
  "N. V. Chawla, K. W. Bowyer, L. O. Hall, and W. P. Kegelmeyer, “SMOTE: Synthetic Minority Over-sampling Technique,” J. Artif. Intell. Res., vol. 16, pp. 321–357, 2002.",
  "H. He and E. A. Garcia, “Learning from Imbalanced Data,” IEEE Trans. Knowl. Data Eng., vol. 21, no. 9, pp. 1263–1284, 2009.",
  "T.-Y. Lin, P. Goyal, R. Girshick, K. He, and P. Dollár, “Focal Loss for Dense Object Detection,” in Proc. IEEE Int. Conf. Comput. Vis. (ICCV), 2017, pp. 2980–2988.",
  "C. Shorten and T. M. Khoshgoftaar, “A survey on Image Data Augmentation for Deep Learning,” J. Big Data, vol. 6, no. 1, p. 60, 2019.",
];
refs.forEach((r, i) => {
  children.push(
    new Paragraph({
      children: [T(`[${i + 1}] `, {}), T(r, {})],
      spacing: { after: 100 },
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 360, hanging: 360 },
    })
  );
});

// ---------- assemble document ----------
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "contrib-list",
        levels: [{ level: 0, format: "decimal", text: "%1)", alignment: AlignmentType.START, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }],
      },
      {
        reference: "strategy-list",
        levels: [{ level: 0, format: "bullet", text: "•", alignment: AlignmentType.START, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("report.docx", buf);
  console.log("Wrote report.docx");
});
