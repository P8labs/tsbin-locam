import { Camera } from "./lib/camera.js";
import { QRScanner } from "./lib/scanner.js";

interface CapturedImage {
  id: string;
  dataUrl: string;
  timestamp: number;
}

class PopupController {
  private camera: Camera;
  private scanner: QRScanner;
  private elements: {
    video: HTMLVideoElement;
    sharedVideoContainer: HTMLDivElement;
    permissionPrompt: HTMLDivElement;
    cameraReady: HTMLDivElement;
    requestCameraBtn: HTMLButtonElement;
    errorMessage: HTMLDivElement;
    toggleCameraBtn: HTMLButtonElement;
    resultSection: HTMLDivElement;
    resultContent: HTMLDivElement;
    copyBtn: HTMLButtonElement;
    openBtn: HTMLButtonElement;
    galleryBtn: HTMLButtonElement;
    galleryView: HTMLDivElement;
    captureBtn: HTMLButtonElement;
    galleryGrid: HTMLDivElement;
    clearGalleryBtn: HTMLButtonElement;
  };
  private lastResult: string = "";
  private capturedImages: CapturedImage[] = [];
  private cameraPermissionGranted: boolean = false;

  constructor() {
    this.elements = {
      video: document.getElementById("video") as HTMLVideoElement,
      sharedVideoContainer: document.getElementById(
        "sharedVideoContainer",
      ) as HTMLDivElement,
      permissionPrompt: document.getElementById(
        "permissionPrompt",
      ) as HTMLDivElement,
      cameraReady: document.getElementById("cameraReady") as HTMLDivElement,
      requestCameraBtn: document.getElementById(
        "requestCameraBtn",
      ) as HTMLButtonElement,
      errorMessage: document.getElementById("errorMessage") as HTMLDivElement,
      toggleCameraBtn: document.getElementById(
        "toggleCamera",
      ) as HTMLButtonElement,
      resultSection: document.getElementById("resultSection") as HTMLDivElement,
      resultContent: document.getElementById("resultContent") as HTMLDivElement,
      copyBtn: document.getElementById("copyBtn") as HTMLButtonElement,
      openBtn: document.getElementById("openBtn") as HTMLButtonElement,
      galleryBtn: document.getElementById("galleryBtn") as HTMLButtonElement,
      galleryView: document.getElementById("galleryView") as HTMLDivElement,
      captureBtn: document.getElementById("captureBtn") as HTMLButtonElement,
      galleryGrid: document.getElementById("galleryGrid") as HTMLDivElement,
      clearGalleryBtn: document.getElementById(
        "clearGalleryBtn",
      ) as HTMLButtonElement,
    };

    this.camera = new Camera(this.elements.video);
    this.scanner = new QRScanner();
    this.setupEventListeners();

    this.initialize();
  }

