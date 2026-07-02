---
name: control-tower-demo
description: |
  Generate a branded, standalone AI "Project Execution Control Tower" DEMO for a Trees
  Engineering prospect running large capital projects (EPC, FPSO, construction, plant
  turnaround, infrastructure). Output is a single self-contained .html file (no backend, no
  build) re-skinned to the PROSPECT's logo, colours and font — showing an AI dashboard
  "powered by Trees Engineering AI" that sits on top of their existing systems (Primavera P6,
  ERP, cost sheets, contracts, correspondence). Views: Command Center (VOWD, CPI/SPI, EAC,
  S-curve, AI weekly brief), Cost Control (leakage flags, back-charges), Schedule & Progress
  (claimed vs AI-verified progress, float erosion, late subcontractors), Procurement & SCM
  (long-lead tracker, expediting signals, subcontractor scorecards), a living Risk Register
  (AI-surfaced signals awaiting human validation), and an AI Assistant chat. Role switcher for
  Project Director / PMO / SCM / Procurement. All data fictitious.

  Trigger when Quentin or Trees staff say: "control tower demo for [client]", "project
  execution dashboard for [client]", "AI project execution demo", "cost/schedule/risk
  dashboard demo", "build the EPC dashboard for [prospect]", or provide a client name + logo
  and ask for a project-execution / capital-projects demo. For RECRUITMENT/ATS demos use the
  prospect-demo skill instead.
---

# control-tower-demo — Branded AI Project Execution Control Tower

Produces a **single self-contained HTML file** that looks like the prospect's own AI project
execution dashboard, **powered by Trees Engineering AI**. It is a sales/discovery artifact,
not a product instance: every figure, company and event is fictitious and the footer says so.
Its job in a meeting is to be a **conversation piece** that makes discovery questions
concrete — open it AFTER the discovery questions, not before, or the prospect compares their
reality to the mock instead of describing their reality.

