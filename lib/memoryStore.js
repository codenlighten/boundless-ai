import { readFile, writeFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import { queryOpenAI } from "./openaiWrapper.js";
import { summarizeAgentResponseSchema } from "../schemas/summarizeAgent.js";
import { evolvePersonality } from "./personalityEvolver.js";
import { updateCompanyLegend } from "./companyLegend.js";

const DEFAULT_INTERACTIONS_LIMIT = 21;
const DEFAULT_SUMMARIES_LIMIT = 3;

function nowIso() {
  return new Date().toISOString();
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function normalizeSession(session) {
  return {
    interactions: Array.isArray(session.interactions) ? session.interactions : [],
    summaries: Array.isArray(session.summaries) ? session.summaries : [],
    nextId: Number.isInteger(session.nextId) ? session.nextId : 1,
    personality: session.personality ?? null,
    personalityEvolutionEnabled:
      typeof session.personalityEvolutionEnabled === "boolean"
        ? session.personalityEvolutionEnabled
        : true,
    personalityImmutable:
      typeof session.personalityImmutable === "boolean"
        ? session.personalityImmutable
        : false
  };
}

export async function loadSession(sessionPath) {
  if (!(await fileExists(sessionPath))) {
    return normalizeSession({});
  }

  const raw = await readFile(sessionPath, "utf-8");
  const parsed = JSON.parse(raw);
  return normalizeSession(parsed);
}

export async function saveSession(sessionPath, session) {
  const payload = JSON.stringify(session, null, 2);
  await writeFile(sessionPath, payload, "utf-8");
}

function buildSummaryPrompt(interactions) {
  const text = interactions
    .map((item) => `${item.role.toUpperCase()}: ${item.text}`)
    .join("\n");

  return `Summarize the following chat interactions in 3-5 sentences, focusing on goals, decisions, facts, names, and evolving state.\n\n${text}`;
}

async function summarizeInteractions(interactions) {
  const prompt = buildSummaryPrompt(interactions);
  const result = await queryOpenAI(prompt, {
    schema: summarizeAgentResponseSchema
  });
  return result.summary;
}

export async function addInteraction(session, interaction, options = {}) {
  const {
    interactionsLimit = DEFAULT_INTERACTIONS_LIMIT,
    summariesLimit = DEFAULT_SUMMARIES_LIMIT,
    sessionId = null // Optional session identifier for legend tracking
  } = options;

  const enriched = {
    id: session.nextId,
    ...interaction,
    ts: interaction.ts || nowIso()
  };

  session.nextId += 1;
  session.interactions.push(enriched);

  while (session.interactions.length > interactionsLimit) {
    const interactionsToSummarize = session.interactions.slice(0, interactionsLimit);
    const summaryText = await summarizeInteractions(interactionsToSummarize);
    const summary = {
      range: {
        startId: interactionsToSummarize[0]?.id ?? null,
        endId: interactionsToSummarize[interactionsToSummarize.length - 1]?.id ?? null
      },
      text: summaryText,
      ts: nowIso()
    };

    session.summaries.push(summary);
    if (session.summaries.length > summariesLimit) {
      session.summaries.shift();
    }

    // Update company legend with facts from this summary
    if (sessionId) {
      try {
        await updateCompanyLegend(summary, sessionId, { interactions: interactionsToSummarize });
      } catch (err) {
        console.error("[MemoryStore] Failed to update company legend:", err.message);
      }
    }

    // Evolve personality at summarization point
    if (
      session.personality &&
      session.personalityEvolutionEnabled !== false &&
      session.personalityImmutable !== true
    ) {
      const evolution = await evolvePersonality(
        session.personality,
        interactionsToSummarize,
        session.summaries
      );
      if (evolution.personality) {
        session.personality = evolution.personality;
        console.log(`[PersonalityEvolution] ${evolution.explanation}`);
      }
    }

    session.interactions.shift();
  }

  return session;
}

export function buildContext(session) {
  const summariesNewestFirst = [...session.summaries].reverse();
  return {
    personality: session.personality ?? null,
    summaries: summariesNewestFirst,
    interactions: session.interactions,
    personalityEvolutionEnabled: session.personalityEvolutionEnabled,
    personalityImmutable: session.personalityImmutable
  };
}
