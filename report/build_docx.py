"""
Build both Word deliverables (single-column and IEEE double-column)
directly from report.tex, via a pandoc conversion with targeted
pre/post-processing fixes for known pandoc<->LaTeX gaps:

  1. report.tex's \\cite{...} and \\input{tables_generated.tex} are
     resolved to plain text / inlined before conversion (pandoc's
     citeproc machinery expects a .bib file we don't have).
  2. \\begin{thebibliography} is converted to plain numbered
     paragraphs (pandoc's LaTeX reader was observed to run every
     \\bibitem together into a single unnumbered paragraph otherwise).
  3. The Section III align-environment (metric formulas) is converted
     to separate display equations (pandoc leaks literal "&" alignment
     markers into rendered math otherwise).
  4. For the double-column build only: every generated table's grid
     width is rescaled to fit a single ~3.1in column, with a smaller
     table font, and a two-column section layout is written into the
     docx's sectPr.

Usage: python build_docx.py
Outputs: G11_DA3_SingleColumn.docx, G11_DA3_DoubleColumn.docx
"""
import os
import re
import shutil
import subprocess
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
TARGET_WIDTH_TWIPS = 4500  # ~3.1in, fits inside a 2-column IEEE-letter section
TABLE_FONT_HALFPOINTS = 14  # 7pt


def build_pandoc_source():
    src = open(os.path.join(HERE, "report.tex"), encoding="utf-8").read()

    bibkeys = re.findall(r"\\bibitem\{([^}]+)\}", src)
    key_to_num = {k: i + 1 for i, k in enumerate(bibkeys)}

    def cite_repl(m):
        keys = [k.strip() for k in m.group(1).split(",")]
        return ", ".join(f"[{key_to_num[k]}]" for k in keys)

    src = re.sub(r"\\cite\{([^}]+)\}", cite_repl, src)
    src = src.replace(r"\IEEEoverridecommandlockouts", "")
    src = re.sub(
        r"\\author\{.*?\}\n\n",
        "\\\\author{Priyanuj Boruah (23BVD1066), Kartik Aggarwal (23BVD1067) -- B.Tech. (BVD), VIT Chennai}\n\n",
        src,
        flags=re.DOTALL,
    )
    src = src.replace(r"\begin{IEEEkeywords}", "\n\\textbf{Index Terms:}")
    src = src.replace(r"\end{IEEEkeywords}", "\n")

    bib_match = re.search(
        r"\\begin\{thebibliography\}\{[^}]*\}(.*?)\\end\{thebibliography\}", src, flags=re.DOTALL
    )
    if bib_match:
        entries = re.split(r"\\bibitem\{[^}]+\}", bib_match.group(1))[1:]
        numbered = "\n\n".join(f"[{i + 1}] {e.strip()}" for i, e in enumerate(entries))
        src = src[: bib_match.start()] + "\\section*{References}\n\n" + numbered + "\n" + src[bib_match.end():]

    align_old = r"""\begin{align}
  \text{Precision} &= \frac{TP}{TP+FP}, \quad
  \text{Recall} = \frac{TP}{TP+FN} \\
  \text{Specificity} &= \frac{TN}{FP+TN}, \quad
  F1 = \frac{2 \cdot P \cdot R}{P + R} \\
  \text{Balanced Acc.} &= \frac{\text{Recall} + \text{Specificity}}{2}
\end{align}"""
    align_new = "\n".join(
        [
            r"\[\text{Precision} = \frac{TP}{TP+FP}, \quad \text{Recall} = \frac{TP}{TP+FN}\]",
            r"\[\text{Specificity} = \frac{TN}{FP+TN}, \quad F1 = \frac{2 \cdot P \cdot R}{P + R}\]",
            r"\[\text{Balanced Acc.} = \frac{\text{Recall} + \text{Specificity}}{2}\]",
        ]
    )
    assert align_old in src, "align block text not found -- check report.tex for edits"
    src = src.replace(align_old, align_new)

    tables = open(os.path.join(HERE, "tables_generated.tex"), encoding="utf-8").read()
    src = src.replace(r"\input{tables_generated.tex}", tables)

    out_path = os.path.join(HERE, "_report_pandoc.tex")
    open(out_path, "w", encoding="utf-8").write(src)
    return out_path


