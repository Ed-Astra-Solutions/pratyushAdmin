# Pratyush Liftz — admin console

The content console for [pratyushfitness.edastra.in](https://pratyushfitness.edastra.in).
Static HTML/CSS/JS, no build step, no framework, no dependencies.

**Live:** https://ed-astra-solutions.github.io/pratyushAdmin/

```
index.html    the shell — login gate + app frame
app.js        all behaviour: auth, content editing, applications inbox, deploys
schema.js     which fields appear in which section, and how collections are shaped
styles.css    black/yellow, matching the site
config.js     where the API is — plain committed values, edit and push
```

## What it does

| Section | |
| --- | --- |
| **Applications** | coaching applications from `/apply/` — filter by status, read every answer, triage (new / contacted / won / archived / spam), private notes, CSV export |
| **Application form** | the questions themselves: wording, options, order, required flags, and which answer ends the form early |
| Content sections | every editable string on the site, grouped as the page reads |
| Collections | transformations, counters, video testimonials, FAQs, blog cards |
| Links & SEO | apply URL, socials, page titles, social preview text |
| **Deployments** | recent builds with status, plus a manual rebuild button |

## How it fits together

This page holds no secrets and has no privileged access of its own. Everything
goes through the backend on EC2, which is the only component with a GitHub
token:

```
this console  ──▶  backend (EC2)  ──▶  commits to Ed-Astra-Solutions/pratyush
                                   └─▶  reads/writes applications (kept on the box)
                        │
                        ▼
                 push to main runs the site's deploy workflow → GitHub Pages
```

Site source and the application form live in
[Ed-Astra-Solutions/pratyush](https://github.com/Ed-Astra-Solutions/pratyush);
the backend is `backend/` in that repo.

## Deploying

There is no build step. GitHub Pages serves this branch directly, so a push to
`main` is the deploy — usually live within a minute.

Settings → Pages → Source: **Deploy from a branch**, `main` / `/ (root)`.

> Deliberately branch-based rather than an Actions workflow: custom workflows
> are currently blocked on this organisation by a billing lock, and this repo
> has nothing to build. If that changes and you want `config.js` generated per
> environment instead of committed, the workflow that did it is in the first
> commit's history.

To point the console at a different backend, edit `config.js` and push.

## Setup

**Allow this origin on the backend.** In the EC2 `.env`, `ADMIN_ORIGINS`
must include `https://ed-astra-solutions.github.io` or the browser blocks every
call:

```
ADMIN_ORIGINS=https://ed-astra-solutions.github.io,https://pratyushfitness.edastra.in
```

Then `sudo systemctl restart pl-admin-api`.

## Running locally

```bash
python3 -m http.server 4200
# open http://localhost:4200 — config.js points at localhost:3005 by default
```

Run the backend from the site repo (`cd backend && npm run dev`) to have
something to talk to.

## A note on access

This page is publicly reachable and `noindex`/`Disallow`ed, but that is
obscurity, not security — the password check on the backend is the actual gate,
and the session is a 12-hour JWT held in `sessionStorage`. Use a long password.
For a second layer, restrict the API's nginx server block to known source IPs.
