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

## Test

Pure request/response logic lives in `functions/parse-receipt/receipt.ts` and is
covered by the app's jest suite (`npx jest`). Type-check the Deno entry point with
`deno check supabase/functions/parse-receipt/index.ts`.
