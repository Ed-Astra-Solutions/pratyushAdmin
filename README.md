# Pratyush Liftz — admin console

The content console for [pratyushliftz.com](https://pratyushliftz.com).
Static HTML/CSS/JS, no build step, no framework, no dependencies.

**Live:** https://admin.pratyushliftz.com

```
index.html    the shell — sign-in + app frame
app.js        behaviour: auth, the four sections, publishing
editor.js     icons, the rich-text box, and the markup cleaner
schema.js     what appears where, and what it is called in plain English
styles.css    black/yellow, matching the site
config.js     where the API is — plain committed values, edit and push
```

## What it does

Four sections, no jargon, aimed at someone who has never seen HTML.

| Section | |
| --- | --- |
| **Blog posts** | write, edit and delete articles: title, cover photo, category, date, summary and a rich-text article with headings, lists, links and inline photos. Draft or live per post. |
| **Website text** | every piece of copy on the site, grouped the way the page reads — headline, your story, what clients get, results, videos, Q&A, apply section, blog heading, links & Google. Photos upload by drag and drop. |
| **Application form** | the questions themselves: wording, answer options, order, whether an answer is required, and which answer ends the form early. |
| **Applications** | the people who have applied: read their answers, mark them New / Replied / Signed up / Closed / Spam, keep private notes, and export the lot as a spreadsheet. |

Applications are the one section that is **not** website content. They are
personal data, they live only on the EC2 box, they are never committed to the
public site repo — and they save the moment you change them, with no Publish
step. Everything else is copy: edited locally, then published in one go.

Formatting is edited the way it reads — bold is bold, a heading is a heading.
Pasted text arrives as plain text, and `editor.js` strips every tag and
attribute the site does not style, so nothing the backend would reject can
leave this page.

## How the site reads it

The website is plain static HTML with no build step. `js/cms.js` in the site
repo loads `content/site.json` in the visitor's browser and swaps in whatever
this console published — so a publish is live in seconds, with no rebuild. Each
page ships a full copy of the current content as its fallback, so a slow or
failed load degrades to the page as it shipped rather than to a blank screen.

Blog posts are stored in `posts[]` and read at `/blog/post/?s=<web-address>`.

## How it fits together

This page holds no secrets and has no privileged access of its own. Everything
goes through the backend on EC2, which is the only component with a GitHub
token:

```
this console  ──▶  backend (EC2)  ──▶  commits content/site.json + images/
                                   │     to the site repo
                                   └─▶  receives coaching applications
                        │
                        ▼
                 GitHub Pages serves the new file; the site picks it up
                 on the next page load
```

The site lives in Ed-Astra-Solutions/pratyush and the backend in its own repo.

## Deploying

There is no build step. GitHub Pages serves this branch directly, so a push to
`main` is the deploy — usually live within a minute.

Settings → Pages → Source: **Deploy from a branch**, `main` / `/ (root)`.
The custom domain is `admin.pratyushliftz.com` (the `CNAME` file); point a
DNS CNAME record for it at `ed-astra-solutions.github.io`.

> Deliberately branch-based rather than an Actions workflow: custom workflows
> are currently blocked on this organisation by a billing lock, and this repo
> has nothing to build. If that changes and you want `config.js` generated per
> environment instead of committed, the workflow that did it is in the first
> commit's history.

To point the console at a different backend, edit `config.js` and push.

## Setup

**Allow this origin on the backend.** In the EC2 `.env`, `ADMIN_ORIGINS`
must include `https://admin.pratyushliftz.com` or the browser blocks every
call:

```
ADMIN_ORIGINS=https://admin.pratyushliftz.com,https://pratyushliftz.com,https://www.pratyushliftz.com
```

Then `sudo systemctl restart pl-admin-api`.

## Running locally

```bash
python3 -m http.server 4200
```

`config.js` points at the production API. To work against a local backend,
temporarily change `apiBase` to `http://localhost:3005` — just don't commit it.

Run the backend from the site repo (`cd backend && npm run dev`) to have
something to talk to.

## A note on access

This page is publicly reachable and `noindex`/`Disallow`ed, but that is
obscurity, not security — the password check on the backend is the actual gate,
and the session is a 12-hour JWT held in `sessionStorage`. Use a long password.
For a second layer, restrict the API's nginx server block to known source IPs.
