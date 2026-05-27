# Speculon UI Audit — Cream/Rialo Tightening Plan

**Date:** 2026-05-27
**Audited by:** ckm-design-system skill
**Scope:** `app/`, `components/`, `contexts/` — all client UI

---

## TL;DR

The cream/Rialo rebrand landed on the **public surface** (`app/page.js`, login/register, markets, predictions, create, Navigation, MarketCard, the two non-admin modals) but **never reached `app/admin/*`**, which is still the original dark + emerald theme. The token system in `app/globals.css` is well-formed, but the codebase doesn't enforce it — there are 498 raw Tailwind palette utilities across 7 files, all in admin or shared modals.

Two underlying problems make drift easy:

1. **`@theme inline` aliases exist but aren't used** — `--color-ink-muted`, `--color-line`, etc. map to vars, so `text-ink-muted` would just work, yet components reach for inline `style={{ color: 'var(--text-muted)' }}` instead.
2. **No type/spacing scale is codified** — components freely use `text-[15px]`, `text-[18px]`, `text-[22px]`, `text-[28px]`, `text-[36px]` (11 distinct arbitrary values). Same for padding/gap.

There are zero hardcoded hex values in JS/JSX (✅), and only 3 inline `rgba()` usages (all the same modal-backdrop value — easy to tokenize).

---

## Token Inventory (`app/globals.css`)

**What's there (working):**
- 13 light theme + 13 dark theme variables, 1:1 mapped
- `@theme inline` block exposes Tailwind utilities (`bg-paper`, `text-ink`, `border-line`, `bg-accent-soft`)
- ~17 legacy palette aliases (`--color-primary-emerald`, `--color-hot-coral`, …) all collapse to `--accent`/`--danger`/`--text` — this is what auto-rebrands stale components
- 4 radius tokens (`--radius-sharp` 4 / `--radius-soft` 10 / `--radius-round` 24 / `--radius-pill` 999)
- 11 utility classes (`surface-card`, `btn-mint`, `btn-outline`, `input-paper`, `eyebrow`, `editorial-heading`, `section-marker`, …)

**What's missing:**
| Gap | Impact |
|-----|--------|
| No type-scale tokens | 11 different `text-[NNpx]` arbitrary values in use |
| No spacing-scale tokens | Components freely use `p-4`/`p-5`/`p-6`/`p-8` with no rationale |
| No `--overlay` token | Modal backdrops use raw `rgba(17,17,17,0.55)` (3 places) |
| No font-weight tokens | Mix of `font-medium` / `font-semibold` / `font-bold` without role |
| `radius-soft` (10px) used in CSS only | Components use `rounded-xl`/`rounded-2xl`/`rounded-3xl` — not aligned |
| No semantic text roles | Only `--text` / `--text-muted` / `--text-placeholder`. No `--text-emphasis`, `--text-success`, `--text-danger-strong` |

---

## Drift Findings (severity ordered)

### S1 — Admin section is unbranded (highest impact)

| File | Off-spec utilities |
|---|---|
| `app/admin/page.js` | **157** |
| `app/admin/proposals/page.js` | **83** |
| `app/admin/ai-dashboard/page.js` | **79** |
| `app/admin/disputes/[id]/page.js` | **59** |
| `app/admin/resolve/[id]/page.js` | **50** |
| `app/admin/settings/page.js` | **34** |
| `components/UserManagementModal.js` | **36** |
| **Total** | **498 occurrences in 7 files** |

Representative pattern (every admin page top wrapper):
```jsx
<div className="min-h-screen bg-gradient-to-br from-zinc-900 via-emerald-950/20 to-zinc-900 ...">
  <div className="glass-dark p-8 rounded-3xl border border-emerald-500/20">
    <Icon className="w-8 h-8 text-emerald-400" />
    <p className="text-zinc-400">…</p>
```

The `glass-dark` class remaps fine, but the surrounding gradient/zinc/emerald utilities do not — admin will look dark-themed even in light mode, and won't react to the dark toggle.

### S2 — Modal backdrop uses raw `rgba()`

| File | Line |
|---|---|
| `components/PredictionModal.js` | 48 |
| `components/ApprovalVoteModal.js` | 62 |
| `app/markets/[id]/page.js` | 350 |

All three: `style={{ background: 'rgba(17, 17, 17, 0.55)', backdropFilter: 'blur(4px)' }}`. Same value, three places — classic copy-paste drift. Should be `--overlay` (+ dark variant) + a `.scrim` class.

### S3 — Typography scale is uncodified

11 distinct arbitrary text sizes in the rebranded surface alone:
`text-[12px]`, `text-[13px]`, `text-[14px]`, `text-[15px]`, `text-[16px]`, `text-[18px]`, `text-[20px]`, `text-[22px]`, `text-[24px]`, `text-[28px]`, `text-[36px]`

Plus `editorial-heading` (clamp 40→72) defined in CSS. No semantic naming, no documented scale. Same content type uses different sizes across pages (compare `page.js:185` `text-[28px]` page-header vs `markets/[id]:367` `text-[22px]` section-header — both are H2 contexts).

### S4 — Inline `var()` instead of Tailwind aliases

