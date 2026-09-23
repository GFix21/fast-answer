import { countryFromIpHeaders } from "../lib/age-gate.js";

/** Country of this connection, from the host's IP country header. */
export default function handler(req, res) {
  const country = countryFromIpHeaders(req.headers);
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify({ country, source: country ? "ip" : "" }));
}
