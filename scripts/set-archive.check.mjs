#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { zipFiles } from "../lib/zip-store.js";
import { listFlowSets, setFinished } from "../lib/set-archive.js";

const zip = zipFiles([{ name: "hello.txt", data: Buffer.from("fast-answer") }]);
assert.equal(zip.readUInt32LE(0), 0x04034b50);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fa-zip-"));
const file = path.join(dir, "sample.zip");
fs.writeFileSync(file, zip);
const listing = execFileSync("python3", ["-c", `import zipfile; print(zipfile.ZipFile(${JSON.stringify(file)}).read("hello.txt").decode())`], { encoding: "utf8" });
assert.equal(listing.trim(), "fast-answer");

const sets = listFlowSets("2026-09-24T00:00:00.000Z");
const first = sets.find((s) => s.id === "SET00001");
assert.ok(first, "SET00001 is listed");
assert.equal(first.archived, false);
assert.equal(setFinished({ status: "banked", playUntil: "2026-09-27T00:00:00.000Z" }, "2026-09-27T00:00:00.000Z"), true);
assert.equal(setFinished({ status: "quality", playUntil: "2026-09-27T00:00:00.000Z" }, "2026-10-01T00:00:00.000Z"), false);
console.log("set archive ok", sets.map((s) => `${s.id}:${s.status}`).join(" "));
