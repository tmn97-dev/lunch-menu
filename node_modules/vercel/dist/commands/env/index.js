import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  getCustomEnvironments,
  getInvalidSubcommand,
  readStandardInput,
  require_dist as require_dist3
} from "../../chunks/chunk-LCYROVUM.js";
import {
  formatTable
} from "../../chunks/chunk-CNJPNT3A.js";
import {
  suggestNextCommands
} from "../../chunks/chunk-2TX2KBK2.js";
import {
  formatEnvironment,
  validateLsArgs
} from "../../chunks/chunk-3U5VDZM5.js";
import {
  validateJsonOutput
} from "../../chunks/chunk-XPKWKPWA.js";
import {
  getSubcommand
} from "../../chunks/chunk-YPQSDAEW.js";
import {
  getCommandAliases
} from "../../chunks/chunk-LFXZ5E5S.js";
import "../../chunks/chunk-M3N5RQLZ.js";
import "../../chunks/chunk-NJKAUXT4.js";
import "../../chunks/chunk-DYV4NBAT.js";
import {
  require_execa
} from "../../chunks/chunk-UPNWDVQF.js";
import "../../chunks/chunk-H5G734TV.js";
import "../../chunks/chunk-DI7L4B4K.js";
import {
  help
} from "../../chunks/chunk-6LTRH3B2.js";
import "../../chunks/chunk-5QN5JFM3.js";
import {
  STANDARD_ENVIRONMENTS,
  TelemetryClient,
  addSubcommand,
  envCommand,
  envTargetChoices,
  formatProject,
  getEnvRecords,
  getEnvTargetPlaceholder,
  getLinkedProject,
  listSubcommand,
  param,
  parseTarget,
  pull,
  pullEnvRecords,
  pullSubcommand,
  removeSubcommand,
  require_dist as require_dist2,
  require_frameworks,
  require_ms,
  runSubcommand,
  stamp_default,
  updateSubcommand
} from "../../chunks/chunk-BNSR2EP5.js";
import {
  getCommandName,
  getFlagsSpecification,
  isAPIError,
  parseArguments,
  printError,
  require_lib
} from "../../chunks/chunk-3J2XL77M.js";
import {
  emoji,
  output_manager_default,
  prependEmoji,
  require_dist
} from "../../chunks/chunk-7K6FEHYP.js";
import {
  __toESM,
  require_source
} from "../../chunks/chunk-A2M6YJ6J.js";

// src/commands/env/add.ts
var import_chalk = __toESM(require_source(), 1);

// src/util/env/add-env-record.ts
var import_constants = __toESM(require_dist2(), 1);
async function addEnvRecord(client, projectId, upsert, type, key, value, targets, gitBranch) {
  const actionWord = upsert ? "Overriding" : "Adding";
  output_manager_default.debug(
    `${actionWord} ${type} Environment Variable ${key} to ${targets.length} targets`
  );
  const target = [];
  const customEnvironmentIds = [];
  for (const t of targets) {
    const arr = import_constants.PROJECT_ENV_TARGET.includes(t) ? target : customEnvironmentIds;
    arr.push(t);
  }
  const body = {
    type,
    key,
    value,
    target,
    customEnvironmentIds: customEnvironmentIds.length > 0 ? customEnvironmentIds : void 0,
    gitBranch: gitBranch || void 0
  };
  const args = upsert ? `?upsert=${upsert}` : "";
  const url = `/v10/projects/${projectId}/env${args}`;
  await client.fetch(url, {
    method: "POST",
    body
  });
}

// src/util/env/known-error.ts
var import_error_utils = __toESM(require_dist(), 1);
var knownErrorsCodes = /* @__PURE__ */ new Set([
  "BAD_REQUEST",
  "ENV_ALREADY_EXISTS",
  "ENV_CONFLICT",
  "EXISTING_KEY_AND_TARGET",
  "FORBIDDEN",
  "ID_NOT_FOUND",
  "INVALID_KEY",
  "INVALID_VALUE",
  "KEY_INVALID_CHARACTERS",
  "KEY_INVALID_LENGTH",
  "KEY_RESERVED",
  "RESERVED_ENV_VARIABLE",
  "MAX_ENVS_EXCEEDED",
  "MISSING_ID",
  "MISSING_KEY",
  "MISSING_TARGET",
  "MISSING_VALUE",
  "NOT_AUTHORIZED",
  "NOT_DECRYPTABLE",
  "SYSTEM_ENV_WITH_VALUE",
  "TEAM_NOT_FOUND",
  "TOO_MANY_IDS",
  "TOO_MANY_KEYS",
  "UNKNOWN_ERROR",
  "VALUE_INVALID_LENGTH",
  "VALUE_INVALID_TYPE"
]);
function isKnownError(error) {
  const code = (0, import_error_utils.isErrnoException)(error) ? error.code : null;
  if (!code)
    return false;
  return knownErrorsCodes.has(code.toUpperCase());
}

