export const codeGeneratorResponseSchema =
{
      type: "object",
      properties: {
        code: { 
          type: "string",
          description: "The generated code with proper formatting, comments, and documentation"
        },
        missingContext: {
          type: "array",
          items: { type: "string" },
          description: "List of missing information that would improve the generated code. Empty array if complete."
        },
        reasoning: {
          type: "string",
          description: "Explanation of design decisions, trade-offs, and implementation approach"
        },
        language: {
          type: "string",
          description: "Programming language of the generated code"
        },
        complexity: {
          type: "string",
          description: "Estimated time and space complexity of the generated code"
        }
      },
      required: ["code", "missingContext", "reasoning", "language", "complexity"],
      additionalProperties: false
    };