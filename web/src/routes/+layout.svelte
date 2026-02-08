<script lang="ts">
  import "./layout.css";
  import moment from "moment";

  let { children } = $props();

  const buildTime = import.meta.env.BUILD_TIME;
  const gitHash = import.meta.env.GIT_HASH;
  const buildTimeAgo = moment(buildTime).fromNow();
</script>

<svelte:head>
  <link rel="shortcut icon" href="/logo.png" type="image/png" />
  <title>Locam - Private QR scanning and camera utility</title>
  <meta
    name="description"
    content="Private QR scanning and camera utility. Runs entirely on your device. No accounts. No uploads. No tracking."
  />
  <meta
    name="keywords"
    content="QR scanner, camera utility, privacy, local-first, browser extension, private scanning, offline QR code"
  />
  <meta name="author" content="P8labs" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://locam.tsbin.tech" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://locam.tsbin.tech/" />
  <meta
    property="og:title"
    content="Locam - Private QR scanning and camera utility"
  />
  <meta
    property="og:description"
    content="Private QR scanning and camera utility. Runs entirely on your device. No accounts. No uploads. No tracking."
  />
  <meta property="og:site_name" content="Locam" />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://locam.tsbin.tech/" />
  <meta
    name="twitter:title"
    content="Locam - Private QR scanning and camera utility"
  />
  <meta
    name="twitter:description"
    content="Private QR scanning and camera utility. Runs entirely on your device. No accounts. No uploads. No tracking."
  />

  <meta name="theme-color" content="#fafafa" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
</svelte:head>

<div class="bg-effect"></div>

<header>
  <div class="container">
    <a href="/" class="logo">LOCAM</a>
    <nav>
      <a href="/downloads">downloads</a>
      <a href="/privacy">privacy</a>
      <a href="/terms">terms</a>
      <a href="/about">about</a>
      <a
        href="https://github.com/P8labs/tsbin-locam"
        target="_blank"
        rel="noopener">github</a
      >
    </nav>
  </div>
</header>

{@render children()}

<footer>
  <div class="container">
    <div class="footer-copyright">
      © 2026 locam, Built at <a
        href="https://github.com/P8labs"
        target="_blank"
        rel="noopener">P8labs</a
      ><br />
      {buildTimeAgo} • {gitHash}
    </div>
    <div class="footer-links">
      <a
        href="https://github.com/P8labs/tsbin-locam"
        target="_blank"
        rel="noopener">GitHub</a
      >
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
    </div>
  </div>
</footer>