// src/util/env/validate-env.ts
var import_frameworks = __toESM(require_frameworks(), 1);
function getEnvValueWarnings(value) {
  const warnings = [];
  const normalized = value.replace(/\n$/, "");
  if (/^[ \t]+/.test(normalized)) {
    warnings.push({
      message: "starts with whitespace",
      requiresConfirmation: false
    });
  }
  if (/[ \t]+$/.test(normalized)) {
    warnings.push({
      message: "ends with whitespace",
      requiresConfirmation: false
    });
  }
  if (normalized.includes("\r") || normalized.includes("\n")) {
    warnings.push({
      message: "contains newlines",
      requiresConfirmation: false
    });
  }
  if (value.includes("\0")) {
    warnings.push({
      message: "contains null characters",
      requiresConfirmation: false
    });
  }
  if (value === "") {
    warnings.push({
      message: "is empty",
      requiresConfirmation: true
    });
  }
  if (value.length > 2 && (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'"))) {
    warnings.push({
      message: "includes surrounding quotes (these will be stored literally)",
      requiresConfirmation: false
    });
  }
  return warnings;
}
function formatWarnings(warnings) {
  if (warnings.length === 0)
    return null;
  const messages = warnings.map((w) => w.message);
  const startsIdx = messages.indexOf("starts with whitespace");
  const endsIdx = messages.indexOf("ends with whitespace");
  if (startsIdx !== -1 && endsIdx !== -1) {
    messages.splice(Math.max(startsIdx, endsIdx), 1);
    messages[Math.min(startsIdx, endsIdx)] = "starts and ends with whitespace";
  }
  if (messages.length === 1) {
    return `Value ${messages[0]}`;
  }
  if (messages.length === 2) {
    return `Value ${messages[0]} and ${messages[1]}`;
  }
  const last = messages.pop();
  return `Value ${messages.join(", ")}, and ${last}`;
}
var PUBLIC_PREFIXES = [
  ...new Set(
    import_frameworks.frameworkList.map((f) => f.envPrefix).filter((p) => !!p)
  )
];
var SENSITIVE_PATTERN = /(?:^|_)(password|secret|private|token|key|auth|jwt|signature)(?:_|$)/i;
function hasOnlyWhitespaceWarnings(warnings) {
  return warnings.length > 0 && warnings.every(
    (w) => w.message === "starts with whitespace" || w.message === "ends with whitespace"
  );
}
function trimValue(value) {
  return value.replace(/\n$/, "").trim();
}
function getPublicPrefix(key) {
  const upperKey = key.toUpperCase();
  return PUBLIC_PREFIXES.find((p) => upperKey.startsWith(p)) || null;
}
function removePublicPrefix(key) {
  const prefix = getPublicPrefix(key);
  if (!prefix)
    return key;
  return key.slice(prefix.length);
}
async function validateEnvValue(opts) {
  let finalValue = opts.initialValue;
  let alreadyConfirmed = false;
  if (!opts.skipConfirm) {
    let valueAccepted = false;
    while (!valueAccepted) {
      const valueWarnings = getEnvValueWarnings(finalValue);
      const warningMessage = formatWarnings(valueWarnings);
      if (!warningMessage) {
        valueAccepted = true;
        break;
      }
      opts.showWarning(warningMessage);
      const canTrim = hasOnlyWhitespaceWarnings(valueWarnings);
      const choices = canTrim ? [
        { name: "Leave as is", value: "c" },
        { name: "Re-enter", value: "r" },
        { name: "Trim whitespace", value: "t" }
      ] : [
        { name: "Leave as is", value: "c" },
        { name: "Re-enter", value: "r" }
      ];
      const action = await opts.selectAction(choices);
      if (action === "c") {
        valueAccepted = true;
        if (valueWarnings.some((w) => w.requiresConfirmation)) {
          alreadyConfirmed = true;
        }
      } else if (action === "t") {
        finalValue = trimValue(finalValue);
        opts.showLog("Trimmed whitespace");
      } else {
        finalValue = await opts.promptForValue();
      }
    }
  } else {
    const valueWarnings = getEnvValueWarnings(finalValue);
    const warningMessage = formatWarnings(valueWarnings);
    if (warningMessage) {
      opts.showWarning(warningMessage);
    }
  }
  return { finalValue, alreadyConfirmed };
}
function getEnvKeyWarnings(key) {
  const warnings = [];
  const matchingPrefix = getPublicPrefix(key);
  if (matchingPrefix) {
    const sensitiveMatch = SENSITIVE_PATTERN.exec(key);
    const nameWithoutPrefix = key.slice(matchingPrefix.length);
    if (sensitiveMatch) {
      warnings.push({
        message: `The ${matchingPrefix} prefix will make ${nameWithoutPrefix} visible to anyone visiting your site`,
        requiresConfirmation: true
      });
    } else {
      warnings.push({
        message: `${matchingPrefix} variables can be seen by anyone visiting your site`,
        requiresConfirmation: false
      });
    }
  }
  return warnings;
}

// src/util/telemetry/commands/env/add.ts
var EnvAddTelemetryClient = class extends TelemetryClient {
  trackCliArgumentName(name) {
    if (name) {
      this.trackCliArgument({
        arg: "name",
        value: this.redactedValue
      });
    }
  }
  trackCliArgumentEnvironment(environment) {
    if (environment) {
      this.trackCliArgument({
        arg: "environment",
        value: STANDARD_ENVIRONMENTS.includes(
          environment
        ) ? environment : this.redactedValue
      });
    }
  }
  trackCliArgumentGitBranch(gitBranch) {
    if (gitBranch) {
      this.trackCliArgument({
        arg: "git-branch",
        value: this.redactedValue
      });
    }
  }
  trackCliFlagSensitive(sensitive) {
    if (sensitive) {
      this.trackCliFlag("sensitive");
    }
  }
  trackCliFlagForce(force) {
    if (force) {
      this.trackCliFlag("force");
    }
  }
  trackCliFlagGuidance(guidance) {
    if (guidance) {
      this.trackCliFlag("guidance");
    }
  }
  trackCliFlagYes(yes) {
    if (yes) {
      this.trackCliFlag("yes");
    }
  }
};

// src/commands/env/add.ts
import { determineAgent } from "@vercel/detect-agent";
async function add(client, argv) {
  let parsedArgs;
  const flagsSpecification = getFlagsSpecification(addSubcommand.options);
  try {
    parsedArgs = parseArguments(argv, flagsSpecification);
  } catch (err) {
    printError(err);
    return 1;
  }
  const { args, flags: opts } = parsedArgs;
  const stdInput = await readStandardInput(client.stdin);
  let [envName, envTargetArg, envGitBranch] = args;
  const telemetryClient = new EnvAddTelemetryClient({
    opts: {
      store: client.telemetryEventStore
    }
  });
  telemetryClient.trackCliArgumentName(envName);
  telemetryClient.trackCliArgumentEnvironment(envTargetArg);
  telemetryClient.trackCliArgumentGitBranch(envGitBranch);
  telemetryClient.trackCliFlagSensitive(opts["--sensitive"]);
  telemetryClient.trackCliFlagForce(opts["--force"]);
  telemetryClient.trackCliFlagGuidance(opts["--guidance"]);
  telemetryClient.trackCliFlagYes(opts["--yes"]);
  if (args.length > 3) {
    output_manager_default.error(
      `Invalid number of arguments. Usage: ${getCommandName(
        `env add <name> ${getEnvTargetPlaceholder()} <gitbranch>`
      )}`
    );
    return 1;
  }
  if (stdInput && (!envName || !envTargetArg)) {
    output_manager_default.error(
      `Invalid number of arguments. Usage: ${getCommandName(
        `env add <name> <target> <gitbranch> < <file>`
      )}`
    );
    return 1;
  }
  let envTargets = [];
  if (envTargetArg) {
    envTargets.push(envTargetArg);
  }
  if (!envName) {
    envName = await client.input.text({
      message: `What's the name of the variable?`,
      validate: (val) => val ? true : "Name cannot be empty"
    });
  }
  const skipConfirm = opts["--yes"] || !!stdInput;
  if (!skipConfirm) {
    let keyAccepted = false;
    while (!keyAccepted) {
      const keyWarnings = getEnvKeyWarnings(envName);
      const sensitiveWarning = keyWarnings.find((w) => w.requiresConfirmation);
      if (!sensitiveWarning) {
        for (const w of keyWarnings) {
          output_manager_default.warn(w.message);
        }
        keyAccepted = true;
        break;
      }
      for (const w of keyWarnings) {
        output_manager_default.warn(w.message);
      }
      const nameWithoutPrefix = removePublicPrefix(envName);
      const choices2 = [
        { name: "Leave as is", value: "c" },
        { name: `Rename to ${nameWithoutPrefix}`, value: "p" },
        { name: "Re-enter", value: "r" }
      ];
      const action = await client.input.select({
        message: "How to proceed?",
        choices: choices2
      });
      if (action === "c") {
        keyAccepted = true;
      } else if (action === "p") {
        envName = nameWithoutPrefix;
        output_manager_default.log(`Renamed to ${envName}`);
      } else {
        envName = await client.input.text({
          message: `What's the name of the variable?`,
          validate: (val) => val ? true : "Name cannot be empty"
        });
      }
    }
  } else {
    const keyWarnings = getEnvKeyWarnings(envName);
    for (const w of keyWarnings) {
      output_manager_default.warn(w.message);
    }
  }
  const link = await getLinkedProject(client);
  if (link.status === "error") {
    return link.exitCode;
  } else if (link.status === "not_linked") {
    output_manager_default.error(
      `Your codebase isn\u2019t linked to a project on Vercel. Run ${getCommandName(
        "link"
      )} to begin.`
    );
    return 1;
  }
  client.config.currentTeam = link.org.type === "team" ? link.org.id : void 0;
  const { project } = link;
  const [{ envs }, customEnvironments] = await Promise.all([
    getEnvRecords(client, project.id, "vercel-cli:env:add"),
    getCustomEnvironments(client, project.id)
  ]);
  const matchingEnvs = envs.filter((r) => r.key === envName);
  const existingTargets = /* @__PURE__ */ new Set();
  const existingCustomEnvs = /* @__PURE__ */ new Set();
  for (const env of matchingEnvs) {
    if (typeof env.target === "string") {
      existingTargets.add(env.target);
    } else if (Array.isArray(env.target)) {
      for (const target of env.target) {
        existingTargets.add(target);
      }
    }
    if (env.customEnvironmentIds) {
      for (const customEnvId of env.customEnvironmentIds) {
        existingCustomEnvs.add(customEnvId);
      }
    }
  }
  const choices = [
    ...envTargetChoices.filter((c) => !existingTargets.has(c.value)),
    ...customEnvironments.filter((c) => !existingCustomEnvs.has(c.id)).map((c) => ({
      name: c.slug,
      value: c.id
    }))
  ];
  if (!envGitBranch && choices.length === 0 && !opts["--force"]) {
    output_manager_default.error(
      `The variable ${param(
        envName
      )} has already been added to all Environments. To remove, run ${getCommandName(
        `env rm ${envName}`
      )}.`
    );
    return 1;
  }
  let type = opts["--sensitive"] ? "sensitive" : "encrypted";
  let envValue;
  if (stdInput) {
    envValue = stdInput;
  } else {
    if (type === "encrypted") {
      const isSensitive = await client.input.confirm(
        `Your value will be encrypted. Mark as sensitive?`,
        false
      );
      if (isSensitive) {
        type = "sensitive";
      }
    }
    envValue = await client.input.password({
      message: `What's the value of ${envName}?`,
      mask: true
    });
  }
  const { finalValue } = await validateEnvValue({
    envName,
    initialValue: envValue,
    skipConfirm,
    promptForValue: () => client.input.password({
      message: `What's the value of ${envName}?`,
      mask: true
    }),
    selectAction: (choices2) => client.input.select({ message: "How to proceed?", choices: choices2 }),
    showWarning: (msg) => output_manager_default.warn(msg),
    showLog: (msg) => output_manager_default.log(msg)
  });
  while (envTargets.length === 0) {
    envTargets = await client.input.checkbox({
      message: `Add ${envName} to which Environments (select multiple)?`,
      choices
    });
    if (envTargets.length === 0) {
      output_manager_default.error("Please select at least one Environment");
    }
  }
  if (!stdInput && !envGitBranch && envTargets.length === 1 && envTargets[0] === "preview") {
    envGitBranch = await client.input.text({
      message: `Add ${envName} to which Git branch? (leave empty for all Preview branches)?`
    });
  }
  const upsert = opts["--force"] ? "true" : "";
  const addStamp = stamp_default();
  try {
    output_manager_default.spinner("Saving");
    await addEnvRecord(
      client,
      project.id,
      upsert,
      type,
      envName,
      finalValue,
      envTargets,
      envGitBranch
    );
  } catch (err) {
    if (isAPIError(err) && isKnownError(err)) {
      output_manager_default.error(err.serverMessage);
      return 1;
    }
    throw err;
  }
  output_manager_default.print(
    `${prependEmoji(
      `${opts["--force"] ? "Overrode" : "Added"} Environment Variable ${import_chalk.default.bold(envName)} to Project ${import_chalk.default.bold(
        project.name
      )} ${import_chalk.default.gray(addStamp())}`,
      emoji("success")
    )}
`
  );
  const { isAgent } = await determineAgent();
  const guidanceMode = parsedArgs.flags["--guidance"] ?? isAgent;
  if (guidanceMode) {
    suggestNextCommands([getCommandName(`env ls`), getCommandName(`env pull`)]);
  }
  return 0;
}

// src/commands/env/ls.ts
var import_chalk2 = __toESM(require_source(), 1);
var import_ms = __toESM(require_ms(), 1);

// src/util/output/ellipsis.ts
function ellipsis(str, length) {
  return str.length > length ? `${str.slice(0, length - 1)}\u2026` : str;
}

// src/util/env/format-environments.ts
var import_title = __toESM(require_lib(), 1);
function formatEnvironments(link, env, customEnvironments) {
  const defaultTargets = (Array.isArray(env.target) ? env.target : [env.target || ""]).map((t) => {
    return formatEnvironment(link.org.slug, link.project.name, {
      id: t,
      slug: (0, import_title.default)(t)
    });
  });
  const customTargets = env.customEnvironmentIds ? env.customEnvironmentIds.map((id) => customEnvironments.find((e) => e.id === id)).filter(Boolean).map((e) => formatEnvironment(link.org.slug, link.project.name, e)) : [];
  const targetsString = [...defaultTargets, ...customTargets].join(", ");
  return env.gitBranch ? `${targetsString} (${env.gitBranch})` : targetsString;
}

// src/util/telemetry/commands/env/ls.ts
var EnvLsTelemetryClient = class extends TelemetryClient {
  trackCliArgumentEnvironment(environment) {
    if (environment) {
      this.trackCliArgument({
        arg: "environment",
        value: STANDARD_ENVIRONMENTS.includes(
          environment
        ) ? environment : this.redactedValue
      });
    }
  }
  trackCliArgumentGitBranch(gitBranch) {
    if (gitBranch) {
      this.trackCliArgument({
        arg: "git-branch",
        value: this.redactedValue
      });
    }
  }
  trackCliFlagGuidance(guidance) {
    if (guidance) {
      this.trackCliFlag("guidance");
    }
  }
};

// src/commands/env/ls.ts
import { determineAgent as determineAgent2 } from "@vercel/detect-agent";
async function ls(client, argv) {
  const telemetryClient = new EnvLsTelemetryClient({
    opts: {
      store: client.telemetryEventStore
    }
  });
  let parsedArgs;
  const flagsSpecification = getFlagsSpecification(listSubcommand.options);
  try {
    parsedArgs = parseArguments(argv, flagsSpecification);
  } catch (err) {
    printError(err);
    return 1;
  }
  const { args, flags } = parsedArgs;
  const validationResult = validateLsArgs({
    commandName: "env ls",
    args,
    maxArgs: 2,
    exitCode: 1,
    usageString: getCommandName(
      `env ls ${getEnvTargetPlaceholder()} <gitbranch>`
    )
  });
  if (validationResult !== 0) {
    return validationResult;
  }
  const [envTarget, envGitBranch] = args;
  const formatResult = validateJsonOutput(flags);
  if (!formatResult.valid) {
    output_manager_default.error(formatResult.error);
    return 1;
  }
  const asJson = formatResult.jsonOutput;
  telemetryClient.trackCliArgumentEnvironment(envTarget);
  telemetryClient.trackCliArgumentGitBranch(envGitBranch);
  telemetryClient.trackCliFlagGuidance(flags["--guidance"]);
  telemetryClient.trackCliOptionFormat(flags["--format"]);
  const link = await getLinkedProject(client);
  if (link.status === "error") {
    return link.exitCode;
  } else if (link.status === "not_linked") {
    output_manager_default.error(
      `Your codebase isn\u2019t linked to a project on Vercel. Run ${getCommandName(
        "link"
      )} to begin.`
    );
    return 1;
  }
  client.config.currentTeam = link.org.type === "team" ? link.org.id : void 0;
  const { project, org } = link;
  const lsStamp = stamp_default();
  const [envsResult, customEnvs] = await Promise.all([
    getEnvRecords(client, project.id, "vercel-cli:env:ls", {
      target: envTarget,
      gitBranch: envGitBranch
    }),
    getCustomEnvironments(client, project.id)
  ]);
  const { envs } = envsResult;
  const projectSlugLink = formatProject(org.slug, project.name);
  if (asJson) {
    output_manager_default.stopSpinner();
    const jsonOutput = {
      envs: envs.map((env) => ({
        key: env.key,
        value: env.type === "plain" ? env.value : void 0,
        type: env.type,
        target: env.target,
        gitBranch: env.gitBranch,
        configurationId: env.configurationId,
        createdAt: env.createdAt,
        updatedAt: env.updatedAt
      }))
    };
    client.stdout.write(`${JSON.stringify(jsonOutput, null, 2)}
`);
  } else if (envs.length === 0) {
    output_manager_default.log(
      `No Environment Variables found for ${projectSlugLink} ${import_chalk2.default.gray(lsStamp())}`
    );
  } else {
    output_manager_default.log(
      `Environment Variables found for ${projectSlugLink} ${import_chalk2.default.gray(lsStamp())}`
    );
    client.stdout.write(`${getTable(link, envs, customEnvs)}
`);
  }
  if (!asJson) {
    const { isAgent } = await determineAgent2();
    const guidanceMode = parsedArgs.flags["--guidance"] ?? isAgent;
    if (guidanceMode) {
      suggestNextCommands([
        getCommandName(`env add`),
        getCommandName("env rm"),
        getCommandName(`env pull`)
      ]);
    }
  }
  return 0;
}
function getTable(link, records, customEnvironments) {
  const label = records.some((env) => env.gitBranch) ? "environments (git branch)" : "environments";
  return formatTable(
    ["name", "value", label, "created"],
    ["l", "l", "l", "l", "l"],
    [
      {
        name: "",
        rows: records.map((row) => getRow(link, row, customEnvironments))
      }
    ]
  );
}
function getRow(link, env, customEnvironments) {
  let value;
  if (env.type === "plain") {
    const singleLineValue = env.value.replace(/\s/g, " ");
    value = import_chalk2.default.gray(ellipsis(singleLineValue, 19));
  } else if (env.type === "system") {
    value = import_chalk2.default.gray.italic(env.value);
  } else {
    value = import_chalk2.default.gray.italic("Encrypted");
  }
  const now = Date.now();
  return [
    import_chalk2.default.bold(env.key),
    value,
    formatEnvironments(link, env, customEnvironments),
    env.createdAt ? `${(0, import_ms.default)(now - env.createdAt)} ago` : ""
  ];
}

// src/commands/env/rm.ts
var import_chalk3 = __toESM(require_source(), 1);

// src/util/env/remove-env-record.ts
async function removeEnvRecord(client, projectId, env) {
  output_manager_default.debug(`Removing Environment Variable ${env.key}`);
  const url = `/v10/projects/${projectId}/env/${env.id}`;
  await client.fetch(url, {
    method: "DELETE"
  });
}

// src/util/telemetry/commands/env/rm.ts
var EnvRmTelemetryClient = class extends TelemetryClient {
  trackCliArgumentName(name) {
    if (name) {
      this.trackCliArgument({
        arg: "name",
        value: this.redactedValue
      });
    }
  }
  trackCliArgumentEnvironment(environment) {
    if (environment) {
      this.trackCliArgument({
        arg: "environment",
        value: STANDARD_ENVIRONMENTS.includes(
          environment
        ) ? environment : this.redactedValue
      });
    }
  }
  trackCliArgumentGitBranch(gitBranch) {
    if (gitBranch) {
      this.trackCliArgument({
        arg: "git-branch",
        value: this.redactedValue
      });
    }
  }
  trackCliFlagYes(yes) {
    if (yes) {
      this.trackCliFlag("yes");
    }
  }
};

// src/commands/env/rm.ts
async function rm(client, argv) {
  const telemetryClient = new EnvRmTelemetryClient({
    opts: {
      store: client.telemetryEventStore
    }
  });
  let parsedArgs;
  const flagsSpecification = getFlagsSpecification(removeSubcommand.options);
  try {
    parsedArgs = parseArguments(argv, flagsSpecification);
  } catch (err) {
    printError(err);
    return 1;
  }
  const { args, flags: opts } = parsedArgs;
  if (args.length > 3) {
    output_manager_default.error(
      `Invalid number of arguments. Usage: ${getCommandName(
        `env rm <name> ${getEnvTargetPlaceholder()} <gitbranch>`
      )}`
    );
    return 1;
  }
  let [envName, envTarget, envGitBranch] = args;
  telemetryClient.trackCliArgumentName(envName);
  telemetryClient.trackCliArgumentEnvironment(envTarget);
  telemetryClient.trackCliArgumentGitBranch(envGitBranch);
  telemetryClient.trackCliFlagYes(opts["--yes"]);
  const link = await getLinkedProject(client);
  if (link.status === "error") {
    return link.exitCode;
  } else if (link.status === "not_linked") {
    output_manager_default.error(
      `Your codebase isn\u2019t linked to a project on Vercel. Run ${getCommandName(
        "link"
      )} to begin.`
    );
    return 1;
  }
  client.config.currentTeam = link.org.type === "team" ? link.org.id : void 0;
  const { project } = link;
  if (!envName) {
    envName = await client.input.text({
      message: "What's the name of the variable?",
      validate: (val) => val ? true : "Name cannot be empty"
    });
  }
  const [result, customEnvironments] = await Promise.all([
    getEnvRecords(client, project.id, "vercel-cli:env:rm", {
      target: envTarget,
      gitBranch: envGitBranch
    }),
    getCustomEnvironments(client, project.id)
  ]);
  let envs = result.envs.filter((env2) => env2.key === envName);
  if (envs.length === 0) {
    output_manager_default.error(`Environment Variable was not found.
`);
    return 1;
  }
  while (envs.length > 1) {
    const id = await client.input.select({
      message: `Remove ${envName} from which Environments?`,
      choices: envs.map((env2) => ({
        value: env2.id,
        name: formatEnvironments(link, env2, customEnvironments)
      }))
    });
    if (!id) {
      output_manager_default.error("Please select at least one Environment Variable to remove");
    }
    envs = envs.filter((env2) => env2.id === id);
  }
  const env = envs[0];
  const skipConfirmation = opts["--yes"];
  if (!skipConfirmation && !await client.input.confirm(
    `Removing Environment Variable ${param(env.key)} from ${formatEnvironments(
      link,
      env,
      customEnvironments
    )} in Project ${import_chalk3.default.bold(project.name)}. Are you sure?`,
    false
  )) {
    output_manager_default.log("Canceled");
    return 0;
  }
  const rmStamp = stamp_default();
  try {
    output_manager_default.spinner("Removing");
    await removeEnvRecord(client, project.id, env);
  } catch (err) {
    if (isAPIError(err) && isKnownError(err)) {
      output_manager_default.error(err.serverMessage);
      return 1;
    }
    throw err;
  }
  output_manager_default.print(
    `${prependEmoji(
      `Removed Environment Variable ${import_chalk3.default.gray(rmStamp())}`,
      emoji("success")
    )}
`
  );
  return 0;
}

// src/commands/env/run.ts
var import_env = __toESM(require_dist3(), 1);
var import_execa = __toESM(require_execa(), 1);
function parseRunArgs(argv) {
  const argvIndex = argv.indexOf("--");
  const hasDoubleDash = argvIndex !== -1;
  const vercelArgs = hasDoubleDash ? argv.slice(2, argvIndex) : argv.slice(2);
  const userCommand = hasDoubleDash ? argv.slice(argvIndex + 1) : [];
  return { vercelArgs, userCommand };
}
function needsHelpForRun(client) {
  const { vercelArgs } = parseRunArgs(client.argv);
  const flagsSpecification = getFlagsSpecification(runSubcommand.options);
  try {
    const parsedArgs = parseArguments(vercelArgs, flagsSpecification);
    return Boolean(parsedArgs.flags["--help"]);
  } catch {
    return false;
  }
}
async function run(client) {
  const { vercelArgs, userCommand } = parseRunArgs(client.argv);
  let parsedArgs;
  const flagsSpecification = getFlagsSpecification(runSubcommand.options);
  try {
    parsedArgs = parseArguments(vercelArgs, flagsSpecification);
  } catch (error) {
    printError(error);
    return 1;
  }
  if (userCommand.length === 0) {
    output_manager_default.error(
      `No command provided. Use \`--\` to separate vercel flags from your command.`
    );
    return 1;
  }
  const link = await getLinkedProject(client);
  if (link.status === "error") {
    return link.exitCode;
  } else if (link.status === "not_linked") {
    output_manager_default.error(
      `Your codebase isn't linked to a project on Vercel. Run ${getCommandName(
        "link"
      )} to begin.`
    );
    return 1;
  }
  client.config.currentTeam = link.org.type === "team" ? link.org.id : void 0;
  const environment = parseTarget({
    flagName: "environment",
    flags: parsedArgs.flags
  }) || "development";
  const gitBranch = parsedArgs.flags["--git-branch"];
  output_manager_default.spinner(`Downloading \`${environment}\` Environment Variables`);
  const records = await pullEnvRecords(
    client,
    link.project.id,
    "vercel-cli:env:run",
    {
      target: environment,
      gitBranch
    }
  );
  output_manager_default.stopSpinner();
  output_manager_default.debug(
    `Running command with ${Object.keys(records.env).length} environment variables`
  );
  let localEnv = {};
  try {
    localEnv = (0, import_env.loadEnvConfig)(client.cwd, true).combinedEnv;
  } catch (err) {
    output_manager_default.debug(`Failed to load local env files: ${err}`);
  }
  try {
    const result = await (0, import_execa.default)(userCommand[0], userCommand.slice(1), {
      cwd: client.cwd,
      stdio: "inherit",
      reject: false,
      env: {
        ...records.env,
        ...localEnv,
        ...process.env
      }
    });
    if (result instanceof Error && typeof result.exitCode !== "number") {
      output_manager_default.prettyError(result);
      return 1;
    }
    return result.exitCode;
  } catch (err) {
    output_manager_default.prettyError(err);
    return 1;
  }
}

// src/commands/env/update.ts
var import_chalk4 = __toESM(require_source(), 1);

// src/util/env/update-env-record.ts
var import_constants2 = __toESM(require_dist2(), 1);
async function updateEnvRecord(client, projectId, envId, type, key, value, targets, gitBranch) {
  output_manager_default.debug(
    `Updating ${type} Environment Variable ${key} in ${targets.length} targets`
  );
  const target = [];
  const customEnvironmentIds = [];
  for (const t of targets) {
    const arr = import_constants2.PROJECT_ENV_TARGET.includes(t) ? target : customEnvironmentIds;
    arr.push(t);
  }
  const body = {
    type,
    key,
    value,
    target,
    customEnvironmentIds: customEnvironmentIds.length > 0 ? customEnvironmentIds : void 0,
    gitBranch: gitBranch || void 0
  };
  const url = `/v10/projects/${projectId}/env/${envId}`;
  await client.fetch(url, {
    method: "PATCH",
    body
  });
}

// src/util/telemetry/commands/env/update.ts
var EnvUpdateTelemetryClient = class extends TelemetryClient {
  trackCliArgumentName(name) {
    if (name) {
      this.trackCliArgument({
        arg: "name",
        value: this.redactedValue
      });
    }
  }
  trackCliArgumentEnvironment(environment) {
    if (environment) {
      this.trackCliArgument({
        arg: "environment",
        value: STANDARD_ENVIRONMENTS.includes(
          environment
        ) ? environment : this.redactedValue
      });
    }
  }
  trackCliArgumentGitBranch(gitBranch) {
    if (gitBranch) {
      this.trackCliArgument({
        arg: "git-branch",
        value: this.redactedValue
      });
    }
  }
  trackCliFlagSensitive(sensitive) {
    if (sensitive) {
      this.trackCliFlag("sensitive");
    }
  }
  trackCliFlagYes(yes) {
    if (yes) {
      this.trackCliFlag("yes");
    }
  }
};

// src/commands/env/update.ts
async function update(client, argv) {
  let parsedArgs;
  const flagsSpecification = getFlagsSpecification(updateSubcommand.options);
  try {
    parsedArgs = parseArguments(argv, flagsSpecification);
  } catch (err) {
    printError(err);
    return 1;
  }
  const { args, flags: opts } = parsedArgs;
  const stdInput = await readStandardInput(client.stdin);
  let [envName, envTargetArg, envGitBranch] = args;
  const telemetryClient = new EnvUpdateTelemetryClient({
    opts: {
      store: client.telemetryEventStore
    }
  });
  telemetryClient.trackCliArgumentName(envName);
  telemetryClient.trackCliArgumentEnvironment(envTargetArg);
  telemetryClient.trackCliArgumentGitBranch(envGitBranch);
  telemetryClient.trackCliFlagSensitive(opts["--sensitive"]);
  telemetryClient.trackCliFlagYes(opts["--yes"]);
  if (args.length > 3) {
    output_manager_default.error(
      `Invalid number of arguments. Usage: ${getCommandName(
        `env update <name> ${getEnvTargetPlaceholder()} <gitbranch>`
      )}`
    );
    return 1;
  }
  if (stdInput && (!envName || !envTargetArg)) {
    output_manager_default.error(
      `Invalid number of arguments. Usage: ${getCommandName(
        `env update <name> <target> <gitbranch> < <file>`
      )}`
    );
    return 1;
  }
  const envTargets = [];
  if (envTargetArg) {
    envTargets.push(envTargetArg);
  }
  if (!envName) {
    envName = await client.input.text({
      message: `What's the name of the variable to update?`,
      validate: (val) => val ? true : "Name cannot be empty"
    });
  }
  const link = await getLinkedProject(client);
  if (link.status === "error") {
    return link.exitCode;
  } else if (link.status === "not_linked") {
    output_manager_default.error(
      `Your codebase isn't linked to a project on Vercel. Run ${getCommandName(
        "link"
      )} to begin.`
    );
    return 1;
  }
  client.config.currentTeam = link.org.type === "team" ? link.org.id : void 0;
  const { project } = link;
  const [{ envs }, customEnvironments] = await Promise.all([
    getEnvRecords(client, project.id, "vercel-cli:env:update"),
    getCustomEnvironments(client, project.id)
  ]);
  const matchingEnvs = envs.filter((r) => r.key === envName);
  if (matchingEnvs.length === 0) {
    output_manager_default.error(
      `The variable ${param(envName)} was not found. Run ${getCommandName(
        `env ls`
      )} to see all available Environment Variables.`
    );
    return 1;
  }
  let selectedEnv;
  if (envTargetArg || envGitBranch) {
    const filteredEnvs = matchingEnvs.filter((env) => {
      const matchesTarget = !envTargetArg || (Array.isArray(env.target) ? env.target.includes(envTargetArg) : env.target === envTargetArg) || env.customEnvironmentIds && env.customEnvironmentIds.includes(envTargetArg);
      const matchesGitBranch = !envGitBranch || env.gitBranch === envGitBranch;
      return matchesTarget && matchesGitBranch;
    });
    if (filteredEnvs.length === 0) {
      output_manager_default.error(
        `No Environment Variable ${param(envName)} found matching the specified criteria.`
      );
      return 1;
    }
    if (filteredEnvs.length === 1) {
      selectedEnv = filteredEnvs[0];
    } else {
      const choices = filteredEnvs.map((env, index) => {
        const targets2 = formatEnvironments(link, env, customEnvironments);
        return {
          name: targets2,
          value: index
        };
      });
      const selectedIndex = await client.input.select({
        message: `Multiple Environment Variables found for ${param(envName)}. Which one do you want to update?`,
        choices
      });
      selectedEnv = filteredEnvs[selectedIndex];
    }
  } else if (matchingEnvs.length === 1) {
    selectedEnv = matchingEnvs[0];
  } else {
    const choices = matchingEnvs.map((env, index) => {
      const targets2 = formatEnvironments(link, env, customEnvironments);
      return {
        name: targets2,
        value: index
      };
    });
    const selectedIndex = await client.input.select({
      message: `Multiple Environment Variables found for ${param(envName)}. Which one do you want to update?`,
      choices
    });
    selectedEnv = matchingEnvs[selectedIndex];
  }
  let envValue;
  if (stdInput) {
    envValue = stdInput;
  } else {
    envValue = await client.input.text({
      message: `What's the new value of ${envName}?`
    });
  }
  const skipConfirm = opts["--yes"] || !!stdInput;
  const { finalValue, alreadyConfirmed } = await validateEnvValue({
    envName,
    initialValue: envValue,
    skipConfirm,
    promptForValue: () => client.input.text({ message: `What's the new value of ${envName}?` }),
    selectAction: (choices) => client.input.select({ message: "How to proceed?", choices }),
    showWarning: (msg) => output_manager_default.warn(msg),
    showLog: (msg) => output_manager_default.log(msg)
  });
  if (!opts["--yes"] && !alreadyConfirmed) {
    const currentTargets = formatEnvironments(
      link,
      selectedEnv,
      customEnvironments
    );
    const confirmed = await client.input.confirm(
      `Updating Environment Variable ${param(envName)} in ${currentTargets} in Project ${import_chalk4.default.bold(project.name)}. Are you sure?`,
      false
    );
    if (!confirmed) {
      output_manager_default.log("Canceled");
      return 0;
    }
  }
  const type = opts["--sensitive"] ? "sensitive" : selectedEnv.type;
  const targets = Array.isArray(selectedEnv.target) ? selectedEnv.target : [selectedEnv.target].filter(
    (r) => Boolean(r)
  );
  const allTargets = [...targets, ...selectedEnv.customEnvironmentIds || []];
  const updateStamp = stamp_default();
  try {
    output_manager_default.spinner("Updating");
    await updateEnvRecord(
      client,
      project.id,
      selectedEnv.id,
      type,
      envName,
      finalValue,
      allTargets,
      selectedEnv.gitBranch || ""
    );
  } catch (err) {
    if (isAPIError(err) && isKnownError(err)) {
      output_manager_default.error(err.serverMessage);
      return 1;
    }
    throw err;
  }
  output_manager_default.print(
    `${prependEmoji(
      `Updated Environment Variable ${import_chalk4.default.bold(envName)} in Project ${import_chalk4.default.bold(
        project.name
      )} ${import_chalk4.default.gray(updateStamp())}`,
      emoji("success")
    )}
`
  );
  return 0;
}

// src/util/telemetry/commands/env/index.ts
var EnvTelemetryClient = class extends TelemetryClient {
  trackCliSubcommandList(actual) {
    this.trackCliSubcommand({
      subcommand: "ls",
      value: actual
    });
  }
  trackCliSubcommandAdd(actual) {
    this.trackCliSubcommand({
      subcommand: "add",
      value: actual
    });
  }
  trackCliSubcommandRemove(actual) {
    this.trackCliSubcommand({
      subcommand: "rm",
      value: actual
    });
  }
  trackCliSubcommandPull(actual) {
    this.trackCliSubcommand({
      subcommand: "pull",
      value: actual
    });
  }
  trackCliSubcommandRun(actual) {
    this.trackCliSubcommand({
      subcommand: "run",
      value: actual
    });
  }
  trackCliSubcommandUpdate(actual) {
    this.trackCliSubcommand({
      subcommand: "update",
      value: actual
    });
  }
};

// src/commands/env/index.ts
var COMMAND_CONFIG = {
  ls: getCommandAliases(listSubcommand),
  add: getCommandAliases(addSubcommand),
  rm: getCommandAliases(removeSubcommand),
  pull: getCommandAliases(pullSubcommand),
  run: getCommandAliases(runSubcommand),
  update: getCommandAliases(updateSubcommand)
};
async function main(client) {
  const telemetry = new EnvTelemetryClient({
    opts: {
      store: client.telemetryEventStore
    }
  });
  let parsedArgs;
  const flagsSpecification = getFlagsSpecification(envCommand.options);
  try {
    parsedArgs = parseArguments(client.argv.slice(2), flagsSpecification, {
      permissive: true
    });
  } catch (err) {
    printError(err);
    return 1;
  }
  const subArgs = parsedArgs.args.slice(1);
  const { subcommand, args, subcommandOriginal } = getSubcommand(
    subArgs,
    COMMAND_CONFIG
  );
  const needHelp = parsedArgs.flags["--help"];
  if (!subcommand && needHelp) {
    telemetry.trackCliFlagHelp("env", subcommand);
    output_manager_default.print(help(envCommand, { columns: client.stderr.columns }));
    return 2;
  }
  function printHelp(command) {
    output_manager_default.print(
      help(command, { parent: envCommand, columns: client.stderr.columns })
    );
  }
  switch (subcommand) {
    case "ls":
      if (needHelp) {
        telemetry.trackCliFlagHelp("env", subcommandOriginal);
        printHelp(listSubcommand);
        return 2;
      }
      telemetry.trackCliSubcommandList(subcommandOriginal);
      return ls(client, args);
    case "add":
      if (needHelp) {
        telemetry.trackCliFlagHelp("env", subcommandOriginal);
        printHelp(addSubcommand);
        return 2;
      }
      telemetry.trackCliSubcommandAdd(subcommandOriginal);
      return add(client, args);
    case "rm":
      if (needHelp) {
        telemetry.trackCliFlagHelp("env", subcommandOriginal);
        printHelp(removeSubcommand);
        return 2;
      }
      telemetry.trackCliSubcommandRemove(subcommandOriginal);
      return rm(client, args);
    case "pull":
      if (needHelp) {
        telemetry.trackCliFlagHelp("env", subcommandOriginal);
        printHelp(pullSubcommand);
        return 2;
      }
      telemetry.trackCliSubcommandPull(subcommandOriginal);
      return pull(client, args);
    case "run":
      if (needsHelpForRun(client)) {
        telemetry.trackCliFlagHelp("env", subcommandOriginal);
        printHelp(runSubcommand);
        return 2;
      }
      telemetry.trackCliSubcommandRun(subcommandOriginal);
      return run(client);
    case "update":
      if (needHelp) {
        telemetry.trackCliFlagHelp("env", subcommandOriginal);
        printHelp(updateSubcommand);
        return 2;
      }
      telemetry.trackCliSubcommandUpdate(subcommandOriginal);
      return update(client, args);
    default:
      output_manager_default.error(getInvalidSubcommand(COMMAND_CONFIG));
      output_manager_default.print(help(envCommand, { columns: client.stderr.columns }));
      return 2;
  }
}
export {
  main as default
};
