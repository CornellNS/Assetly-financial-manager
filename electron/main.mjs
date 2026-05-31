import path from "node:path";
import { spawn } from "node:child_process";
import net from "node:net";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { app, BrowserWindow, shell, session } = require("electron");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appName = "Assetly Financial Manager";
const appId = "com.assetly.financialmanager";

let mainWindow;
let nextServer;

const isDev = !app.isPackaged;
const workspacePath = "/workspace";
const desktopWorkspaceSearchParam = "desktop";
const devUrl =
  process.env.ELECTRON_START_URL ||
  `http://localhost:3000${workspacePath}?${desktopWorkspaceSearchParam}=1`;

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === "string") {
          reject(new Error(`Could not allocate a local port for ${appName}.`));
          return;
        }
        resolve(address.port);
      });
    });
  });
}

function waitForUrl(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const response = await fetch(url);
        if (response.ok || response.status < 500) {
          resolve();
          return;
        }
      } catch {
        // The local Next server is still booting.
      }

      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }

      setTimeout(attempt, 250);
    };

    attempt();
  });
}

async function startBundledNextServer() {
  const port = await getFreePort();
  const appPath = app.getAppPath();
  const unpackedStandaloneRoot = appPath.endsWith(".asar")
    ? path.join(path.dirname(appPath), "app.asar.unpacked", ".next", "standalone")
    : undefined;
  const standaloneRoot =
    unpackedStandaloneRoot && fs.existsSync(unpackedStandaloneRoot)
      ? unpackedStandaloneRoot
      : path.join(appPath, ".next", "standalone");
  const serverPath = path.join(standaloneRoot, "server.js");

  nextServer = spawn(process.execPath, [serverPath], {
    cwd: standaloneRoot,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
    },
    stdio: "ignore",
  });

  nextServer.once("exit", (code) => {
    if (code !== 0 && mainWindow) {
      mainWindow.webContents.send("ledger-room:server-exit", code);
    }
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForUrl(url);
  return url;
}

function createWindow(startUrl) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1080,
    minHeight: 720,
    title: appName,
    backgroundColor: "#14130f",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const target = new URL(url);
    const appOrigin = new URL(startUrl).origin;
    if (target.origin !== appOrigin) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.loadURL(startUrl);
}

function withWorkspacePath(baseUrl) {
  const url = new URL(baseUrl);
  if (url.pathname === "/" || url.pathname === "") {
    url.pathname = workspacePath;
  }
  if (url.pathname === workspacePath) {
    url.searchParams.set(desktopWorkspaceSearchParam, "1");
  }
  return url.toString();
}

app.whenReady().then(async () => {
  app.setName(appName);
  app.setAppUserModelId(appId);

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  const startUrl = withWorkspacePath(isDev ? devUrl : await startBundledNextServer());
  createWindow(startUrl);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(startUrl);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextServer) {
    nextServer.kill();
    nextServer = undefined;
  }
});
