// GET /api/leads — read back what /api/lead stored.
//
// A private Blob store is only reachable through an authenticated request, so
// without this route the archive is dashboard-only. Guarded by a shared secret
// in LEADS_ADMIN_KEY; if that variable is unset the route refuses to run at all.
//
//   /api/leads?key=…                       newest 50, JSON index
//   /api/leads?key=…&prefix=leads/2026/08  one month
//   /api/leads?key=…&format=csv            flattened export for a spreadsheet
//   /api/leads?key=…&pathname=leads/…json  one full record

import { timingSafeEqual } from 'node:crypto';
import { get, list } from '@vercel/blob';

const ADMIN_KEY = process.env.LEADS_ADMIN_KEY;
const BLOB_ACCESS = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';

const MAX_CSV_ROWS = 250;
const CSV_FETCH_CONCURRENCY = 8;
const CSV_COLUMNS = [
  ['receivedAt', (r) => r.receivedAt],
  ['name', (r) => r.lead?.full_name],
  ['phone', (r) => r.lead?.phone],
  ['email', (r) => r.lead?.email],
  ['address', (r) => r.lead?.property_address],
  ['service', (r) => r.lead?.service_needed],
  ['message', (r) => r.lead?.message],
  ['consent', (r) => r.lead?.consent],
  ['page', (r) => r.source?.page],
  ['city', (r) => r.source?.city],
  ['region', (r) => r.source?.region],
  ['utm_source', (r) => r.utm?.utm_source],
  ['utm_medium', (r) => r.utm?.utm_medium],
  ['utm_campaign', (r) => r.utm?.utm_campaign],
  ['suspectedBot', (r) => r.signals?.suspectedBot],
  ['id', (r) => r.id],
];

export default async function handler(request) {
  if (request.method !== 'GET') return text('Method not allowed', 405, { Allow: 'GET' });
  if (!ADMIN_KEY) return text('Lead export is not configured.', 503);

  const { searchParams } = new URL(request.url);
  const supplied =
    (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || searchParams.get('key') || '';
  if (!matches(supplied, ADMIN_KEY)) return text('Unauthorized', 401);

  const pathname = searchParams.get('pathname');
  if (pathname) return one(pathname);

  const prefix = searchParams.get('prefix') || 'leads/';
  const limit = clampInt(searchParams.get('limit'), 50, 1, 1000);
  const listing = await list({ prefix, limit, cursor: searchParams.get('cursor') || undefined });

  // list() returns ascending pathnames; our names are timestamped, so reversing
  // puts the newest lead first.
  const blobs = [...listing.blobs].reverse();

  if (searchParams.get('format') === 'csv') return csv(blobs.slice(0, MAX_CSV_ROWS));

  return json({
    count: blobs.length,
    hasMore: listing.hasMore,
    cursor: listing.cursor ?? null,
    leads: blobs.map((blob) => ({
      pathname: blob.pathname,
      uploadedAt: blob.uploadedAt,
      size: blob.size,
    })),
  });
}

async function one(pathname) {
  if (!pathname.startsWith('leads/')) return text('Not found', 404);
  const result = await get(pathname, { access: BLOB_ACCESS });
  if (!result || result.statusCode !== 200) return text('Not found', 404);
  return new Response(result.stream, {
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

async function csv(blobs) {
  const records = [];
  for (let i = 0; i < blobs.length; i += CSV_FETCH_CONCURRENCY) {
    const batch = await Promise.all(
      blobs.slice(i, i + CSV_FETCH_CONCURRENCY).map(async (blob) => {
        try {
          const result = await get(blob.pathname, { access: BLOB_ACCESS });
          if (!result || result.statusCode !== 200) return null;
          return JSON.parse(await new Response(result.stream).text());
        } catch {
          return null;
        }
      })
    );
    records.push(...batch.filter(Boolean));
  }

  const rows = [CSV_COLUMNS.map(([header]) => header).join(',')];
  for (const record of records) {
    rows.push(CSV_COLUMNS.map(([, read]) => cell(read(record))).join(','));
  }

  return new Response(rows.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="m310-leads.csv"',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

function cell(value) {
  if (value === undefined || value === null) return '';
  const s = String(value);
  // Neutralise spreadsheet formula injection from free-text fields.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

function matches(supplied, expected) {
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function clampInt(raw, fallback, min, max) {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

function text(message, status, headers = {}) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...headers },
  });
}
