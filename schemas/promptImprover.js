//prompt improver schema will return improved Prompt, explanation, suggestions
export const promptImproverResponseSchema = {
    type: "object",
    properties: {
      improvedPrompt: { 
        type: "string",
        description: "The improved version of the provided prompt with enhancements for clarity and effectiveness"
      },
      missingContext: {
        type: "string",
        description: "Information that was missing from the original prompt that would help improve it further"
      },
      explanation: {
        type: "string",
        description: "A detailed explanation of the improvements made to the prompt"
      },
      suggestions: {
        type: "array",
        items: { type: "string" },
        description: "List of additional suggestions for further improvements or considerations"
      }
    },
    required: ["improvedPrompt", "missingContext", "explanation", "suggestions"],
    additionalProperties: false
};