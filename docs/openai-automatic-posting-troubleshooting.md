# OpenAI automatic posting troubleshooting

## `OpenAI-Textgenerierung fehlgeschlagen (400)` after adding web search

The posting workflow now separates OpenAI usage into two Responses API calls:

1. **Research step**: runs `web_search` to determine the current Crete/Greece date context, Greek holidays, name days, and relevant Cretan events.
2. **Post-generation step**: creates the final German Facebook post from the researched facts and the existing prompt inputs.

This avoids mixing a web-search tool call into a legacy Chat Completions payload, which can cause HTTP 400 responses.

## Expected request flow

```text
Crete date context
→ OpenAI Responses API with web_search
→ structured research JSON
→ OpenAI Responses API without web_search
→ final post text
→ optional Facebook publishing
```

## Existing prompt integration

The implementation preserves the existing prompt inputs by folding these environment values into both OpenAI steps:

- `INPUT_FORMAT`
- `INPUT_WEEK_THEME`
- `INPUT_EVENT_ONLY`

`INPUT_FORMAT` and `INPUT_WEEK_THEME` are included as binding prompt context during research and final text generation. `INPUT_EVENT_ONLY=true` prevents publishing generic fallback posts when the research finds no holiday or relevant event.

## Safer error logging

The script logs separate failure labels for the research and text-generation phases:

- `OpenAI-Webrecherche fehlgeschlagen.`
- `OpenAI-Textgenerierung fehlgeschlagen.`

The OpenAI response body is included in the thrown error so future 400 responses show the rejected parameter or unsupported tool combination. The script also logs the OpenAI request phase (`Webrecherche` or `Textgenerierung`), the request ID returned by OpenAI, and a redacted/truncated request body. Set `DEBUG_OPENAI=false` to suppress these diagnostic request logs after the workflow is stable.

If OpenAI rejects a Responses request with HTTP 400 and the request contained `max_output_tokens`, the script retries that same phase once without `max_output_tokens`. This keeps the run moving when an account/model combination rejects that optional limit, while still surfacing the original phase and retry in the logs.
