const pptxgen = require("pptxgenjs");

// ---- Palette: "Midnight Executive" + hotspot-red accent ----
const NAVY = "1E2761";
const NAVY_DARK = "141B4D";
const ICE = "CADCFC";
const WHITE = "FFFFFF";
const RED = "E63946";
const GREY = "555B6E";
const LIGHTGREY = "F4F5F9";

const STRATS = ["Baseline", "RUS", "ROS", "ROS+Aug", "Bal. Batch", "Combined"];
const STRAT_COLORS = ["8C8C8C", "4C72B0", "55A868", "C44E52", "8172B2", "CCB974"];

const AVG = {
  balanced_accuracy: [0.844, 0.779, 0.923, 0.887, 0.945, 0.926],
  recall: [0.781, 0.642, 0.949, 0.871, 0.980, 0.939],
  specificity: [0.906, 0.915, 0.897, 0.903, 0.909, 0.913],
  f1: [0.503, 0.228, 0.456, 0.453, 0.446, 0.491],
};

const BENCH_LABELS = ["B1", "B2", "B3", "B4", "B5"];
const BA_PER_BENCH = {
  Baseline: [0.813, 0.698, 0.949, 0.845, 0.914],
  RUS: [0.808, 0.947, 0.949, 0.688, 0.500],
  ROS: [0.806, 0.978, 0.954, 0.964, 0.914],
  "ROS+Aug": [0.808, 0.992, 0.967, 0.961, 0.707],
  "Bal. Batch": [0.815, 0.981, 0.972, 0.970, 0.986],
  Combined: [0.806, 0.992, 0.903, 0.966, 0.961],
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
  slide.addText(`Group 11 · Data Balancing and Augmentation Strategies for Hotspot Detection`, {
    x: 0.5, y: PAGE_H - 0.42, w: 9.0, h: 0.3, fontSize: 9, color: dark ? "8B93C4" : "9AA0B4",
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
  s.addShape("rect", { x: 0, y: 0, w: PAGE_W, h: PAGE_H, fill: { color: NAVY_DARK } });
  // subtle circular motif representing a "hotspot"
  s.addShape("ellipse", { x: 10.6, y: -1.3, w: 5, h: 5, fill: { color: NAVY }, line: { type: "none" } });
  s.addShape("ellipse", { x: 11.5, y: -0.5, w: 3.2, h: 3.2, fill: { color: RED, transparency: 80 }, line: { type: "none" } });
  s.addShape("ellipse", { x: -1.5, y: 5.2, w: 4, h: 4, fill: { color: NAVY }, line: { type: "none" } });

  s.addText("DATA BALANCING & AUGMENTATION\nSTRATEGIES FOR HOTSPOT DETECTION", {
    x: 0.8, y: 2.1, w: 10.8, h: 1.7, fontSize: 34, bold: true, color: WHITE,
    fontFace: "Cambria", isTextBox: true, margin: 0, lineSpacingMultiple: 1.1,
  });
  s.addText("Lithography Hotspot Detection on the ICCAD-12 Benchmark", {
    x: 0.8, y: 3.75, w: 10.5, h: 0.5, fontSize: 17, color: ICE, fontFace: "Calibri",
    isTextBox: true, margin: 0, italic: true,
  });

  s.addShape("rect", { x: 0.8, y: 4.55, w: 1.6, h: 0.04, fill: { color: RED }, line: { type: "none" } });

  s.addText("BEVD402L — AI and Machine Learning for IC  |  Digital Assignment II  |  Group 11", {
    x: 0.8, y: 4.85, w: 10.5, h: 0.4, fontSize: 13, color: "AEB6DE", fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  s.addText([
    { text: "Priyanuj Boruah", options: { bold: true, breakLine: true } },
    { text: "23BVD1066", options: { fontSize: 11, color: "AEB6DE", breakLine: true } },
  ], { x: 0.8, y: 5.5, w: 3.3, h: 0.8, fontSize: 14, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText([
    { text: "Kartik Aggarwal", options: { bold: true, breakLine: true } },
    { text: "23BVD1067", options: { fontSize: 11, color: "AEB6DE", breakLine: true } },
  ], { x: 4.3, y: 5.5, w: 3.3, h: 0.8, fontSize: 14, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0 });
}

// ============ SLIDE 2: Agenda ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Agenda");
  const items = [
    ["01", "The Problem", "Lithography hotspots & why detecting them is hard"],
    ["02", "The Real Challenge", "Severe class imbalance in ICCAD-12"],
    ["03", "Our Research Question", "Which balancing strategy works best?"],
    ["04", "Method", "Common CNN backbone + 6 balancing strategies"],
    ["05", "Results", "Main comparison across 5 benchmarks"],
    ["06", "Key Findings & Ablation", "What actually works, and why"],
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

  // simple layout-clip diagram: grid of "wires" with one highlighted hotspot
  const dx = 7.6, dy = 1.7, dw = 5.1, dh = 4.6;
  s.addShape("roundRect", { x: dx, y: dy, w: dw, h: dh, rectRadius: 0.06, fill: { color: NAVY_DARK }, line: { type: "none" } });
  s.addText("SIMPLIFIED LAYOUT CLIP", { x: dx + 0.3, y: dy + 0.2, w: dw - 0.6, h: 0.35, fontSize: 11, color: "8B93C4", fontFace: "Calibri", isTextBox: true, margin: 0, charSpacing: 2 });
  // vertical + horizontal metal lines
  for (let i = 0; i < 5; i++) {
    s.addShape("rect", { x: dx + 0.5 + i * 0.85, y: dy + 0.7, w: 0.18, h: dh - 1.3, fill: { color: ICE }, line: { type: "none" } });
  }
  s.addShape("rect", { x: dx + 0.5, y: dy + 2.0, w: dw - 1.0, h: 0.18, fill: { color: ICE }, line: { type: "none" } });
  // hotspot highlight circle where two lines pinch close
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
  s.addText("A classifier that always predicts “Non-Hotspot” scores >99% raw accuracy on B5 — and catches zero hotspots. This is why Balanced Accuracy, not accuracy, drives this whole study.", {
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
  s.addText("Group 11 focus: undersampling · oversampling · augmentation · balanced mini-batches · combinations — compared on an identical backbone, across all 5 benchmarks independently.", {
    x: 0.9, y: 4.75, w: 11.0, h: 0.9, fontSize: 15, color: ICE, fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  footer(s, 5, true);
}

// ============ SLIDE 6: Backbone ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Common Classification Backbone", "Identical lightweight CNN for every strategy — isolates the effect of the training data");
  // block diagram
  const blocks = [
    ["Input", "64×64×1\ngrayscale"],
    ["Basic Block 1", "3× Conv(3×3,12)\n+BN +ELU +Pool"],
    ["Pool", "downsample"],
    ["Basic Block 2", "3× Conv(3×3,12)\n+BN +ELU +Pool"],
    ["FC Head", "Flatten→Dropout\n→FC(10)→FC(1)"],
  ];
  const bw = 2.2, bh = 1.5, gap = 0.28, startX = 0.7, y = 2.2;
  blocks.forEach((b, i) => {
    const x = startX + i * (bw + gap);
    s.addShape("roundRect", { x, y, w: bw, h: bh, rectRadius: 0.08, fill: { color: i % 2 === 0 ? NAVY : RED }, line: { type: "none" } });
    s.addText(b[0], { x: x + 0.1, y: y + 0.18, w: bw - 0.2, h: 0.4, fontSize: 13, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
    s.addText(b[1], { x: x + 0.1, y: y + 0.65, w: bw - 0.2, h: 0.8, fontSize: 10.5, color: "F0F0F8", fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
    if (i < blocks.length - 1) {
      s.addText("→", { x: x + bw, y: y + 0.5, w: gap, h: 0.5, fontSize: 20, bold: true, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
    }
  });

  const stats = [["8,649", "trainable parameters"], ["PyTorch", "re-implementation"], ["8 epochs", "Nadam optimizer, fixed seed"]];
  stats.forEach((st, i) => {
    const x = 0.7 + i * 4.0;
    s.addShape("roundRect", { x, y: 4.3, w: 3.7, h: 1.35, rectRadius: 0.08, fill: { color: LIGHTGREY }, line: { type: "none" } });
    s.addText(st[0], { x: x + 0.25, y: 4.42, w: 3.2, h: 0.6, fontSize: 22, bold: true, color: NAVY, fontFace: "Cambria", isTextBox: true, margin: 0 });
    s.addText(st[1], { x: x + 0.25, y: 5.0, w: 3.2, h: 0.5, fontSize: 12, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0 });
  });
  s.addText("Same order of magnitude as the reference paper's custom CNN (12,873 params) — rescaled from 224×224×3 to 64×64×1 so the full experiment grid is tractable on CPU.", {
    x: 0.7, y: 5.95, w: 12.0, h: 0.7, fontSize: 12, italic: true, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  footer(s, 6, false);
}

// ============ SLIDE 7: Six Strategies ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Six Data Strategies, One Fair Comparison");
  const strategies = [
    ["1", "Baseline", "Natural imbalance, no intervention — the reference point", "8C8C8C"],
    ["2", "Random Undersampling", "Discard majority (NHS) samples down to target ratio", "4C72B0"],
    ["3", "Random Oversampling", "Duplicate minority (HS) samples up to target ratio", "55A868"],
    ["4", "Oversampling + Augmentation", "Duplicate + flip/rotate HS so copies aren't pixel-identical", "C44E52"],
    ["5", "Balanced Mini-Batch", "Dataset untouched; sampler forces ~50:50 HS:NHS per batch", "8172B2"],
    ["6", "Combined", "Moderate undersample NHS + augmented oversample HS", "CCB974"],
  ];
  const colW = 3.95, rowH = 1.65, startX = 0.6, startY = 1.75, gapX = 0.2, gapY = 0.2;
  strategies.forEach((st, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = startX + col * (colW + gapX);
    const y = startY + row * (rowH + gapY);
    s.addShape("roundRect", { x, y, w: colW, h: rowH, rectRadius: 0.08, fill: { color: LIGHTGREY }, line: { type: "none" } });
    s.addShape("ellipse", { x: x + 0.2, y: y + 0.2, w: 0.55, h: 0.55, fill: { color: st[3] }, line: { type: "none" } });
    s.addText(st[0], { x: x + 0.2, y: y + 0.2, w: 0.55, h: 0.55, fontSize: 16, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0, align: "center", valign: "middle" });
    s.addText(st[1], { x: x + 0.9, y: y + 0.18, w: colW - 1.1, h: 0.55, fontSize: 13, bold: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0, valign: "middle" });
    s.addText(st[2], { x: x + 0.2, y: y + 0.85, w: colW - 0.4, h: 0.72, fontSize: 10.5, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0 });
  });
  footer(s, 7, false);
}

// ============ SLIDE 8: Experimental Protocol ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Experimental Protocol");
  const steps = [
    ["Preprocess", "Resize all PNGs to 64×64 grayscale, cache per benchmark"],
    ["Train", "8 epochs, fixed seed, per (benchmark × strategy) pair — test split never touched"],
    ["Evaluate", "Balanced Acc., Precision, Recall, Specificity, F1, full confusion matrix"],
    ["Ablate", "Sweep target HS:NHS ratio {0.1, 0.25, 0.5, 0.75, 1.0} for 3 strategies × 5 benchmarks"],
  ];
  const stepW = 2.85, gap = 0.25, startX = 0.6, y = 2.0;
  steps.forEach((st, i) => {
    const x = startX + i * (stepW + gap);
    s.addShape("roundRect", { x, y, w: stepW, h: 1.9, rectRadius: 0.08, fill: { color: i === 3 ? RED : NAVY }, line: { type: "none" } });
    s.addText(String(i + 1), { x: x + 0.2, y: y + 0.15, w: 1.0, h: 0.55, fontSize: 22, bold: true, color: ICE, fontFace: "Cambria", isTextBox: true, margin: 0 });
    s.addText(st[0], { x: x + 0.2, y: y + 0.65, w: stepW - 0.4, h: 0.4, fontSize: 14, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addText(st[1], { x: x + 0.2, y: y + 1.05, w: stepW - 0.4, h: 0.8, fontSize: 10, color: "EDEFF7", fontFace: "Calibri", isTextBox: true, margin: 0 });
    if (i < steps.length - 1) {
      s.addText("→", { x: x + stepW, y: y + 0.65, w: gap, h: 0.5, fontSize: 18, bold: true, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0, align: "center" });
    }
  });
  s.addText([
    { text: "Grid size:  ", options: { bold: true, color: NAVY } },
    { text: "5 benchmarks × 6 strategies = 30 main runs, + 3 strategies × 5 ratios × 5 benchmarks = 75 ablation runs  ", options: { color: GREY } },
    { text: "(105 total training runs)", options: { italic: true, color: GREY } },
  ], { x: 0.6, y: 4.4, w: 12.1, h: 0.5, fontSize: 13.5, fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText("Key rule: balancing/augmentation is applied only to the training split. Every test split stays in its natural, imbalanced form so reported metrics reflect real deployment conditions.", {
    x: 0.6, y: 5.1, w: 12.1, h: 0.9, fontSize: 13, italic: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  footer(s, 8, false);
}

// ============ SLIDE 9: Average performance chart ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Results: Average Performance Across All 5 Benchmarks");
  const chartData = [
    { name: "Balanced Acc.", labels: STRATS, values: AVG.balanced_accuracy },
    { name: "Recall", labels: STRATS, values: AVG.recall },
    { name: "Specificity", labels: STRATS, values: AVG.specificity },
    { name: "F1-score", labels: STRATS, values: AVG.f1 },
  ];
  s.addChart("bar", chartData, {
    x: 0.6, y: 1.75, w: 12.1, h: 5.1,
    barGrouping: "clustered",
    chartColors: [NAVY, RED, "6A8CD9", "C9A227"],
    showTitle: false,
    showLegend: true, legendPos: "b", legendFontSize: 11,
    showValue: false,
    catAxisLabelFontSize: 12, valAxisLabelFontSize: 10,
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
  const chartData = Object.keys(BA_PER_BENCH).map((name, i) => ({
    name, labels: BENCH_LABELS, values: BA_PER_BENCH[name],
  }));
  s.addChart("bar", chartData, {
    x: 0.6, y: 1.75, w: 12.1, h: 5.1,
    barGrouping: "clustered",
    chartColors: STRAT_COLORS,
    showTitle: false,
    showLegend: true, legendPos: "b", legendFontSize: 11,
    showValue: false,
    catAxisLabelFontSize: 12, valAxisLabelFontSize: 10,
    valAxisMinVal: 0, valAxisMaxVal: 1,
    valGridLine: { color: "E2E4EE", size: 1 },
    catGridLine: { style: "none" },
    catAxisLabelColor: NAVY, valAxisLabelColor: GREY,
  });
  footer(s, 10, false);
}

// ============ SLIDE 11: Key finding - winner/loser ============
{
  const s = bgSlide(NAVY_DARK);
  sectionTitle(s, "");
  s.addText("KEY FINDING", { x: 0.7, y: 0.5, w: 6, h: 0.4, fontSize: 13, bold: true, color: RED, fontFace: "Calibri", isTextBox: true, margin: 0, charSpacing: 2 });
  s.addText("One strategy wins almost everywhere. One fails when it matters most.", {
    x: 0.7, y: 0.9, w: 12, h: 0.7, fontSize: 22, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0,
  });

  // left card: winner
  s.addShape("roundRect", { x: 0.7, y: 1.9, w: 5.9, h: 4.9, rectRadius: 0.1, fill: { color: "1B3A2E" }, line: { type: "none" } });
  s.addText("BALANCED MINI-BATCH SAMPLING", { x: 1.0, y: 2.15, w: 5.3, h: 0.4, fontSize: 13, bold: true, color: "6FCF97", fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText("0.945", { x: 1.0, y: 2.55, w: 5.3, h: 1.0, fontSize: 46, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0 });
  s.addText("average balanced accuracy — best of all 6 strategies", { x: 1.0, y: 3.55, w: 5.3, h: 0.45, fontSize: 12.5, color: "C9E9D6", fontFace: "Calibri", isTextBox: true, margin: 0 });
  const winPts = [
    "Best or tied-best on 3 of 5 benchmarks",
    "Recall 0.976 even on B5 (471:1 imbalance) — no other strategy stayed reliable there",
    "Never duplicates or discards data — only changes what's sampled into each batch",
    "Simplest to deploy: no augmentation pipeline needed",
  ];
  let wy = 4.15;
  winPts.forEach((p) => {
    s.addShape("ellipse", { x: 1.0, y: wy + 0.08, w: 0.09, h: 0.09, fill: { color: "6FCF97" }, line: { type: "none" } });
    s.addText(p, { x: 1.22, y: wy - 0.1, w: 5.1, h: 0.55, fontSize: 11.5, color: "E5F5EC", fontFace: "Calibri", isTextBox: true, margin: 0 });
    wy += 0.62;
  });

  // right card: loser
  s.addShape("roundRect", { x: 6.75, y: 1.9, w: 5.9, h: 4.9, rectRadius: 0.1, fill: { color: "3E1620" }, line: { type: "none" } });
  s.addText("RANDOM UNDERSAMPLING (RUS)", { x: 7.05, y: 2.15, w: 5.3, h: 0.4, fontSize: 13, bold: true, color: "F4A6B0", fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText("0.779", { x: 7.05, y: 2.55, w: 5.3, h: 1.0, fontSize: 46, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0 });
  s.addText("average balanced accuracy — worst of all 6 strategies", { x: 7.05, y: 3.55, w: 5.3, h: 0.45, fontSize: 12.5, color: "F7CDD3", fontFace: "Calibri", isTextBox: true, margin: 0 });
  const losePts = [
    "Recall = 0.000 on B5 — predicts “non-hotspot” for every single test image",
    "Stays stuck at 0% recall across every tested ratio (0.1 → 1.0)",
    "Discarding majority data can't manufacture minority signal that was never there",
    "Only 26 native HS images on B5 — too little for the model to learn from, regardless of class balance",
  ];
  let ly = 4.15;
  losePts.forEach((p) => {
    s.addShape("ellipse", { x: 7.05, y: ly + 0.08, w: 0.09, h: 0.09, fill: { color: RED }, line: { type: "none" } });
    s.addText(p, { x: 7.27, y: ly - 0.1, w: 5.1, h: 0.55, fontSize: 11.5, color: "FBE1E4", fontFace: "Calibri", isTextBox: true, margin: 0 });
    ly += 0.62;
  });
  footer(s, 11, true);
}

// ============ SLIDE 12: Augmentation is conditional ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Augmentation Helps... Until It Doesn't", "Oversampling + Augmentation vs. plain duplication (ROS)");
  const rows = [
    { b: "B2", n: "498 test HS, moderate minority pool", ros: 0.978, rosaug: 0.992, win: "aug" },
    { b: "B3", n: "1,808 test HS, largest minority pool", ros: 0.954, rosaug: 0.967, win: "aug" },
    { b: "B5", n: "Only 26 original training HS images", ros: 0.914, rosaug: 0.707, win: "ros" },
  ];
  let y = 1.95;
  rows.forEach((r) => {
    s.addShape("roundRect", { x: 0.6, y, w: 12.1, h: 1.35, rectRadius: 0.08, fill: { color: LIGHTGREY }, line: { type: "none" } });
    s.addText(r.b, { x: 0.85, y: y + 0.15, w: 1.0, h: 0.6, fontSize: 22, bold: true, color: NAVY, fontFace: "Cambria", isTextBox: true, margin: 0 });
    s.addText(r.n, { x: 0.85, y: y + 0.75, w: 3.9, h: 0.5, fontSize: 11, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0 });

    const barMaxW = 4.6;
    s.addText("ROS", { x: 5.0, y: y + 0.15, w: 0.9, h: 0.35, fontSize: 11, bold: true, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addShape("rect", { x: 5.9, y: y + 0.17, w: barMaxW * r.ros, h: 0.3, fill: { color: r.win === "ros" ? "55A868" : "B9C6E0" }, line: { type: "none" } });
    s.addText(r.ros.toFixed(3), { x: 5.95 + barMaxW * r.ros, y: y + 0.12, w: 0.8, h: 0.35, fontSize: 11, bold: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0 });

    s.addText("ROS+Aug", { x: 5.0, y: y + 0.65, w: 0.9, h: 0.35, fontSize: 11, bold: true, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addShape("rect", { x: 5.9, y: y + 0.67, w: barMaxW * r.rosaug, h: 0.3, fill: { color: r.win === "aug" ? "C44E52" : "E7B3B5" }, line: { type: "none" } });
    s.addText(r.rosaug.toFixed(3), { x: 5.95 + barMaxW * r.rosaug, y: y + 0.62, w: 0.8, h: 0.35, fontSize: 11, bold: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0 });

    y += 1.55;
  });
  s.addText("Augmentation adds real value when there's already moderate minority diversity — but when almost every hotspot the model sees is a flipped/rotated copy of one of a handful of originals, it can amplify noise instead of signal.", {
    x: 0.6, y: 6.25, w: 12.1, h: 0.6, fontSize: 12, italic: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  footer(s, 12, false);
}

// ============ SLIDE 13: Ablation ============
{
  const s = bgSlide(WHITE);
  sectionTitle(s, "Ablation: Effect of the Target Class Ratio", "Sweeping HS:NHS target ratio from 0.1 (mild) to 1.0 (fully balanced) — RUS, ROS+Aug, Combined × 5 benchmarks");
  const cards = [
    ["RUS on B5 never recovers", "Recall stays at exactly 0.000 across every ratio tested — confirms the failure isn't a tuning artifact; there simply isn't enough minority data to rebalance with.", RED],
    ["Milder ratios can beat full balance", "On B2, balanced accuracy peaks at 0.985 with only mild undersampling (ratio 0.10) vs. 0.947 at full 1:1 balance — discarding less majority data preserves more decision-boundary signal.", NAVY],
    ["Small benchmarks can be unstable", "Combined on B4 swings from 0.960 (ratio 0.25) to 0.562 (ratio 0.50) back up to 0.966 (ratio 1.0) — a single-seed artifact worth validating with repeated runs.", "8172B2"],
  ];
  let y = 2.05;
  cards.forEach((c) => {
    s.addShape("roundRect", { x: 0.6, y, w: 12.1, h: 1.5, rectRadius: 0.08, fill: { color: LIGHTGREY }, line: { type: "none" } });
    s.addShape("rect", { x: 0.6, y, w: 0.12, h: 1.5, fill: { color: c[2] }, line: { type: "none" } });
    s.addText(c[0], { x: 1.0, y: y + 0.15, w: 4.4, h: 1.2, fontSize: 14, bold: true, color: NAVY, fontFace: "Calibri", isTextBox: true, margin: 0, valign: "top" });
    s.addText(c[1], { x: 5.5, y: y + 0.15, w: 6.9, h: 1.2, fontSize: 11.5, color: GREY, fontFace: "Calibri", isTextBox: true, margin: 0, valign: "top" });
    y += 1.68;
  });
  footer(s, 13, false);
}

// ============ SLIDE 14: Conclusion ============
{
  const s = bgSlide(NAVY_DARK);
  sectionTitle(s, "");
  s.addText("CONCLUSIONS", { x: 0.7, y: 0.5, w: 6, h: 0.4, fontSize: 13, bold: true, color: RED, fontFace: "Calibri", isTextBox: true, margin: 0, charSpacing: 2 });
  s.addText("Three answers to our research question", {
    x: 0.7, y: 0.9, w: 12, h: 0.6, fontSize: 24, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0,
  });
  const concl = [
    ["1", "Do something — but not undersampling", "Every strategy that adds information beats the baseline on average. RUS, which only removes information, is the single worst performer and the only one that collapses completely on extreme imbalance."],
    ["2", "Balanced mini-batch sampling is the safest default", "Strongest average result, and the only strategy that stayed reliable on the most extreme benchmark — without touching the underlying dataset at all."],
    ["3", "The right strategy is benchmark-dependent", "Augmentation is a clear win on moderately imbalanced benchmarks and a clear loss on the most extreme one. There is no single recipe that is best everywhere."],
  ];
  let y = 1.75;
  concl.forEach((c) => {
    s.addShape("ellipse", { x: 0.7, y: y + 0.05, w: 0.65, h: 0.65, fill: { color: RED }, line: { type: "none" } });
    s.addText(c[0], { x: 0.7, y: y + 0.05, w: 0.65, h: 0.65, fontSize: 20, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0, align: "center", valign: "middle" });
    s.addText(c[1], { x: 1.6, y: y, w: 11.0, h: 0.4, fontSize: 15, bold: true, color: WHITE, fontFace: "Calibri", isTextBox: true, margin: 0 });
    s.addText(c[2], { x: 1.6, y: y + 0.42, w: 11.0, h: 0.7, fontSize: 12, color: "C7CCEA", fontFace: "Calibri", isTextBox: true, margin: 0 });
    y += 1.55;
  });
  footer(s, 14, true);
}

// ============ SLIDE 15: Thank you ============
{
  const s = bgSlide(NAVY_DARK);
  s.addShape("ellipse", { x: 10.6, y: -1.3, w: 5, h: 5, fill: { color: NAVY }, line: { type: "none" } });
  s.addShape("ellipse", { x: 11.5, y: -0.5, w: 3.2, h: 3.2, fill: { color: RED, transparency: 80 }, line: { type: "none" } });
  s.addText("Thank You", { x: 0.8, y: 2.7, w: 10, h: 1.0, fontSize: 40, bold: true, color: WHITE, fontFace: "Cambria", isTextBox: true, margin: 0 });
  s.addText("Questions & Discussion", { x: 0.8, y: 3.6, w: 10, h: 0.6, fontSize: 18, color: ICE, fontFace: "Calibri", isTextBox: true, margin: 0 });
  s.addText("Full code, cached data, figures, and the IEEE-format report are in the accompanying repository.", {
    x: 0.8, y: 4.4, w: 10, h: 0.5, fontSize: 12, italic: true, color: "AEB6DE", fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  footer(s, 15, true);
}

pres.writeFile({ fileName: "slides.pptx" }).then(() => console.log("Wrote slides.pptx"));
