# Spectra Test Health — operator manual

How to open, read, run locally, and keep this dashboard fed with real Spectra results.

Live site: **https://sentikatechorg.github.io/spectra-health-dashboard/**

Repo: **https://github.com/sentikatechOrg/spectra-health-dashboard**

This site is static GitHub Pages. There is no login and no server. Every run you see is a JSON file under `data/`.

---

## 1. Open the dashboard

Use the live URL above (or `npm run dev` locally). Pages:

| Page | What it answers |
| --- | --- |
| **Overview** | Are we healthier or slipping? Pass rate, speed, open failures, charts, calendar, latest runs |
| **Apps** | One card per connected frontend (healthy / flaky / failing) |
| **Failures** | Repeated error messages, grouped |
| **Maintain** | List of stored run ids, and how to delete a run |

Click a row on Overview to open **run detail** (cases, failed step, screenshot if stored).

Colors: **green** passed, **amber** watch / mixed, **red** failed.

Time filters (30 days / 90 days / all history) apply to Overview, Apps, and Failures.

The latest-runs table scrolls inside its card if the list gets long. That is expected.

**Owner** is the PR author (or the GitHub user who triggered the run). Older rows ingested before this field existed show a dash; new CI publishes fill it in.

---

## 2. Run it on your machine

```bash
git clone https://github.com/sentikatechOrg/spectra-health-dashboard.git
cd spectra-health-dashboard
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build
npm run preview
```

`build` copies `data/` into `dist/data/` so the static site can read the same JSON as Pages.

---

## 3. How new results appear

1. A frontend repo (for example `sentikatech-frontend`) runs the **Spectra PR gate** on a pull request.
2. It uploads `spectra/reports/**` even when the suite fails.
3. A **publish** job checks out this dashboard with `SPECTRA_DASHBOARD_TOKEN`, runs `scripts/ci-ingest.mjs`, and commits `data/runs/{id}.json` plus `data/manifest.json`.
4. **Deploy GitHub Pages** rebuilds the site.

You do not paste YAML into the dashboard. Only Spectra JSON reports are ingested.

---

## 4. Connect another frontend app

### Token (once per person / org)

1. Sign in as a Sentika GitHub user with write access to this dashboard.
2. Create a fine-grained PAT: resource owner `sentikatechOrg`, only `spectra-health-dashboard`, **Contents: Read and write**.
3. Store it as repository secret **`SPECTRA_DASHBOARD_TOKEN`** on the frontend repo  
   (for example `sentikatech-frontend` → Settings → Secrets → Actions).

An org-wide secret is better if you have org-admin access. Repo secret is enough.

### Workflow

Copy [`examples/spectra-pr-publish-snippet.yml`](../examples/spectra-pr-publish-snippet.yml) into the app’s Spectra workflow:

- Upload reports with `if: always()`
- Add the `publish-health` **job** (not a step inside the suite job)

Add the repo slug to `connectedRepos` in [`dashboard.config.json`](../dashboard.config.json) so it appears on **Apps** before the first run.

---

## 5. Remove a run

Anyone with **write access** on `sentikatechOrg/spectra-health-dashboard` is a maintainer. No extra admin account.

1. Open **Maintain** on the site and copy the run id.
2. GitHub → this repo → **Actions → Maintain dashboard → Run workflow**.
3. Paste the id (comma-separated for several). The job archives the file under `data/archive/runs/` and updates the manifest. Pages redeploys.

Locally:

```bash
node scripts/remove-runs.mjs --ids sentikatechOrg-sentikatech-frontend-32532762335-alarm
```

---

## 6. Manual ingest (optional)

If you already have a `spectra-report-*.json` file:

```bash
node scripts/ingest-report.mjs \
  --report path/to/spectra-report.json \
  --repo sentikatechOrg/sentikatech-frontend \
  --run-id 32532762335 \
  --pr 3 \
  --out data/runs

node scripts/merge-manifest.mjs \
  --run data/runs/sentikatechOrg-sentikatech-frontend-32532762335-alarm.json \
  --manifest data/manifest.json
```

Or, from CI artifacts, **Actions → Ingest Spectra report** (`workflow_dispatch`) with the artifact name, source repo, and run id.

---

## 7. Change org or site path

Edit [`dashboard.config.json`](../dashboard.config.json):

- `org` / `repo` — GitHub location
- `pagesBase` — must match the Pages URL path (`/spectra-health-dashboard/`)
- `connectedRepos` — apps listed on the Apps page
- `manifestCap` — max runs kept in `data/manifest.json` (older ones archive)

---

## 8. Troubleshooting

| What you see | What to check |
| --- | --- |
| Site stale after a Spectra run | Pages workflow on this repo; hard-refresh the browser |
| Publish job cannot push | `SPECTRA_DASHBOARD_TOKEN` exists and has Contents write on this repo |
| No **Run workflow** on Spectra PR gate | That workflow must exist on `main`. Until the PR is merged, run it from branch `feat/spectra-pr-gate` or with `gh workflow run "Spectra PR gate" --ref feat/spectra-pr-gate` |
| Empty Apps card | No ingested run for that repo yet, or it is not in `connectedRepos` |
| Run detail has no screenshot | Screenshots are only shown if the path is stored on the run and the file is committed (or is a full URL) |

Schema and ingest internals: see the [README](../README.md).
