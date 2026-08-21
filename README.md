# Spectra Test Health

A static executive dashboard for **historical Spectra UI test health** across frontend repos.

Leaders should be able to answer, at a glance:

- Are our apps getting healthier or slipping?
- Which apps or suites are red, flaky, or slow?
- What failed last, and where?

The site is a GitHub Pages SPA. There is no backend. Every historical run is a committed JSON file under `data/`.

Live site (after Pages is enabled):

**https://aesstechnologies.github.io/spectra-health-dashboard/**

Org and repo slug are configurable in [`dashboard.config.json`](dashboard.config.json) so the same dashboard can live under `aesstechnologies` or `sentikatechOrg`.

---

## What you will see

| Page | Purpose |
| --- | --- |
| **Overview** | Pass rate, total runs, average duration, open failures, trends, daily calendar, latest-run table |
| **Apps** | One card per connected frontend, with pass-rate sparkline |
| **Failures** | Repeated error messages grouped together |
| **Run detail** | Case list → failed step message (and screenshot if stored) |

Language is plain English. Colors are green / amber / red. No raw YAML.

---

## Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The app reads `data/manifest.json` and lazy-loads `data/runs/*.json`.

```bash
npm run build
npm run preview
```

---

## Data model

### Manifest (`data/manifest.json`)

Newest runs first. Capped at 500 (older rows move to `data/archive/`).

```json
{
  "generated_at": "2026-08-21T21:15:02.000Z",
  "cap": 500,
  "runs": [{ "id": "sentikatechOrg-sentikatech-frontend-32528125817-alarm", "status": "passed" }]
}
```

### Normalized run (`data/runs/{id}.json`)

Produced from a Spectra CLI report (`spectra-report-*.json`). Extra CI fields are added at ingest time.

```json
{
  "id": "sentikatechOrg-sentikatech-frontend-32528125817-alarm",
  "repo": "sentikatechOrg/sentikatech-frontend",
  "suite": "alarm",
  "status": "passed",
  "pass_rate": 1.0,
  "started_at": "2026-08-21T21:09:04.962Z",
  "duration_ms": 307000,
  "pr": 3,
  "branch": "feat/spectra-pr-gate",
  "commit": "abc1234",
  "github_run_url": "https://github.com/sentikatechOrg/sentikatech-frontend/actions/runs/32528125817",
  "cases_passed": 1,
  "cases_failed": 0,
  "failed_steps": [{ "case_id": "AL-001", "step": 19, "message": "Timeout waiting for Snooze" }],
  "cases": []
}
```

This dashboard never imports Spectra source code. It only consumes the JSON report.

Sample history in `data/` includes:

- **Passed** Sentika alarm (`AL-001` Set up an alarm)
- **Failed** alarm on a Snooze timeout
- Webapp login (pass) and reminders (fail)

---

## Connect a new frontend repo

### 1. Create a dashboard write token

In the GitHub user or org that **owns this dashboard repo**:

1. Create a fine-grained PAT (or GitHub App installation token) with **Contents: Read and write** on `spectra-health-dashboard`.
2. Optionally add **Actions: Read** if you will pull artifacts from other private repos via *workflow_dispatch*.
3. In each **frontend** repo, add a secret named `SPECTRA_DASHBOARD_TOKEN` with that token.

If the dashboard is public and the frontend repos are in another org (`sentikatechOrg`), the token still works — it only needs write access to the dashboard.

### 2. Publish after every Spectra PR gate

In the frontend repo, upload reports on pass **or** fail, then call the reusable workflow. Full snippet: [`examples/spectra-pr-publish-snippet.yml`](examples/spectra-pr-publish-snippet.yml).

```yaml
      - name: Upload Spectra reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: spectra-reports-pr-${{ github.event.pull_request.number || github.run_number }}
          path: spectra/reports/**
          retention-days: 14
          if-no-files-found: ignore

      - name: Publish run to health dashboard
        if: always()
        uses: aesstechnologies/spectra-health-dashboard/.github/workflows/ingest.yml@main
        with:
          report_artifact_name: spectra-reports-pr-${{ github.event.pull_request.number || github.run_number }}
        secrets:
          DASHBOARD_TOKEN: ${{ secrets.SPECTRA_DASHBOARD_TOKEN }}
```

Change `aesstechnologies/spectra-health-dashboard` if you forked this repo into `sentikatechOrg` (or another org). Also update `org`, `repo`, and `pagesBase` in `dashboard.config.json`.

### 3. Allow the reusable workflow

In the frontend repo: **Settings → Actions → General → Access** — allow reusable workflows from the dashboard owner.

The ingest job writes `data/runs/{id}.json`, updates `data/manifest.json`, and commits to `main`. Pages then redeploys.

### Alternative: repository_dispatch

From any system that already has the JSON:

```bash
gh api repos/aesstechnologies/spectra-health-dashboard/dispatches \
  -f event_type=spectra-ingest \
  -f client_payload='{"report_artifact_name":"spectra-reports-pr-3","source_repo":"sentikatechOrg/sentikatech-frontend","source_run_id":"32528125817","pr":"3"}'
```

Or ingest locally:

```bash
node scripts/ingest-report.mjs \
  --report path/to/spectra-report.json \
  --repo sentikatechOrg/sentikatech-frontend \
  --run-id 32528125817 \
  --pr 3 \
  --out data/runs

node scripts/merge-manifest.mjs \
  --run data/runs/sentikatechOrg-sentikatech-frontend-32528125817-alarm.json \
  --manifest data/manifest.json
```

---

## Hosting and configuration

| File | What to change |
| --- | --- |
| `dashboard.config.json` | `org`, `repo`, `pagesBase` (`/spectra-health-dashboard/`), `connectedRepos`, `manifestCap` |
| `.github/workflows/ingest.yml` | default `dashboard_repo` input |
| Frontend `spectra-pr.yml` | `uses: {org}/spectra-health-dashboard/.github/workflows/ingest.yml@main` |

GitHub Pages is built from **GitHub Actions** (not the `gh-pages` branch). After the first push:

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. The `Deploy GitHub Pages` workflow publishes `dist/`

The site is static. Screenshots are shown only if their path is stored on the run record and the file is committed (or is an absolute URL). Otherwise the run detail page tells you to open the CI artifact.

---

## Repository layout

```
spectra-health-dashboard/
├── index.html
├── dashboard.config.json
├── data/
│   ├── manifest.json
│   ├── runs/
│   └── archive/
├── scripts/
│   ├── ingest-report.mjs
│   ├── merge-manifest.mjs
│   └── ci-ingest.mjs
├── src/                    # Vite + React + TypeScript UI (Recharts)
└── .github/workflows/
    ├── deploy-pages.yml
    └── ingest.yml
```
