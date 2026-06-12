import { randomUUID } from "node:crypto";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() ?? "";
const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || "o4-mini";
const OPENAI_REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT?.trim() || "medium";
const OPENAI_URL = "https://api.openai.com/v1/responses";

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function renderTemplate(template, variables = {}) {
  return String(template).replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, path) => {
    const value = path.split(".").reduce((current, key) => (current && typeof current === "object" ? current[key] : undefined), variables);
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(value);
  });
}

function extractTextFromResponse(payload) {
  if (!payload) return "";
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (typeof payload.text === "string" && payload.text.trim()) {
    return payload.text.trim();
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const chunks = [];

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === "string") chunks.push(part.text);
      if (typeof part?.value === "string") chunks.push(part.value);
    }
  }

  return chunks.join("\n").trim();
}

function splitBullets(text) {
  return normalizeText(text)
    .split(/\n|•|-/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 3);
}

async function callOpenAI({ instructions, input, model = OPENAI_MODEL, maxOutputTokens = 220 }) {
  if (!OPENAI_API_KEY) return null;

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      reasoning: { effort: OPENAI_REASONING_EFFORT },
      max_output_tokens: maxOutputTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`OpenAI request failed (${response.status}): ${errorText || response.statusText}`);
  }

  const payload = await response.json();
  const text = extractTextFromResponse(payload);
  return text ? { text, model: payload.model ?? model } : null;
}

function buildAnalysisRecord({
  promptKey,
  entityType,
  entityId,
  input,
  summary,
  bullets,
  source,
  model,
}) {
  return {
    id: `ai-${randomUUID()}`,
    promptKey,
    entityType,
    entityId,
    input,
    summary: normalizeText(summary),
    bullets: Array.isArray(bullets) ? bullets : [],
    source,
    model,
    createdAt: new Date().toISOString(),
  };
}

export function listAiPrompts(store) {
  return [...(store.aiPrompts ?? [])].filter((prompt) => prompt.active !== false);
}

export function getAiPrompt(store, key) {
  return listAiPrompts(store).find((prompt) => prompt.key === key) ?? null;
}

export function listAiAnalyses(store, promptKey) {
  const analyses = Array.isArray(store.aiAnalyses) ? store.aiAnalyses : [];
  const filtered = promptKey ? analyses.filter((analysis) => analysis.promptKey === promptKey) : analyses;
  return [...filtered];
}

export function updateAiPrompt(store, key, patch = {}) {
  const prompt = Array.isArray(store.aiPrompts) ? store.aiPrompts.find((item) => item.key === key) : null;
  if (!prompt) return null;

  if (typeof patch.title === "string") prompt.title = patch.title;
  if (typeof patch.category === "string") prompt.category = patch.category;
  if (typeof patch.description === "string") prompt.description = patch.description;
  if (typeof patch.template === "string") prompt.template = patch.template;
  if (typeof patch.instructions === "string") prompt.instructions = patch.instructions;
  if (typeof patch.model === "string") prompt.model = patch.model;
  if (typeof patch.active === "boolean") prompt.active = patch.active;
  prompt.updatedAt = new Date().toISOString();

  return prompt;
}

export async function generateAiAnalysis({
  store,
  promptKey,
  entityType,
  entityId,
  input,
  fallbackSummary,
  fallbackBullets = [],
  maxOutputTokens = 220,
  extraInstructions = "",
}) {
  const prompt = getAiPrompt(store, promptKey);
  const promptInput = prompt ? renderTemplate(prompt.template, input) : JSON.stringify(input, null, 2);
  const instructions = [
    prompt?.instructions,
    extraInstructions,
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  let summary = fallbackSummary;
  let bullets = Array.isArray(fallbackBullets) ? [...fallbackBullets] : [];
  let source = "mock";
  let model = prompt?.model ?? OPENAI_MODEL;

  try {
    const aiResponse = await callOpenAI({
      instructions: instructions || "Write a short, practical logistics analysis.",
      input: promptInput,
      model,
      maxOutputTokens,
    });

    if (aiResponse?.text) {
      summary = aiResponse.text;
      bullets = splitBullets(aiResponse.text);
      source = "openai";
      model = aiResponse.model ?? model;
    }
  } catch (error) {
    console.warn(`AI analysis fallback for ${promptKey}:`, error instanceof Error ? error.message : error);
  }

  const analysis = buildAnalysisRecord({
    promptKey,
    entityType,
    entityId,
    input,
    summary,
    bullets,
    source,
    model,
  });

  if (!Array.isArray(store.aiAnalyses)) {
    store.aiAnalyses = [];
  }

  store.aiAnalyses.unshift(analysis);
  if (store.aiAnalyses.length > 500) {
    store.aiAnalyses.length = 500;
  }

  return {
    prompt,
    analysis,
  };
}
