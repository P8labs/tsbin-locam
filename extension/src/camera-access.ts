class CameraAccessController {
  private elements: {
    requestSection: HTMLDivElement;
    requestCameraBtn: HTMLButtonElement;
    troubleshootSection: HTMLDivElement;
    retryBtn: HTMLButtonElement;
    successSection: HTMLDivElement;
    closeBtn: HTMLButtonElement;
  };

  constructor() {
    this.elements = {
      requestSection: document.getElementById(
        "requestSection",
      ) as HTMLDivElement,
      requestCameraBtn: document.getElementById(
        "requestCameraBtn",
      ) as HTMLButtonElement,
      troubleshootSection: document.getElementById(
        "troubleshootSection",
      ) as HTMLDivElement,
      retryBtn: document.getElementById("retryBtn") as HTMLButtonElement,
      successSection: document.getElementById(
        "successSection",
      ) as HTMLDivElement,
      closeBtn: document.getElementById("closeBtn") as HTMLButtonElement,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.elements.requestCameraBtn.addEventListener("click", () =>
      this.requestCamera(),
    );
    this.elements.retryBtn.addEventListener("click", () =>
      this.requestCamera(),
    );
    this.elements.closeBtn.addEventListener("click", () => window.close());
  }

  private async requestCamera(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      stream.getTracks().forEach((track) => track.stop());

      this.showSuccess();
    } catch (error) {
      console.error("Camera access error:", error);
      this.showTroubleshoot();
    }
  }

  private showTroubleshoot(): void {
    this.elements.requestSection.style.display = "none";
    this.elements.troubleshootSection.style.display = "block";
    this.elements.successSection.style.display = "none";
  }

  private showSuccess(): void {
    this.elements.requestSection.style.display = "none";
    this.elements.troubleshootSection.style.display = "none";
    this.elements.successSection.style.display = "block";

    setTimeout(() => {
      window.close();
    }, 2000);
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => new CameraAccessController(),
  );
} else {
  new CameraAccessController();
}
