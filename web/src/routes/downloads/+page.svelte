<svelte:head>
  <title>Downloads - Locam</title>
  <meta
    name="description"
    content="Download Locam for Chrome, Firefox, or from GitHub releases."
  />
</svelte:head>

<main>
  <div class="container">
    <h1>Downloads</h1>

    <div class="download-list">
      <div class="download-item" id="chrome">
        <h3>Chrome Web Store</h3>
        <p>For Chrome, Edge, Brave, Arc, and other Chromium-based browsers</p>
        <a href="https://github.com/P8labs/tsbin-locam/releases" rel="noopener"
          >In Review (till use it from github)</a
        >
      </div>

      <div class="download-item" id="firefox">
        <h3>Firefox Add-ons</h3>
        <p>For Firefox and Firefox-based browsers</p>
        <a
          href="https://addons.mozilla.org/en-US/firefox/addon/locam-private-qr-scanner"
          rel="noopener">addons.mozilla.org/locam-private-qr-scanner</a
        >
      </div>

      <div class="download-item">
        <h3>GitHub Releases</h3>
        <p>Manual installation from source or release packages (zip, crx)</p>
        <a
          href="https://github.com/P8labs/tsbin-locam/releases"
          target="_blank"
          rel="noopener">github.com/P8labs/tsbin-locam/releases</a
        >
      </div>

      <div class="download-item">
        <h3>Source Code</h3>
        <p>Build from source or review the codebase</p>
        <a
          href="https://github.com/P8labs/tsbin-locam"
          target="_blank"
          rel="noopener">github.com/P8labs/tsbin-locam</a
        >
      </div>
    </div>

    <section>
      <h2>Installation</h2>
      <p>
        After downloading from your preferred source, the extension will request
        permission to access your camera. This is required for QR code scanning
        and photo capture.
      </p>
      <p>
        All processing happens locally in your browser. No data is transmitted.
      </p>
    </section>

    <section>
      <h2>System Requirements</h2>
      <p>Locam works on any operating system that supports modern browsers.</p>
      <ul>
        <li>Chrome 90 or later</li>
        <li>Firefox 88 or later</li>
        <li>Edge 90 or later</li>
        <li>Brave, Arc, or other Chromium-based browsers</li>
      </ul>
    </section>
  </div>
</main>
