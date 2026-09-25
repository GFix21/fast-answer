/**
 * The mailing list lives on GMG Brand. Fast Answer only forwards opt-ins.
 * GMG_LIST_ORIGIN=off keeps the old local sender (tests). On Vercel the
 * default is the live GMG site.
 */

const LIVE = "https://gmgbrand.vercel.app";

export function gmgListOrigin() {
  const raw = process.env.GMG_LIST_ORIGIN;
  if (raw === "off") return "";
  if (raw) return String(raw).replace(/\/$/, "");
  if (process.env.VERCEL === "1") return LIVE;
  return "";
}

export async function forwardToGmgList({ email, name, locale }) {
  const origin = gmgListOrigin();
  if (!origin) return { ok: false, skipped: true };
  const headers = { "content-type": "application/json" };
  const secret = String(process.env.LIST_SYNC_SECRET || "");
  if (secret) headers["x-list-sync"] = secret;
  const res = await fetch(`${origin}/api/house`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      kind: "list",
      email,
      name: name || "",
      locale: locale || "",
      source: "fast-answer",
      company: "",
    }),
  });
  const data = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    skipped: false,
    emailed: Boolean(data.emailed),
    duplicate: Boolean(data.duplicate),
    status: res.status,
  };
}

export async function pushListToGmg(rows) {
  const origin = gmgListOrigin();
  const secret = String(process.env.LIST_SYNC_SECRET || "");
  if (!origin) return { ok: false, reason: "off" };
  if (secret.length < 16) return { ok: false, reason: "secret" };
  const res = await fetch(`${origin}/api/list/import`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-list-sync": secret,
    },
    body: JSON.stringify({
      subscribers: (rows || []).map((row) => ({
        email: row.email,
        name: row.displayName || row.name || "",
        at: row.activatedAt || row.at || "",
        source: "fast-answer",
      })),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, reason: data.error || "import", status: res.status };
  return { ok: true, ...data };
}
