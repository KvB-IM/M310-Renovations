# Lead capture

Every estimate form on the site posts to `/api/lead`. That endpoint does two
independent things:

1. **Stores** the full submission as JSON in **Vercel Blob** — the permanent record.
2. **Emails** a notification through the **Resend HTTP API** — the alert.

They are decoupled on purpose. If Resend has an outage the lead is still stored;
if Blob has an outage the email still arrives. The request only fails when both
fail, which is the only case where a lead would actually be lost.

## Why Resend

The site has no server, but Vercel Functions *are* the backend — the `api/`
folder deploys as serverless functions on the Hobby plan at no cost. From a
function, sending mail is just an HTTPS POST, so the only requirement is an
email provider with a plain REST API (no SMTP sockets, which serverless
functions handle badly anyway).

Resend fits: REST API, free tier of 3,000 emails/month (100/day), one custom
domain, 30-day log retention, and a first-party Vercel integration. Volume here
is a few leads a day, so the free tier is ample.

If you ever outgrow it or want a second opinion on deliverability, the drop-in
alternatives with the same shape (one authenticated POST, JSON body) are
**Postmark**, **Mailgun**, and **AWS SES**. Only `sendNotification()` in
[api/lead.js](api/lead.js) would change.

## One-time setup

### 1. Blob store

Vercel dashboard → project → **Storage** → **Create Database** → **Blob** →
set access to **Private** (leads are personal data — a public store hands out
readable URLs). Connect it to this project for Production and Preview.

Vercel injects the credentials automatically; you don't need to copy a token.

### 2. Resend

1. Sign up at [resend.com](https://resend.com) and add `m310renovations.com`
   under **Domains**.
2. Add the DKIM/SPF DNS records it shows you and wait for **Verified**.
   Until the domain verifies, mail from that address will be rejected.
3. **API Keys** → create one with *Sending access* → copy the `re_…` value.

### 3. Environment variables

Project → **Settings** → **Environment Variables**, for Production *and*
Preview. See [.env.example](.env.example) for the full annotated list; the
required ones are:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | the `re_…` key from step 2 |
| `LEAD_TO_EMAIL` | `yashwanth.challa@insurancemasters.biz,mario@insurancemasters.biz` |
| `LEAD_FROM_EMAIL` | `M310 Renovations <leads@m310renovations.com>` — must be the verified domain |
| `BLOB_ACCESS` | `private` (match how you created the store) |
| `LEADS_ADMIN_KEY` | long random string, only if you want the export endpoint |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret; without it the bot check is skipped |

> **Both recipients require a verified domain.** Until then Resend refuses the
> whole send — not just the second address — with a 403. Keep `LEAD_TO_EMAIL` at
> `yashwanth.challa@insurancemasters.biz` alone while the domain is pending, and
> add Mario the moment it verifies. Leads are archived in Blob either way.

Optional: `LEAD_BCC_EMAIL`, `LEAD_AUTOREPLY=true` to send the homeowner a
confirmation, `ALLOWED_ORIGIN_HOSTS` for extra staging domains.

Redeploy after adding them — env vars are baked in at deploy time.

## Reading leads back

A private Blob store needs an authenticated request, so leads are visible in the
Vercel dashboard (Storage → your store) or through `GET /api/leads`, which is
gated on `LEADS_ADMIN_KEY`. Leave that variable unset and the endpoint returns
503 and does nothing.

```
/api/leads?key=…                        newest 50, as a JSON index
/api/leads?key=…&prefix=leads/2026/08   one month
/api/leads?key=…&limit=200&format=csv   spreadsheet export (max 250 rows)
/api/leads?key=…&pathname=leads/…json   one full record
```

The key also works as `Authorization: Bearer …`. Blobs are stored at
`leads/YYYY/MM/<timestamp>-<name>.json`, so they sort chronologically with no
separate index.

## Spam handling

Five layers. The honeypot runs before Turnstile so obvious bots never cost a
verification call.

- **Cloudflare Turnstile** — an invisible challenge on every form. The site key
  is public and sits in the markup; the secret goes in `TURNSTILE_SECRET_KEY`
  and is verified server-side against Cloudflare before anything is stored.
  A failed or missing token is rejected with `403`.

  Two deliberate fail-open cases, both so a configuration problem can never
  silently swallow leads: if `TURNSTILE_SECRET_KEY` is unset the check is
  skipped (with a warning in the logs), and if Cloudflare itself is unreachable
  the submission proceeds. Every stored record notes which happened under
  `signals.turnstile`.

  Tokens are single-use and expire after five minutes, so the widget is reset
  on any failed submission and the visitor gets a fresh one.
- **Honeypot** — a `company_website` field positioned off-canvas and hidden from
  assistive tech. Anything that fills it gets a `200 OK` and is silently dropped,
  so the bot never learns it was caught.
- **Fill timing** — `form_render_ts` is stamped by JS when the page loads.
  Submissions under two seconds are recorded with `suspectedBot: true`. This only
  annotates the record; it never rejects, so a fast real person is never lost.
- **Origin check** — cross-origin POSTs are refused.
- **Field allowlist** — only the known form fields are persisted, capped at 5,000
  characters each and 32 KB per request.

If spam still gets through, tighten the Turnstile widget mode in the Cloudflare
dashboard (Managed → Interactive) — no code change needed.

## Local development

```bash
npm install
vercel env pull      # writes .env.local with the Blob + Resend credentials
vercel dev
```

`.env*` files are gitignored. Never commit the Resend key or the admin key.

## Files

| File | Role |
| --- | --- |
| [api/lead.js](api/lead.js) | accepts submissions, writes the blob, sends the email |
| [api/leads.js](api/leads.js) | authenticated read-back and CSV export |
| [assets/site.js](assets/site.js) | form submit handler, timestamp stamping, inline errors |
| [.env.example](.env.example) | annotated list of every variable |
