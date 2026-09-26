import { computeReceiptResize, RECEIPT_MAX_LONG_SIDE } from '../receipt-image';

describe('computeReceiptResize', () => {
  it('leaves images within the limit untouched', () => {
    expect(computeReceiptResize(1000, 1800)).toBeNull();
    expect(computeReceiptResize(RECEIPT_MAX_LONG_SIDE, RECEIPT_MAX_LONG_SIDE)).toBeNull();
  });

  it('pins the height of a tall screenshot', () => {
    expect(computeReceiptResize(1170, 2532)).toEqual({ height: RECEIPT_MAX_LONG_SIDE });
  });

  it('pins the width of a landscape photo', () => {
    expect(computeReceiptResize(4032, 3024)).toEqual({ width: RECEIPT_MAX_LONG_SIDE });
  });

  it('pins the width of a square image over the limit', () => {
    expect(computeReceiptResize(3000, 3000)).toEqual({ width: RECEIPT_MAX_LONG_SIDE });
  });
});
