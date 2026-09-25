import { readSong } from "../lib/fan-mail.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("method");
    return;
  }
  const song = await readSong();
  if (!song) {
    res.statusCode = 404;
    res.setHeader("cache-control", "no-store");
    res.end("none");
    return;
  }
  if (song.redirect) {
    res.statusCode = 302;
    res.setHeader("location", song.redirect);
    res.setHeader("cache-control", "no-store");
    res.end();
    return;
  }
  res.statusCode = 200;
  res.setHeader("content-type", song.type || "application/octet-stream");
  res.setHeader("content-disposition", `inline; filename="${String(song.name || "song").replace(/"/g, "")}"`);
  res.setHeader("cache-control", "no-store");
  res.end(song.body);
}
