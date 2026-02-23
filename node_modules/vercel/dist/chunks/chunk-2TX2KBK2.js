import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  output_manager_default
} from "./chunk-7K6FEHYP.js";
import {
  __toESM,
  require_source
} from "./chunk-A2M6YJ6J.js";

// src/util/suggest-next-commands.ts
var import_chalk = __toESM(require_source(), 1);
function suggestNextCommands(commands) {
  output_manager_default.print(
    import_chalk.default.dim(
      [
        `Common next commands:`,
        ...commands.map((command) => `- ${command}`)
      ].join("\n")
    )
  );
  output_manager_default.print("\n");
}

export {
  suggestNextCommands
};
