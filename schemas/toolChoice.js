/**
 * Tool/Agent Router Schema
 * 
 * Purpose: Given a query and available tools/agents, determine which tool is best suited
 * for the task. Supports both AI agents (require further AI processing) and direct tools
 * (terminal, API, database, etc.). Returns a clear choice with reasoning and alternatives.
 * 
 * Input (via context): Array of available tools with descriptions
 * Output: Selected tool, type classification, and decision metadata
 */
export const toolChoiceSchema = {
  type: "object",
  properties: {
    chosenTool: {
      type: "string",
      description: "The name or ID of the selected tool or agent from the provided tools array"
    },
    chosenToolIndex: {
      type: "integer",
      description: "The zero-based index of the selected tool in the provided tools array. Use -1 if no suitable tool is found"
    },
    isAgent: {
      type: "boolean",
      description: "True if the chosenTool is another AI agent that will generate a further structured response. False if it is a non-agent tool (e.g., terminal, HTTP API, database, etc.)"
    },
    shouldInvokeTool: {
      type: "boolean",
      description: "Whether the caller should actually invoke the chosen tool/agent now. False if the router believes more context is required first"
    },
    missingContext: {
      type: "array",
      items: { type: "string" },
      description: "List of missing information that would improve or change the tool choice. Empty array if the choice is confident"
    },
    reasoning: {
      type: "string",
      description: "Explanation of why this tool/agent was chosen over the others, including any trade-offs or assumptions"
    },
    alternativeTools: {
      type: "array",
      description: "Optional ranked list of other candidate tools/agents that could also handle the request",
      items: {
        type: "object",
        properties: {
          tool: {
            type: "string",
            description: "Name or ID of the alternative tool/agent"
          },
          index: {
            type: "integer",
            description: "Zero-based index of this tool in the original tools array"
          },
          score: {
            type: "number",
            description: "Relative suitability score (e.g., 0–1 or 0–100) compared to the chosen tool"
          },
          rationale: {
            type: "string",
            description: "Short explanation of why this tool is a reasonable alternative"
          }
        },
        required: ["tool", "index", "score", "rationale"],
        additionalProperties: false
      }
    }
  },
  required: [
    "chosenTool",
    "chosenToolIndex",
    "isAgent",
    "shouldInvokeTool",
    "missingContext",
    "reasoning",
    "alternativeTools"
  ],
  additionalProperties: false
};