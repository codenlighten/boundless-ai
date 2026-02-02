//github agent will provide github commands for user to interact with github repos
export const githubAgentResponseSchema = {
    type: "object",
    properties: {
      githubCommands: {
        type: "array",
        description: "List of GitHub commands to be executed",
        items: {
          type: "object",
          properties: {
            command: { 
              type: "string",
              description: "The GitHub CLI command to be executed"
            },
            reasoning: {
              type: "string",
              description: "Explanation of why this command was chosen and its intended effect"
            }
          },
          required: ["command", "reasoning"],
          additionalProperties: false
        }
      },
      missingContext: {
        type: "array",
        items: { type: "string" },
        description: "List of missing information that would improve the command choice. Empty array if complete."
      }
    },
    required: ["githubCommands", "missingContext"],
    additionalProperties: false
  };  