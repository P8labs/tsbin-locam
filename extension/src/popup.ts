import { Camera } from "./lib/camera.js";
import { QRScanner } from "./lib/scanner.js";

class PopupController {
  private camera: Camera;
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
  };
  private lastResult: string = "";

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
    };

    this.camera = new Camera(this.elements.video);
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

    window.addEventListener("unload", () => {
      this.scanner.stopScanning();
      this.camera.stop();
    });
  }

  private async initialize(): Promise<void> {
    this.elements.permissionPrompt.style.display = "flex";
    this.elements.toggleCameraBtn.style.display = "none";
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
}

declare const browser: {
  runtime: {
    getURL: (path: string) => string;
  };
  tabs: {
    create: (options: { url: string }) => Promise<any>;
  };
};

declare const chrome: {
  runtime: {
    getURL: (path: string) => string;
  };
  tabs: {
    create: (options: { url: string }) => Promise<any>;
  };
};

const browserAPI =
  typeof browser !== "undefined" ? browser : (chrome as typeof browser);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new PopupController());
} else {
  new PopupController();
}
