import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const POLICY_DIR = path.join(process.cwd(), "policy");

const STYLES = `
  body {
    font-family: system-ui, sans-serif;
    max-width: 48rem;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3rem;
    line-height: 1.75;
    color: #e2e8f0;
    background: #0f172a;
  }
  h1, h2, h3 { color: #f8fafc; margin-top: 1.5em; }
  h1 { font-size: 1.75rem; margin-top: 0; }
  h2 { font-size: 1.25rem; }
  h3 { font-size: 1.1rem; }
  p { margin: 0.75em 0; }
  a { color: #60a5fa; }
  hr { border: none; border-top: 1px solid #334155; margin: 2rem 0; }
  ul, ol { padding-right: 1.5rem; margin: 0.75em 0; }
  li { margin: 0.35em 0; }
  blockquote {
    border-right: 4px solid #475569;
    padding: 0.25rem 1rem 0.25rem 0;
    margin: 1rem 0;
    background: rgba(30, 41, 59, 0.5);
    color: #cbd5e1;
  }
  strong { color: #f8fafc; }
  .math-display { margin: 1rem 0; overflow-x: auto; }
`;

function preprocessMath(markdown) {
  const display = [];
  const inline = [];

  let md = markdown;
  md = md.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    const id = display.length;
    display.push(tex.trim());
    return `\n<p data-math-display="${id}"></p>\n`;
  });
  md = md.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    const id = inline.length;
    inline.push(tex.trim());
    return `POLICY_MATH_INLINE_${id}`;
  });

  return { md, display, inline };
}

function applyMathPlaceholders(bodyHtml, display, inline) {
  let html = bodyHtml;
  for (let i = 0; i < display.length; i++) {
    html = html.replace(
      `<p data-math-display="${i}"></p>`,
      `<div class="math-display">\\[${display[i]}\\]</div>`,
    );
  }
  for (let i = 0; i < inline.length; i++) {
    const tex = inline[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(
      new RegExp(`POLICY_MATH_INLINE_${i}`, "g"),
      `<span class="math-inline">\\(${tex}\\)</span>`,
    );
  }
  return html;
}

function hasMath(markdown) {
  return /\$[^$]/.test(markdown);
}

function wrapDocument(title, bodyHtml, includeMath) {
  const mathJax = includeMath
    ? `<script>
        window.MathJax = {
          tex: {
            inlineMath: [['\\\\(', '\\\\)']],
            displayMath: [['\\\\[', '\\\\]']]
          }
        };
      </script>
      <script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>`
    : "";

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${STYLES}</style>
  ${mathJax}
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

marked.setOptions({ gfm: true });

const mdFiles = fs.readdirSync(POLICY_DIR).filter((name) => name.endsWith(".md"));

if (mdFiles.length === 0) {
  console.error("No .md files in policy/");
  process.exit(1);
}

for (const file of mdFiles) {
  const mdPath = path.join(POLICY_DIR, file);
  const markdown = fs.readFileSync(mdPath, "utf8");
  const { md, display, inline } = preprocessMath(markdown);
  const bodyHtml = applyMathPlaceholders(marked.parse(md), display, inline);
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] ?? "תקנון פולישוק";
  const html = wrapDocument(title, bodyHtml, hasMath(markdown));
  const outPath = path.join(POLICY_DIR, file.replace(/\.md$/, ".html"));
  fs.writeFileSync(outPath, html, "utf8");
  console.log(`Wrote ${path.basename(outPath)}`);
}
