/**
 * Send the welcome letter from the house Gmail inbox.
 * The password stays in GMAIL_APP_PASSWORD. It is never written into the repo.
 */
import tls from "node:tls";
import { LOUIS_MAIL } from "../q-and-a/louis-liberty.js";

function mailPassword() {
  return String(process.env.GMAIL_APP_PASSWORD || process.env.GMG_MAIL_PASSWORD || "");
}

function dotStuff(text) {
  return String(text || "").replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

class Smtp {
  constructor(socket) {
    this.socket = socket;
    this.buf = "";
    this.wait = null;
    socket.on("data", (chunk) => {
      this.buf += chunk.toString("utf8");
      this.drain();
    });
    socket.on("error", (err) => {
      if (this.wait) this.wait.reject(err);
    });
  }

  drain() {
    if (!this.wait) return;
    const lines = this.buf.split("\r\n");
    if (!this.buf.endsWith("\r\n")) return;
    const complete = lines.filter(Boolean);
    const last = complete[complete.length - 1] || "";
    if (last[3] === "-") return;
    this.buf = "";
    const code = Number(last.slice(0, 3));
    const done = this.wait;
    this.wait = null;
    done.resolve({ code, line: last });
  }

  read() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout")), 15000);
      this.wait = {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (err) => { clearTimeout(timer); reject(err); },
      };
      this.drain();
    });
  }

  async cmd(line) {
    this.socket.write(`${line}\r\n`);
    return this.read();
  }

  end() {
    this.socket.end();
  }
}

export async function sendHouseMail({ to, name, subject, body, attachment }) {
  const pass = mailPassword();
  const recipient = String(to || "").trim();
  if (!pass) return { sent: false, reason: "unconfigured" };
  if (!recipient) return { sent: false, reason: "to" };
  const song = attachment?.href ? `\n\nSong: ${attachment.href}` : "";
  const text = `${name ? `Hello ${name},\n\n` : ""}${body || ""}${song}\n`;
  const payload = [
    `From: GMG Brand Label <${LOUIS_MAIL}>`,
    `To: ${recipient}`,
    `Subject: ${subject || "Welcome"}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    dotStuff(text),
    ".",
  ].join("\r\n");

  const socket = tls.connect({ host: "smtp.gmail.com", port: 465, servername: "smtp.gmail.com" });
  const smtp = new Smtp(socket);
  try {
    await new Promise((resolve, reject) => {
      socket.once("secureConnect", resolve);
      socket.once("error", reject);
    });
    const greet = await smtp.read();
    if (greet.code !== 220) return { sent: false, reason: "greeting" };
    const ehlo = await smtp.cmd("EHLO fast-answer");
    if (ehlo.code !== 250) return { sent: false, reason: "ehlo" };
    const auth = await smtp.cmd("AUTH LOGIN");
    if (auth.code !== 334) return { sent: false, reason: "auth" };
    const user = await smtp.cmd(Buffer.from(LOUIS_MAIL).toString("base64"));
    if (user.code !== 334) return { sent: false, reason: "auth" };
    const logged = await smtp.cmd(Buffer.from(pass).toString("base64"));
    if (logged.code !== 235) return { sent: false, reason: "password", code: logged.code };
    const from = await smtp.cmd(`MAIL FROM:<${LOUIS_MAIL}>`);
    if (from.code !== 250) return { sent: false, reason: "from" };
    const rcpt = await smtp.cmd(`RCPT TO:<${recipient}>`);
    if (rcpt.code !== 250 && rcpt.code !== 251) return { sent: false, reason: "recipient" };
    const data = await smtp.cmd("DATA");
    if (data.code !== 354) return { sent: false, reason: "data" };
    const accepted = await smtp.cmd(payload);
    if (accepted.code !== 250) return { sent: false, reason: "send" };
    await smtp.cmd("QUIT");
    return { sent: true };
  } catch {
    return { sent: false, reason: "network" };
  } finally {
    smtp.end();
  }
}
