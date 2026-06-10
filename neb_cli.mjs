#!/usr/bin/env node
import fs from "node:fs";
import {
  getTaskFields,
  listTasks,
  validateTaskFields,
} from "./neb_core.mjs";

function usage() {
  return `Usage:
  node neb_cli.mjs <neb|art> <task> [--mode single|set] [--fields path.json] [--json '{...}'] [--plain] [--key value ...]

Examples:
  node neb_cli.mjs neb Movie --title "Friends and Heroes" --language Spanish --resolution hd --house LAS1234567
  node neb_cli.mjs art Episode --mode set --title "Example Name" --season 02 --episode 05 --language English
  node neb_cli.mjs neb "Episode Caption" --fields episode-fields.json --plain
  node neb_cli.mjs list neb
  node neb_cli.mjs fields art Episode --mode set`;
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const key = rawKey.replace(/-/g, "_");
    if (inlineValue !== undefined) {
      flags[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }
    flags[key] = next;
    index += 1;
  }
  return { positional, flags };
}

function readFields(flags) {
  let fields = {};
  if (flags.fields) {
    fields = JSON.parse(fs.readFileSync(String(flags.fields), "utf8"));
  }
  if (flags.json) {
    fields = { ...fields, ...JSON.parse(String(flags.json)) };
  }
  const reserved = new Set(["fields", "json", "mode", "plain", "help"]);
  for (const [key, value] of Object.entries(flags)) {
    if (!reserved.has(key)) {
      fields[key] = value;
    }
  }
  return fields;
}

function writeJson(payload, exitCode = 0) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = exitCode;
}

function writePlain(result) {
  if (Array.isArray(result.filenames)) {
    process.stdout.write(`${result.filenames.join("\n")}\n`);
    return;
  }
  const lines = [result.filename];
  if (result.companionCaptions) {
    lines.push(result.companionCaptions.eng, result.companionCaptions.las);
  }
  if (result.externalReference) {
    lines.push(result.externalReference);
  }
  process.stdout.write(`${lines.filter(Boolean).join("\n")}\n`);
}

function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  if (flags.help || positional.length === 0) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const [commandOrDomain, maybeTask] = positional;
  if (commandOrDomain === "list") {
    writeJson({ ok: true, domain: maybeTask, tasks: listTasks(maybeTask) });
    return;
  }
  if (commandOrDomain === "fields") {
    writeJson({
      ok: true,
      domain: maybeTask,
      task: positional.slice(2).join(" "),
      fields: getTaskFields(maybeTask, positional.slice(2).join(" "), { mode: flags.mode }),
    });
    return;
  }

  const domain = commandOrDomain;
  const task = maybeTask;
  if (!task) {
    throw new Error("Task is required.");
  }

  const fields = readFields(flags);
  const mode = flags.mode || "single";
  const validation = validateTaskFields(domain, task, fields, { mode });
  if (!validation.ok) {
    writeJson(validation, 1);
    return;
  }
  const result = validation.result;

  if (flags.plain) {
    writePlain(result);
    return;
  }
  writeJson({ ok: true, result });
}

try {
  main();
} catch (error) {
  writeJson({ ok: false, error: error.message || "Unable to generate filename." }, 1);
}
