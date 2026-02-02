export const terminalAgentResponseSchema = {
    type: "object",
    properties: {
      command: { 
        type: "string",
        description: "The terminal command to be executed"
      },
      reasoning: {
        type: "string",
        description: "Explanation of why this command was chosen and its intended effect"
      },
      missingContext: {
        type: "array",
        items: { type: "string" },
        description: "List of missing information that would improve the command choice. Empty array if complete."
      }
    },
    required: ["command", "reasoning", "missingContext"],
    additionalProperties: false
  };  