def fix_tables_for_columns(document_xml_path):
    content = open(document_xml_path, encoding="utf-8").read()

    def fix_one_table(tbl_xml):
        grid_match = re.search(r"<w:tblGrid>(.*?)</w:tblGrid>", tbl_xml, flags=re.DOTALL)
        if grid_match:
            cols = re.findall(r'<w:gridCol w:w="(\d+)"\s*/>', grid_match.group(1))
            if cols:
                total = sum(int(c) for c in cols)
                scale = TARGET_WIDTH_TWIPS / total if total > 0 else 1.0
                new_cols = "".join(
                    f'<w:gridCol w:w="{max(1, round(int(c) * scale))}" />' for c in cols
                )
                tbl_xml = tbl_xml.replace(grid_match.group(0), f"<w:tblGrid>{new_cols}</w:tblGrid>")
        tbl_xml = re.sub(
            r'<w:tblW w:type="auto" w:w="0"\s*/>',
            f'<w:tblW w:type="dxa" w:w="{TARGET_WIDTH_TWIPS}" />',
            tbl_xml,
        )

        def shrink_run(m):
            run = m.group(0)
            if "<w:rPr>" in run:
                return run.replace(
                    "<w:rPr>",
                    f'<w:rPr><w:sz w:val="{TABLE_FONT_HALFPOINTS}" /><w:szCs w:val="{TABLE_FONT_HALFPOINTS}" />',
                    1,
                )
            return run.replace(
                "<w:r>",
                f'<w:r><w:rPr><w:sz w:val="{TABLE_FONT_HALFPOINTS}" /><w:szCs w:val="{TABLE_FONT_HALFPOINTS}" /></w:rPr>',
                1,
            )

        return re.sub(r"<w:r>(?:(?!</w:r>).)*</w:r>", shrink_run, tbl_xml, flags=re.DOTALL)

    new_content, n = re.subn(
        r"<w:tbl>.*?</w:tbl>", lambda m: fix_one_table(m.group(0)), content, flags=re.DOTALL
    )
    print(f"  patched {n} tables for column width")
    open(document_xml_path, "w", encoding="utf-8").write(new_content)


def make_two_column(document_xml_path):
    content = open(document_xml_path, encoding="utf-8").read()
    old = "<w:sectPr>"
    new = (
        "<w:sectPr>"
        '<w:pgSz w:w="12240" w:h="15840"/>'
        '<w:pgMar w:top="1440" w:right="1080" w:bottom="1440" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>'
        '<w:cols w:num="2" w:space="432"/>'
    )
    assert content.count(old) == 1
    content = content.replace(old, new, 1)
    open(document_xml_path, "w", encoding="utf-8").write(content)


def rezip(src_dir, out_path):
    if os.path.exists(out_path):
        os.remove(out_path)
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(src_dir):
            for f in files:
                full = os.path.join(root, f)
                rel = os.path.relpath(full, src_dir)
                zf.write(full, rel)


def main():
    print("1. Preprocessing report.tex for pandoc...")
    pandoc_src = build_pandoc_source()

    single_out = os.path.join(HERE, "G11_DA3_SingleColumn.docx")
    print("2. Converting to single-column docx via pandoc...")
    subprocess.run(["pandoc", pandoc_src, "-o", single_out, "--standalone"], check=True, cwd=HERE)

    print("3. Building double-column docx...")
    workdir = os.path.join(HERE, "_docx_build_tmp")
    if os.path.exists(workdir):
        shutil.rmtree(workdir)
    os.makedirs(workdir)
    with zipfile.ZipFile(single_out) as zf:
        zf.extractall(workdir)
    doc_xml = os.path.join(workdir, "word", "document.xml")
    fix_tables_for_columns(doc_xml)
    make_two_column(doc_xml)
    double_out = os.path.join(HERE, "G11_DA3_DoubleColumn.docx")
    rezip(workdir, double_out)

    shutil.rmtree(workdir)
    os.remove(pandoc_src)
    print("Done:")
    print(" ", single_out)
    print(" ", double_out)


if __name__ == "__main__":
    main()
