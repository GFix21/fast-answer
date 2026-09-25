#!/usr/bin/env node
import assert from "node:assert/strict";
import { bumpMetric, deployWelcome, readFanMail, readSong, resetFanMailForTests, saveLetter } from "../lib/fan-mail.js";

resetFanMailForTests();
const letter = await saveLetter({
  subject: "Hello",
  body: "Welcome to the list.",
  attachmentUrl: "https://example.com/song.mp3",
  attachmentName: "theme.mp3",
});
assert.equal(letter.subject, "Hello");
assert.equal(letter.from, "gmgbrandlabel@gmail.com");
assert.equal(letter.attachment.kind, "link");
assert.equal(letter.attachment.href, "https://example.com/song.mp3");

const sent = await deployWelcome({ email: "fan@example.com", name: "Fan" });
assert.equal(sent.subject, "Hello");
assert.equal(sent.mailed, false);
const mail = await readFanMail();
assert.equal(mail.metrics.mailingJoins, 1);
assert.equal(mail.sends[0].email, "fan@example.com");

await bumpMetric("musicOn");
await bumpMetric("openChat");
await bumpMetric("gameRoom");
await bumpMetric("games");
await bumpMetric("mailingJoins");
const after = await readFanMail();
assert.equal(after.metrics.musicOn, 1);
assert.equal(after.metrics.openChat, 1);
assert.equal(after.metrics.gameRoom, 1);
assert.equal(after.metrics.games, 1);
assert.equal(after.metrics.mailingJoins, 1);

const song = await readSong();
assert.equal(song.redirect, "https://example.com/song.mp3");

let tooBig = false;
try {
  await saveLetter({ subject: "Hello", body: "Welcome to the list.", songBase64: "a".repeat(200_000), songType: "audio/mpeg" });
} catch (err) {
  tooBig = err.code === "song";
}
assert.equal(tooBig, true);

console.log("fan mail ok");
