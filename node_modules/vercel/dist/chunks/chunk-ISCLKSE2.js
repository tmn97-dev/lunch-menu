import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  VERCEL_DIR,
  require_json_parse_better_errors,
  require_lib
} from "./chunk-BNSR2EP5.js";
import {
  CantParseJSONFile,
  ConflictingConfigFiles,
  InvalidLocalConfig,
  getArgs
} from "./chunk-3J2XL77M.js";
import {
  require_dist
} from "./chunk-7K6FEHYP.js";
import {
  __toESM
} from "./chunk-A2M6YJ6J.js";

// src/util/read-json-file.ts
var import_fs_extra = __toESM(require_lib(), 1);
var import_json_parse_better_errors = __toESM(require_json_parse_better_errors(), 1);
var import_error_utils = __toESM(require_dist(), 1);
async function readJSONFile(file) {
  const content = await readFileSafe(file);
  if (content === null) {
    return content;
  }
  try {
    const json = (0, import_json_parse_better_errors.default)(content);
    return json;
  } catch (error) {
    return new CantParseJSONFile(file, (0, import_error_utils.errorToString)(error));
  }
}
async function readFileSafe(file) {
  try {
    return await import_fs_extra.default.readFile(file, "utf8");
  } catch (_) {
    return null;
  }
}

// src/util/config/local-path.ts
import path from "path";
import { existsSync } from "fs";
function getLocalPathConfig(prefix) {
  const argv = getArgs(process.argv.slice(2), {}, { permissive: true });
  const customPath = argv["--local-config"];
  if (customPath) {
    if (typeof customPath !== "string") {
      throw new InvalidLocalConfig(customPath);
    }
    return path.resolve(prefix, customPath);
  }
  const vercelConfigPath = path.join(prefix, "vercel.json");
  const nowConfigPath = path.join(prefix, "now.json");
  const vercelConfigExists = existsSync(vercelConfigPath);
  const nowConfigExists = existsSync(nowConfigPath);
  if (nowConfigExists && vercelConfigExists) {
    throw new ConflictingConfigFiles([vercelConfigPath, nowConfigPath]);
  }
  const compiledConfigPath = path.join(prefix, VERCEL_DIR, "vercel.json");
  const compiledConfigExists = existsSync(compiledConfigPath);
  if (compiledConfigExists) {
    return compiledConfigPath;
  }
  if (nowConfigExists) {
    return nowConfigPath;
  }
  return vercelConfigPath;
}

export {
  getLocalPathConfig,
  readJSONFile
};
