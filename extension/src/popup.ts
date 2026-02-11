import { Camera } from "./lib/camera.js";
import { QRScanner } from "./lib/scanner.js";

interface CapturedImage {
  id: string;
  dataUrl: string;
  timestamp: number;
}

class PopupController {
  private camera: Camera;
  private cameraForCapture: Camera;
  private scanner: QRScanner;
  private elements: {
    video: HTMLVideoElement;
    videoContainer: HTMLDivElement;
    permissionPrompt: HTMLDivElement;
    requestPermissionBtn: HTMLButtonElement;
    errorMessage: HTMLDivElement;
    toggleCameraBtn: HTMLButtonElement;
    resultSection: HTMLDivElement;
    resultContent: HTMLDivElement;
    copyBtn: HTMLButtonElement;
    openBtn: HTMLButtonElement;
    scanTab: HTMLButtonElement;
    cameraTab: HTMLButtonElement;
    galleryTab: HTMLButtonElement;
    scannerTab: HTMLDivElement;
    cameraTabContent: HTMLDivElement;
    galleryTabContent: HTMLDivElement;
    cameraVideo: HTMLVideoElement;
    cameraVideoContainer: HTMLDivElement;
    cameraPermissionPrompt: HTMLDivElement;
    requestCameraPermissionBtn: HTMLButtonElement;
    cameraErrorSection: HTMLDivElement;
    cameraErrorMessage: HTMLDivElement;
    retryCameraBtn: HTMLButtonElement;
    captureBtn: HTMLButtonElement;
    galleryGrid: HTMLDivElement;
    clearGalleryBtn: HTMLButtonElement;
  };
  private lastResult: string = "";
  private capturedImages: CapturedImage[] = [];
  private currentTab: "scanner" | "camera" | "gallery" = "scanner";

  constructor() {
    this.elements = {
      video: document.getElementById("video") as HTMLVideoElement,
      videoContainer: document.getElementById(
        "videoContainer",
      ) as HTMLDivElement,
      permissionPrompt: document.getElementById(
        "permissionPrompt",
      ) as HTMLDivElement,
      requestPermissionBtn: document.getElementById(
        "requestPermissionBtn",
      ) as HTMLButtonElement,
      errorMessage: document.getElementById("errorMessage") as HTMLDivElement,
      toggleCameraBtn: document.getElementById(
        "toggleCamera",
      ) as HTMLButtonElement,
      resultSection: document.getElementById("resultSection") as HTMLDivElement,
      resultContent: document.getElementById("resultContent") as HTMLDivElement,
      copyBtn: document.getElementById("copyBtn") as HTMLButtonElement,
      openBtn: document.getElementById("openBtn") as HTMLButtonElement,
      scanTab: document.getElementById("scanTab") as HTMLButtonElement,
      cameraTab: document.getElementById("cameraTab") as HTMLButtonElement,
      galleryTab: document.getElementById("galleryTab") as HTMLButtonElement,
      scannerTab: document.getElementById("scannerTab") as HTMLDivElement,
      cameraTabContent: document.getElementById(
        "cameraTabContent",
      ) as HTMLDivElement,
      galleryTabContent: document.getElementById(
        "galleryTabContent",
      ) as HTMLDivElement,
      cameraVideo: document.getElementById("cameraVideo") as HTMLVideoElement,
      cameraVideoContainer: document.getElementById(
        "cameraVideoContainer",
      ) as HTMLDivElement,
      cameraPermissionPrompt: document.getElementById(
        "cameraPermissionPrompt",
      ) as HTMLDivElement,
      requestCameraPermissionBtn: document.getElementById(
        "requestCameraPermissionBtn",
      ) as HTMLButtonElement,
      cameraErrorSection: document.getElementById(
        "cameraErrorSection",
      ) as HTMLDivElement,
      cameraErrorMessage: document.getElementById(
        "cameraErrorMessage",
      ) as HTMLDivElement,
      retryCameraBtn: document.getElementById(
        "retryCameraBtn",
      ) as HTMLButtonElement,
      captureBtn: document.getElementById("captureBtn") as HTMLButtonElement,
      galleryGrid: document.getElementById("galleryGrid") as HTMLDivElement,
      clearGalleryBtn: document.getElementById(
        "clearGalleryBtn",
      ) as HTMLButtonElement,
    };

    this.camera = new Camera(this.elements.video);
    this.cameraForCapture = new Camera(this.elements.cameraVideo);
    this.scanner = new QRScanner();
    this.setupEventListeners();

    this.initialize();
  }

