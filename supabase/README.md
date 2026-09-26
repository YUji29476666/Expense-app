# Supabase (Edge Function only)

Supabase hosts one Edge Function, `parse-receipt`, which forwards a photo or
screenshot to Gemini and returns the extracted transaction as JSON. The app's
data stays in on-device SQLite; no Supabase database, auth or storage is used.

## Deploy

Run from the repository root on your PC (needs the Supabase CLI and `supabase login`):

```bash
supabase link --project-ref vzfbpbvgdftylzwxebpj
supabase secrets set GEMINI_API_KEY=<your Gemini API key>
supabase functions deploy parse-receipt
```

- The Gemini key goes only into Supabase secrets. Never commit it or put it in the app.
- Optional: `supabase secrets set GEMINI_MODEL=<model id>` overrides the default `gemini-3.1-flash-lite`.
- Logs (token counts and errors only; images are never logged):
  Dashboard → Edge Functions → parse-receipt → Logs.

## Abuse and cost limits

The anon key ships inside the app, so anyone who extracts it can call the function.
Three layers keep Gemini spend bounded:

1. **Google Cloud quota and budget (hard cap)** on the API key's project:
   APIs & Services → Generative Language API → Quotas (requests per day), and
   Billing → Budgets & alerts.
2. **In-function throttling** (`rate-limit.ts`): 5 requests/minute and 30/hour per
   client IP, 60/minute per instance; over the limit returns 429 with `Retry-After`.
   Best-effort only: counters live in memory and reset when an instance is recycled.
3. **Monthly cap in the app** (Settings), which limits honest use from the app itself.

Request size is also capped (~3 MB image) before anything reaches Gemini.

## Test

Pure request/response logic lives in `functions/parse-receipt/receipt.ts` and is
covered by the app's jest suite (`npx jest`). Type-check the Deno entry point with
`deno check supabase/functions/parse-receipt/index.ts`.
