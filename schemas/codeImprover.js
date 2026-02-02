//provide complete improvedCode without breaking changes, explanation, suggestions
export const codeImproverResponseSchema = {
    type: "object",
    properties: {
      improvedCode: { 
        type: "string",
        description: "The improved version of the provided code with enhancements and optimizations"
      },
      explanation: {
        type: "string",
        description: "A detailed explanation of the improvements made to the code"
      },
      suggestions: {
        type: "array",
        items: { type: "string" },
        description: "List of additional suggestions for further improvements or considerations"
      }
    },
    required: ["improvedCode", "explanation", "suggestions"],
    additionalProperties: false
};