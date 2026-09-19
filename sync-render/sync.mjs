// sync-render.mjs
// One-time admin-API sync: pushes ONLY the 10 hotel image changes and 14 UMR17
// package price changes (from change-set.json) to the Render API, using the same
// endpoints the admin panel uses. Idempotent: skips records that already match.
//
// Usage:
//   node sync-render/sync.mjs            # apply
//   node sync-render/sync.mjs --dry-run  # show what would change, write nothing
//
// Credentials: set RENDER_ADMIN_EMAIL and RENDER_ADMIN_PASSWORD either as
// environment variables or in sync-render/secrets.env (KEY=VALUE, one per line).
// Optional RENDER_API_BASE (default https://ms-sons-tours.onrender.com).

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");
const BASE = process.env.RENDER_API_BASE || "https://ms-sons-tours.onrender.com";

function loadSecrets() {
  const env = { ...process.env };
  const p = path.join(__dirname, "secrets.env");
  if (existsSync(p)) {
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const secrets = loadSecrets();
if (!secrets.RENDER_ADMIN_EMAIL || !secrets.RENDER_ADMIN_PASSWORD) {
  console.error("Missing RENDER_ADMIN_EMAIL / RENDER_ADMIN_PASSWORD.");
  console.error("Create sync-render/secrets.env with both values (this file is gitignored).");
  process.exit(2);
}

const changeSetStr = readFileSync(path.join(__dirname, "change-set.json"), "utf8").replace(/^\uFEFF/, "");
const changeSet = JSON.parse(changeSetStr);

async function req(method, url, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  if (!res.ok) throw new Error(`${method} ${url} -> HTTP ${res.status}: ${text.slice(0, 300)}`);
  return json;
}

async function login() {
  const r = await req("POST", `${BASE}/api/auth/login`, {
    body: { email: secrets.RENDER_ADMIN_EMAIL, password: secrets.RENDER_ADMIN_PASSWORD },
  });
  if (!r || !r.token) throw new Error("Login failed: no token returned");
  return r.token;
}

const sameSet = (a, b) => {
  const norm = (x) => Array.from(new Set(x.map((s) => String(s).trim()))).sort().join("\u0000");
  return norm(a) === norm(b);
};

function samePrices(current, target) {
  if (current.length !== target.length) return false;
  const m = new Map(target.map((t) => [t.roomTypeId, t.price]));
  return current.every((c) => m.get(c.roomTypeId) === c.price);
}

async function main() {
  console.log(DRY_RUN ? "DRY-RUN (no writes)" : "APPLY", "->", BASE);
  const token = await login();
  console.log("Logged in as admin.");

  const hotelsRes = await req("GET", `${BASE}/api/hotels?limit=500`, { token });
  const hotelsByLower = new Map((hotelsRes.data || []).map((h) => [h.name.trim().toLowerCase(), h]));

  const rtRes = await req("GET", `${BASE}/api/room-types`, { token });
  const rtByName = new Map((rtRes.data || []).map((rt) => [rt.name, rt]));

  let packages = [];
  for (let page = 1, i = 0; i < 5; i++) {
    const r = await req("GET", `${BASE}/api/packages?status=ACTIVE&limit=100&page=${page}`, { token });
    const list = r.data || [];
    packages = packages.concat(list);
    const pag = r.pagination || {};
    if (list.length === 0 || page >= (pag.totalPages || 1)) break;
    page++;
  }
  const pkgByCode = new Map(packages.filter((p) => p.packageCode).map((p) => [p.packageCode, p]));

  console.log("\n== HOTELS ==");
  let hApplied = 0, hSkipped = 0, hMissing = 0;
  for (const h of changeSet.hotels) {
    const r = hotelsByLower.get(h.name.toLowerCase());
    if (!r) { hMissing++; console.log(`  MISSING on render: ${h.name}`); continue; }
    if (sameSet(r.images || [], h.images || [])) { hSkipped++; console.log(`  already synced: ${h.name}`); continue; }
    console.log(`  ${DRY_RUN ? "WOULD UPDATE" : "updated"}: ${h.name} -> ${(h.images || []).length} images`);
    if (!DRY_RUN) await req("PUT", `${BASE}/api/hotels/${r.id}`, { token, body: { images: h.images } });
    hApplied++;
  }
  console.log(`hotels: applied=${hApplied} skipped=${hSkipped} missing=${hMissing}`);

  console.log("\n== PACKAGES ==");
  let pApplied = 0, pSkipped = 0, pMissing = 0, pBadRoom = 0;
  for (const p of changeSet.packages) {
    const r = pkgByCode.get(p.packageCode);
    if (!r) { pMissing++; console.log(`  MISSING on render: ${p.packageCode}`); continue; }
    const target = [];
    let roomOk = true;
    for (const [roomName, price] of Object.entries(p.roomPrices)) {
      const rt = rtByName.get(roomName);
      if (!rt) { pBadRoom++; roomOk = false; console.log(`  missing room type "${roomName}" for ${p.packageCode}`); continue; }
      target.push({ roomTypeId: rt.id, price, available: true });
    }
    if (!roomOk) continue;
    if (samePrices(r.roomPrices || [], target)) { pSkipped++; console.log(`  already synced: ${p.packageCode}`); continue; }
    console.log(`  ${DRY_RUN ? "WOULD UPDATE" : "updated"}: ${p.packageCode} (${target.length} room prices)`);
    if (!DRY_RUN) await req("PUT", `${BASE}/api/packages/${r.id}`, { token, body: { roomPrices: target } });
    pApplied++;
  }
  console.log(`packages: applied=${pApplied} skipped=${pSkipped} missing=${pMissing} badRoomTypes=${pBadRoom}`);

  console.log(DRY_RUN ? "\nDry-run finished. Nothing was written." : "\nSync finished.");
}

main().catch((e) => { console.error("\nSYNC FAILED:", e.message); process.exit(1); });