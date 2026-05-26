import { createClient } from "@libsql/client/web";

let client;

export function db() {
  if (!client) {
    const url = process.env.TURSO_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) {
      throw new Error("TURSO_URL and TURSO_AUTH_TOKEN must be set");
    }
    client = createClient({ url, authToken });
  }
  return client;
}
