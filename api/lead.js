// POST /api/lead — the only backend this site needs.
//
// Two things happen per submission, independently:
//   1. The full record is written to Vercel Blob (system of record, never lost).
//   2. A notification email goes out through the Resend HTTP API (no SMTP).
//
// They are deliberately decoupled: if Resend is down the lead is still stored,
// and if Blob is down the email still goes out. We only fail the request when
// BOTH fail, because that is the only case where the lead is actually gone.

import { put } from '@vercel/blob';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const LEAD_TO =
  process.env.LEAD_TO_EMAIL || 'yashwanth.challa@insurancemasters.biz,mario@insurancemasters.biz';
const LEAD_FROM = process.env.LEAD_FROM_EMAIL || 'M310 Renovations <leads@m310renovations.com>';
const LEAD_BCC = process.env.LEAD_BCC_EMAIL || '';
const AUTOREPLY = process.env.LEAD_AUTOREPLY === 'true';
const BLOB_ACCESS = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';
const ALLOWED_HOSTS = (process.env.ALLOWED_ORIGIN_HOSTS || '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

const MAX_BODY_BYTES = 32 * 1024;
const MAX_FIELD_CHARS = 5000;
// A human cannot read the form, type a name and a phone number, and submit in
// under two seconds. Bots routinely do. This only flags — it never rejects.
const MIN_FILL_MS = 2000;

// Allowlist. Anything a client posts that is not in here is discarded, so a
// scripted POST can't stuff 500 junk keys into the blob or the email body.
const LEAD_FIELDS = {
  full_name: 'Name',
  phone: 'Phone',
  email: 'Email',
  property_address: 'Property address / city',
  service_needed: 'Service needed',
  message: 'Project details',
  consent: 'Consent to contact',
  brand: 'Brand',
};

const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, { error: 'Method not allowed.' }, 405, { Allow: 'POST' });
  }

  if (!isSameSite(req)) {
    return json(res, { error: 'Forbidden.' }, 403);
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    if (err.code === 'BODY_TOO_LARGE') return json(res, { error: 'Payload too large.' }, 413);
    return json(res, { error: 'Invalid JSON body.' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json(res, { error: 'Invalid body.' }, 400);
  }

  // Honeypot: a hidden input no sighted user or screen reader ever reaches.
  // Filled means bot. Answer 200 so the bot believes it succeeded and moves on.
  if (clean(body.company_website)) {
    return json(res, { ok: true });
  }

  const lead = {};
  for (const key of Object.keys(LEAD_FIELDS)) {
    const value = clean(body[key]);
    if (value) lead[key] = value;
  }

  const errors = [];
  if (!lead.full_name) errors.push('full_name');
  if (!lead.phone) errors.push('phone');
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) errors.push('email');
  if (errors.length) {
    return json(res, { error: 'Please check the highlighted fields.', fields: errors }, 400);
  }

  const now = new Date();
  const elapsedMs = fillTime(body.form_render_ts, now);
  const utm = {};
  for (const key of UTM_FIELDS) {
    const value = clean(body[key]);
    if (value) utm[key] = value;
  }

  const record = {
    id: crypto.randomUUID(),
    receivedAt: now.toISOString(),
    lead,
    utm,
    source: {
      page: clean(body.page) || header(req, 'referer') || null,
      userAgent: header(req, 'user-agent') || null,
      ip: header(req, 'x-forwarded-for')?.split(',')[0].trim() || null,
      country: header(req, 'x-vercel-ip-country') || null,
      region: header(req, 'x-vercel-ip-country-region') || null,
      city: geo(header(req, 'x-vercel-ip-city')) || null,
    },
    signals: {
      fillTimeMs: elapsedMs,
      // Not a verdict, just a note in the record so you can spot a spam wave later.
      suspectedBot: elapsedMs !== null && elapsedMs < MIN_FILL_MS,
    },
  };

  const serialized = JSON.stringify(record, null, 2);
  const pathname = blobPathname(now, lead.full_name);

  const [stored, mailed] = await Promise.allSettled([
    put(pathname, serialized, {
      access: BLOB_ACCESS,
      contentType: 'application/json',
      addRandomSuffix: true,
      cacheControlMaxAge: 60,
    }),
    sendNotification(record, serialized, pathname),
  ]);

  if (stored.status === 'rejected') console.error('[lead] blob write failed:', stored.reason);
  if (mailed.status === 'rejected') console.error('[lead] notification email failed:', mailed.reason);

  if (stored.status === 'rejected' && mailed.status === 'rejected') {
    return json(res, { error: 'We could not save your request. Please call (803) 634-1616.' }, 502);
  }

  // Best-effort courtesy reply to the homeowner. Never allowed to fail the request.
  if (AUTOREPLY && lead.email) {
    try {
      await sendAutoReply(lead);
    } catch (err) {
      console.error('[lead] auto-reply failed:', err);
    }
  }

  return json(res, {
    ok: true,
    id: record.id,
    stored: stored.status === 'fulfilled',
    notified: mailed.status === 'fulfilled',
  });
}

