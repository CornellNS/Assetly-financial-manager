#!/usr/bin/env node
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { put } from "@vercel/blob";

const installers = {
  mac: {
    pathname: "installers/mac/Assetly-Financial-Manager-mac-arm64.zip",
    defaultFile: "release/Assetly-Financial-Manager-mac-arm64.zip",
    contentType: "application/zip",
  },
  windows: {
    pathname: "installers/windows/Assetly-Financial-Manager-Setup-0.1.0.exe",
    defaultFile: "release/Assetly-Financial-Manager-Setup-0.1.0.exe",
    contentType: "application/vnd.microsoft.portable-executable",
  },
};

loadEnvLocal();

const platform = process.argv[2];
const installer = installers[platform];

if (!installer) {
  console.error("Usage: node scripts/upload-assetly-installer.mjs <mac|windows> [file]");
  process.exit(1);
}

const filePath = resolve(process.argv[3] ?? installer.defaultFile);

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Missing BLOB_READ_WRITE_TOKEN in environment or .env.local.");
  process.exit(1);
}

if (!existsSync(filePath)) {
  console.error(`Installer file not found: ${filePath}`);
  process.exit(1);
}

const size = statSync(filePath).size;
console.log(`Uploading ${filePath} (${formatBytes(size)})`);
console.log(`Blob pathname: ${installer.pathname}`);

const result = await put(installer.pathname, createReadStream(filePath), {
  access: "private",
  allowOverwrite: true,
  contentType: installer.contentType,
  multipart: true,
  token: process.env.BLOB_READ_WRITE_TOKEN,
});

console.log(`Uploaded: ${result.pathname}`);
console.log(`Content type: ${result.contentType}`);

function loadEnvLocal() {
  const envPath = resolve(".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}