`@theme inline` exposes the variables as Tailwind classes (`text-ink-muted`, `border-line`, `bg-paper`, `bg-accent-soft`, `text-accent`), but components don't use them:

```jsx
// Current (verbose, escapes Tailwind's purge tracking)
<span style={{ color: 'var(--text-muted)' }}>

// Available
<span className="text-ink-muted">
```

This pattern repeats in `MarketCard.js`, `page.js`, `markets/[id]/page.js`, `predictions/page.js`, `Navigation.js`.

### S5 — Radius drift

`globals.css` defines `--radius-soft: 10px` (used by `btn-mint`, `input-paper`) and `--radius-round: 24px` (used by `surface-card`). But components use Tailwind: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl` — none of which read the token. 53 `rounded-2xl`/`rounded-3xl` instances total. Need to map Tailwind radius scale to the token scale.

### S6 — No validation guard

The `ckm-design-system` skill ships `validate-tokens.cjs` (scans source for hardcoded hex/rgba and palette utilities outside an allowlist). Not installed here. Without it, S1 will return.

---

## Tightening Plan

Phased, smallest-first. Each phase is independently shippable.

### Phase 0 — Codify what's already there (no behavior change)
1. Add a `tokens.json` mirroring `globals.css` (primitive → semantic → component layers).
2. Add `--overlay: rgba(17,17,17,0.55)` (light) / `rgba(0,0,0,0.65)` (dark) and a `.scrim` utility.
3. Add type-scale tokens: `--text-xs` 12 / `--text-sm` 13 / `--text-base` 15 / `--text-md` 18 / `--text-lg` 22 / `--text-xl` 28 / `--text-2xl` 36 / `--text-display` (clamp). Document which content role each maps to.
4. Add font-weight semantic tokens: `--weight-body` 400 / `--weight-emphasis` 500 / `--weight-heading` 600.
5. Drop `validate-tokens.cjs` into `scripts/` and wire to `npm run lint`.

### Phase 1 — Public surface cleanup (low risk, big readability win)
1. Replace 3 modal-backdrop `rgba()` inline styles with `.scrim`.
2. Replace `style={{ color: 'var(--text-muted)' }}` patterns with `text-ink-muted` (and analogous for other vars). ~15 sites.
3. Collapse arbitrary `text-[NNpx]` to the new type scale. Choose 5–6 roles (caption, body, body-strong, h3, h2, h1) and rename across `MarketCard`, `page.js`, `markets/[id]`, `predictions`, `create`.

### Phase 2 — Admin rebrand (highest impact, biggest churn)
The mechanical substitutions:
| Old | New |
|---|---|
| `bg-gradient-to-br from-zinc-900 via-emerald-950/20 to-zinc-900` | `bg-paper` |
| `bg-zinc-950` / `bg-black/40` | `bg-paper` / `bg-card` |
| `text-zinc-400` / `text-zinc-500` | `text-ink-muted` |
| `text-white` / `text-zinc-200` / `text-zinc-300` | `text-ink` |
| `border-zinc-700` / `border-zinc-800` | `border-line` |
| `border-emerald-500/20` | `border-line-strong` |
| `bg-emerald-500/20` + `text-emerald-400` | `bg-accent-soft text-accent-ink` |
| `text-emerald-400` (icon) | `text-accent` |
| `bg-red-500/20` + `text-red-400` (danger callout) | new `bg-danger-soft text-danger` pair (add tokens) |
| `text-orange-400`, `text-purple-400`, `text-blue-400` (StatCard accents) | pick 2–3 status roles; map to existing accent + new tokens, don't introduce arbitrary hues |
| `rounded-3xl` / `rounded-2xl` | `rounded-[var(--radius-round)]` or new `rounded-card` utility |
| `shadow-lg shadow-emerald-500/30` | remove (flat design) |
| `glass-dark` | `surface-card` (let it use the proper var) |

Suggested order: `settings` (smallest) → `disputes/[id]` → `resolve/[id]` → `proposals` → `ai-dashboard` → `page.js` (largest, do last when patterns are settled) → `UserManagementModal`.

### Phase 3 — Lock it in
1. Enable `validate-tokens.cjs` in pre-commit or CI.
2. Add Storybook (or a single `/styleguide` page) showing all tokens + utility classes in light + dark. Living doc.
3. Update `CLAUDE.md` (or add `DESIGN.md`) listing: "use these classes for these roles" — eliminate ambiguity that allowed the `text-[NNpx]` proliferation.

---

## Recommended next step

Phase 0 + Phase 1 together — adds the missing tokens and migrates the rebranded surface to use them. Low risk, no admin churn yet. Estimate: 1 focused session.

Phase 2 should be its own task — 498 substitutions with visual verification in dark + light modes, deserves a separate pass with screenshots.

---

## Files referenced

- `app/globals.css:6-94` — token definitions
- `app/globals.css:158-272` — utility classes
- `components/PredictionModal.js:48`, `components/ApprovalVoteModal.js:62`, `app/markets/[id]/page.js:350` — overlay rgba
- `app/admin/page.js`, `app/admin/proposals/page.js`, `app/admin/ai-dashboard/page.js`, `app/admin/disputes/[id]/page.js`, `app/admin/resolve/[id]/page.js`, `app/admin/settings/page.js`, `components/UserManagementModal.js` — un-rebranded
