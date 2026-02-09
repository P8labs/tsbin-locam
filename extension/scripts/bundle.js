#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { bundle } = require("./build");

const BUILD_DIR = path.join(__dirname, "../build");
const DIST_DIR = path.join(__dirname, "../dist");
const SRC_DIR = path.join(__dirname, "../src");
const ICONS_DIR = path.join(__dirname, "../icons");
const MANIFEST = path.join(__dirname, "../metadata.json");
const PACKAGE_JSON = path.join(__dirname, "../package.json");

const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf-8"));
const version = packageJson.version;

function syncVersion() {
  console.log(`Syncing version ${version} to metadata.json...`);
  const metadata = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
  metadata.version = version;
  fs.writeFileSync(MANIFEST, JSON.stringify(metadata, null, 2) + "\n");
}

async function build() {
  console.log("Building Locam...");

  syncVersion();

  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
  }
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  console.log("Bundling and minifying...");
  await bundle(BUILD_DIR);

  console.log("Copying manifest...");
  fs.copyFileSync(MANIFEST, path.join(BUILD_DIR, "manifest.json"));

  console.log("Copying HTML and CSS...");
  fs.copyFileSync(
    path.join(SRC_DIR, "popup.html"),
    path.join(BUILD_DIR, "popup.html"),
  );
  fs.copyFileSync(
    path.join(SRC_DIR, "popup.css"),
    path.join(BUILD_DIR, "popup.css"),
  );
  fs.copyFileSync(
    path.join(SRC_DIR, "camera-access.html"),
    path.join(BUILD_DIR, "camera-access.html"),
  );
  fs.copyFileSync(
    path.join(SRC_DIR, "camera-access.css"),
    path.join(BUILD_DIR, "camera-access.css"),
  );

  console.log("Copying icons...");
  const iconsTarget = path.join(BUILD_DIR, "icons");
  fs.mkdirSync(iconsTarget, { recursive: true });
  fs.cpSync(ICONS_DIR, iconsTarget, { recursive: true });

  console.log("Creating zip archive...");

  const archiver = require("archiver");
  const output = fs.createWriteStream(
    path.join(DIST_DIR, `locam-v${version}.zip`),
  );
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    console.log(`✓ build complete: ${archive.pointer()} bytes`);
    console.log(`✓ Package: dist/locam-v${version}.zip`);
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(BUILD_DIR, false);
  archive.finalize();
}

build().catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});
