import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const nextCommand = process.platform === "win32" ? "npx.cmd" : "npx";

const build = spawnSync(nextCommand, ["next", "build"], {
  cwd: root,
  env: {
    ...process.env,
    NEXT_OUTPUT_STANDALONE: "true",
  },
  stdio: "inherit",
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const standaloneRoot = path.join(root, ".next", "standalone");
const standaloneNextRoot = path.join(standaloneRoot, ".next");

fs.mkdirSync(standaloneNextRoot, { recursive: true });

const staticSource = path.join(root, ".next", "static");
const staticTarget = path.join(standaloneNextRoot, "static");
if (fs.existsSync(staticSource)) {
  fs.rmSync(staticTarget, { recursive: true, force: true });
  fs.cpSync(staticSource, staticTarget, { recursive: true });
}

const publicSource = path.join(root, "public");
const publicTarget = path.join(standaloneRoot, "public");
if (fs.existsSync(publicSource)) {
  fs.rmSync(publicTarget, { recursive: true, force: true });
  const downloadsSource = path.join(publicSource, "downloads");
  fs.cpSync(publicSource, publicTarget, {
    recursive: true,
    filter(source) {
      return source !== downloadsSource && !source.startsWith(`${downloadsSource}${path.sep}`);
    },
  });
}
