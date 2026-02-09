# Locam

Privacy-first QR scanner and camera utility that runs entirely in your browser.

No accounts.
No uploads.
No tracking.

Just open and use.

---

## What is Locam?

Locam turns your laptop into a simple, reliable tool for:

- Scanning QR codes from your camera
- Reading QR codes from images
- Capturing photos locally

Everything is processed on-device. Your data never leaves your machine.

---

### Load the extension (Chrome)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension` folder

---

## Development

### Building the Extension

```bash
cd extension
pnpm install
pnpm run bundle
```

This builds the extension into the `build/` directory.

### Development Mode

```bash
pnpm run dev
```

Watches for TypeScript changes and recompiles automatically.

---

## Releasing

### Quick Release

To create a new release:

```bash
cd extension

# Bump version (patch, minor, or major)
pnpm run version:patch

# This will:
# - Update version in package.json and metadata.json
# - Create a git commit
# - Create a git tag (e.g., v1.0.1)

# Push to trigger automatic release
git push origin master
git push origin --tags
```

GitHub Actions will automatically:

- Build the extension
- Create Firefox and Chrome packages
- Generate CRX file
- Publish a GitHub Release with all artifacts

For detailed release instructions, see [extension/RELEASE.md](extension/RELEASE.md).

---

## Privacy

Locam does not collect, transmit, or store personal data.

- Images are never uploaded
- QR data is processed locally
- No analytics are embedded
- No identifiers are generated

For details, see the privacy page on the website.

---

## Contributing

Locam is intentionally small.
Before suggesting major features, consider whether they preserve the tool’s simplicity.

Bug fixes and stability improvements are always welcome.

---

## Why Locam Exists

Modern tools often default to cloud processing and data collection.

Locam takes the opposite approach:

Your camera is yours.
Your data stays with you.
Your tools should respect that.
