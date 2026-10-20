# Neuroverse — deploy on Vercel Hobby ($0)

**Deployment status:** repository configuration prepared; **no public deployment has been confirmed**. Use a personal, noncommercial Hobby project. Pricing/usage restrictions can change; confirm the $0 plan on your own account before deploying.

Sources: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Vercel Services deployment](https://vercel.com/kb/guide/vercel-services), [FastAPI runtime](https://vercel.com/docs/frameworks/backend/fastapi), [Vite support](https://vercel.com/docs/frameworks/frontend/vite).

## Architecture (preferred: one project)

The root [vercel.json](../vercel.json) defines two **Vercel Services**. This is not a Render Docker deployment.

| Service | Repository directory | Runtime | Public path |
| --- | --- | --- | --- |
| `web` | `frontend/` | React/Vite static frontend | `/` |
| `api` | `backend/` | FastAPI Python Functions, via `backend/main.py` | `/api/*` |

The API rule appears before the catch-all web rule, and the original API path is retained. Frontend requests default to `/api/v1/*` at **the same HTTPS origin**: leave `VITE_API_BASE_URL` unset or empty. No production CORS wildcard, secret, separate paid service or fake research data is required.

**Why no Docker:** Vercel uses its own managed frontend build and Python Functions runtime. The existing Render Dockerfile is preserved for independent local testing, not used by this Vercel configuration.

## Deploy from the Vercel dashboard

1. Open https://vercel.com/new and sign in with the GitHub account that can access `krisvan123/Neuroverse`.
2. Import the existing **`krisvan123/Neuroverse`** repository (the **main** branch). No new repository is needed.
3. Set **Project Root Directory** to the repository root (`./`, not `frontend/` or `backend/`).
4. Set the **Framework Preset** to **Services** if the dashboard exposes it. The root `vercel.json` defines `web` (Vite) and `api` (FastAPI). The root `vercel.json` should be detected without extra build/output overrides.
5. Choose **Hobby — $0**, not Pro, a trial that requests billing information, or a paid team. Confirm the price in the dashboard. Account-specific verification requirements cannot be guaranteed from the repository.
6. Do not add `VITE_API_BASE_URL`, `NEUROVERSE_STATIC_DIR` or `NEUROVERSE_DATASET_DB` environment variables for this initial demo. Do not upload tokens or biological archives. 
7. Click **Deploy**. Wait for both `web` and `api` services to build successfully. If a dashboard error says Services are not available for your account, use the two-project fallback below rather than selecting a paid plan.
8. Visit the **actual URL** Vercel gives you. Verify:
   - `/` shows the Neuroverse homepage and CSS/JS load.
   - `/api/v1/health` returns JSON with `status: "ok"`.
   - `/#academy`, `/#lab`, and `/#journal` work; save/export/import a SYNTHETIC experiment.
   - `/#explore` reports the true source availability. Authentic PLY meshes are downloaded at runtime from public pinned upstream URLs; those requests may be unavailable or subject to function limits.
   - `/api/v1/datasets/current` reports `available: false` until **you** supply a legitimate FAFB dataset through a separate, authorized persistent data workflow. This is expected, not a failed deployment.
9. Save the actual live URL and the deployment result in the Phase 09 QA log. A successful git push or local Docker test is **not** proof of a live Vercel deployment.

### Vercel Services not available? Two-project Hobby fallback

Vercel Services has been announced as available in Beta on all plans, but UI access/features may differ by account. If you cannot select **Services**, it is possible to deploy **two normal Hobby projects from the same GitHub repository** instead. This requires no paid Docker service.

1. First Vercel project: import `krisvan123/Neuroverse`, **Root Directory = `backend`**, choose the **FastAPI** framework (or Vercel's automatic Python detection). The included `backend/main.py` exports `app` and `backend/requirements.txt` lists the runtime dependencies. Deploy and verify `https://YOUR-BACKEND.vercel.app/api/v1/health`. Do not set `NEUROVERSE_STATIC_DIR` or a SQLite dataset location.
2. Second Vercel project: import the same repository again, **Root Directory = `frontend`**, choose **Vite**, and set environment variable `VITE_API_BASE_URL` to the exact **HTTPS origin** of the backend project without a trailing slash (e.g. `https://YOUR-BACKEND.vercel.app`). Deploy and record the frontend URL.
3. On the **backend** project, set `NEUROVERSE_CORS_ORIGINS` to the exact deployed **frontend** origin (e.g. `https://YOUR-FRONTEND.vercel.app`), with no slash at the end and **never `*`**. Redeploy backend.
4. Redeploy frontend if its `VITE_API_BASE_URL` changed after build. Check the `API CONNECTED` label and direct requests to the health and anatomy endpoints. Preview domains may need to be listed in CORS separately and only when deliberately trusted.

A single Services deployment is preferred since it avoids cross-origin configuration and duplicate projects. The fallback is still subject to account-specific build/runtime constraints.

## Vercel Python build troubleshooting

If the Vercel build log shows `No project table found in backend/pyproject.toml`, make sure the deployed commit contains the updated `[project]` metadata under `backend/pyproject.toml` and `backend/.python-version` is `3.12`. The Python service uses `uv lock` during its cloud build: a pytest-only `pyproject.toml` is **not** sufficient. CI now reproduces this `uv lock` and `uv sync` step before accepting a change.

Use the **latest commit on main** and redeploy. If an older deployment was created before the fix, choose the latest deployment in Vercel or trigger a new deployment after GitHub changes are synced; optionally disable build cache for troubleshooting. After a successful build, verify `https://YOUR-DOMAIN.vercel.app/api/v1/health`. A successful frontend build alone does not prove the Python API is online. If it still fails, open the **api service's build/runtime logs** and share the precise new error message; do not add secrets or paid services to work around a build error.

## Limits and scientific honesty

- **Cost:** Hobby is free for personal/noncommercial use within usage caps; exceeding limits can pause service or features. Do not assume unlimited bandwidth, functions, build minutes, or support.
- **Python Functions:** cold starts and runtime/download timeouts apply. Source PLY and skeleton endpoints fetch public upstream data and may fail on Vercel even though local and CI checks pass. The application must display error/unavailable states rather than fake neuroscience.
- **No persistent database:** serverless filesystem is not a durable SQLite store. There is intentionally **no** official FAFB connectivity graph in the Vercel image. The offline Academy, synthetic Lab, and local browser Journal work without it.
- **Privacy:** journal and Academy progress are stored only in each user's browser. Avoid committing personally identifiable data or researcher tokens.
- **Rights:** FAFB public data and original geometry have attribution, noncommercial and other applicable licensing restrictions. Read [data and third-party notices](licenses-and-attribution.md) before publishing.
- **Outstanding acceptance:** official live URL, actual Vercel build/test results, phone/GPU performance, Lighthouse and human accessibility/learning pilot all remain **not verified** until performed.

## Developer checks

The repository CI checks the actual app modules, UI, complete backend regression tests and that the Vercel Services routing config matches the real file structure. These are **configuration tests**, not an actual Vercel cloud deployment. For local same-origin developer behavior, use the already-tested Docker or Vite proxy integration as documented in the main README.
