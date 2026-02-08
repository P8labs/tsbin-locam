import { BrowserQRCodeReader } from "@zxing/browser";

export class QRScanner {
  private reader: BrowserQRCodeReader;
  private scanning: boolean = false;
  private onResultCallback: ((result: string) => void) | null = null;

  constructor() {
    this.reader = new BrowserQRCodeReader();
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    onResult: (result: string) => void,
  ): Promise<void> {
    this.scanning = true;
    this.onResultCallback = onResult;

    try {
      await this.reader.decodeFromVideoElement(videoElement, (result) => {
        if (result && this.scanning) {
          const text = result.getText();
          if (text && this.onResultCallback) {
            this.onResultCallback(text);
          }
        }
      });
    } catch (error) {
      console.error("Scanner error:", error);
      this.scanning = false;
    }
  }

  stopScanning(): void {
    this.scanning = false;
    this.onResultCallback = null;
    // this.reader.reset()
  }

  isScanning(): boolean {
    return this.scanning;
  }
}
