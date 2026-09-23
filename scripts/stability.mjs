#!/usr/bin/env node
/**
 * Live check for Fast Answer and Q&A once the production domain is set.
 * APP_ORIGIN is the Fast Answer domain. QA_ORIGIN defaults to the same domain,
 * because Q&A ships inside this app. Until APP_ORIGIN is set, this waits.
 */
const app = String(process.env.APP_ORIGIN || "").trim().replace(/\/$/, "");
const qa = String(process.env.QA_ORIGIN || app).trim().replace(/\/$/, "");

if (!app) {
  console.log("stability waiting: set APP_ORIGIN to the production domain when the app is delivered");
  process.exit(0);
}

const probes = [
  { app: "fast-answer", url: `${app}/`, text: "Fast Answer" },
  { app: "fast-answer", url: `${app}/dojo.html`, text: "Dojo" },
  { app: "fast-answer", url: `${app}/api/country`, json: "object", handler: "country" },
  { app: "q-and-a", url: `${qa}/q-and-a/topics.json`, json: "array" },
  { app: "q-and-a", url: `${qa}/questions.json`, json: "array" },
];

/** The route is in this branch. Production 404s until that deploy is live. */
async function countryHandlerOk() {
  const { default: handler } = await import("../api/country.js");
  const res = {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    end(payload) { this.body = payload == null ? "" : String(payload); },
  };
  handler({ headers: { "x-vercel-ip-country": "US" } }, res);
  if (res.statusCode !== 200) return `status ${res.statusCode}`;
  let data;
  try { data = JSON.parse(res.body); } catch { return "not json"; }
  if (!data || typeof data !== "object" || Array.isArray(data)) return "not an object";
  if (data.country !== "US" || data.source !== "ip") return "unexpected body";
  return "";
}

const failures = [];
for (const probe of probes) {
  try {
    const res = await fetch(probe.url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    const body = await res.text();
    if (!res.ok) {
      const undeployedOnPullRequest = probe.handler === "country"
        && res.status === 404
        && process.env.GITHUB_EVENT_NAME === "pull_request";
      if (undeployedOnPullRequest) {
        const problem = await countryHandlerOk();
        if (problem) failures.push(`${probe.app} ${probe.url}: handler ${problem}`);
        else console.log("ok", probe.app, `${probe.url} (handler; production has not deployed this route yet)`);
        continue;
      }
      failures.push(`${probe.app} ${probe.url}: ${res.status}`);
      continue;
    }
    if (probe.text && !body.includes(probe.text)) {
      failures.push(`${probe.app} ${probe.url}: missing ${probe.text}`);
      continue;
    }
    if (probe.json) {
      const data = JSON.parse(body);
      const kind = Array.isArray(data) ? "array" : "object";
      if (kind !== probe.json) failures.push(`${probe.app} ${probe.url}: expected ${probe.json}`);
      else if (probe.json === "array" && data.length < 1) failures.push(`${probe.app} ${probe.url}: empty`);
    }
    console.log("ok", probe.app, probe.url);
  } catch (err) {
    failures.push(`${probe.app} ${probe.url}: ${err.name || "error"}`);
  }
}

if (failures.length) {
  for (const line of failures) console.error("stability fail:", line);
  process.exit(1);
}
console.log("stability ok", { app, qa });
