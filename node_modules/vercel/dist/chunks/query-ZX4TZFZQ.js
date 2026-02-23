import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  formatCsv,
  formatErrorJson,
  formatQueryJson,
  getDefaultAggregation,
  getRollupColumnName,
  validateAggregation,
  validateEvent,
  validateGroupBy,
  validateMeasure,
  validateMutualExclusivity,
  validateRequiredEvent
} from "./chunk-XRBKGUUD.js";
import {
  getScope
} from "./chunk-SRPVI3PV.js";
import {
  validateJsonOutput
} from "./chunk-XPKWKPWA.js";
import {
  metricsCommand
} from "./chunk-NJKAUXT4.js";
import {
  getLinkedProject,
  require_ms
} from "./chunk-BNSR2EP5.js";
import {
  getFlagsSpecification,
  isAPIError,
  parseArguments,
  printError
} from "./chunk-3J2XL77M.js";
import {
  output_manager_default
} from "./chunk-7K6FEHYP.js";
import {
  __toESM
} from "./chunk-A2M6YJ6J.js";

// src/commands/metrics/time-utils.ts
var import_ms = __toESM(require_ms(), 1);
var MINUTE_MS = 60 * 1e3;
var HOUR_MS = 60 * MINUTE_MS;
var DAY_MS = 24 * HOUR_MS;
function parseTimeFlag(input) {
  const milliseconds = (0, import_ms.default)(input);
  if (milliseconds !== void 0) {
    return new Date(Date.now() - milliseconds);
  }
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    throw new Error(
      `Invalid time format "${input}". Use relative (1h, 30m, 2d, 1w) or ISO 8601 datetime.`
    );
  }
  return date;
}
function resolveTimeRange(since, until) {
  const startTime = parseTimeFlag(since ?? "1h");
  const endTime = until ? parseTimeFlag(until) : /* @__PURE__ */ new Date();
  return { startTime, endTime };
}
function toGranularityDuration(input) {
  const milliseconds = (0, import_ms.default)(input);
  if (milliseconds === void 0) {
    throw new Error(
      `Invalid granularity format "${input}". Use 1m, 5m, 15m, 1h, 4h, 1d.`
    );
  }
  if (milliseconds >= DAY_MS) {
    return { days: milliseconds / DAY_MS };
  }
  if (milliseconds >= HOUR_MS) {
    return { hours: milliseconds / HOUR_MS };
  }
  return { minutes: milliseconds / MINUTE_MS };
}
function toGranularityMs(input) {
  const milliseconds = (0, import_ms.default)(input);
  if (milliseconds === void 0) {
    throw new Error(`Invalid granularity format "${input}".`);
  }
  return milliseconds;
}
var GRANULARITY_THRESHOLDS = [
  [1 * HOUR_MS, "1m", "1m"],
  // ≤1h
  [2 * HOUR_MS, "5m", "5m"],
  // ≤2h
  [12 * HOUR_MS, "15m", "5m"],
  // ≤12h
  [3 * DAY_MS, "1h", "1h"],
  // ≤3d
  [30 * DAY_MS, "4h", "4h"]
  // ≤30d
];
var FALLBACK_GRANULARITY = "1d";
function getAutoGranularity(rangeMs) {
  for (const [maxRange, defaultG] of GRANULARITY_THRESHOLDS) {
    if (rangeMs <= maxRange) {
      return defaultG;
    }
  }
  return FALLBACK_GRANULARITY;
}
function getMinGranularity(rangeMs) {
  for (const [maxRange, , minG] of GRANULARITY_THRESHOLDS) {
    if (rangeMs <= maxRange) {
      return minG;
    }
  }
  return FALLBACK_GRANULARITY;
}
function computeGranularity(rangeMs, explicit) {
  if (!explicit) {
    const auto = getAutoGranularity(rangeMs);
    return {
      duration: toGranularityDuration(auto),
      adjusted: false
    };
  }
  const minG = getMinGranularity(rangeMs);
  const explicitMs = toGranularityMs(explicit);
  const minMs = toGranularityMs(minG);
  if (explicitMs < minMs) {
    const rangeDays = Math.round(rangeMs / DAY_MS);
    const rangeHours = Math.round(rangeMs / HOUR_MS);
    const rangeLabel = rangeDays >= 1 ? `${rangeDays}-day` : `${rangeHours}-hour`;
    return {
      duration: toGranularityDuration(minG),
      adjusted: true,
      notice: `Granularity adjusted from ${explicit} to ${minG} for a ${rangeLabel} time range.`
    };
  }
  return {
    duration: toGranularityDuration(explicit),
    adjusted: false
  };
}
function roundTimeBoundaries(start, end, granularityMs) {
  const flooredStart = new Date(
    Math.floor(start.getTime() / granularityMs) * granularityMs
  );
  const ceiledEnd = new Date(
    Math.ceil(end.getTime() / granularityMs) * granularityMs
  );
  return { start: flooredStart, end: ceiledEnd };
}
function toGranularityMsFromDuration(duration) {
  if ("minutes" in duration) {
    return duration.minutes * MINUTE_MS;
  }
  if ("hours" in duration) {
    return duration.hours * HOUR_MS;
  }
  return duration.days * DAY_MS;
}

