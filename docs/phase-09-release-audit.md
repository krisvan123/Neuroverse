# Phase 09 — QA, Accessibility & Deployment Readiness

**Status:** engineering release candidate. A green automated workflow is required before merge; **a public deploy, five-person educational pilot, human accessibility audit, physical mobile/desktop GPU measurements, and measured Lighthouse scores remain unverified** until evidence is recorded. Do not substitute CI for these gates.

## Hosting update — Vercel Hobby (current preferred path)

After the Render setup requested a card on this account, the deployment target was switched to **Vercel Hobby**. `vercel.json` defines same-origin Vercel Services (`frontend/` Vite, `backend/` FastAPI) with `/api/*` routing to Python before the frontend catch-all. See [Vercel deployment and account-specific fallback instructions](deploy-vercel.md). The tested Docker/Render plan below remains optional and should not be presented as a verified Vercel deployment. Actual production URL and host-side deploy tests are still **NOT VERIFIED**.

## Deployment target and rationale

A single, same-origin container hosts a static Vite React production build on `/` and the FastAPI scientific service on `/api/v1/*`. This avoids needing separate paid hosting or exposing a broad production CORS wildcard.

The included `render.yaml` uses Render's documented **Docker web service** and `plan: free` compute tier. Official guidance: [Blueprint schema](https://render.com/docs/blueprint-spec), [Docker](https://render.com/docs/docker), [Free limitations](https://render.com/docs/free). This is suitable for a hobby/portfolio **demo**, not an always-available production SLA.

**Free-tier cautions verified against the host's documentation:** 512 MB memory / 0.1 CPU; shutdown after 15 minutes idle; waking can take ~1 minute; 750 free instance hours per workspace per calendar month; usage-based bandwidth/build constraints (payment method may allow overage billing); no persistent disk and ephemeral local files. Large source download traffic might trigger host limits. Do not present free hosting as guaranteed 24/7 or unlimited.

## Steps to publish (requires the repository owner's hosting account)

1. Review `Dockerfile`, `render.yaml`, and [data restrictions](licenses-and-attribution.md). No passwords, dataset archive or journal backup belongs in the public repo or web image.
2. Log in to [Render](https://dashboard.render.com/), choose **New → Blueprint**, connect `krisvan123/Neuroverse` and use the root `render.yaml`. Review that the selected service is **Free** before applying. Alternatively create a Web Service connected to the repo with Docker runtime, root `Dockerfile`, free compute plan and health endpoint `/api/v1/health`.
3. The service builds React with `VITE_API_BASE_URL` empty and then runs FastAPI on `0.0.0.0:${PORT}`. The service serves both UI and API from the same HTTPS hostname; no production CORS additions are necessary in this topology.
4. Do **not** configure `NEUROVERSE_DATASET_DB` on the free host unless a licensed, authenticated, separately staged dataset and a persistence strategy exist. It is optional. Without one, the connectivity Explorer and real-FAFB Lab explain how to import locally instead of inventing connections. The Academy, synthetic Lab and local journal continue to function.
5. After deployment, open the **real URL** and confirm the following manually: `/`, `/#academy`, `/#explore`, `/#lab`, `/#journal`; `/api/v1/health` shows `status:ok`; proper original neuropil mesh source when upstream online; synthetic graph and journal round-trip; no missing JS assets; sources and research license notices visible.
6. Record the exact public URL, successful deploy timestamp, host build log or screenshot, browser/device names, source availability, and actual Lighthouse output here. If no host deployment occurred, keep the status **not deployed**.

## Local reproduction without Render

```sh
docker build -t neuroverse:local .
docker run --rm -p 10000:10000 -e PORT=10000 neuroverse:local
```

Visit `http://localhost:10000` for the public React build and `http://localhost:10000/api/v1/health` for the scientific API. The API also remains runnable without a built frontend using the existing development instructions. No container deployment implies the official FlyWire v783 connectivity CSV is included.

## Automated gates

The repository's CI continues the previous frontend/backend/integration, official-ID, source-authenticity and Chromium desktop/emulated-mobile tests. Phase 09 adds:

- Python regression tests for static route containment, immutable build assets, release headers, explicit missing-bundle errors and API-only fallback.
- Live **Docker image build-and-start** smoke: an actual release image serves HTML, its hashed JS and a successful health endpoint over HTTP, with correct cache and safety headers and no exposed `.env`.
- Playwright checks that internal navigation anchors exist and outbound source links open safely.

These are engineering checks only. A container boot test is **not** equivalent to production deployment or physical-device testing. The local storage remains browser-owned and should not be mistaken for persistent server storage.

## Manual acceptance matrix (do not pre-fill)

| Gate | Evidence required | Status |
| --- | --- | --- |
| Public deploy | Actual HTTPS domain, build logs, live endpoint | NOT VERIFIED |
| Physical smartphone & desktop | Device model, browser, responsive behavior, real WebGL state | NOT VERIFIED |
| Human keyboard/screen reader | Focus flow, labels, reading order, announcements, severity list | NOT VERIFIED |
| Lighthouse | Actual mobile/desktop accessibility/performance scores and reports | NOT VERIFIED |
| Five-person Academy comprehension pilot | Recruitment, tasks, rubric, participant consent and anonymized outcomes | NOT VERIFIED |
| Real source license/legal review | Attribution, licensing terms and public redistribution rights | PARTIAL: documented, final review open |
| Production dataset | Owner-confirmed authorized original FAFB subset staged durably | NOT CONFIGURED |

## Scientific and release-risk register

- Source-derived FlyWire surface meshes are fetched live from pinned upstream URLs, verified by Git blob checksums and kept in a process cache. No substitute scientific model is generated if a network request fails.
- Real directed connectivity is never available solely because a static website deployed. A valid locally imported dataset is required; do not upload it into an ephemeral container without durable, licensed hosting.
- No authenticated accounts, server-side upload endpoint or commercial data analytics are implemented. Academy progress and journal records live in local browser storage and can be removed by browser cleanup.
- Reduced-motion/keyboard-accessible controls have automated coverage, but manual WCAG conformance is not certified.
- CSP and broader abuse/rate-limit testing remain future hardening; current security headers and input restrictions are **not** a formal penetration test.

## Phase outcome report

- **Phase:** 09 — QA, Accessibility & Deployment.
- **Branch:** `phase/09-qa-deployment`.
- **Implemented:** single-origin release container, explicit static files, non-root runtime, safety/cache headers, free-plan manifest, regression tests, source notices, deployment guide.
- **Automated gate:** Pending exact final PR CI result.
- **Manual/production gate:** NOT YET VERIFIED.
- **Acceptance:** release-ready source configuration once CI is green; **not** a validated live production deployment.
