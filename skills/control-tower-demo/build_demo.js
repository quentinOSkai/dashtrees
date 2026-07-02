#!/usr/bin/env node
/* ============================================================================
 * build_demo.js — generate a branded Project Execution Control Tower demo
 * from template/controltower.template.html + a config JSON.
 *
 *   node build_demo.js <config.json> [output.html] [--deploy]
 *
 * Config (all colors optional — omit `theme` to keep the default navy/green):
 * {
 *   "clientName": "Bumi Armada",
 *   "logo":       "logo.png | https://… | data:image/png;base64,…",
 *   "theme":      { "primary": "#232e83", "accent": "#1fb25a", "neutral": "#bcbdc0" },
 *   "font":       { "family": "Heebo", "googleUrl": "https://fonts.googleapis.com/…" },
 *   "output":     "Demo_Client_ControlTower.html",
 *   "deploy":     true,
 *   "projectName":"democlientcontroltower"
 * }
 *
 * The template is authored in the default palette (navy #232e83 / green #1fb25a
 * / grey #bcbdc0). This script re-derives EVERY tint in the file (sidebar text,
 * chart lines, heat map, badges…) from the client's primary + accent, so one
 * hex re-brands the whole dashboard coherently.
 * ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ---------- args ----------
const cfgPath = process.argv[2];
if (!cfgPath || !fs.existsSync(cfgPath)) {
  console.error('✗ Usage: node build_demo.js <config.json> [output.html] [--deploy]');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const cfgDir = path.dirname(path.resolve(cfgPath));
const SKILL_DIR = __dirname;
const outArg = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : null;
const wantDeploy = cfg.deploy === true || process.argv.includes('--deploy');

const clientName = cfg.clientName || 'Client';
const outFile = path.resolve(outArg || cfg.output || `Demo_${clientName.replace(/\W+/g, '')}_ControlTower.html`);

// ---------- color math ----------
const hex2rgb = h => { const x = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(x.slice(i, i + 2), 16)); };
const rgb2hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => rgb2hex(hex2rgb(a).map((v, i) => v + (hex2rgb(b)[i] - v) * t)); // t=0 → a, t=1 → b
const lighten = (c, t) => mix(c, '#ffffff', t);
const darken = (c, t) => mix(c, '#000000', t);

const theme = cfg.theme || {};
const P = theme.primary || '#232e83';
const A = theme.accent || '#1fb25a';
const N = theme.neutral || '#bcbdc0';

// Every color in the template that belongs to the primary/accent families,
// mapped to how it is re-derived. Order matters: longer/darker first is not
// needed since hex strings are unique.
const colorMap = {};
if (P !== '#232e83' || theme.primaryDark || theme.primaryLight) Object.assign(colorMap, {
  '#232e83': P,                    // primary
  '#1a2363': theme.primaryDark || darken(P, 0.26),   // primary dark
  '#5b64ad': theme.primaryLight || lighten(P, 0.28), // primary light
  '#2c3a9e': lighten(P, 0.09),     // aibrief gradient end
  '#8f96c9': lighten(P, 0.52),     // sidebar muted text
  '#aeb6e8': lighten(P, 0.62),     // brief headings on dark
  '#c9cde8': lighten(P, 0.72),     // chart "today" line
  '#cdd2ef': lighten(P, 0.74),     // nav idle text
  '#cfd6ee': lighten(P, 0.76),     // heat low
  '#e8eaf3': lighten(P, 0.88),     // heat lowest
  '#eef0fa': lighten(P, 0.93)      // suggestion hover
});
if (A !== '#1fb25a') Object.assign(colorMap, {
  '#1fb25a': A,                    // accent
  '#177a42': darken(A, 0.30),      // accent text
  '#9fe8bf': lighten(A, 0.55),     // accent tint on dark
  '#cdeeda': lighten(A, 0.72),     // accent border tint
  '#e5f6ec': lighten(A, 0.86),     // accent bg tint
  '#eef7f1': lighten(A, 0.90)      // rolenote bg
});
if (N !== '#bcbdc0') colorMap['#bcbdc0'] = N;  // neutral / baseline curve

// ---------- logo ----------
function initialsChip(name) {
  const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="20" fill="${P}"/><text x="60" y="76" font-family="Arial,Helvetica,sans-serif" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle">${initials}</text></svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

async function resolveLogo() {
  const src = cfg.logo;
  if (!src) return { uri: initialsChip(clientName), how: 'initials chip (no logo given)' };
  if (src.startsWith('data:')) return { uri: src, how: 'data URI from config' };
  if (/^https?:\/\//.test(src)) {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get('content-type') || 'image/png';
      return { uri: `data:${ct.split(';')[0]};base64,${buf.toString('base64')}`, how: 'fetched ' + src };
    } catch (e) {
      console.warn('⚠ logo fetch failed (' + e.message + '), using initials chip');
      return { uri: initialsChip(clientName), how: 'initials chip (fetch failed)' };
    }
  }
  const p = path.isAbsolute(src) ? src : path.join(cfgDir, src);
  if (!fs.existsSync(p)) {
    console.warn('⚠ logo file not found: ' + p + ', using initials chip');
    return { uri: initialsChip(clientName), how: 'initials chip (file missing)' };
  }
  const ext = path.extname(p).slice(1).toLowerCase();
  const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/' + ext;
  return { uri: `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`, how: 'embedded ' + src };
}

// ---------- build ----------
(async () => {
  let html = fs.readFileSync(path.join(SKILL_DIR, 'template', 'controltower.template.html'), 'utf8');

  const logo = await resolveLogo();
  const font = cfg.font || {};
  const family = font.family || 'Heebo';
  const fontUrl = font.googleUrl ||
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;500;600;700;900&display=swap`;

  html = html
    .split('{{CLIENT_NAME}}').join(clientName)
    .split('{{LOGO_SRC}}').join(logo.uri)
    .split('{{FONT_FAMILY}}').join(family)
    .split('{{FONT_URL}}').join(fontUrl);

  for (const [from, to] of Object.entries(colorMap)) {
    html = html.split(from).join(to);
    html = html.split(from.toUpperCase()).join(to); // just in case
  }

  const leftovers = html.match(/{{[A-Z_]+}}/g);
  if (leftovers) { console.error('✗ Unreplaced tokens: ' + [...new Set(leftovers)].join(', ')); process.exit(1); }

  fs.writeFileSync(outFile, html);
  console.log(`✓ Control Tower demo generated → ${outFile}`);
  console.log(`  client: ${clientName} · primary ${P} · accent ${A} · font ${family}`);
  console.log(`  logo: ${logo.how}`);

  if (wantDeploy) {
    const project = cfg.projectName || `demo${clientName.replace(/\W+/g, '').toLowerCase()}controltower`;
    console.log(`→ Deploying '${project}' to Vercel…`);
    execFileSync(path.join(SKILL_DIR, 'deploy_vercel.sh'), [outFile, project], { stdio: 'inherit' });
  }
})();