// src/commands/metrics/query.ts
function handleValidationError(result, jsonOutput, client) {
  if (jsonOutput) {
    client.stdout.write(
      formatErrorJson(result.code, result.message, result.allowedValues)
    );
  } else {
    output_manager_default.error(result.message);
    if (result.allowedValues && result.allowedValues.length > 0) {
      output_manager_default.print(
        `
Available ${result.code === "UNKNOWN_EVENT" ? "events" : result.code === "UNKNOWN_MEASURE" ? "measures" : result.code === "INVALID_AGGREGATION" ? "aggregations" : "dimensions"}: ${result.allowedValues.join(", ")}
`
      );
    }
  }
  return 1;
}
function handleApiError(err, jsonOutput, client) {
  let code;
  let message;
  switch (err.status) {
    case 402:
      code = "PAYMENT_REQUIRED";
      message = "This feature requires an Observability Plus subscription. Upgrade at https://vercel.com/dashboard/settings/billing";
      break;
    case 403:
      code = "FORBIDDEN";
      message = "You do not have permission to query metrics for this project/team.";
      break;
    case 500:
      code = "INTERNAL_ERROR";
      message = "An internal error occurred. Please try again later.";
      break;
    case 504:
      code = "TIMEOUT";
      message = "The query timed out. Try a shorter time range or fewer groups.";
      break;
    default:
      code = err.code || "BAD_REQUEST";
      message = err.serverMessage || `API error (${err.status})`;
  }
  if (jsonOutput) {
    client.stdout.write(formatErrorJson(code, message));
  } else {
    output_manager_default.error(message);
  }
  return 1;
}
async function resolveQueryScope(client, opts) {
  if (opts.project || opts.all) {
    const { team } = await getScope(client);
    if (!team) {
      const errMsg = "No team context found. Run `vercel switch` to select a team, or use `vercel link` in a project directory.";
      if (opts.jsonOutput) {
        client.stdout.write(formatErrorJson("NO_TEAM", errMsg));
      } else {
        output_manager_default.error(errMsg);
      }
      return 1;
    }
    if (opts.all) {
      return {
        scope: { type: "team-with-slug", teamSlug: team.slug },
        accountId: team.id
      };
    }
    return {
      scope: {
        type: "project-with-slug",
        teamSlug: team.slug,
        projectName: opts.project
      },
      accountId: team.id
    };
  }
  const linkedProject = await getLinkedProject(client);
  if (linkedProject.status === "error") {
    return linkedProject.exitCode;
  }
  if (linkedProject.status === "not_linked") {
    const errMsg = "No linked project found. Run `vercel link` to link a project, or use --project <name> or --all.";
    if (opts.jsonOutput) {
      client.stdout.write(formatErrorJson("NOT_LINKED", errMsg));
    } else {
      output_manager_default.error(errMsg);
    }
    return 1;
  }
  return {
    scope: {
      type: "project-with-slug",
      teamSlug: linkedProject.org.slug,
      projectName: linkedProject.project.name
    },
    accountId: linkedProject.org.id
  };
}
async function query(client, telemetry) {
  let parsedArgs;
  const flagsSpecification = getFlagsSpecification(metricsCommand.options);
  try {
    parsedArgs = parseArguments(client.argv.slice(2), flagsSpecification);
  } catch (err) {
    printError(err);
    return 1;
  }
  const flags = parsedArgs.flags;
  const formatResult = validateJsonOutput(flags);
  if (!formatResult.valid) {
    output_manager_default.error(formatResult.error);
    return 1;
  }
  const jsonOutput = formatResult.jsonOutput;
  const eventFlag = flags["--event"];
  const measure = flags["--measure"] ?? "count";
  const aggregationFlag = flags["--aggregation"];
  const groupBy = flags["--group-by"] ?? [];
  const limit = flags["--limit"];
  const orderBy = flags["--order-by"];
  const filter = flags["--filter"];
  const since = flags["--since"];
  const until = flags["--until"];
  const granularity = flags["--granularity"];
  const project = flags["--project"];
  const all = flags["--all"];
  telemetry.trackCliOptionEvent(eventFlag);
  telemetry.trackCliOptionMeasure(flags["--measure"]);
  telemetry.trackCliOptionAggregation(aggregationFlag);
  telemetry.trackCliOptionGroupBy(groupBy.length > 0 ? groupBy : void 0);
  telemetry.trackCliOptionLimit(limit);
  telemetry.trackCliOptionOrderBy(orderBy);
  telemetry.trackCliOptionFilter(filter);
  telemetry.trackCliOptionSince(since);
  telemetry.trackCliOptionUntil(until);
  telemetry.trackCliOptionGranularity(granularity);
  telemetry.trackCliOptionProject(project);
  telemetry.trackCliFlagAll(all);
  telemetry.trackCliOptionFormat(flags["--format"]);
  const requiredResult = validateRequiredEvent(eventFlag);
  if (!requiredResult.valid) {
    return handleValidationError(requiredResult, jsonOutput, client);
  }
  const event = requiredResult.value;
  const aggregation = aggregationFlag ?? getDefaultAggregation(event, measure);
  const eventResult = validateEvent(event);
  if (!eventResult.valid) {
    return handleValidationError(eventResult, jsonOutput, client);
  }
  const measureResult = validateMeasure(event, measure);
  if (!measureResult.valid) {
    return handleValidationError(measureResult, jsonOutput, client);
  }
  const aggResult = validateAggregation(event, measure, aggregation);
  if (!aggResult.valid) {
    return handleValidationError(aggResult, jsonOutput, client);
  }
  const groupByResult = validateGroupBy(event, groupBy);
  if (!groupByResult.valid) {
    return handleValidationError(groupByResult, jsonOutput, client);
  }
  const mutualResult = validateMutualExclusivity(all, project);
  if (!mutualResult.valid) {
    return handleValidationError(mutualResult, jsonOutput, client);
  }
  const scopeResult = await resolveQueryScope(client, {
    project,
    all,
    jsonOutput
  });
  if (typeof scopeResult === "number") {
    return scopeResult;
  }
  const { scope, accountId } = scopeResult;
  let startTime;
  let endTime;
  try {
    ({ startTime, endTime } = resolveTimeRange(since, until));
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (jsonOutput) {
      client.stdout.write(formatErrorJson("INVALID_TIME", errMsg));
    } else {
      output_manager_default.error(errMsg);
    }
    return 1;
  }
  const rangeMs = endTime.getTime() - startTime.getTime();
  const granResult = computeGranularity(rangeMs, granularity);
  if (granResult.adjusted && granResult.notice) {
    output_manager_default.log(`Notice: ${granResult.notice}`);
  }
  const rounded = roundTimeBoundaries(
    startTime,
    endTime,
    toGranularityMsFromDuration(granResult.duration)
  );
  const rollupColumn = getRollupColumnName(measure, aggregation);
  const body = {
    reason: "agent",
    scope,
    event,
    rollups: { [rollupColumn]: { measure, aggregation } },
    startTime: rounded.start.toISOString(),
    endTime: rounded.end.toISOString(),
    granularity: granResult.duration,
    ...groupBy.length > 0 ? { groupBy } : {},
    ...filter ? { filter } : {},
    limit: limit ?? 10,
    ...orderBy ? { orderBy } : {}
  };
  const baseUrl = client.apiUrl === "https://api.vercel.com" ? "https://vercel.com" : client.apiUrl;
  const metricsUrl = `${baseUrl}/api/observability/metrics`;
  output_manager_default.spinner("Querying metrics...");
  let response;
  try {
    response = await client.fetch(metricsUrl, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      accountId
    });
  } catch (err) {
    if (isAPIError(err)) {
      return handleApiError(err, jsonOutput, client);
    }
    const errMsg = err instanceof Error ? err.message : String(err);
    if (jsonOutput) {
      client.stdout.write(formatErrorJson("NETWORK_ERROR", errMsg));
    } else {
      output_manager_default.error(errMsg);
    }
    return 1;
  } finally {
    output_manager_default.stopSpinner();
  }
  if (jsonOutput) {
    client.stdout.write(
      formatQueryJson(
        {
          event,
          measure,
          aggregation,
          groupBy,
          filter,
          startTime: rounded.start.toISOString(),
          endTime: rounded.end.toISOString(),
          granularity: granResult.duration
        },
        response
      )
    );
  } else {
    client.stdout.write(formatCsv(response.data ?? [], groupBy, rollupColumn));
  }
  return 0;
}
export {
  query as default
};
