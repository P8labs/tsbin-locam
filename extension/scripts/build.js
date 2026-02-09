#!/usr/bin/env node

const esbuild = require("esbuild");
const path = require("path");

async function bundle(outdir) {
  try {
    await esbuild.build({
      entryPoints: [path.join(__dirname, "../src/popup.ts")],
      bundle: true,
      minify: true,
      sourcemap: false,
      target: ["es2020"],
      format: "esm",
      outfile: path.join(outdir, "popup.js"),
      external: [],
      platform: "browser",
      legalComments: "none",
    });

    await esbuild.build({
      entryPoints: [path.join(__dirname, "../src/camera-access.ts")],
      bundle: true,
      minify: true,
      sourcemap: false,
      target: ["es2020"],
      format: "esm",
      outfile: path.join(outdir, "camera-access.js"),
      external: [],
      platform: "browser",
      legalComments: "none",
    });

    console.log("✓ Bundles created and minified");
  } catch (error) {
    console.error("Bundling failed:", error);
    process.exit(1);
  }
}

module.exports = { bundle };

if (require.main === module) {
  const outdir = process.argv[2] || path.join(__dirname, "../dist");
  bundle(outdir);
}
