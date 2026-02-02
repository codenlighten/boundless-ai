//based on alan kay's famous quote "boxes are the only useful concept in programming", we will provide a schema for a modular box design for a file/module/function 
export const boxSchema = {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name of the box/module/function"
      },
      description: {
        type: "string",
        description: "A brief description of the box's purpose and functionality"
      },
      inputs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the input parameter" },
            type: { type: "string", description: "Data type of the input parameter" },
            description: { type: "string", description: "Description of the input parameter" }
          },
          required: ["name", "type", "description"],
          additionalProperties: false
        },
        description: "List of input parameters for the box"
      },
      outputs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the output parameter" },
            type: { type: "string", description: "Data type of the output parameter" },
            description: { type: "string", description: "Description of the output parameter" }
          },
          required: ["name", "type", "description"],
          additionalProperties: false
        },
        description: "List of output parameters for the box"
      },
      dependencies: {
        type: "array",
        items: { type: "string" },
        description: "List of external dependencies or libraries required by the box"
      }
    },
    required: ["name", "description", "inputs", "outputs", "dependencies"],
    additionalProperties: false
  };