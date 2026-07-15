const DEFAULT_TEXT_MODEL = "gpt-5.6-sol";
const DEFAULT_GRAPH_VERSION = "v25.0";
const CRETE_TIME_ZONE = "Europe/Athens";

const env = process.env;

function readBoolean(name, fallback = false) {
  const value = env[name];
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "ja", "on"].includes(value.toLowerCase());
}

function requireEnv(name) {
  const value = env[name];
  if (!value) {
    throw new Error(`Umgebungsvariable ${name} fehlt.`);
  }
  return value;
}

function getTextModel() {
  return env.OPENAI_MODEL?.trim() || DEFAULT_TEXT_MODEL;
}

function getCreteDateContext(date = new Date()) {
  const formatted = new Intl.DateTimeFormat("de-DE", {
    timeZone: CRETE_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

  const isoDate = new Intl.DateTimeFormat("sv-SE", {
    timeZone: CRETE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  return { formatted, isoDate, timeZone: CRETE_TIME_ZONE };
}

function buildExistingPromptSection() {
  const parts = [];

  if (env.INPUT_FORMAT) {
    parts.push(`Gewünschtes Format / bestehende Formatvorgabe:\n${env.INPUT_FORMAT}`);
  }

  if (env.INPUT_WEEK_THEME) {
    parts.push(`Wochenthema / bestehender Themenprompt:\n${env.INPUT_WEEK_THEME}`);
  }

  if (readBoolean("INPUT_EVENT_ONLY", false)) {
    parts.push("Event-only-Modus: Erzeuge nur dann einen Post, wenn die Recherche ein relevantes Event oder einen Feiertag ergibt.");
  }

  if (!parts.length) {
    parts.push("Kein zusätzlicher bestehender Prompt wurde über INPUT_FORMAT oder INPUT_WEEK_THEME übergeben. Nutze die Standardvorgaben für einen natürlichen Kreta-/Griechenland-Post.");
  }

  return parts.join("\n\n");
}

function extractOutputText(response) {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const chunks = [];
  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && content?.text) {
        chunks.push(content.text);
      }
    }
  }

  const text = chunks.join("\n").trim();
  if (!text) {
    throw new Error("OpenAI-Antwort enthielt keinen Text.");
  }
  return text;
}

function stripJsonFence(text) {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseResearchJson(text) {
  try {
    return JSON.parse(stripJsonFence(text));
  } catch (error) {
    throw new Error(`Recherche-Antwort war kein gültiges JSON: ${error.message}\nAntwort:\n${text}`);
  }
}

function truncateForLog(value, maxLength = 12000) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n... [gekürzt, insgesamt ${text.length} Zeichen]`;
}

function redactOpenAIRequestBody(body) {
  return {
    ...body,
    input: typeof body.input === "string" ? `${body.input.slice(0, 1200)}${body.input.length > 1200 ? "\n... [gekürzt]" : ""}` : body.input,
  };
}

function makeOpenAIError(phase, status, data, requestId) {
  const message = data?.error?.message || data?.message || data?.raw || "Keine Fehlermeldung im OpenAI-Body.";
  const type = data?.error?.type || data?.type || "unknown";
  const param = data?.error?.param || data?.param || "unknown";
  const code = data?.error?.code || data?.code || "unknown";
  const detail = truncateForLog(data);
  return new Error(
    `OpenAI-${phase} fehlgeschlagen (${status}). request_id=${requestId || "unknown"}; type=${type}; code=${code}; param=${param}; message=${message}\n${detail}`,
  );
}

async function openaiRequest(path, body, phase = "Anfrage") {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const debug = readBoolean("DEBUG_OPENAI", true);

  if (debug) {
    console.error(`[OpenAI:${phase}] Request ${path}: ${truncateForLog(redactOpenAIRequestBody(body), 4000)}`);
  }

  const response = await fetch(`https://api.openai.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const requestId = response.headers.get("x-request-id") || response.headers.get("openai-request-id");
  const payload = await response.text();
  let data;
  try {
    data = payload ? JSON.parse(payload) : {};
  } catch {
    data = { raw: payload };
  }

  if (!response.ok) {
    throw makeOpenAIError(phase, response.status, data, requestId);
  }

  if (debug) {
    console.error(`[OpenAI:${phase}] OK request_id=${requestId || "unknown"}`);
  }

  return data;
}

async function openaiResponsesWithFallback(body, phase) {
  try {
    return await openaiRequest("responses", body, phase);
  } catch (error) {
    const isBadRequest = /\(400\)/.test(error.message || "");
    if (!isBadRequest || body.max_output_tokens == null) {
      throw error;
    }

    const retryBody = { ...body };
    delete retryBody.max_output_tokens;
    console.error(`[OpenAI:${phase}] 400 erhalten; retry ohne max_output_tokens.`);
    return openaiRequest("responses", retryBody, `${phase}:retry-ohne-max_output_tokens`);
  }
}

async function researchTodayContext(dateContext) {
  const model = getTextModel();
  const existingPrompt = buildExistingPromptSection();

  const response = await openaiResponsesWithFallback({
    model,
    tools: [
      {
        type: "web_search",
        user_location: {
          type: "approximate",
          country: "GR",
          region: "Crete",
          timezone: CRETE_TIME_ZONE,
        },
      },
    ],
    input: `Heute ist ${dateContext.formatted} (${dateContext.isoDate}) in der Zeitzone ${dateContext.timeZone}.

Führe zuerst eine Websuche durch. Prüfe:
1. Welcher Wochentag und welches Datum heute auf Kreta/in Griechenland ist.
2. Ob heute ein offizieller griechischer Feiertag, Namenstag oder kulturell relevanter Tag ist.
3. Ob heute ein relevantes kretanisches Event, Fest, Markt, kulturelles Ereignis oder saisonales Thema stattfindet.
4. Ob sich daraus ein geeigneter Social-Media-Aufhänger ergibt.

Bestehender Prompt-Kontext, der im späteren Posting berücksichtigt werden muss:
${existingPrompt}

Antworte ausschließlich als JSON ohne Markdown:
{
  "date": "YYYY-MM-DD",
  "weekday": "...",
  "isGreekHoliday": false,
  "holidayName": null,
  "nameDay": null,
  "creteEvents": [
    {
      "name": "...",
      "location": "...",
      "summary": "...",
      "sourceUrl": "..."
    }
  ],
  "seasonalContext": "...",
  "usablePostContext": "...",
  "sources": ["..."]
}`,
    max_output_tokens: 1400,
  }, "Webrecherche");

  return parseResearchJson(extractOutputText(response));
}

async function generatePostFromResearch(research) {
  const model = getTextModel();
  const existingPrompt = buildExistingPromptSection();
  const eventOnly = readBoolean("INPUT_EVENT_ONLY", false);

  if (eventOnly && !research.isGreekHoliday && (!Array.isArray(research.creteEvents) || research.creteEvents.length === 0)) {
    return "";
  }

  const response = await openaiResponsesWithFallback({
    model,
    input: `Erstelle jetzt den finalen deutschen Facebook-Post auf Basis der Recherche.

Wichtig:
- Nutze den bestehenden Prompt-Kontext verbindlich.
- Nutze ausschließlich die folgenden recherchierten Informationen.
- Erfinde keine Feiertage, Events, Orte, Uhrzeiten oder Quellen.
- Wenn keine relevanten Events/Feiertage gefunden wurden, schreibe einen allgemeinen, saisonal passenden Kreta-/Griechenland-Post.
- Schreibe natürlich, freundlich, einladend und nicht zu werblich.
- Gib nur den finalen Posting-Text aus, keine Analyse und kein JSON.

Bestehender Prompt-Kontext:
${existingPrompt}

Recherchierte Informationen:
${JSON.stringify(research, null, 2)}`,
    max_output_tokens: 1200,
  }, "Textgenerierung");

  return extractOutputText(response);
}

async function publishToFacebook(message) {
  const pageId = requireEnv("FACEBOOK_PAGE_ID");
  const token = requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN");
  const version = env.FACEBOOK_GRAPH_VERSION || DEFAULT_GRAPH_VERSION;

  const params = new URLSearchParams({ message, access_token: token });
  const response = await fetch(`https://graph.facebook.com/${version}/${pageId}/feed`, {
    method: "POST",
    body: params,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Facebook-Veröffentlichung fehlgeschlagen (${response.status}).\n${JSON.stringify(data, null, 2)}`);
  }
  return data;
}

async function main() {
  const dateContext = getCreteDateContext();
  console.log(`Starte Recherche für ${dateContext.formatted} (${dateContext.timeZone}).`);

  let research;
  try {
    research = await researchTodayContext(dateContext);
  } catch (error) {
    console.error("OpenAI-Webrecherche fehlgeschlagen.", error.message || error);
    throw error;
  }

  console.log("Recherche abgeschlossen.", JSON.stringify(research, null, 2));

  let postText;
  try {
    postText = await generatePostFromResearch(research);
  } catch (error) {
    console.error("OpenAI-Textgenerierung fehlgeschlagen.", error.message || error);
    throw error;
  }

  if (!postText) {
    console.log("Kein Post erzeugt, weil INPUT_EVENT_ONLY aktiv ist und kein relevantes Event/Feiertag gefunden wurde.");
    return;
  }

  console.log("Finaler Post:\n" + postText);

  const shouldPublish = readBoolean("INPUT_PUBLISH", false) && (env.PUBLISH_MODE || "manual") === "automatic";
  if (!shouldPublish) {
    console.log("Veröffentlichung übersprungen: INPUT_PUBLISH ist nicht true oder PUBLISH_MODE ist nicht automatic.");
    return;
  }

  const result = await publishToFacebook(postText);
  console.log("Facebook-Post veröffentlicht.", JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
