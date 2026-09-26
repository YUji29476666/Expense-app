// Supabase Edge Function: reads one transaction from a photo or screenshot
// with Gemini and returns it as JSON for the app's confirmation screen.
//
// - The Gemini API key lives only in this function's secrets
//   (`supabase secrets set GEMINI_API_KEY=...`), never in the app.
// - The image is forwarded to Gemini and then dropped; nothing is stored
//   and nothing about the image is logged.
// - Callers must send the project's anon key (verify_jwt in config.toml),
//   which Supabase checks before this code runs.

import {
  buildPrompt,
  MAX_REQUEST_BYTES,
  parseModelOutput,
  RESPONSE_SCHEMA,
  validateRequest,
  type ParseReceiptError,
  type ParseReceiptResponse,
} from './receipt.ts';

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.1-flash-lite';
const GEMINI_TIMEOUT_MS = 25_000;

type GeminiPart = { text?: string; thought?: boolean };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
};

function respond(body: ParseReceiptResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fail(error: ParseReceiptError, status: number): Response {
  return respond({ ok: false, error }, status);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return fail('method_not_allowed', 405);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return fail('server_misconfigured', 500);
  }

  // Reject oversized uploads before buffering them.
  const declaredLength = Number(req.headers.get('content-length') ?? '0');
  if (declaredLength > MAX_REQUEST_BYTES) {
    return fail('payload_too_large', 413);
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return fail('invalid_request', 400);
  }
  if (rawBody.length > MAX_REQUEST_BYTES) {
    return fail('payload_too_large', 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return fail('invalid_request', 400);
  }
  const validated = validateRequest(body);
  if (!validated.ok) {
    return fail(validated.error === 'image is too large' ? 'payload_too_large' : 'invalid_request', 400);
  }
  const request = validated.value;

  let gemini: GeminiResponse;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType: request.mimeType, data: request.imageBase64 } },
                { text: buildPrompt(request) },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0,
          },
        }),
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      }
    );
    if (!response.ok) {
      // Status only: the error body can echo request details.
      console.error(`Gemini returned ${response.status}`);
      return fail('model_error', 502);
    }
    gemini = (await response.json()) as GeminiResponse;
  } catch (error) {
    console.error('Gemini request failed:', error instanceof Error ? error.name : 'unknown');
    return fail('model_error', 502);
  }

  const usage = gemini.usageMetadata;
  console.log(
    `parse-receipt model=${MODEL} tokens in=${usage?.promptTokenCount ?? '?'} out=${usage?.candidatesTokenCount ?? '?'}`
  );

  const candidate = gemini.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((part) => !part.thought && typeof part.text === 'string')
    .map((part) => part.text)
    .join('');
  if (!text) {
    console.error(`Gemini returned no text (finishReason=${candidate?.finishReason ?? 'none'})`);
    return fail('model_error', 502);
  }

  const parsed = parseModelOutput(text, request.categories);
  if (!parsed.ok) {
    return parsed.error === 'not_a_transaction' ? fail('not_a_transaction', 422) : fail('model_error', 502);
  }
  return respond({ ok: true, receipt: parsed.value }, 200);
});
