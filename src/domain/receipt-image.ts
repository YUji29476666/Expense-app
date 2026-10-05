// Sizing for images sent to the parse-receipt Edge Function (SPEC.md 8).
// Shrinking before upload keeps requests far under the function's ~3 MB cap
// and cuts Gemini input cost, while leaving receipt text legible.

// 1800px on the long side keeps a phone screenshot (e.g. 1170x2532 ->
// 832x1800) and a receipt photo readable.
export const RECEIPT_MAX_LONG_SIDE = 1800;
export const RECEIPT_JPEG_QUALITY = 0.7;

// The resize to apply, as the single dimension to pin (the other follows
// the aspect ratio), or null when the image is already small enough.
export function computeReceiptResize(
  width: number,
  height: number,
  maxLongSide: number = RECEIPT_MAX_LONG_SIDE
): { width: number } | { height: number } | null {
  if (width <= maxLongSide && height <= maxLongSide) {
    return null;
  }
  return width >= height ? { width: maxLongSide } : { height: maxLongSide };
}
