# III F Notice Board — frontend

React + TypeScript + Vite app for the dashboard. Deployed to GitHub Pages by
`.github/workflows/scrape.yml`, which builds this app and copies `../docs/*.json`
(scraper output) plus `../docs/revision-notebooks/*.json` (hand-authored
revision notebooks) into `dist/data/` so the app can fetch them at runtime.

## Local development

```bash
npm install
npm run dev
```

`predev` copies `../docs/*.json` into `public/data/` first, so the dev
server serves real data without needing CI. Re-run `npm run predev` (or
just restart `npm run dev`) after the scraper updates `../docs/*.json`.

## Adding a new subject's revision notebook

No code change needed — add `../docs/revision-notebooks/<slug>.json` in the
`RevisionNotebook` shape (see `src/revision-notebooks/types.ts`), add any
images it needs under `public/`, and link to it from a
`portion_schedules.json` row's `revision_notebook_url` as `revision/<slug>`.
The `/revision/:slug` route fetches it by slug at runtime
(`src/features/revision/revisionSlice.ts`).

## Scripts

- `npm run dev` — local dev server
- `npm run build` — typecheck + production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — oxlint
- `npm run parse-revision-notebook` — historical: the one-off script that
  originally parsed the legacy static SST revision notebook HTML page into
  JSON (that source HTML no longer exists, so this can't be re-run, but it's
  a worked reference for migrating another legacy HTML notebook page)
