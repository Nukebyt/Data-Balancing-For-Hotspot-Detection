const pptxgen = require("pptxgenjs");
const path = require("path");

// ---- Palette: "Midnight Executive" + hotspot-red accent ----
const NAVY = "1E2761";
const NAVY_DARK = "141B4D";
const ICE = "CADCFC";
const WHITE = "FFFFFF";
const RED = "E63946";
const GREY = "555B6E";
const LIGHTGREY = "F4F5F9";
const GREEN = "2E7D32";

const GITHUB_URL = "https://github.com/Nukebyt/Data-Balancing-For-Hotspot-Detection";

const STRATS = ["Baseline", "RUS", "ROS", "ROS+Aug", "Bal.Batch", "Combo(50%)", "Combo(25%)", "Combo(B+A)"];
const STRAT_COLORS = ["8C8C8C", "4C72B0", "55A868", "C44E52", "8172B2", "CCB974", "64B5CD", "E07B39"];

// DA3 (revised) results
const AVG = {
  balanced_accuracy: [0.922, 0.928, 0.936, 0.917, 0.937, 0.924, 0.931, 0.934],
  recall: [0.940, 0.974, 0.967, 0.926, 0.971, 0.952, 0.957, 0.960],
  specificity: [0.905, 0.883, 0.905, 0.908, 0.903, 0.895, 0.904, 0.908],
  pr_auc: [0.664, 0.492, 0.750, 0.663, 0.718, 0.649, 0.658, 0.681],
};

