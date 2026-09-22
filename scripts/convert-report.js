const fs = require("fs");
const path = require("path");

const docsDir = path.join(__dirname, "../docs");
const mdPath = path.join(docsDir, "REPORT.md");
const htmlPath = path.join(docsDir, "report.html");

let text = fs.readFileSync(mdPath, "utf-8");

// Convert markdown tables
function parseTable(match) {
  const lines = match.trim().split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return match;

  const headerCells = lines[0].replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const html = ['<table class="report-table">', "  <thead>", "    <tr>"];
  for (const hc of headerCells) {
    html.push(`      <th>${hc}</th>`);
  }
  html.push("    </tr>", "  </thead>", "  <tbody>");

  for (let i = 2; i < lines.length; i++) {
    const rowCells = lines[i].replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    html.push("    <tr>");
    for (const cell of rowCells) {
      let fCell = cell
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");
      html.push(`      <td>${fCell}</td>`);
    }
    html.push("    </tr>");
  }
  html.push("  </tbody>", "</table>");
  return html.join("\n");
}

// Preserve code blocks
const codeBlocks = [];
text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
  const safeCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const idx = codeBlocks.length;
  codeBlocks.push(`<pre class="code-block ${lang}"><code>${safeCode}</code></pre>`);
  return `__CODE_BLOCK_${idx}__`;
});

// Tables
text = text.replace(/(\|.+?\|\n\|[-:| ]+\|\n(?:\|.+?\|\n?)+)/g, parseTable);

// Headers
text = text.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
text = text.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
text = text.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
text = text.replace(/^#### (.*?)$/gm, "<h4>$1</h4>");

// Inline styles
text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
text = text.replace(/^---$/gm, '<hr class="divider"/>');

// Lists and paragraphs
const lines = text.split("\n");
let inUl = false;
let inOl = false;
const newLines = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
    if (inOl) {
      newLines.push("</ol>");
      inOl = false;
    }
    if (!inUl) {
      newLines.push("<ul>");
      inUl = true;
    }
    newLines.push(`  <li>${trimmed.substring(2)}</li>`);
  } else if (/^\d+\.\s+/.test(trimmed)) {
    if (inUl) {
      newLines.push("</ul>");
      inUl = false;
    }
    if (!inOl) {
      newLines.push("<ol>");
      inOl = true;
    }
    newLines.push(`  <li>${trimmed.replace(/^\d+\.\s+/, "")}</li>`);
  } else {
    if (inUl) {
      newLines.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      newLines.push("</ol>");
      inOl = false;
    }
    if (trimmed && !trimmed.startsWith("<") && !trimmed.startsWith("__CODE_BLOCK")) {
      newLines.push(`<p>${line}</p>`);
    } else {
      newLines.push(line);
    }
  }
}
if (inUl) newLines.push("</ul>");
if (inOl) newLines.push("</ol>");

let body = newLines.join("\n");

// Restore code blocks
for (let i = 0; i < codeBlocks.length; i++) {
  body = body.replace(new RegExp(`__CODE_BLOCK_${i}__`, "g"), codeBlocks[i]);
  body = body.replace(new RegExp(`<p>__CODE_BLOCK_${i}__</p>`, "g"), codeBlocks[i]);
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>COSC349 Assignment 2 Report - SmartPantry</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm 20mm 18mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 18pt;
      color: #0f172a;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 6px;
      margin-top: 0;
      margin-bottom: 10px;
    }
    h2 {
      font-size: 13pt;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 11pt;
      color: #0369a1;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }
    h4 {
      font-size: 10pt;
      color: #334155;
      margin-top: 10px;
      margin-bottom: 4px;
    }
    p {
      margin-top: 0;
      margin-bottom: 6px;
      text-align: justify;
    }
    ul, ol {
      margin-top: 3px;
      margin-bottom: 8px;
      padding-left: 22px;
    }
    li {
      margin-bottom: 3px;
    }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }
    pre.code-block {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 8pt;
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 8px 0 12px;
      line-height: 1.35;
      page-break-inside: avoid;
    }
    pre.code-block code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: inherit;
    }
    table.report-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    table.report-table th, table.report-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
    }
    table.report-table th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }
    table.report-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    hr.divider {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 14px 0;
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;

fs.writeFileSync(htmlPath, html, "utf-8");
console.log("HTML report successfully generated at:", htmlPath);