/* ------------------------------------------------------------------ email */

async function sendNotification(record, serialized, pathname) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set.');

  const { lead } = record;
  const subject = `New estimate request — ${lead.full_name}${
    lead.service_needed ? ` (${lead.service_needed})` : ''
  }`;

  const rows = Object.entries(LEAD_FIELDS)
    .filter(([key]) => lead[key])
    .map(([key, label]) => [label, lead[key]]);

  const context = [
    ['Received', record.receivedAt],
    ['Page', record.source.page],
    ['Location', [record.source.city, record.source.region, record.source.country].filter(Boolean).join(', ')],
    ...Object.entries(record.utm).map(([k, v]) => [k, v]),
    ['Stored at', pathname],
  ].filter(([, value]) => value);

  const payload = {
    from: LEAD_FROM,
    to: LEAD_TO.split(',').map((address) => address.trim()).filter(Boolean),
    subject,
    // reply_to makes the notification directly answerable from the inbox.
    ...(lead.email ? { reply_to: lead.email } : {}),
    ...(LEAD_BCC ? { bcc: LEAD_BCC.split(',').map((a) => a.trim()).filter(Boolean) } : {}),
    text: textBody(rows, context, record),
    html: htmlBody(rows, context, record),
    attachments: [
      {
        filename: `${pathname.split('/').pop()}`,
        content: Buffer.from(serialized).toString('base64'),
      },
    ],
  };

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // A retried submission with the same id will not double-send.
      'Idempotency-Key': record.id,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Resend responded ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function sendAutoReply(lead) {
  if (!RESEND_API_KEY) return;
  const firstName = lead.full_name.split(/\s+/)[0];

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: LEAD_FROM,
      to: [lead.email],
      reply_to: LEAD_TO.split(',')[0].trim(),
      subject: 'We got your estimate request — M310 Renovations',
      text:
        `Hi ${firstName},\n\n` +
        'Thanks for reaching out to M310 Renovations. We have your request and someone from our ' +
        'team will call you shortly to schedule your free estimate.\n\n' +
        'Need us sooner? Call (803) 634-1616.\n\n' +
        'M310 Renovations\n332 Edgefield Rd, North Augusta, SC 29841\n',
      html:
        `<p>Hi ${esc(firstName)},</p>` +
        '<p>Thanks for reaching out to M310 Renovations. We have your request and someone from our ' +
        'team will call you shortly to schedule your free estimate.</p>' +
        '<p>Need us sooner? Call <a href="tel:+18036341616">(803) 634-1616</a>.</p>' +
        '<p style="color:#666;font-size:13px">M310 Renovations<br>332 Edgefield Rd, North Augusta, SC 29841</p>',
    }),
  });

  if (!response.ok) throw new Error(`Resend auto-reply ${response.status}: ${await response.text()}`);
}

