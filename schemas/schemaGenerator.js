// we use this to create new schemas based on user requests
export const schemaGeneratorResponseSchema = {
  type: "object",
  properties: {
    schemaAsString: { 
      type: "string",
      description: "The generated JSON schema as a JSON string based on the user's request"
    },
    missingContext: {
      type: "array",
      items: { type: "string" },
      description: "List of missing information that would improve the generated schema. Empty array if complete."
    },
    reasoning: {
      type: "string",
      description: "Explanation of design decisions, trade-offs, and implementation approach"
    }
  },
  required: ["schemaAsString", "missingContext", "reasoning"],
  additionalProperties: false
};