Worked example: `examples/Demo_BumiArmada_ControlTower.html`
(live at https://demobumiarmadacontroltower.vercel.app).

## ⚠️ Rules — read first
- **Brand to the PROSPECT every run.** Their logo + name lead the UI. Trees Engineering is the
  "Powered by" badge, never the headline. Never reuse a previous client's branding.
- **All data stays fictitious.** Fictional project name, fictional client-of-the-client,
  fictional suppliers. Never name a prospect's real assets, bids or clients — using a real
  pending tender in a demo reads as presumptuous and can breach confidentiality.
- **Keep the human-in-the-loop framing.** Every AI action button routes to a human
  ("AI prepares, your team decides"). That's the Trees SOP standard, visible in the product.
- **Keep the fictitious-data disclaimer** in the footer, always.

## Inputs to gather (every run)
Required:
- **Client name** — used in title, header, footer, filename.
- **Logo** — file path, URL, or `data:` URI. Embedded base64 so the file stays standalone.
  Omitted → clean initials chip. (Tip: `https://logo.clearbit.com/<domain>` or the site's
  press/media page.)

Optional (defaults in parentheses):
- **theme.primary** (navy `#232e83`) — ONE hex re-brands everything: the builder re-derives
  every tint in the file (sidebar, chart lines, heat map, badges) from it. Extract it from the
  prospect's logo (`python3 + PIL` pixel count works well) or website CSS.
- **theme.accent** (green `#1fb25a`) — the "good/AI" colour. Prefer a colour from their logo.
- **theme.neutral** (grey `#bcbdc0`) — baseline curve + neutral chrome.
- **font** — `{ "family": "Heebo", "googleUrl": "…" }`. Match the prospect's website font
  (closest Google Fonts match if proprietary).
- **deploy / projectName** — deploy to Vercel after building (see below).

## Step by step
### 1. Gather inputs, extract brand
Download the logo, count dominant pixel colours to get primary/accent, confirm with the user
if the palette is ambiguous.

### 2. Write the config
```json
{
  "clientName": "Bumi Armada",
  "logo": "logo_bumiarmada.png",
  "theme": { "primary": "#232e83", "accent": "#1fb25a", "neutral": "#bcbdc0" },
  "font": { "family": "Heebo", "googleUrl": "https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;900&display=swap" },
  "output": "Demo_BumiArmada_ControlTower.html",
  "deploy": true,
  "projectName": "demobumiarmadacontroltower"
}
```
Logo paths resolve relative to the config file. `primaryDark` / `primaryLight` are derived
from `primary` unless given explicitly.

### 3. Build (pure Node 18+, no npm install)
```bash
node "$SKILL_DIR/build_demo.js" /path/to/config.json
```

### 4. Adapt the story to the prospect's industry — edit the OUTPUT file
The template ships with an **EPC / FPSO conversion** story (FPSO Kencana Conversion, fictional
client PetroDelta E&P, Batam yard). If the prospect is in FPSO/offshore EPC, it works as-is.
For other industries, rewrite the story in the generated file — the structure stays, the nouns
change. Keep the numbers coherent (VOWD/budget %, CPI ≈ EV/VOWD, SPI ≈ EV/PV, EAC ≈ budget/CPI).

What to rewrite, in order of visibility:
- Sidebar `navlabel` + view headers: project name, client-of-client, location, facility.
- Command Center KPI values + AI Weekly Brief bullets.
- Cost packages table (keep 6–8 packages + contingency row).
- Schedule: subcontractor names/scopes, watchlist deliverables, float-erosion activities.
- SCM: long-lead items + suppliers (industry-correct equipment), expediting signals,
  scorecards.
- Risk register entries + AI-surfaced signals (keep the pattern: source snippets → drafted
  entry → validate/dismiss).
- AI Assistant `CANNED` answers + the seeded first exchange — including the "where are we
  losing money silently" answer, which carries the self-funding pitch (identified leakage ≈
  N× the system's annual run cost). Recompute N from your story's numbers.
- Footer client + disclaimer names.

Industry translation examples: FPSO conversion → data-centre build (packages: civil, shell,
MEP, fit-out; long-leads: generators, chillers, switchgear); plant turnaround (packages by
unit; long-leads: exchangers, valves, catalysts); infrastructure (viaduct segments, TBM
parts). Keep "claimed vs AI-verified progress" and "expediting language drift" — those two
signals sell the product in every industry.

### 5. Verify, then deliver
Open the file and click through all six views. Check: logo renders (on WHITE header — dark
logos need the white top bar, don't move it onto the navy), palette coherent, role switcher
updates the nav dots + note, chat suggestions answer, toasts fire, footer disclaimer intact.
Then hand over / deploy.

## Deploying live (Vercel)
Same auth as prospect-demo: token in `$VERCEL_TOKEN` or `~/.config/trees/vercel-token`,
team scope cached in `~/.config/trees/vercel-scope`. Either set `"deploy": true` +
`"projectName"` in the config, or run:
```bash
"$SKILL_DIR/deploy_vercel.sh" Demo_Client_ControlTower.html democlientcontroltower
```
Share the clean `https://<projectName>.vercel.app` URL. Re-running with the same project name
redeploys to the same URL.

## Files in this folder
- `SKILL.md` — this file
- `build_demo.js` — builder: embeds logo, re-derives the full palette from primary+accent,
  swaps font, optional deploy
- `template/controltower.template.html` — the dashboard (default navy/green palette is the
  source of truth the colour map in build_demo.js remaps FROM — if you recolour the template,
  update the map)
- `deploy_vercel.sh` — non-interactive Vercel deploy helper
- `examples/config_bumiarmada_ct.json` + `examples/Demo_BumiArmada_ControlTower.html` — worked
  example (Bumi Armada, July 2026)
- `package.json` — CommonJS marker so the builder runs inside this ESM repo
