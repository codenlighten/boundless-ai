import OpenAI from 'openai';
import dotenv from 'dotenv';
import { universalAgentResponseSchema } from '../schemas/universalAgent.js';

dotenv.config();

// Support multiple LLM providers
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // 'openai' or 'ollama'
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

console.log('[openaiWrapper] LLM_PROVIDER:', LLM_PROVIDER);
console.log('[openaiWrapper] OLLAMA_MODEL:', OLLAMA_MODEL);
console.log('[openaiWrapper] OLLAMA_BASE_URL:', OLLAMA_BASE_URL);

// Initialize OpenAI client (works for both OpenAI and Ollama via OpenAI-compatible API)
const openai = new OpenAI({
  apiKey: LLM_PROVIDER === 'ollama' ? 'ollama' : process.env.OPENAI_API_KEY,
  baseURL: LLM_PROVIDER === 'ollama' ? OLLAMA_BASE_URL : undefined,
});

/**
 * Wrapper for OpenAI Chat Completions with JSON schema response format
 * @param {string} query - The user query/prompt
 * @param {object} options - Optional configuration
 * @param {object} options.context - Additional context object to include in the prompt
 * @param {object} options.schema - JSON schema for structured output (defaults to universalAgentResponseSchema)
 * @param {string} options.model - Model to use (defaults to OPENAI_DEFAULT_MODEL from .env)
 * @param {number} options.temperature - Temperature setting (defaults to OPENAI_DEFAULT_TEMPERATURE from .env)
 * @returns {Promise<object>} Parsed JSON response matching the schema
 */
export async function queryOpenAI(query, options = {}) {
  const {
    context = null,
    schema = universalAgentResponseSchema,
    model = LLM_PROVIDER === 'ollama' ? OLLAMA_MODEL : (process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini'),
    temperature = parseFloat(process.env.OPENAI_DEFAULT_TEMPERATURE) || 1.0,
  } = options;

  // Build the prompt with optional context
  let promptContent = query;
  if (context) {
    promptContent = `Context: ${JSON.stringify(context, null, 2)}\n\nQuery: ${query}`;
  }

  // Ollama doesn't support structured output yet, so we need to prompt for JSON
  if (LLM_PROVIDER === 'ollama') {
    promptContent += `\n\nRespond with ONLY valid JSON matching this schema:\n${JSON.stringify(schema, null, 2)}`;
  }

  console.log('[queryOpenAI] Using model:', model);
  console.log('[queryOpenAI] Provider:', LLM_PROVIDER);

  try {
    const completionParams = {
      model,
      temperature,
      messages: [
        {
          role: "user",
          content: promptContent
        }
      ]
    };

    // Only add response_format for OpenAI (Ollama doesn't support it)
    if (LLM_PROVIDER === 'openai') {
      completionParams.response_format = {
        type: "json_schema",
        json_schema: {
          name: "agent_response",
          strict: true,
          schema
        }
      };
    }

    const completion = await openai.chat.completions.create(completionParams);

    // Parse and return the JSON response
    const responseContent = completion.choices[0].message.content;
    
    // For Ollama, extract JSON from markdown code blocks if present
    let jsonContent = responseContent;
    if (LLM_PROVIDER === 'ollama') {
      const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/) || responseContent.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
    }
    
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error(`${LLM_PROVIDER.toUpperCase()} API Error:`, error.message);
    throw error;
  }
}

/**
 * Simple wrapper for OpenAI with json_object mode (no strict schema)
 * @param {string} query - The user query/prompt (should mention JSON in the prompt)
 * @param {object} options - Optional configuration
 * @param {object} options.context - Additional context object to include in the prompt
 * @param {string} options.model - Model to use (defaults to OPENAI_DEFAULT_MODEL from .env)
 * @param {number} options.temperature - Temperature setting (defaults to OPENAI_DEFAULT_TEMPERATURE from .env)
 * @returns {Promise<object>} Parsed JSON response
 */
export async function queryOpenAIJsonMode(query, options = {}) {
  const {
    context = null,
    model = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
    temperature = parseFloat(process.env.OPENAI_DEFAULT_TEMPERATURE) || 1.0,
  } = options;

  // Build the prompt with optional context
  let promptContent = query;
  if (context) {
    promptContent = `Context: ${JSON.stringify(context, null, 2)}\n\nQuery: ${query}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        {
          role: "user",
          content: promptContent
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse and return the JSON response
    const responseContent = completion.choices[0].message.content;
    return JSON.parse(responseContent);
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    throw error;
  }
}

export default { queryOpenAI, queryOpenAIJsonMode };