const BENCH_LABELS = ["B1", "B2", "B3", "B4", "B5"];
const BA_PER_BENCH = {
  Baseline: [0.811, 0.986, 0.963, 0.929, 0.923],
  RUS: [0.810, 0.978, 0.958, 0.937, 0.957],
  ROS: [0.808, 0.984, 0.957, 0.962, 0.969],
  "ROS+Aug": [0.804, 0.975, 0.968, 0.938, 0.901],
  "Bal.Batch": [0.808, 0.990, 0.958, 0.958, 0.971],
  "Combo(50%)": [0.806, 0.930, 0.957, 0.949, 0.975],
  "Combo(25%)": [0.806, 0.973, 0.959, 0.961, 0.955],
  "Combo(B+A)": [0.807, 0.971, 0.965, 0.953, 0.974],
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5 in
const PAGE_W = 13.33, PAGE_H = 7.5;

function bgSlide(color) {
  const s = pres.addSlide();
  s.background = { color };
  return s;
}

function footer(slide, pageNum, dark) {
  slide.addText(`Group 11 (DA3 Revision) · Data Balancing and Augmentation Strategies for Hotspot Detection`, {
    x: 0.5, y: PAGE_H - 0.42, w: 10.0, h: 0.3, fontSize: 9, color: dark ? "8B93C4" : "9AA0B4",
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  slide.addText(String(pageNum), {
    x: PAGE_W - 1.0, y: PAGE_H - 0.42, w: 0.5, h: 0.3, fontSize: 9, align: "right",
    color: dark ? "8B93C4" : "9AA0B4", fontFace: "Calibri", isTextBox: true, margin: 0,
  });
}

function sectionTitle(slide, title, subtitle) {
  slide.addText(title, {
    x: 0.6, y: 0.45, w: PAGE_W - 1.2, h: 0.7, fontSize: 30, bold: true, color: NAVY,
    fontFace: "Cambria", isTextBox: true, margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6, y: 1.1, w: PAGE_W - 1.2, h: 0.45, fontSize: 15, color: GREY,
      fontFace: "Calibri", isTextBox: true, margin: 0,
    });
  }
}

// ============ SLIDE 1: Title ============
{
  const s = bgSlide(NAVY_DARK);
  s.addShape("ellipse", { x: 10.6, y: -1.3, w: 5, h: 5, fill: { color: NAVY }, line: { type: "none" } });
  s.addShape("ellipse", { x: 11.5, y: -0.5, w: 3.2, h: 3.2, fill: { color: RED, transparency: 80 }, line: { type: "none" } });
  s.addShape("ellipse", { x: -1.5, y: 5.2, w: 4, h: 4, fill: { color: NAVY }, line: { type: "none" } });

  s.addText("DA3 REVISION", { x: 0.8, y: 1.55, w: 10, h: 0.45, fontSize: 14, bold: true, color: RED, fontFace: "Calibri", isTextBox: true, margin: 0, charSpacing: 3 });
  s.addText("DATA BALANCING & AUGMENTATION\nSTRATEGIES FOR HOTSPOT DETECTION", {
    x: 0.8, y: 2.05, w: 10.8, h: 1.7, fontSize: 32, bold: true, color: WHITE,
    fontFace: "Cambria", isTextBox: true, margin: 0, lineSpacingMultiple: 1.1,
  });
  s.addText("Lithography Hotspot Detection on the ICCAD-12 Benchmark: Revised per Reviewer Feedback", {
    x: 0.8, y: 3.7, w: 10.5, h: 0.5, fontSize: 16, color: ICE, fontFace: "Calibri",
    isTextBox: true, margin: 0, italic: true,
  });

  s.addShape("rect", { x: 0.8, y: 4.5, w: 1.6, h: 0.04, fill: { color: RED }, line: { type: "none" } });

  s.addText("BEVD402L: AI and Machine Learning for IC  |  Digital Assignment III  |  Group 11", {
    x: 0.8, y: 4.8, w: 10.5, h: 0.4, fontSize: 13, color: "AEB6DE", fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  s.addText([
    { text: "Priyanuj Boruah", options: { bold: true, breakLine: true } },
    { text: "23BVD1066", options: { fontSize: 11, color: "AEB6DE", breakLine: true } },
  ], { x: 0.8, y: 5.45, w: 3.3, h: 0.8, fontSize: 14, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText([
    { text: "Kartik Aggarwal", options: { bold: true, breakLine: true } },
    { text: "23BVD1067", options: { fontSize: 11, color: "AEB6DE", breakLine: true } },
  ], { x: 4.3, y: 5.45, w: 3.3, h: 0.8, fontSize: 14, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText(`Code: ${GITHUB_URL}`, {
    x: 0.8, y: 6.7, w: 11.5, h: 0.4, fontSize: 11, color: "8B93C4", fontFace: "Calibri", isTextBox: true, margin: 0,
  });
}

// ============ SLIDE 2: Agenda ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Agenda");
  const items = [
    ["01", "The Problem", "Lithography hotspots & severe class imbalance"],
    ["02", "What We Revised", "Validation split, equal steps, seeds, PR-AUC"],
    ["03", "Method", "Common CNN backbone + 8 balancing strategies"],
    ["04", "Results", "Main comparison across 5 benchmarks, 3 seeds"],
    ["05", "Key Findings", "Why DA2's conclusions changed"],
    ["06", "Feedback Addressed", "Every reviewer point, mapped to our response"],
  ];
  const colW = 5.9, gapX = 0.6, rowH = 1.55, startX = 0.6, startY = 1.75;
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = startX + col * (colW + gapX);
    const y = startY + row * rowH;
    s.addShape("roundRect", { x, y, w: colW, h: rowH - 0.25, rectRadius: 0.08, fill: { color: LIGHTGREY }, line: { type: "none" } });
    s.addText(it[0], { x: x + 0.25, y: y + 0.15, w: 1.0, h: 0.9, fontSize: 30, bold: true, color: ICE, fontFace: "Cambria", isTextBox: true, margin: 0 });
    s.addText(it[1], { x: x + 1.15, y: y + 0.13, w: colW - 1.4, h: 0.45, fontSize: 15, bold: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addText(it[2], { x: x + 1.15, y: y + 0.56, w: colW - 1.4, h: 0.6, fontSize: 11.5, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0 });
  });
  footer(s, 2, false);
}

// ============ SLIDE 3: The Problem ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "The Problem: Lithography Hotspots");
  s.addText([
    { text: "Photo-lithography prints chip layouts onto silicon. ", options: { breakLine: true } },
    { text: "As transistors shrink, some layout patterns become too fine to print correctly.", options: { breakLine: true } },
  ], { x: 0.6, y: 1.6, w: 6.5, h: 1.3, fontSize: 15, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0, paraSpaceAfter: 8 });

  const bullets = [
    "A “hotspot” is a layout region likely to print as a broken (open) or shorted (bridging) circuit",
    "Catching hotspots early avoids costly re-spins and mask corrections",
    "Full lithography simulation is accurate but far too slow for full-chip checks",
    "→ Machine learning offers a fast screening alternative",
  ];
  let by = 2.85;
  bullets.forEach((b) => {
    s.addShape("ellipse", { x: 0.6, y: by + 0.08, w: 0.1, h: 0.1, fill: { color: RED }, line: { type: "none" } });
    s.addText(b, { x: 0.85, y: by - 0.08, w: 6.3, h: 0.5, fontSize: 13, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0 });
    by += 0.62;
  });

  const dx = 7.6, dy = 1.7, dw = 5.1, dh = 4.6;
  s.addShape("roundRect", { x: dx, y: dy, w: dw, h: dh, rectRadius: 0.06, fill: { color: NAVY_DARK }, line: { type: "none" } });
  s.addText("SIMPLIFIED LAYOUT CLIP", { x: dx + 0.3, y: dy + 0.2, w: dw - 0.6, h: 0.35, fontSize: 11, color: "8B93C4", fontFace: "Calibri", isTextBox: true, margin: 0, charSpacing: 2 });
  for (let i = 0; i < 5; i++) {
    s.addShape("rect", { x: dx + 0.5 + i * 0.85, y: dy + 0.7, w: 0.18, h: dh - 1.3, fill: { color: ICE }, line: { type: "none" } });
  }
  s.addShape("rect", { x: dx + 0.5, y: dy + 2.0, w: dw - 1.0, h: 0.18, fill: { color: ICE }, line: { type: "none" } });
  s.addShape("ellipse", { x: dx + 2.05, y: dy + 1.75, w: 0.9, h: 0.9, fill: { color: RED, transparency: 55 }, line: { color: RED, width: 2 } });
  s.addText("HOTSPOT\n(pinch risk)", { x: dx + 0.3, y: dy + dh - 1.15, w: 2.6, h: 0.8, fontSize: 11, bold: true, color: RED, fontFace: "Calibri", isTextBox: true, margin: 0 });
  footer(s, 3, false);
}

// ============ SLIDE 4: Class imbalance ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "The Real Challenge: Severe Class Imbalance", "ICCAD-12 test-set imbalance ratio (Non-Hotspot : Hotspot)");
  const data = [
    { b: "B1", ratio: "20.7:1", hs: 226, nhs: 4679 },
    { b: "B2", ratio: "82.9:1", hs: 498, nhs: 41298 },
    { b: "B3", ratio: "25.6:1", hs: 1808, nhs: 46333 },
    { b: "B4", ratio: "180.2:1", hs: 177, nhs: 31890 },
    { b: "B5", ratio: "471.4:1", hs: 41, nhs: 19327 },
  ];
  const colW = 2.32, startX = 0.6, y = 1.95, h = 3.6;
  data.forEach((d, i) => {
    const x = startX + i * (colW + 0.15);
    const isExtreme = i === 4;
    s.addShape("roundRect", { x, y, w: colW, h, rectRadius: 0.08, fill: { color: isExtreme ? RED : NAVY }, line: { type: "none" } });
    s.addText(d.b, { x: x + 0.15, y: y + 0.2, w: colW - 0.3, h: 0.4, fontSize: 14, bold: true, color: ICE, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addText(d.ratio, { x: x + 0.1, y: y + 0.75, w: colW - 0.2, h: 0.9, fontSize: 24, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0, align: "center" });
    s.addText("NHS : HS", { x: x + 0.15, y: y + 1.55, w: colW - 0.3, h: 0.3, fontSize: 10, color: isExtreme ? "FFD9DC" : "AEB6DE", fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
    s.addText(`${d.hs} HS`, { x: x + 0.15, y: y + h - 1.05, w: colW - 0.3, h: 0.35, fontSize: 12, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
    s.addText(`${d.nhs.toLocaleString()} NHS`, { x: x + 0.15, y: y + h - 0.65, w: colW - 0.3, h: 0.35, fontSize: 12, color: isExtreme ? "FFD9DC" : "AEB6DE", fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
  });
  s.addText("A classifier that always predicts “Non-Hotspot” scores >99% raw accuracy on B5, and catches zero hotspots. This is why Balanced Accuracy and PR-AUC, not accuracy, drive this whole study.", {
    x: 0.6, y: 5.85, w: 12.1, h: 0.9, fontSize: 13.5, italic: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  footer(s, 4, false);
}

// ============ SLIDE 5: Research Question ============
{
  const s = bgSlide(NAVY_DARK);
  s.addShape("ellipse", { x: -2, y: -2, w: 6, h: 6, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("OUR RESEARCH QUESTION", { x: 0.9, y: 1.7, w: 11.5, h: 0.5, fontSize: 14, color: RED, bold: true, fontFace: "Calibri", isTextBox: true, margin: 0, charSpacing: 2 });
  s.addText("Which data-balancing strategy provides the most effective improvement for highly imbalanced ICCAD-12 hotspot detection?", {
    x: 0.9, y: 2.25, w: 11.5, h: 2.2, fontSize: 30, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
  });
  s.addText("DA3 revision: our DA2 answer was contaminated by an unfair training protocol. This talk is as much about that correction as it is about the original question.", {
    x: 0.9, y: 4.75, w: 11.0, h: 0.9, fontSize: 15, color: ICE, fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  footer(s, 5, true);
}

// ============ SLIDE 6: Backbone ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Common Classification Backbone", "Identical lightweight CNN for every strategy isolates the effect of the training data");
  const blocks = [
    ["Input", "64×64×1\ngrayscale"],
    ["Basic Block 1", "3× Conv(3×3,12)\n+BN +ELU +Pool"],
    ["Pool", "downsample"],
    ["Basic Block 2", "3× Conv(3×3,12)\n+BN +ELU +Pool"],
    ["FC Head", "Flatten→Dropout\n→FC(10)→FC(1)"],
  ];
  const bw = 2.2, bh = 1.5, gap = 0.28, startX = 0.7, y = 2.1;
  blocks.forEach((b, i) => {
    const x = startX + i * (bw + gap);
    s.addShape("roundRect", { x, y, w: bw, h: bh, rectRadius: 0.08, fill: { color: i % 2 === 0 ? NAVY : RED }, line: { type: "none" } });
    s.addText(b[0], { x: x + 0.1, y: y + 0.18, w: bw - 0.2, h: 0.4, fontSize: 13, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
    s.addText(b[1], { x: x + 0.1, y: y + 0.65, w: bw - 0.2, h: 0.8, fontSize: 10.5, color: "F0F0F8", fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
    if (i < blocks.length - 1) {
      s.addText("→", { x: x + bw, y: y + 0.5, w: gap, h: 0.5, fontSize: 20, bold: true, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
    }
  });

  const stats = [["8,649", "trainable parameters"], ["PyTorch", "re-implementation"], ["Equal steps", "not epochs: fixed per-benchmark gradient-update budget for every strategy (DA3)"]];
  stats.forEach((st, i) => {
    const x = 0.7 + i * 4.0;
    s.addShape("roundRect", { x, y: 4.1, w: 3.7, h: 1.55, rectRadius: 0.08, fill: { color: LIGHTGREY }, line: { type: "none" } });
    s.addText(st[0], { x: x + 0.25, y: 4.22, w: 3.2, h: 0.6, fontSize: 20, bold: true, color: NAVY, fontFace: "Cambria", isTextBox: true, margin: 0 });
    s.addText(st[1], { x: x + 0.25, y: 4.8, w: 3.2, h: 0.75, fontSize: 11.5, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0 });
  });
  s.addText("Same order of magnitude as the reference paper's custom CNN (12,873 params). A held-out validation split now selects the training checkpoint; the test split is touched exactly once per run.", {
    x: 0.7, y: 5.85, w: 12.0, h: 0.8, fontSize: 12, italic: true, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  footer(s, 6, false);
}

// ============ SLIDE 7: Eight Strategies ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Eight Data Strategies, One Fair Comparison", "Two new combined variants added in direct response to DA3 feedback");
  const strategies = [
    ["1", "Baseline", "Natural imbalance, no intervention", "8C8C8C"],
    ["2", "Random Undersampling", "Discard majority (NHS) samples", "4C72B0"],
    ["3", "Random Oversampling", "Duplicate minority (HS) samples", "55A868"],
    ["4", "Oversampling + Aug.", "Duplicate + flip/rotate HS", "C44E52"],
    ["5", "Balanced Mini-Batch", "Sampler forces ~50:50 per batch", "8172B2"],
    ["6", "Combo (50% US)", "Undersample NHS + aug-oversample HS", "CCB974"],
    ["7", "Combo-Mild (25% US)", "Same, milder undersampling", "64B5CD"],
    ["8", "Combo (Batch+Aug)", "Balanced batch + stochastic aug.", "E07B39"],
  ];
  const colW = 2.95, rowH = 1.65, startX = 0.55, startY = 1.9, gapX = 0.18, gapY = 0.2;
  strategies.forEach((st, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = startX + col * (colW + gapX);
    const y = startY + row * (rowH + gapY);
    s.addShape("roundRect", { x, y, w: colW, h: rowH, rectRadius: 0.08, fill: { color: LIGHTGREY }, line: { type: "none" } });
    s.addShape("ellipse", { x: x + 0.18, y: y + 0.18, w: 0.5, h: 0.5, fill: { color: st[3] }, line: { type: "none" } });
    s.addText(st[0], { x: x + 0.18, y: y + 0.18, w: 0.5, h: 0.5, fontSize: 14, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0, align: "center", valign: "middle" });
    s.addText(st[1], { x: x + 0.18, y: y + 0.72, w: colW - 0.36, h: 0.5, fontSize: 11.5, bold: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addText(st[2], { x: x + 0.18, y: y + 1.18, w: colW - 0.36, h: 0.42, fontSize: 9.5, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0 });
  });
  footer(s, 7, false);
}

// ============ SLIDE 8: Experimental Protocol (DA3) ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Experimental Protocol (Revised)");
  const steps = [
    ["Val. Split", "15% of training data carved out; fixed split seed shared by every strategy/seed"],
    ["Equal Steps", "Every strategy trains for the same gradient-update budget per benchmark, not epochs"],
    ["3 Seeds", "42, 123, 2024: checkpoint picked on validation; test touched once"],
    ["PR-AUC + Sig. Test", "Threshold-free ranking metric + paired t-test / Wilcoxon, α=0.05"],
  ];
  const stepW = 2.85, gap = 0.25, startX = 0.6, y = 2.0;
  steps.forEach((st, i) => {
    const x = startX + i * (stepW + gap);
    s.addShape("roundRect", { x, y, w: stepW, h: 2.1, rectRadius: 0.08, fill: { color: i >= 1 ? RED : NAVY }, line: { type: "none" } });
    s.addText(String(i + 1), { x: x + 0.2, y: y + 0.15, w: 1.0, h: 0.55, fontSize: 22, bold: true, color: ICE, fontFace: "Cambria", isTextBox: true, margin: 0 });
    s.addText(st[0], { x: x + 0.2, y: y + 0.65, w: stepW - 0.4, h: 0.4, fontSize: 14, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addText(st[1], { x: x + 0.2, y: y + 1.05, w: stepW - 0.4, h: 0.95, fontSize: 10, color: "EDEFF7", fontFace: "Calibri", isTextBox: true, margin: 0 });
    if (i < steps.length - 1) {
      s.addText("→", { x: x + stepW, y: y + 0.8, w: gap, h: 0.5, fontSize: 18, bold: true, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
    }
  });
  s.addText([
    { text: "Grid size:  ", options: { bold: true, color: NAVY } },
    { text: "5 benchmarks × 8 strategies × 3 seeds = 120 main runs, + 75 ratio-ablation runs + 9 learning-curve runs  ", options: { color: GREY } },
    { text: "(204 total training runs, vs. 30 in DA2)", options: { italic: true, color: GREY } },
  ], { x: 0.6, y: 4.5, w: 12.1, h: 0.5, fontSize: 13, fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText("Key fix: DA2 trained every strategy for a fixed 8 epochs, but RUS's smaller resampled dataset meant far fewer actual gradient updates per epoch than ROS. That confound is now removed.", {
    x: 0.6, y: 5.2, w: 12.1, h: 0.9, fontSize: 13, italic: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  footer(s, 8, false);
}

// ============ SLIDE 9: Average performance chart ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Results: Average Performance (5 Benchmarks × 3 Seeds)");
  const chartData = [
    { name: "Balanced Acc.", labels: STRATS, values: AVG.balanced_accuracy },
    { name: "Recall", labels: STRATS, values: AVG.recall },
    { name: "Specificity", labels: STRATS, values: AVG.specificity },
    { name: "PR-AUC", labels: STRATS, values: AVG.pr_auc },
  ];
  s.addChart("bar", chartData, {
    x: 0.6, y: 1.75, w: 12.1, h: 5.1,
    barGrouping: "clustered",
    chartColors: [NAVY, RED, "6A8CD9", "C9A227"],
    showTitle: false,
    showLegend: true, legendPos: "b", legendFontSize: 11,
    showValue: false,
    catAxisLabelFontSize: 11, valAxisLabelFontSize: 10,
    valAxisMinVal: 0, valAxisMaxVal: 1,
    valGridLine: { color: "E2E4EE", size: 1 },
    catGridLine: { style: "none" },
    catAxisLabelColor: NAVY, valAxisLabelColor: GREY,
    dataLabelColor: NAVY,
  });
  footer(s, 9, false);
}

// ============ SLIDE 10: Balanced accuracy per benchmark ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Results: Balanced Accuracy per Benchmark");
  const chartData = Object.keys(BA_PER_BENCH).map((name) => ({
    name, labels: BENCH_LABELS, values: BA_PER_BENCH[name],
  }));
  s.addChart("bar", chartData, {
    x: 0.6, y: 1.75, w: 12.1, h: 5.1,
    barGrouping: "clustered",
    chartColors: STRAT_COLORS,
    showTitle: false,
    showLegend: true, legendPos: "b", legendFontSize: 10,
    showValue: false,
    catAxisLabelFontSize: 12, valAxisLabelFontSize: 10,
    valAxisMinVal: 0, valAxisMaxVal: 1,
    valGridLine: { color: "E2E4EE", size: 1 },
    catGridLine: { style: "none" },
    catAxisLabelColor: NAVY, valAxisLabelColor: GREY,
  });
  footer(s, 10, false);
}

// ============ SLIDE 11: KEY FINDING - no significant difference ============
{
  const s = bgSlide(NAVY_DARK);
  s.addText("KEY FINDING #1", { x: 0.7, y: 0.5, w: 8, h: 0.4, fontSize: 13, bold: true, color: RED, fontFace: "Calibri", isTextBox: true, margin: 0, charSpacing: 2 });
  s.addText("Once training is fair, balanced accuracy barely tells strategies apart", {
    x: 0.7, y: 0.9, w: 12, h: 1.0, fontSize: 24, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0,
  });

  s.addShape("roundRect", { x: 0.7, y: 2.1, w: 5.9, h: 4.6, rectRadius: 0.1, fill: { color: "2A1F4D" }, line: { type: "none" } });
  s.addText("DA2 (unequal updates, 1 seed)", { x: 1.0, y: 2.35, w: 5.3, h: 0.4, fontSize: 13, bold: true, color: "C9A8F5", fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText("0.779 – 0.945", { x: 1.0, y: 2.75, w: 5.3, h: 0.9, fontSize: 36, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0 });
  s.addText("17-point spread: looked like strategy choice mattered a lot", { x: 1.0, y: 3.55, w: 5.3, h: 0.5, fontSize: 12.5, color: "D8C8F0", fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText("RUS appeared to collapse to 0% recall on the most extreme benchmark. That was our DA2 headline claim.", { x: 1.0, y: 4.2, w: 5.3, h: 1.0, fontSize: 12, italic: true, color: "D8C8F0", fontFace: "Calibri", isTextBox: true, margin: 0 });

  s.addShape("roundRect", { x: 6.75, y: 2.1, w: 5.9, h: 4.6, rectRadius: 0.1, fill: { color: "1B3A2E" }, line: { type: "none" } });
  s.addText("DA3 (equal steps, 3 seeds)", { x: 7.05, y: 2.35, w: 5.3, h: 0.4, fontSize: 13, bold: true, color: "6FCF97", fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText("0.917 – 0.937", { x: 7.05, y: 2.75, w: 5.3, h: 0.9, fontSize: 36, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0 });
  s.addText("2-point spread. NO pairwise comparison is statistically significant (α=0.05)", { x: 7.05, y: 3.55, w: 5.3, h: 0.6, fontSize: 12.5, color: "C9E9D6", fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText("RUS now reaches 0.957 balanced accuracy on that same benchmark. The DA2 “collapse” was a training-protocol artifact, not a property of undersampling.", { x: 7.05, y: 4.3, w: 5.3, h: 1.1, fontSize: 12, italic: true, color: "C9E9D6", fontFace: "Calibri", isTextBox: true, margin: 0 });
  footer(s, 11, true);
}

// ============ SLIDE 12: KEY FINDING - mechanistic (learning curves) ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Key Finding #2: Why RUS “Failed” in DA2: A Mechanistic Look", "Per-step learning curves on Benchmark 5, across 3 seeds");
  try {
    s.addImage({
      path: path.join(__dirname, "..", "results", "figures", "learning_curves_b5.png"),
      x: 0.8, y: 1.75, w: 11.7, h: 3.35,
    });
  } catch (e) {
    s.addText("[learning_curves_b5.png]", { x: 0.8, y: 1.75, w: 11.7, h: 3.35, fontSize: 14, color: GREY, isTextBox: true, margin: 0 });
  }
  s.addText([
    { text: "RUS memorizes its tiny resampled pool (~44 images) almost immediately: ", options: { bold: true } },
    { text: "training loss crashes near-zero within ~150 steps. Its validation recall peaks by step ~73 and then degrades with further training if left unchecked.", options: {} },
  ], { x: 0.8, y: 5.25, w: 11.7, h: 0.7, fontSize: 12.5, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText([
    { text: "The Baseline, by contrast, needs the entire step budget just to start detecting hotspots at all: ", options: { bold: true } },
    { text: "its gradient signal from the rare positive class is heavily diluted by the natural imbalance. DA2's fixed-epoch, no-checkpoint protocol evaluated RUS at the wrong point in training.", options: {} },
  ], { x: 0.8, y: 5.95, w: 11.7, h: 0.8, fontSize: 12.5, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0 });
  footer(s, 12, false);
}

// ============ SLIDE 13: PR-AUC reveals real differences ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "PR-AUC Reveals What Balanced Accuracy Hides", "Statistically significant differences (paired t-test + Wilcoxon, both p<0.05)");
  const rows = [
    ["ROS vs. RUS", "0.750", "0.492", "p=0.0048"],
    ["Bal.Batch vs. RUS", "0.718", "0.492", "p=0.019"],
    ["ROS vs. Baseline", "0.750", "0.664", "p=0.033"],
    ["ROS vs. ROS+Aug", "0.750", "0.663", "p=0.0025"],
    ["Combo(B+A) vs. RUS", "0.681", "0.492", "p=0.027"],
  ];
  let y = 1.85;
  const rowH = 0.68;
  // header row
  s.addShape("rect", { x: 0.6, y, w: 12.1, h: 0.45, fill: { color: NAVY }, line: { type: "none" } });
  const headers = ["Comparison (PR-AUC)", "Mean A", "Mean B", "Result"];
  const colXs = [0.8, 6.2, 7.6, 9.0];
  headers.forEach((h, i) => s.addText(h, { x: colXs[i], y: y + 0.06, w: i === 0 ? 5.2 : 1.3, h: 0.32, fontSize: 12, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0 }));
  y += 0.45;
  rows.forEach((r, i) => {
    s.addShape("rect", { x: 0.6, y, w: 12.1, h: rowH, fill: { color: i % 2 === 0 ? LIGHTGREY : WHITE }, line: { type: "none" } });
    s.addText(r[0], { x: colXs[0], y: y + 0.13, w: 5.2, h: 0.42, fontSize: 13, bold: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addText(r[1], { x: colXs[1], y: y + 0.13, w: 1.3, h: 0.42, fontSize: 13, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addText(r[2], { x: colXs[2], y: y + 0.13, w: 1.3, h: 0.42, fontSize: 13, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addText(r[3], { x: colXs[3], y: y + 0.13, w: 2.8, h: 0.42, fontSize: 13, bold: true, color: GREEN, fontFace: "Calibri", isTextBox: true, margin: 0 });
    y += rowH;
  });
  s.addText("Once we stop relying on a single 0.5 threshold and look at ranking quality across every threshold, RUS is reliably worse than oversampling-based strategies, just not in balanced accuracy.", {
    x: 0.6, y: y + 0.15, w: 12.1, h: 0.55, fontSize: 12, italic: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  footer(s, 13, false);
}

// ============ SLIDE 14: Feedback Addressed ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Feedback Addressed", "Every reviewer point for Group 11, mapped to what we did");
  const rows = [
    ["Validation split + equal gradient updates", "Done: 15% validation carve-out, step-based training, checkpoint selection"],
    ["Add seeds", "Done: 3 seeds (42/123/2024), paired t-test + Wilcoxon significance tests"],
    ["Test combined strategies + PR-AUC", "Done: 3 combined variants (50%/25%/Batch+Aug); PR-AUC on every run"],
    ["Justify augmentations physically", "Done: Manhattan-geometry closure + local-diffraction-physics argument"],
    ["Explain mechanistically why RUS fails", "Revised: it doesn't, once trained fairly; learning curves show why DA2 was wrong"],
    ["30–35+ references, validation-only tuning, published comparison", "Done: 40 refs, test touched once, compared vs. 2 published ICCAD-12 detectors"],
  ];
  let y = 1.95;
  const rowH = 0.78;
  rows.forEach((r, i) => {
    s.addShape("roundRect", { x: 0.6, y, w: 12.1, h: rowH - 0.08, rectRadius: 0.06, fill: { color: LIGHTGREY }, line: { type: "none" } });
    s.addShape("ellipse", { x: 0.8, y: y + (rowH - 0.08) / 2 - 0.13, w: 0.26, h: 0.26, fill: { color: GREEN }, line: { type: "none" } });
    s.addText("✓", { x: 0.8, y: y + (rowH - 0.08) / 2 - 0.15, w: 0.26, h: 0.3, fontSize: 13, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
    s.addText(r[0], { x: 1.25, y: y + 0.06, w: 4.7, h: rowH - 0.2, fontSize: 12, bold: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0, valign: "middle" });
    s.addText(r[1], { x: 6.1, y: y + 0.06, w: 6.4, h: rowH - 0.2, fontSize: 11, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0, valign: "middle" });
    y += rowH;
  });
  footer(s, 14, false);
}

// ============ SLIDE 15: Ablation ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Ablation: Effect of the Target Class Ratio", "Sweeping HS:NHS target ratio 0.1–1.0 for RUS, ROS+Aug, Combo (single seed)");
  const cards = [
    ["RUS now stable across every ratio", "Recall/specificity stay high (≥0.90 / ≥0.95) on B5 at every tested ratio, a complete reversal of the DA2 ablation, which showed RUS stuck at 0% recall regardless of ratio.", GREEN],
    ["But RUS's PR-AUC still degrades with aggressive undersampling", "On B5, RUS's PR-AUC falls from 0.80 (mild ratio) to ~0.08–0.11 (aggressive ratios) even while balanced accuracy stays flat. That is the ablation-level confirmation of the mechanistic story.", RED],
    ["Combined strategy is flat across ratios, no DA2-style collapse", "No ratio on any benchmark reproduces DA2's dramatic collapse-and-recover pattern; remaining variation is single-seed noise, a limitation we flag directly.", NAVY],
  ];
  let y = 2.05;
  cards.forEach((c) => {
    s.addShape("roundRect", { x: 0.6, y, w: 12.1, h: 1.5, rectRadius: 0.08, fill: { color: LIGHTGREY }, line: { type: "none" } });
    s.addShape("rect", { x: 0.6, y, w: 0.12, h: 1.5, fill: { color: c[2] }, line: { type: "none" } });
    s.addText(c[0], { x: 1.0, y: y + 0.15, w: 4.4, h: 1.2, fontSize: 13.5, bold: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0, valign: "top" });
    s.addText(c[1], { x: 5.5, y: y + 0.15, w: 6.9, h: 1.2, fontSize: 11, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0, valign: "top" });
    y += 1.68;
  });
  footer(s, 15, false);
}

// ============ SLIDE 16: Conclusion ============
{
  const s = bgSlide(NAVY_DARK);
  s.addText("CONCLUSIONS", { x: 0.7, y: 0.5, w: 6, h: 0.4, fontSize: 13, bold: true, color: RED, fontFace: "Calibri", isTextBox: true, margin: 0, charSpacing: 2 });
  s.addText("A more cautious, more honest answer than DA2", {
    x: 0.7, y: 0.9, w: 12, h: 0.6, fontSize: 24, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0,
  });
  const concl = [
    ["1", "Balancing strategy matters far less than DA2 suggested", "Under fair training, no strategy's balanced accuracy is statistically distinguishable from any other's, including the baseline. Most of our DA2 spread was a protocol artifact."],
    ["2", "PR-AUC recovers real, significant structure", "Oversampling-based strategies (ROS especially) significantly outperform RUS on ranking quality, even though their balanced accuracies are statistically tied."],
    ["3", "RUS's real weakness is calibration, not detection", "Its tiny effective training set makes probability outputs fragile and poorly ranked: a narrower, more defensible mechanistic claim than DA2's “fails outright.”"],
  ];
  let y = 1.75;
  concl.forEach((c) => {
    s.addShape("ellipse", { x: 0.7, y: y + 0.05, w: 0.65, h: 0.65, fill: { color: RED }, line: { type: "none" } });
    s.addText(c[0], { x: 0.7, y: y + 0.05, w: 0.65, h: 0.65, fontSize: 20, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0, align: "center", valign: "middle" });
    s.addText(c[1], { x: 1.6, y: y, w: 11.0, h: 0.4, fontSize: 15, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addText(c[2], { x: 1.6, y: y + 0.42, w: 11.0, h: 0.7, fontSize: 12, color: "C7CCEA", fontFace: "Calibri", isTextBox: true, margin: 0 });
    y += 1.55;
  });
  footer(s, 16, true);
}

// ============ SLIDE 17: Thank you ============
{
  const s = bgSlide(NAVY_DARK);
  s.addShape("ellipse", { x: 10.6, y: -1.3, w: 5, h: 5, fill: { color: NAVY }, line: { type: "none" } });
  s.addShape("ellipse", { x: 11.5, y: -0.5, w: 3.2, h: 3.2, fill: { color: RED, transparency: 80 }, line: { type: "none" } });
  s.addText("Thank You", { x: 0.8, y: 2.5, w: 10, h: 1.0, fontSize: 40, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0 });
  s.addText("Questions & Discussion", { x: 0.8, y: 3.4, w: 10, h: 0.6, fontSize: 18, color: ICE, fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addShape("roundRect", { x: 0.8, y: 4.3, w: 10.8, h: 0.9, rectRadius: 0.08, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("CODE & REPRODUCIBILITY", { x: 1.05, y: 4.42, w: 10, h: 0.3, fontSize: 10, bold: true, color: "8B93C4", fontFace: "Calibri", isTextBox: true, margin: 0, charSpacing: 2 });
  s.addText(GITHUB_URL, { x: 1.05, y: 4.68, w: 10.3, h: 0.45, fontSize: 15, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText("Full code, cached data, figures, significance tests, and the IEEE-format report are in the repository above.", {
    x: 0.8, y: 5.45, w: 10, h: 0.5, fontSize: 12, italic: true, color: "AEB6DE", fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  footer(s, 17, true);
}

pres.writeFile({ fileName: "slides.pptx" }).then(() => console.log("Wrote slides.pptx"));
