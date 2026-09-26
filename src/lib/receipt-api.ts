// Client for the parse-receipt Supabase Edge Function (SPEC.md 8). The app
// never talks to Gemini directly and holds no Gemini key; it only knows the
// function URL and the project's public anon key, both read from .env
// (EXPO_PUBLIC_*), which is gitignored.

// Type-only import: erased at build time, so no Edge Function code ships in
// the app, but both sides share one definition of the wire format.
import type {
  CategoryOption,
  ParsedReceipt,
  ParseReceiptError,
  ParseReceiptRequest,
  ParseReceiptResponse,
} from '../../supabase/functions/parse-receipt/receipt';

export type { CategoryOption, ParsedReceipt };

const REQUEST_TIMEOUT_MS = 35_000;

export type ReceiptApiError = ParseReceiptError | 'not_configured' | 'network_error';

export type ReceiptApiResult = { ok: true; receipt: ParsedReceipt } | { ok: false; error: ReceiptApiError };

function getConfig(): { url: string; anonKey: string } | null {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    return null;
  }
  return { url: `${baseUrl.replace(/\/+$/, '')}/functions/v1/parse-receipt`, anonKey };
}

function isParseReceiptResponse(value: unknown): value is ParseReceiptResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.ok === true ? typeof record.receipt === 'object' && record.receipt !== null : typeof record.error === 'string';
}

export async function parseReceiptImage(request: ParseReceiptRequest): Promise<ReceiptApiResult> {
  const config = getConfig();
  if (!config) {
    return { ok: false, error: 'not_configured' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.anonKey}`,
        apikey: config.anonKey,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    const body: unknown = await response.json().catch(() => null);
    if (isParseReceiptResponse(body)) {
      return body.ok ? { ok: true, receipt: body.receipt } : { ok: false, error: body.error };
    }
    // Non-function responses, e.g. the Supabase gateway rejecting the key.
    return { ok: false, error: response.status === 429 ? 'rate_limited' : 'model_error' };
  } catch {
    return { ok: false, error: 'network_error' };
  } finally {
    clearTimeout(timeout);
  }
}

// User-facing copy for each failure. Every failure falls back to manual entry.
export function describeReceiptApiError(error: ReceiptApiError): string {
  switch (error) {
    case 'not_configured':
      return 'Receipt reading is not set up. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.';
    case 'network_error':
      return 'Could not reach the receipt reader. Check your connection and try again.';
    case 'rate_limited':
      return 'Too many scans in a short time. Wait a minute and try again.';
    case 'payload_too_large':
      return 'The image is too large to read.';
    case 'not_a_transaction':
      return 'No transaction was found in this image.';
    case 'invalid_request':
    case 'method_not_allowed':
    case 'model_error':
    case 'server_misconfigured':
      return 'The receipt could not be read. Please enter it manually.';
  }
}
