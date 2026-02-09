#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { execSync } = require("child_process");

const BUILD_DIR = path.join(__dirname, "../build");
const DIST_DIR = path.join(__dirname, "../dist");
const PACKAGE_JSON = path.join(__dirname, "../package.json");

const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf-8"));
const version = packageJson.version;

async function createZip(outputPath, sourceDir) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(
        `✓ Created: ${path.basename(outputPath)} (${archive.pointer()} bytes)`,
      );
      resolve();
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function release() {
  console.log(`\n🚀 Creating release packages for v${version}...\n`);

  // Ensure build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error("❌ Build directory not found. Run 'pnpm run bundle' first.");
    process.exit(1);
  }

  // Ensure dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Create Firefox package
  console.log("📦 Creating Firefox package...");
  const firefoxZip = path.join(DIST_DIR, `locam-firefox-v${version}.zip`);
  await createZip(firefoxZip, BUILD_DIR);

  // Create Chrome package
  console.log("📦 Creating Chrome package...");
  const chromeZip = path.join(DIST_DIR, `locam-chrome-v${version}.zip`);
  await createZip(chromeZip, BUILD_DIR);

  // Create CRX package (same as Chrome zip but with .crx extension for convenience)
  console.log("📦 Creating CRX package...");
  const crxFile = path.join(DIST_DIR, `locam-v${version}.crx`);
  fs.copyFileSync(chromeZip, crxFile);

  // Generate checksums
  console.log("🔐 Generating checksums...");
  const files = fs
    .readdirSync(DIST_DIR)
    .filter((f) => f.startsWith("locam-") && !f.endsWith(".txt"));

  const checksums = [];
  for (const file of files) {
    const filePath = path.join(DIST_DIR, file);
    try {
      // Try using sha256sum if available (Linux/Mac)
      const hash = execSync(`sha256sum "${filePath}"`, { encoding: "utf-8" })
        .trim()
        .split(" ")[0];
      checksums.push(`${hash}  ${file}`);
    } catch (e) {
      // Fallback for systems without sha256sum
      const crypto = require("crypto");
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      checksums.push(`${hash}  ${file}`);
    }
  }

  const checksumFile = path.join(DIST_DIR, "checksums.txt");
  fs.writeFileSync(checksumFile, checksums.join("\n") + "\n");
  console.log(`✓ Created: checksums.txt`);

  console.log(`\n✅ Release packages created successfully!\n`);
  console.log("📋 Release artifacts:");
  console.log(`   - ${path.basename(firefoxZip)}`);
  console.log(`   - ${path.basename(chromeZip)}`);
  console.log(`   - ${path.basename(crxFile)}`);
  console.log(`   - checksums.txt\n`);
  console.log(`📍 Location: ${DIST_DIR}\n`);
}

release().catch((error) => {
  console.error("❌ Release failed:", error);
  process.exit(1);
});
