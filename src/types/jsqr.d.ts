declare module 'jsqr' {
  export interface QRLocationPoint { x: number; y: number }
  export interface QRLocation {
    topRightCorner: QRLocationPoint;
    topLeftCorner: QRLocationPoint;
    bottomRightCorner: QRLocationPoint;
    bottomLeftCorner: QRLocationPoint;
    topRightFinderPattern: QRLocationPoint;
    topLeftFinderPattern: QRLocationPoint;
    bottomLeftFinderPattern: QRLocationPoint;
    bottomRightAlignmentPattern?: QRLocationPoint;
  }
  export interface QRCodeResult {
    binaryData: number[];
    data: string;
    chunks: any[];
    version: number;
    location: QRLocation;
  }
  export interface JSQROptions {
    inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
  }
  const jsQR: (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: JSQROptions
  ) => QRCodeResult | null;
  export default jsQR;
}