function textBody(rows, context, record) {
  const lines = ['New estimate request from the website.', ''];
  for (const [label, value] of rows) lines.push(`${label}: ${value}`);
  lines.push('', '--- context ---');
  for (const [label, value] of context) lines.push(`${label}: ${value}`);
  if (record.signals.suspectedBot) lines.push('', 'NOTE: submitted suspiciously fast — possible spam.');
  return lines.join('\n');
}

function htmlBody(rows, context, record) {
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 14px;background:#f6f5f2;font:600 13px/1.4 system-ui,sans-serif;color:#4a4741;white-space:nowrap;vertical-align:top">${esc(
          label
        )}</td><td style="padding:8px 14px;font:14px/1.5 system-ui,sans-serif;color:#1d2733">${esc(
          value
        ).replace(/\n/g, '<br>')}</td></tr>`
    )
    .join('');

  const meta = context
    .map(([label, value]) => `<tr><td style="padding:3px 0;color:#8a857c">${esc(label)}</td><td style="padding:3px 0 3px 14px;color:#4a4741">${esc(value)}</td></tr>`)
    .join('');

  return `<div style="background:#f0efec;padding:24px">
  <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2dfd9">
    <div style="background:#1d2733;padding:18px 22px">
      <div style="font:700 18px/1.2 system-ui,sans-serif;color:#fff;letter-spacing:.02em">NEW ESTIMATE REQUEST</div>
      <div style="font:13px/1.4 system-ui,sans-serif;color:#c9a227;margin-top:4px">M310 Renovations — website lead</div>
    </div>
    ${record.signals.suspectedBot ? '<div style="background:#fff4d6;color:#7a5c00;padding:10px 22px;font:13px system-ui,sans-serif">Submitted unusually fast — review before calling.</div>' : ''}
    <table style="width:100%;border-collapse:collapse">${cells}</table>
    <div style="padding:16px 22px;border-top:1px solid #e2dfd9">
      <table style="border-collapse:collapse;font:12px/1.4 system-ui,sans-serif">${meta}</table>
    </div>
  </div>
</div>`;
}

/* ----------------------------------------------------------------- helpers */

function clean(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : '';
  const text = String(value).replace(/\r\n/g, '\n').trim();
  if (text === 'on') return 'Yes'; // unchecked checkboxes are simply absent
  return text.slice(0, MAX_FIELD_CHARS);
}

function fillTime(renderedAt, now) {
  const started = Number(renderedAt);
  if (!Number.isFinite(started) || started <= 0) return null;
  const elapsed = now.getTime() - started;
  return elapsed >= 0 && elapsed < 86_400_000 ? elapsed : null;
}

// leads/2026/08/2026-08-11T14-32-07Z-jane-doe.json — sorts chronologically in
// the Blob dashboard and in list() output without any extra index.
function blobPathname(now, name) {
  const stamp = now.toISOString().replace(/\.\d+Z$/, 'Z').replace(/:/g, '-');
  const slug =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'lead';
  return `leads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${stamp}-${slug}.json`;
}

// Blocks cross-origin scripted POSTs. Requests with no Origin header (curl,
// some privacy tooling) are allowed through — the honeypot handles those.
function isSameSite(req) {
  const origin = header(req, 'origin');
  if (!origin) return true;
  let host;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  // The apex redirects to www, so compare registrable host, not the exact one.
  const self = (header(req, 'host') || '').toLowerCase();
  if (bareHost(host) === bareHost(self)) return true;
  if (host.endsWith('.vercel.app')) return true;
  return ALLOWED_HOSTS.includes(host);
}

function bareHost(host) {
  return host.replace(/^www\./, '');
}

function header(req, name) {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value || '';
}

// Vercel percent-encodes the geo headers, so "North Augusta" arrives as
// "North%20Augusta" and would otherwise be stored that way.
function geo(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Vercel's Node runtime pre-parses JSON bodies onto req.body, but that is not
// guaranteed for every content-type, so fall back to reading the stream.
async function readJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const err = new Error('Body too large');
      err.code = 'BODY_TOO_LARGE';
      throw err;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function json(res, payload, status = 200, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(payload));
}
