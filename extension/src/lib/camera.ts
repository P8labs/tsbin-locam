export class Camera {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
  }

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      this.videoElement.srcObject = this.stream;

      await new Promise<void>((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play().then(resolve);
        };
      });

      //   await this.videoElement.play();
    } catch (error) {
      this.handleError(error);
    }
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.videoElement.srcObject = null;
    }
  }

  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  private handleError(error: unknown): never {
    if (error instanceof DOMException) {
      switch (error.name) {
        case "NotAllowedError":
          throw new Error(
            "Camera access denied. Please allow camera permissions in your browser settings.",
          );
        case "NotFoundError":
          throw new Error(
            "No camera detected. Please connect a camera and try again.",
          );
        case "NotReadableError":
          throw new Error("Camera is in use by another application.");
        case "OverconstrainedError":
          throw new Error("Camera unavailable. Try restarting your browser.");
        default:
          throw new Error("Camera unavailable. Check browser permissions.");
      }
    }
    throw new Error("Camera unavailable. Check browser permissions.");
  }
}
