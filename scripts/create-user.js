/**
 * One-time admin user creator.
 * Run: `npm run seed:user`  (uses node --env-file=.env.local)
 *
 * Prompts for username + password, bcrypts the password, inserts into Turso `users`.
 * No registration endpoint exists on the deployed app — this is the only way to add users.
 */

import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";
import { stdin, stdout, exit } from "node:process";

function ask(question, { silent = false } = {}) {
  return new Promise((resolve, reject) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });
    if (silent) {
      const origWrite = stdout.write.bind(stdout);
      stdout.write = (chunk, ...rest) => {
        if (typeof chunk === "string" && chunk !== question) {
          return origWrite("", ...rest);
        }
        return origWrite(chunk, ...rest);
      };
      rl.question(question, (answer) => {
        stdout.write = origWrite;
        stdout.write("\n");
        rl.close();
        resolve(answer);
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
    rl.on("error", reject);
  });
}

async function main() {
  if (!process.env.TURSO_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error("TURSO_URL and TURSO_AUTH_TOKEN must be set. Run via `npm run seed:user`.");
    exit(1);
  }

  const username = (await ask("Username: ")).trim();
  if (!username) {
    console.error("Username required.");
    exit(1);
  }
  const password = await ask("Password: ", { silent: true });
  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters.");
    exit(1);
  }
  const confirm = await ask("Confirm password: ", { silent: true });
  if (password !== confirm) {
    console.error("Passwords do not match.");
    exit(1);
  }

  const client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const hash = await bcrypt.hash(password, 12);

  try {
    await client.execute({
      sql: "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      args: [username, hash],
    });
    console.log(`Created user "${username}".`);
  } catch (e) {
    if (String(e.message || "").includes("UNIQUE")) {
      console.error(`User "${username}" already exists.`);
    } else {
      console.error("Insert failed:", e.message);
    }
    exit(1);
  }
  exit(0);
}

main().catch((e) => {
  console.error(e);
  exit(1);
});
