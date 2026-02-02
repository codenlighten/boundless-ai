/**
 * Workflow Planner Agent
 * 
 * Purpose: Design multi-agent workflows as executable data structures.
 * Creates DAGs (directed acyclic graphs) of agent invocations with data flow wiring.
 * 
 * Use Cases:
 * - Complex multi-step AI pipelines
 * - Agent orchestration and composition
 * - Automated workflow execution
 * - Integration with MemorySession for stateful flows
 * 
 * Input: Description of desired workflow, available agents/tools, constraints
 * Output: Complete workflow specification as string-serialized DAG
 */
export const workflowPlannerSchema = {
  type: "object",
  properties: {
    workflowName: {
      type: "string",
      description: "Clear, descriptive name for this workflow (e.g., 'CodeReviewPipeline', 'DataAnalysisFlow')"
    },
    workflowDescription: {
      type: "string",
      description: "Detailed explanation of what this workflow does, its inputs, outputs, and purpose"
    },
    workflowSchemaAsString: {
      type: "string",
      description: "Complete workflow definition serialized as JSON string. When parsed, contains: version, steps array with id/agent/inputFrom/writesToMemory/description, and execution metadata"
    },
    estimatedDuration: {
      type: "string",
      description: "Approximate time to execute (e.g., '5-10 seconds', '1-2 minutes')"
    },
    requiredAgents: {
      type: "array",
      items: { type: "string" },
      description: "List of Schema.icu agent endpoints this workflow requires (e.g., ['base', 'code-generator', 'summarize'])"
    },
    dataFlowSummary: {
      type: "string",
      description: "High-level explanation of how data flows through the workflow steps"
    },
    missingContext: {
      type: "array",
      items: { type: "string" },
      description: "Information that would improve the workflow design or make it more robust"
    },
    reasoning: {
      type: "string",
      description: "Explanation of workflow design decisions, step ordering, parallelization choices, and trade-offs"
    }
  },
  required: [
    "workflowName",
    "workflowDescription",
    "workflowSchemaAsString",
    "estimatedDuration",
    "requiredAgents",
    "dataFlowSummary",
    "missingContext",
    "reasoning"
  ],
  additionalProperties: false
};

export default workflowPlannerSchema;

/**
 * Example workflowSchemaAsString structure (when parsed):
 * 
 * {
 *   version: "workflow-v1",
 *   steps: [
 *     {
 *       id: "step1",
 *       agent: "schema-generator",
 *       inputFrom: [
 *         { stepId: "input", field: "requirements", as: "query" }
 *       ],
 *       writesToMemory: true,
 *       description: "Generate initial schema from requirements"
 *     },
 *     {
 *       id: "step2",
 *       agent: "code-generator",
 *       inputFrom: [
 *         { stepId: "step1", field: "schema", as: "context" },
 *         { stepId: "input", field: "language", as: "language" }
 *       ],
 *       writesToMemory: true,
 *       description: "Generate code from schema"
 *     },
 *     {
 *       id: "step3",
 *       agent: "summarize",
 *       inputFrom: [
 *         { stepId: "memory", field: "context", as: "context" },
 *         { stepId: "step2", field: "code", as: "query" }
 *       ],
 *       writesToMemory: false,
 *       description: "Summarize generated code and process"
 *     }
 *   ],
 *   parallelGroups: [
 *     {
 *       name: "validation",
 *       steps: ["step4", "step5"],
 *       description: "Steps that can run in parallel"
 *     }
 *   ],
 *   memoryConfig: {
 *     sessionId: "workflow-{timestamp}",
 *     summarizeAfterSteps: 3
 *   },
 *   errorHandling: {
 *     strategy: "abort" | "continue" | "retry",
 *     maxRetries: 3
 *   }
 * }
 */