  private setupEventListeners(): void {
    this.elements.requestCameraBtn.addEventListener("click", () =>
      this.requestCameraPermission(),
    );
    this.elements.toggleCameraBtn.addEventListener("click", () =>
      this.toggleCamera(),
    );
    this.elements.copyBtn.addEventListener("click", () => this.copyResult());
    this.elements.openBtn.addEventListener("click", () => this.openResult());

    this.elements.galleryBtn.addEventListener("click", () =>
      this.toggleGallery(),
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
    });
  }

  private async initialize(): Promise<void> {
    await this.loadGallery();
    await this.checkCameraPermission();
  }

  private async checkCameraPermission(): Promise<void> {
    try {
      const data = await browserAPI.storage.local.get(
        "cameraPermissionGranted",
      );
      this.cameraPermissionGranted = data.cameraPermissionGranted || false;

      if (this.cameraPermissionGranted) {
        this.elements.permissionPrompt.style.display = "none";
        this.elements.cameraReady.style.display = "flex";
        this.elements.requestCameraBtn.style.display = "none";
        this.elements.toggleCameraBtn.style.display = "block";
        this.elements.toggleCameraBtn.textContent = "Start Camera";
        this.elements.galleryBtn.style.display = "block";
      } else {
        this.elements.permissionPrompt.style.display = "flex";
        this.elements.cameraReady.style.display = "none";
        this.elements.requestCameraBtn.style.display = "block";
        this.elements.toggleCameraBtn.style.display = "none";
      }
    } catch (error) {
      console.error("Failed to check permission:", error);
      this.cameraPermissionGranted = false;
    }
  }

  private async saveCameraPermission(granted: boolean): Promise<void> {
    try {
      await browserAPI.storage.local.set({ cameraPermissionGranted: granted });
      this.cameraPermissionGranted = granted;
    } catch (error) {
      console.error("Failed to save permission:", error);
    }
  }

  private toggleGallery(): void {
    const isVisible = this.elements.galleryView.style.display !== "none";

    if (isVisible) {
      // Hide gallery, show camera
      this.elements.galleryView.style.display = "none";
      this.elements.galleryBtn.textContent = "Gallery";

      // Show camera button
      if (this.cameraPermissionGranted) {
        this.elements.toggleCameraBtn.style.display = "block";
        if (this.camera.isActive()) {
          this.elements.sharedVideoContainer.style.display = "block";
          this.elements.captureBtn.style.display = "block";
        } else {
          this.elements.cameraReady.style.display = "flex";
        }
      } else {
        this.elements.requestCameraBtn.style.display = "block";
      }
    } else {
      this.elements.galleryView.style.display = "block";
      this.elements.galleryBtn.textContent = "Camera";
      this.elements.sharedVideoContainer.style.display = "none";
      this.elements.cameraReady.style.display = "none";
      this.elements.captureBtn.style.display = "none";
      this.elements.resultSection.style.display = "none";

      this.elements.toggleCameraBtn.style.display = "none";
      this.elements.requestCameraBtn.style.display = "none";

      this.refreshGallery();
    }
  }

  private async requestCameraPermission(): Promise<void> {
    try {
      this.showLoading();
      await this.startCamera();
      await this.saveCameraPermission(true);
      this.elements.requestCameraBtn.style.display = "none";
    } catch (error) {
      console.log(error);
      await this.saveCameraPermission(false);
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
      this.elements.cameraReady.style.display = "none";

      this.elements.sharedVideoContainer.style.display = "block";
      this.elements.toggleCameraBtn.style.display = "block";

      await this.camera.start();
      this.hideLoading();

      await this.waitForVideoReady();

      // Start QR scanning
      await this.scanner.startScanning(this.elements.video, (result) =>
        this.handleScanResult(result),
      );

      // Show capture button
      this.elements.captureBtn.style.display = "block";

      this.elements.toggleCameraBtn.textContent = "Stop Camera";
    } catch (error) {
      this.hideLoading();
      throw error;
    }
  }

  private stopCamera(): void {
    this.scanner.stopScanning();
    this.camera.stop();
    this.elements.sharedVideoContainer.style.display = "none";
    this.elements.cameraReady.style.display = "flex";
    this.elements.captureBtn.style.display = "none";
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
          await this.saveCameraPermission(false);
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
    this.elements.sharedVideoContainer.style.display = "none";
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.style.display = "block";
    this.elements.toggleCameraBtn.textContent = "Start Camera";
    this.elements.toggleCameraBtn.style.display = "block";
  }

  private hideError(): void {
    this.elements.errorMessage.style.display = "none";
    this.elements.sharedVideoContainer.style.display = "block";
  }

  private showLoading(): void {
    this.elements.permissionPrompt.style.display = "none";
    this.elements.errorMessage.style.display = "none";
    this.elements.sharedVideoContainer.style.display = "flex";
    this.elements.sharedVideoContainer.classList.add("loading");
  }

  private hideLoading(): void {
    this.elements.sharedVideoContainer.classList.remove("loading");
  }

  private async captureImage(): Promise<void> {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = this.elements.video.videoWidth;
      canvas.height = this.elements.video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      ctx.drawImage(this.elements.video, 0, 0);
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
      this.elements.galleryGrid.textContent = "";

      const emptyDiv = document.createElement("div");
      emptyDiv.className = "empty-gallery";

      const iconDiv = document.createElement("div");
      iconDiv.className = "empty-icon";
      iconDiv.textContent = "📷";

      const messageP = document.createElement("p");
      messageP.textContent = "No images captured yet";

      const hintP = document.createElement("p");
      hintP.className = "empty-hint";
      hintP.textContent = "Switch to the Camera tab to start capturing";

      emptyDiv.appendChild(iconDiv);
      emptyDiv.appendChild(messageP);
      emptyDiv.appendChild(hintP);
      this.elements.galleryGrid.appendChild(emptyDiv);

      this.elements.clearGalleryBtn.style.display = "none";
    } else {
      this.elements.clearGalleryBtn.style.display = "block";
      this.elements.galleryGrid.textContent = "";

      this.capturedImages
        .slice()
        .reverse()
        .forEach((image) => {
          const item = document.createElement("div");
          item.className = "gallery-item";

          const img = document.createElement("img");
          img.src = image.dataUrl;
          img.alt = "Captured image";

          const actionsDiv = document.createElement("div");
          actionsDiv.className = "gallery-item-actions";

          const downloadBtn = document.createElement("button");
          downloadBtn.className = "gallery-item-btn download-btn";
          downloadBtn.textContent = "Save";

          const deleteBtn = document.createElement("button");
          deleteBtn.className = "gallery-item-btn delete-btn";
          deleteBtn.textContent = "Delete";

          actionsDiv.appendChild(downloadBtn);
          actionsDiv.appendChild(deleteBtn);
          item.appendChild(img);
          item.appendChild(actionsDiv);

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
    this.capturedImages = this.capturedImages.filter((img) => img.id !== id);
    await this.saveGallery();
    this.refreshGallery();
  }

  private async clearGallery(): Promise<void> {
    if (!confirm("Clear all captured images?")) {
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
      remove: (keys: string | string[]) => Promise<void>;
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
      remove: (keys: string | string[]) => Promise<void>;
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
