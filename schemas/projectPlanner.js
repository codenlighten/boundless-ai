//project planner will take a project idea and break it down into a list of coding tasks with descriptions and estimated time to complete each task, using alan kay's philosophy of "do things in the simplest way possible"
export const projectPlannerResponseSchema = {
    type: "object",
    properties: {
      projectName: {
        type: "string",
        description: "The name of the project"
      },
      projectDescription: {
        type: "string",
        description: "A brief description of the overall project idea and goals"
      },
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            taskName: {
              type: "string",
              description: "The name of the individual coding task"
            },
            taskDescription: {
              type: "string",
              description: "A detailed description of what the task entails"
            },
            estimatedTimeHours: {
              type: "number",
              description: "Estimated time to complete the task in hours"
            }
          },
          required: ["taskName", "taskDescription", "estimatedTimeHours"],
          additionalProperties: false
        },
        description: "List of coding tasks required to complete the project"
      }
    },
    required: ["projectName", "projectDescription", "tasks"],
    additionalProperties: false
  };