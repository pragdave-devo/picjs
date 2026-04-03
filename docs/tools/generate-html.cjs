#!/usr/bin/env node

// Phase 3: Read jp-language-reference.md and produce a self-contained HTML page
// with fixed sidebar navigation, collapsible sections, and scroll-aware highlighting.

const fs   = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const MD_FILE     = path.join(ROOT, 'docs/jp-language-reference.md')
const OUTPUT_FILE = path.join(ROOT, 'docs/jp-language-reference.html')

const md = fs.readFileSync(MD_FILE, 'utf8')

// ──────────────────────────────────────────────── Markdown → HTML (minimal, no deps)

// We parse just enough markdown to produce clean HTML. No external libraries.

function convertMarkdown(src) {
  // Strip the <details> TOC block — we build our own sidebar
  src = src.replace(/<details[\s\S]*?<\/details>\s*---/m, '')

  const lines = src.split('\n')
  const out = []
  let inTable = false
  let inList = false
  let inCodeBlock = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Fenced code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        out.push('</code></pre>')
        inCodeBlock = false
      } else {
        closeList()
        out.push('<pre><code>')
        inCodeBlock = true
      }
      continue
    }
    if (inCodeBlock) {
      out.push(escHtml(line))
      continue
    }

    // Blank line
    if (line.trim() === '') {
      closeList()
      closeTable()
      continue
    }

    // Anchor elements — pass through
    if (line.startsWith('<a id=')) {
      out.push(line)
      continue
    }

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.*)/)
    if (hMatch) {
      closeList()
      closeTable()
      const level = hMatch[1].length
      const text = hMatch[2]
      const id = slugify(text)
      const tag = `h${level}`
      out.push(`<${tag} id="${id}">${inline(text)}</${tag}>`)
      continue
    }

    // Table
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim())
      // Skip separator rows
      if (cells.every(c => /^[-:]+$/.test(c))) continue
      if (!inTable) {
        closeList()
        out.push('<table>')
        inTable = true
        // First row is header
        out.push('<thead><tr>' + cells.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>')
        continue
      }
      out.push('<tr>' + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>')
      continue
    }

    // Unordered list
    if (line.match(/^[-*]\s/)) {
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${inline(line.replace(/^[-*]\s/, ''))}</li>`)
      continue
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      closeList(); closeTable()
      out.push('<hr>')
      continue
    }

    // Paragraph text
    closeList(); closeTable()
    // Bold-start lines (like **Options:** ...)
    out.push(`<p>${inline(line)}</p>`)
  }

  closeList()
  closeTable()
  return out.join('\n')

  function closeTable() {
    if (inTable) { out.push('</tbody></table>'); inTable = false }
  }
  function closeList() {
    if (inList) { out.push('</ul>'); inList = false }
  }
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(s) {
  // Order matters: process longer patterns first
  s = escHtml(s)
  // Inline code
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Bold
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // Italic (but not inside already-processed tags)
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>')
  // Links
  s = s.replace(/\[([^\]]+)\]\(#([^)]+)\)/g, '<a href="#$2">$1</a>')
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  // Em dash
  s = s.replace(/ — /g, ' &mdash; ')
  return s
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ──────────────────────────────────────────────── Extract TOC structure from markdown

function extractToc(src) {
  const sections = []
  const lines = src.split('\n')

  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.*)/)
    if (!m) continue
    const level = m[1].length
    const text = m[2]
    const id = slugify(text)

    if (level === 2) {
      sections.push({ id, text, children: [] })
    } else if (level === 3 && sections.length > 0) {
      // Check if previous line was an <a id="..."> anchor
      const idx = lines.indexOf(line)
      let anchorId = id
      if (idx > 0) {
        const prev = lines[idx - 2] || ''  // -2 because blank line between anchor and heading
        const am = prev.match(/<a id="([^"]+)"/)
        if (am) anchorId = am[1]
      }
      sections[sections.length - 1].children.push({ id: anchorId, text })
    }
  }
  return sections
}

// ──────────────────────────────────────────────── Build sidebar HTML

function buildSidebar(toc) {
  const items = toc.map(section => {
    const children = section.children.length > 0
      ? `<ul class="nav-sub">${section.children.map(c =>
          `<li><a href="#${c.id}" data-target="${c.id}">${c.text}</a></li>`
        ).join('')}</ul>`
      : ''
    return `<li class="nav-section">
      <a href="#${section.id}" data-target="${section.id}" class="nav-section-link">${section.text}</a>
      ${children}
    </li>`
  }).join('')

  return `<nav id="sidebar"><div class="nav-title">jp Reference</div><ul class="nav-root">${items}</ul></nav>`
}

// ──────────────────────────────────────────────── Assemble HTML

const toc = extractToc(md)
const bodyHtml = convertMarkdown(md)
const sidebarHtml = buildSidebar(toc)

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>jp Language Reference</title>
<style>
${CSS}
</style>
</head>
<body>
${sidebarHtml}
<main id="content">
${bodyHtml}
</main>
<script>
${JS}
</script>
</body>
</html>`

fs.writeFileSync(OUTPUT_FILE, html)
console.log(`Wrote ${OUTPUT_FILE}`)

// ──────────────────────────────────────────────── Embedded CSS

var CSS = `
:root {
  --sidebar-w: 260px;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
  --bg: #fff;
  --bg-sidebar: #f6f8fa;
  --bg-code: #f0f2f5;
  --border: #d8dee4;
  --text: #1f2328;
  --text-dim: #656d76;
  --accent: #0969da;
  --accent-bg: #ddf4ff;
  --highlight: #fff8c5;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117;
    --bg-sidebar: #161b22;
    --bg-code: #1c2128;
    --border: #30363d;
    --text: #e6edf3;
    --text-dim: #8b949e;
    --accent: #58a6ff;
    --accent-bg: #1c3a5c;
    --highlight: #3b2e00;
  }
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.6;
  color: var(--text);
  background: var(--bg);
}

/* ── Sidebar ── */

#sidebar {
  position: fixed;
  top: 0; left: 0;
  width: var(--sidebar-w);
  height: 100vh;
  overflow-y: auto;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  padding: 16px 0;
  font-size: 13px;
  z-index: 10;
  scrollbar-width: thin;
}

.nav-title {
  padding: 0 16px 12px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}

.nav-root {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-section { margin: 0; }

.nav-section-link {
  display: block;
  padding: 6px 16px;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
  cursor: pointer;
}

.nav-section-link:hover { color: var(--accent); }

.nav-section-link.active {
  color: var(--accent);
  background: var(--accent-bg);
  border-right: 3px solid var(--accent);
}

.nav-sub {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.25s ease;
}

.nav-section.expanded > .nav-sub {
  max-height: 2000px;
}

.nav-sub a {
  display: block;
  padding: 3px 16px 3px 28px;
  color: var(--text-dim);
  text-decoration: none;
  font-size: 12.5px;
}

.nav-sub a:hover { color: var(--accent); }

.nav-sub a.active {
  color: var(--accent);
  font-weight: 600;
}

/* ── Main content ── */

#content {
  margin-left: var(--sidebar-w);
  max-width: 800px;
  padding: 32px 40px 80px;
}

h1 { font-size: 28px; margin: 0 0 8px; border-bottom: 2px solid var(--border); padding-bottom: 12px; }
h2 { font-size: 22px; margin: 40px 0 12px; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
h3 { font-size: 17px; margin: 28px 0 8px; }

h2:target, h3:target {
  animation: flash 1.5s ease;
}

@keyframes flash {
  0%   { background: var(--highlight); }
  100% { background: transparent; }
}

p { margin: 0 0 12px; }

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

code {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: var(--bg-code);
  padding: 2px 6px;
  border-radius: 4px;
}

pre {
  background: var(--bg-code);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 16px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
}

pre code {
  background: none;
  padding: 0;
  font-size: inherit;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 0 0 16px;
  font-size: 14px;
}

th, td {
  text-align: left;
  padding: 6px 12px;
  border: 1px solid var(--border);
}

th {
  background: var(--bg-sidebar);
  font-weight: 600;
}

ul {
  margin: 0 0 12px;
  padding-left: 24px;
}

li { margin: 2px 0; }

li code {
  white-space: nowrap;
}

hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 32px 0;
}

/* ── Mobile ── */

@media (max-width: 860px) {
  #sidebar {
    position: static;
    width: 100%;
    height: auto;
    max-height: 50vh;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  #content {
    margin-left: 0;
    padding: 20px 16px 60px;
  }
}
`;

// ──────────────────────────────────────────────── Embedded JS

var JS = `
(function() {
  const sidebar = document.getElementById('sidebar');
  const sections = sidebar.querySelectorAll('.nav-section');
  const allLinks = sidebar.querySelectorAll('a[data-target]');

  // Collect all heading targets for scroll tracking
  const targets = [];
  allLinks.forEach(link => {
    const id = link.dataset.target;
    const el = document.getElementById(id);
    if (el) targets.push({ id, el, link });
  });

  // Expand/collapse on section link click
  sections.forEach(section => {
    const link = section.querySelector('.nav-section-link');
    const sub = section.querySelector('.nav-sub');
    if (!sub) return;

    link.addEventListener('click', (e) => {
      // Still navigate, but also toggle
      sections.forEach(s => {
        if (s !== section) s.classList.remove('expanded');
      });
      section.classList.toggle('expanded');
    });
  });

  // Scroll spy: highlight current section
  let ticking = false;

  function updateActive() {
    const scrollY = window.scrollY + 80;
    let current = null;

    for (let i = targets.length - 1; i >= 0; i--) {
      if (targets[i].el.offsetTop <= scrollY) {
        current = targets[i];
        break;
      }
    }

    allLinks.forEach(l => l.classList.remove('active'));
    sections.forEach(s => s.classList.remove('expanded'));

    if (current) {
      current.link.classList.add('active');

      // Expand parent section
      const parentSection = current.link.closest('.nav-section');
      if (parentSection) {
        parentSection.classList.add('expanded');
        // If the active link is a section link, also expand it
      }
      // If it's a child, also mark the parent section link
      const parentLink = parentSection?.querySelector('.nav-section-link');
      if (parentLink && parentLink !== current.link) {
        parentLink.classList.add('active');
      }

      // Scroll sidebar to keep active item visible
      const rect = current.link.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      if (rect.top < sidebarRect.top || rect.bottom > sidebarRect.bottom) {
        current.link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateActive);
      ticking = true;
    }
  });

  // Initial state
  updateActive();
})();
`;
