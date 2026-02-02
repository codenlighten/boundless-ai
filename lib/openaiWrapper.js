import OpenAI from 'openai';
import dotenv from 'dotenv';
import { universalAgentResponseSchema } from '../schemas/universalAgent.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agent_response",
          strict: true,
          schema
        }
      }
    });

    // Parse and return the JSON response
    const responseContent = completion.choices[0].message.content;
    return JSON.parse(responseContent);
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
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