  private setupEventListeners(): void {
    this.elements.requestPermissionBtn.addEventListener("click", () =>
      this.requestCameraPermission(),
    );
    this.elements.toggleCameraBtn.addEventListener("click", () =>
      this.toggleCamera(),
    );
    this.elements.copyBtn.addEventListener("click", () => this.copyResult());
    this.elements.openBtn.addEventListener("click", () => this.openResult());

    this.elements.scanTab.addEventListener("click", () =>
      this.switchTab("scanner"),
    );
    this.elements.cameraTab.addEventListener("click", () =>
      this.switchTab("camera"),
    );
    this.elements.galleryTab.addEventListener("click", () =>
      this.switchTab("gallery"),
    );

    this.elements.requestCameraPermissionBtn.addEventListener("click", () =>
      this.requestCameraForCapture(),
    );
    this.elements.retryCameraBtn.addEventListener("click", () =>
      this.requestCameraForCapture(),
    );
    this.elements.captureBtn.addEventListener("click", () =>
      this.captureImage(),
    );

    this.elements.clearGalleryBtn.addEventListener("click", () =>
      this.clearGallery(),
    );

    window.addEventListener("unload", () => {
      this.scanner.stopScanning();
      this.camera.stop();
      this.cameraForCapture.stop();
    });
  }

  private async initialize(): Promise<void> {
    this.elements.permissionPrompt.style.display = "flex";
    this.elements.toggleCameraBtn.style.display = "none";
    await this.loadGallery();
  }

  private switchTab(tab: "scanner" | "camera" | "gallery"): void {
    this.elements.scanTab.classList.remove("active");
    this.elements.cameraTab.classList.remove("active");
    this.elements.galleryTab.classList.remove("active");

    this.elements.scannerTab.classList.remove("active");
    this.elements.cameraTabContent.classList.remove("active");
    this.elements.galleryTabContent.classList.remove("active");

    // Stop cameras when switching tabs
    if (this.currentTab === "scanner") {
      this.scanner.stopScanning();
      this.camera.stop();
    } else if (this.currentTab === "camera") {
      this.cameraForCapture.stop();
    }

    this.currentTab = tab;

    switch (tab) {
      case "scanner":
        this.elements.scanTab.classList.add("active");
        this.elements.scannerTab.classList.add("active");
        break;
      case "camera":
        this.elements.cameraTab.classList.add("active");
        this.elements.cameraTabContent.classList.add("active");
        break;
      case "gallery":
        this.elements.galleryTab.classList.add("active");
        this.elements.galleryTabContent.classList.add("active");
        this.refreshGallery();
        break;
    }
  }

  private async requestCameraPermission(): Promise<void> {
    try {
      this.showLoading();
      await this.startCamera();
    } catch (error) {
      console.log(error);
      if (
        error instanceof Error &&
        error.message.includes("Camera access denied")
      ) {
        const extensionUrl = browserAPI.runtime.getURL("camera-access.html");
        browserAPI.tabs.create({ url: extensionUrl });
        window.close();
        return;
      }
      this.showError(
        error instanceof Error ? error.message : "Camera unavailable",
      );
    }
  }

  private async startCamera(): Promise<void> {
    try {
      this.hideError();

      this.elements.permissionPrompt.style.display = "none";

      this.elements.videoContainer.style.display = "block";
      this.elements.toggleCameraBtn.style.display = "block";

      await this.camera.start();
      this.hideLoading();

      await this.waitForVideoReady();

      await this.scanner.startScanning(this.elements.video, (result) =>
        this.handleScanResult(result),
      );

      this.elements.toggleCameraBtn.textContent = "Stop Camera";
    } catch (error) {
      this.hideLoading();
      throw error;
    }
  }

  private stopCamera(): void {
    this.scanner.stopScanning();
    this.camera.stop();
    this.elements.toggleCameraBtn.textContent = "Start Camera";
  }

