#!/usr/bin/env bash
# =============================================================================
# COSC349 Assignment 2: Generate PDF Report from Markdown
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCS_DIR="${ROOT_DIR}/docs"
HTML_FILE="${DOCS_DIR}/report.html"
PDF_FILE="${DOCS_DIR}/COSC349_Assignment_2_Report.pdf"
CHROME_TEMP="${ROOT_DIR}/.chrome-temp"

echo "Step 1: Converting Markdown to styled HTML..."
node "${SCRIPT_DIR}/convert-report.js"

echo "Step 2: Generating PDF via Google Chrome Headless..."
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ -f "$CHROME_BIN" ]; then
  mkdir -p "${CHROME_TEMP}"
  "$CHROME_BIN" --headless --disable-gpu --no-sandbox --no-pdf-header-footer \
    --user-data-dir="${CHROME_TEMP}" \
    --print-to-pdf="${PDF_FILE}" "${HTML_FILE}"
  rm -rf "${CHROME_TEMP}"
  echo "✓ PDF successfully generated at: ${PDF_FILE}"
  ls -lh "${PDF_FILE}"
else
  echo "Warning: Google Chrome not found at $CHROME_BIN. Open ${HTML_FILE} in your browser and choose 'Print to PDF'."
fi
