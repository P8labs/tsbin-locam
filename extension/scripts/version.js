#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PACKAGE_JSON = path.join(__dirname, "../package.json");
const METADATA_JSON = path.join(__dirname, "../metadata.json");

function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf-8"));
  return pkg.version;
}

function bumpVersion(type) {
  const validTypes = ["patch", "minor", "major"];
  if (!validTypes.includes(type)) {
    console.error(`❌ Invalid version type: ${type}`);
    console.error(`   Valid types: ${validTypes.join(", ")}`);
    process.exit(1);
  }

  const oldVersion = getCurrentVersion();

  console.log(`\n🔄 Bumping ${type} version...`);

  const [major, minor, patch] = oldVersion.split(".").map(Number);
  let newVersion;

  if (type === "major") {
    newVersion = `${major + 1}.0.0`;
  } else if (type === "minor") {
    newVersion = `${major}.${minor + 1}.0`;
  } else if (type === "patch") {
    newVersion = `${major}.${minor}.${patch + 1}`;
  }

  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf-8"));
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n");

  const metadata = JSON.parse(fs.readFileSync(METADATA_JSON, "utf-8"));
  metadata.version = newVersion;
  fs.writeFileSync(METADATA_JSON, JSON.stringify(metadata, null, 2) + "\n");

  console.log(`✓ Version updated: ${oldVersion} → ${newVersion}`);
  console.log(`✓ Synced to metadata.json\n`);

  return newVersion;
}

function createGitCommitAndTag(version, skipGit = false) {
  if (skipGit) {
    console.log("⚠️  Skipping git commit and tag (--skip-git flag)");
    return;
  }

  try {
    execSync("git --version", { stdio: "ignore" });
  } catch (e) {
    console.log("⚠️  Git not found, skipping commit and tag");
    return;
  }

  try {
    const status = execSync("git status --porcelain", { encoding: "utf-8" });
    if (!status.includes("package.json") && !status.includes("metadata.json")) {
      console.log("ℹ️  No changes to commit");
      return;
    }

    console.log("📝 Creating git commit...");
    execSync(`git add package.json metadata.json`, {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
    execSync(`git commit -m "chore: bump version to ${version}"`, {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
    console.log(`✓ Committed version bump\n`);

    console.log("🏷️  Creating git tag...");
    execSync(`git tag v${version}`, {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
    console.log(`✓ Created tag v${version}\n`);

    console.log("📤 Next steps:");
    console.log(`   git push origin master`);
    console.log(`   git push origin v${version}`);
    console.log("");
    console.log(
      "   This will trigger the GitHub Actions release workflow! 🚀\n",
    );
  } catch (e) {
    console.error("❌ Git operations failed:", e.message);
    console.log("\n⚠️  Version was updated but git commit/tag failed");
    console.log("   You can manually commit and tag:");
    console.log(`   git add package.json metadata.json`);
    console.log(`   git commit -m "chore: bump version to ${version}"`);
    console.log(`   git tag v${version}`);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const type = args[0];
  const skipGit = args.includes("--skip-git");

  if (!type) {
    console.error("❌ Please specify version type: patch, minor, or major\n");
    console.error("Usage:");
    console.error("  pnpm run version patch");
    console.error("  pnpm run version minor");
    console.error("  pnpm run version major");
    console.error("\nOptions:");
    console.error("  --skip-git    Skip git commit and tag");
    process.exit(1);
  }

  const newVersion = bumpVersion(type);
  createGitCommitAndTag(newVersion, skipGit);
}

main();