  private async toggleCamera(): Promise<void> {
    if (this.camera.isActive()) {
      this.stopCamera();
    } else {
      try {
        this.showLoading();
        await this.startCamera();
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Camera access denied")
        ) {
          const extensionUrl = browserAPI.runtime.getURL("camera-access.html");
          browserAPI.tabs.create({ url: extensionUrl });
          window.close();
          return;
        }
        this.showError(
          error instanceof Error ? error.message : "Camera unavailable",
        );
      }
    }
  }

  private waitForVideoReady(): Promise<void> {
    return new Promise((resolve) => {
      if (this.elements.video.readyState >= 2) {
        resolve();
      } else {
        this.elements.video.addEventListener("loadeddata", () => resolve(), {
          once: true,
        });
      }
    });
  }

  private handleScanResult(result: string): void {
    if (result === this.lastResult) {
      return;
    }

    this.lastResult = result;

    this.displayResult(result);

    // this.scanner.stopScanning();
  }

  private displayResult(result: string): void {
    this.elements.resultContent.textContent = result;
    this.elements.resultSection.style.display = "block";

    const isUrl = this.isValidUrl(result);
    this.elements.openBtn.style.display = isUrl ? "block" : "none";
  }

  private isValidUrl(text: string): boolean {
    try {
      const url = new URL(text);
      return (
        url.protocol === "http:" ||
        url.protocol === "https:" ||
        text.startsWith("FIDO:/")
      );
    } catch {
      return false;
    }
  }

  private async copyResult(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.lastResult);

      const originalText = this.elements.copyBtn.textContent;
      this.elements.copyBtn.textContent = "Copied!";
      setTimeout(() => {
        this.elements.copyBtn.textContent = originalText;
      }, 1500);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy. Please select and copy manually.");
    }
  }

  private openResult(): void {
    if (!this.isValidUrl(this.lastResult)) {
      return;
    }

    window.open(this.lastResult, "_blank", "noopener,noreferrer");
  }

  private showError(message: string): void {
    this.elements.permissionPrompt.style.display = "none";
    this.elements.videoContainer.style.display = "none";
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.style.display = "block";
    this.elements.toggleCameraBtn.textContent = "Start Camera";
    this.elements.toggleCameraBtn.style.display = "block";
  }

  private hideError(): void {
    this.elements.errorMessage.style.display = "none";
    this.elements.videoContainer.style.display = "block";
  }

  private showLoading(): void {
    this.elements.permissionPrompt.style.display = "none";
    this.elements.errorMessage.style.display = "none";
    this.elements.videoContainer.style.display = "flex";
    this.elements.videoContainer.classList.add("loading");
  }

  private hideLoading(): void {
    this.elements.videoContainer.classList.remove("loading");
  }

  private async requestCameraForCapture(): Promise<void> {
    try {
      this.elements.cameraPermissionPrompt.style.display = "none";
      this.elements.cameraErrorSection.style.display = "none";
      this.elements.cameraVideoContainer.style.display = "block";
      this.elements.cameraVideoContainer.classList.add("loading");

      await this.cameraForCapture.start();

      this.elements.cameraVideoContainer.classList.remove("loading");
    } catch (error) {
      this.elements.cameraVideoContainer.classList.remove("loading");
      this.elements.cameraVideoContainer.style.display = "none";
      this.elements.cameraErrorSection.style.display = "flex";
      this.elements.cameraErrorMessage.textContent =
        error instanceof Error ? error.message : "Camera unavailable";
    }
  }

  private async captureImage(): Promise<void> {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = this.elements.cameraVideo.videoWidth;
      canvas.height = this.elements.cameraVideo.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      ctx.drawImage(this.elements.cameraVideo, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");

      const blob = await (await fetch(dataUrl)).blob();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `locam-${timestamp}.png`;

      if ("showSaveFilePicker" in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: "PNG Image",
                accept: { "image/png": [".png"] },
              },
            ],
          });

          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();

          const image: CapturedImage = {
            id: Date.now().toString(),
            dataUrl,
            timestamp: Date.now(),
          };
          this.capturedImages.push(image);
          await this.saveGallery();

          this.elements.captureBtn.textContent = "✓ Saved!";
          setTimeout(() => {
            this.elements.captureBtn.textContent = "📷 Capture";
          }, 1500);
        } catch (err) {
          if ((err as Error).name === "AbortError") {
            console.log("User cancelled save");
          } else {
            throw err;
          }
        }
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = fileName;
        a.click();

        const image: CapturedImage = {
          id: Date.now().toString(),
          dataUrl,
          timestamp: Date.now(),
        };
        this.capturedImages.push(image);
        await this.saveGallery();

        this.elements.captureBtn.textContent = "✓ Saved!";
        setTimeout(() => {
          this.elements.captureBtn.textContent = "📷 Capture";
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to capture image:", error);
      alert(
        "Failed to capture image: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  }

  private async loadGallery(): Promise<void> {
    try {
      const data = await browserAPI.storage.local.get("capturedImages");
      this.capturedImages = data.capturedImages || [];
    } catch (error) {
      console.error("Failed to load gallery:", error);
      this.capturedImages = [];
    }
  }

  private async saveGallery(): Promise<void> {
    try {
      await browserAPI.storage.local.set({
        capturedImages: this.capturedImages,
      });
    } catch (error) {
      console.error("Failed to save gallery:", error);
    }
  }

  private refreshGallery(): void {
    const isEmpty = this.capturedImages.length === 0;

    if (isEmpty) {
      this.elements.galleryGrid.innerHTML = `
        <div class="empty-gallery">
          <div class="empty-icon">📷</div>
          <p>No images captured yet</p>
          <p class="empty-hint">Switch to the Camera tab to start capturing</p>
        </div>
      `;
      this.elements.clearGalleryBtn.style.display = "none";
    } else {
      this.elements.clearGalleryBtn.style.display = "block";
      this.elements.galleryGrid.innerHTML = "";

      this.capturedImages
        .slice()
        .reverse()
        .forEach((image) => {
          const item = document.createElement("div");
          item.className = "gallery-item";
          item.innerHTML = `
          <img src="${image.dataUrl}" alt="Captured image">
          <div class="gallery-item-actions">
            <button class="gallery-item-btn download-btn">Save</button>
            <button class="gallery-item-btn delete-btn">Delete</button>
          </div>
        `;

          const downloadBtn = item.querySelector(
            ".download-btn",
          ) as HTMLButtonElement;
          const deleteBtn = item.querySelector(
            ".delete-btn",
          ) as HTMLButtonElement;

          downloadBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            await this.downloadImage(image);
          });

          deleteBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            await this.deleteImage(image.id);
          });

          this.elements.galleryGrid.appendChild(item);
        });
    }
  }

  private async downloadImage(image: CapturedImage): Promise<void> {
    try {
      const blob = await (await fetch(image.dataUrl)).blob();
      const timestamp = new Date(image.timestamp)
        .toISOString()
        .replace(/[:.]/g, "-");
      const fileName = `locam-${timestamp}.png`;

      if ("showSaveFilePicker" in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: "PNG Image",
                accept: { "image/png": [".png"] },
              },
            ],
          });

          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            throw err;
          }
        }
      } else {
        const a = document.createElement("a");
        a.href = image.dataUrl;
        a.download = fileName;
        a.click();
      }
    } catch (error) {
      console.error("Failed to download image:", error);
      alert("Failed to download image");
    }
  }

  private async deleteImage(id: string): Promise<void> {
    if (!confirm("Delete this image?")) {
      return;
    }

    this.capturedImages = this.capturedImages.filter((img) => img.id !== id);
    await this.saveGallery();
    this.refreshGallery();
  }

  private async clearGallery(): Promise<void> {
    if (!confirm("Clear all captured images? This cannot be undone.")) {
      return;
    }

    this.capturedImages = [];
    await this.saveGallery();
    this.refreshGallery();
  }
}

declare const browser: {
  runtime: {
    getURL: (path: string) => string;
  };
  tabs: {
    create: (options: { url: string }) => Promise<any>;
  };
  storage: {
    local: {
      get: (keys: string | string[]) => Promise<any>;
      set: (items: any) => Promise<void>;
    };
  };
};

declare const chrome: {
  runtime: {
    getURL: (path: string) => string;
  };
  tabs: {
    create: (options: { url: string }) => Promise<any>;
  };
  storage: {
    local: {
      get: (keys: string | string[]) => Promise<any>;
      set: (items: any) => Promise<void>;
    };
  };
};

const browserAPI =
  typeof browser !== "undefined" ? browser : (chrome as typeof browser);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new PopupController());
} else {
  new PopupController();
}
