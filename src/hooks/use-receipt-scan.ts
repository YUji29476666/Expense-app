import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { isCategoryForType } from '@/constants/categories';
import type { CategoryRow } from '@/db/types';
import { formatISODate } from '@/domain/month-period';
import { computeReceiptResize, RECEIPT_JPEG_QUALITY } from '@/domain/receipt-image';
import { parseReceiptImage, type CategoryOption, type ReceiptApiResult } from '@/lib/receipt-api';

export type ReceiptSource = 'camera' | 'library';

export type ReceiptScanOutcome =
  | { status: 'canceled' }
  | { status: 'permission_denied' }
  | { status: 'done'; result: ReceiptApiResult };

// Categories as the Edge Function expects them. "Other" is valid for both
// types but can carry only one, so it is offered as an expense category.
function toCategoryOptions(categories: CategoryRow[]): CategoryOption[] {
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    type: isCategoryForType(category.id, 'expense') ? 'expense' : 'income',
  }));
}

// Picks a photo or screenshot, shrinks it to a JPEG on the device, and
// sends it to parse-receipt. The image itself is never stored anywhere.
export function useReceiptScan(categories: CategoryRow[]) {
  const [isScanning, setIsScanning] = useState(false);

  async function pickImage(source: ReceiptSource): Promise<ImagePicker.ImagePickerResult | 'permission_denied'> {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        return 'permission_denied';
      }
      return ImagePicker.launchCameraAsync(options);
    }
    return ImagePicker.launchImageLibraryAsync(options);
  }

  async function scan(source: ReceiptSource): Promise<ReceiptScanOutcome> {
    const picked = await pickImage(source);
    if (picked === 'permission_denied') {
      return { status: 'permission_denied' };
    }
    if (picked.canceled || picked.assets.length === 0) {
      return { status: 'canceled' };
    }
    const asset = picked.assets[0];

    setIsScanning(true);
    let base64: string;
    try {
      // Always re-encode as JPEG: shrinks the upload and turns HEIC/PNG
      // screenshots into a format the function accepts.
      const context = ImageManipulator.manipulate(asset.uri);
      const resize = computeReceiptResize(asset.width, asset.height);
      if (resize) {
        context.resize(resize);
      }
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({ base64: true, compress: RECEIPT_JPEG_QUALITY, format: SaveFormat.JPEG });
      if (!saved.base64) {
        throw new Error('no base64 from saveAsync');
      }
      base64 = saved.base64;
    } catch {
      setIsScanning(false);
      return { status: 'done', result: { ok: false, error: 'image_error' } };
    }

    try {
      const result = await parseReceiptImage({
        imageBase64: base64,
        mimeType: 'image/jpeg',
        today: formatISODate(new Date()),
        categories: toCategoryOptions(categories),
      });
      return { status: 'done', result };
    } finally {
      setIsScanning(false);
    }
  }

  return { scan, isScanning };
}
