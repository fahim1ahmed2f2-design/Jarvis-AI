import { sendChatMessage } from '../../services/api';
import { AgentTownMember, AgentTask, ToolResult } from './types';
import { agentMemoryManager } from './agentMemoryManager';
import { agentToolRegistry } from './agentToolRegistry';

export interface AgentTaskExecutionResult {
  success: boolean;
  result?: string;
  toolsUsed?: string[];
  error?: string;
  cancelled?: boolean;
}

const AGENT_SYSTEM_PROFILES: Record<string, { role: string; behavior: string; promptGuide: string }> = {
  'agent-jarvis': {
    role: 'Head Officer & Supreme AI Commander',
    behavior: 'Omniscient, decisive, courteous, executive commander',
    promptGuide: 'Deliver executive-grade command intelligence, fleet delegation, and strategic oversight across all Agent Town departments.'
  },
  'agent-alice': {
    role: 'Research & Analysis Agent',
    behavior: 'Analytical, evidence-focused, concise, structured',
    promptGuide: 'Deliver a structured analytical evaluation. Highlight core evidence, key findings, comparative factors, and logical deductions.'
  },
  'agent-bob': {
    role: 'Automation & Execution Agent',
    behavior: 'Action-oriented, procedural, precise, safety-conscious',
    promptGuide: 'Deliver an actionable, procedural step-by-step execution roadmap. Specify exact processes, prerequisites, sequencing, and safety verifications.'
  },
  'agent-carol': {
    role: 'Knowledge & Memory Agent',
    behavior: 'Organized, context-aware, good at summarization, knowledge-focused',
    promptGuide: 'Deliver a structured knowledge synthesis. Organize concepts hierarchically, summarize core facts, and link conceptual relationships cleanly.'
  },
  'agent-dave': {
    role: 'Planning & Coordination Agent',
    behavior: 'Strategic, task-oriented, good at breaking complex tasks into steps, coordination-focused',
    promptGuide: 'Deliver a high-level strategic master plan. Define phases, milestones, risk contingencies, and agent delegation recommendations.'
  },
  'agent-jonson': {
    role: 'Security & Threat Operations Specialist',
    behavior: 'Vigilant, tactical, protective, disciplined',
    promptGuide: 'Deliver a rigorous security assessment, threat vector analysis, and defensive hardening protocol.'
  },
  'agent-tuly': {
    role: 'UI/UX Design & Creative Studio Lead',
    behavior: 'Creative, aesthetic, intuitive, lively, detail-oriented',
    promptGuide: 'Deliver state-of-the-art UI/UX architectural recommendations, color harmony tokens, typography specs, and user experience enhancements.'
  },
  'agent-mob': {
    role: 'Big Data & Pipeline Architect',
    behavior: 'Analytical, fast, data-driven, highly optimized',
    promptGuide: 'Deliver high-throughput ETL data pipeline architectures, distributed caching strategies, and telemetry analytics.'
  },
  'agent-knox': {
    role: 'Cloud DevOps & Mainframe Specialist',
    behavior: 'Systematic, resilient, calm under pressure, meticulous',
    promptGuide: 'Deliver resilient cloud infrastructure roadmaps, Kubernetes container topologies, and continuous deployment workflows.'
  }
};

class AgentAIService {
  private inFlightControllers: Map<string, AbortController> = new Map();

  /**
   * Evaluates if any authorized tools should be invoked for a task.
   */
  private async executeRelevantTools(
    agent: AgentTownMember,
    task: AgentTask,
    onToolActivity?: (toolName: string) => void
  ): Promise<{ results: ToolResult[]; toolNames: string[] }> {
    const titleLower = task.title.toLowerCase();
    const availableTools = agentToolRegistry.getAvailableToolsForAgent(agent);
    const results: ToolResult[] = [];
    const toolNames: string[] = [];

    // 1. Math / Calculation Tool check
    if (availableTools.some((t) => t.id === 'calculator')) {
      const mathMatch = task.title.match(/(?:calculate|math|compute|\b\d+\s*[\+\-\*\/\^%]\s*\d+)/i);
      if (mathMatch) {
        onToolActivity?.('Calculator');
        const exprMatch = task.title.match(/([0-9+\-*/().^%\s]{3,})/);
        const expr = exprMatch ? exprMatch[1].trim() : '100 * 1.5';
        const res = await agentToolRegistry.executeTool(agent, 'calculator', { expression: expr }, task.id);
        results.push(res);
        toolNames.push('Calculator');
      }
    }

    // 2. Knowledge Search Tool check
    if (availableTools.some((t) => t.id === 'knowledge_search')) {
      if (titleLower.includes('search') || titleLower.includes('find') || titleLower.includes('memory') || titleLower.includes('research') || titleLower.includes('query')) {
        onToolActivity?.('Knowledge Search');
        const query = task.title.replace(/(search|find|lookup|query|for|about|the)/gi, '').trim() || task.title;
        const res = await agentToolRegistry.executeTool(agent, 'knowledge_search', { query }, task.id);
        results.push(res);
        toolNames.push('Knowledge Search');
      }
    }

    // 3. Task Planner Tool check
    if (availableTools.some((t) => t.id === 'task_planner')) {
      if (titleLower.includes('plan') || titleLower.includes('roadmap') || titleLower.includes('strategy') || titleLower.includes('breakdown')) {
        onToolActivity?.('Task Planner');
        const res = await agentToolRegistry.executeTool(agent, 'task_planner', { objective: task.title }, task.id);
        results.push(res);
        toolNames.push('Task Planner');
      }
    }

    // 4. Text Processor Tool check
    if (availableTools.some((t) => t.id === 'text_processor')) {
      if (titleLower.includes('summarize') || titleLower.includes('format') || titleLower.includes('word count')) {
        onToolActivity?.('Text Processor');
        const mode = titleLower.includes('bullet') ? 'bullet_points' : titleLower.includes('count') ? 'word_count' : 'summarize';
        const res = await agentToolRegistry.executeTool(agent, 'text_processor', { text: task.title, mode }, task.id);
        results.push(res);
        toolNames.push('Text Processor');
      }
    }

    // 5. Code Solver Tool check
    if (availableTools.some((t) => t.id === 'code_solver')) {
      if (titleLower.includes('code') || titleLower.includes('script') || titleLower.includes('program') || titleLower.includes('syntax') || titleLower.includes('algorithm')) {
        onToolActivity?.('Code Solver');
        const res = await agentToolRegistry.executeTool(agent, 'code_solver', { prompt: task.title }, task.id);
        results.push(res);
        toolNames.push('Code Solver');
      }
    }

    // 6. Cyber Defense Scanner Tool check
    if (availableTools.some((t) => t.id === 'cyber_defense_scanner')) {
      if (titleLower.includes('security') || titleLower.includes('scan') || titleLower.includes('firewall') || titleLower.includes('vulnerability') || titleLower.includes('port')) {
        onToolActivity?.('Cyber Defense Scanner');
        const res = await agentToolRegistry.executeTool(agent, 'cyber_defense_scanner', { target: task.title }, task.id);
        results.push(res);
        toolNames.push('Cyber Defense Scanner');
      }
    }

    // 7. Data Pipeline Streamer Tool check
    if (availableTools.some((t) => t.id === 'data_pipeline_streamer')) {
      if (titleLower.includes('pipeline') || titleLower.includes('stream') || titleLower.includes('ingest') || titleLower.includes('throughput') || titleLower.includes('etl')) {
        onToolActivity?.('Data Pipeline Streamer');
        const res = await agentToolRegistry.executeTool(agent, 'data_pipeline_streamer', { topic: task.title }, task.id);
        results.push(res);
        toolNames.push('Data Pipeline Streamer');
      }
    }

    // 8. Creative Palette Generator Tool check
    if (availableTools.some((t) => t.id === 'creative_palette_generator')) {
      if (titleLower.includes('design') || titleLower.includes('palette') || titleLower.includes('ui') || titleLower.includes('ux') || titleLower.includes('color') || titleLower.includes('theme')) {
        onToolActivity?.('Creative Palette Generator');
        const res = await agentToolRegistry.executeTool(agent, 'creative_palette_generator', { theme: task.title }, task.id);
        results.push(res);
        toolNames.push('Creative Palette Generator');
      }
    }

    return { results, toolNames };
  }

  /**
   * Constructs an isolated, role-specific prompt for an Agent Town member with relevant memory and tool outputs.
   */
  private buildAgentPrompt(
    agent: AgentTownMember,
    task: AgentTask,
    toolResults: ToolResult[]
  ): string {
    const profile = AGENT_SYSTEM_PROFILES[agent.id] || {
      role: agent.role,
      behavior: agent.personality || 'Analytical and autonomous',
      promptGuide: 'Provide a structured, high-quality reasoning response.'
    };

    // Retrieve relevant memories for context
    const relevantMemories = agentMemoryManager.getRelevantMemoriesForTask(agent.id, task.title, 3);
    const memoryContextBlock =
      relevantMemories.length > 0
        ? `\n\n[RELEVANT AGENT KNOWLEDGE / MEMORY]\n` +
          relevantMemories
            .map((m) => `• [${m.type} // ${m.importance}] (${m.source}): "${m.content}"`)
            .join('\n')
        : '';

    // Tool execution output context block
    const toolResultsBlock =
      toolResults.length > 0
        ? `\n\n[AUTHORIZED TOOL EXECUTION FEEDBACK]\n` +
          toolResults
            .map(
              (r) =>
                `• Tool: ${r.toolId} [Status: ${r.status}]\n  Output: ${JSON.stringify(r.result || r.error)}`
            )
            .join('\n')
        : '';

    return `[JARVIS AGENT TOWN // SUB-AGENT DIRECTIVE]
Agent: ${agent.name} (${agent.codename})
Station: ${agent.position.deskName} (${agent.position.sector})
Role: ${profile.role}
Behavioral Archetype: ${profile.behavior}

Assigned Directive:
"${task.title}"
${memoryContextBlock}
${toolResultsBlock}

Operational Guidance:
${profile.promptGuide}

Strict Boundary:
Provide a comprehensive, beautifully structured reasoning and analytical report for this task incorporating verified tool results where available. Deliver only your direct response without raw metadata or conversational filler.`;
  }

  /**
   * Dispatches task to the existing JARVIS AI backend safely and asynchronously.
   */
  public async executeTask(
    agent: AgentTownMember,
    task: AgentTask,
    onToolActivity?: (toolName: string) => void
  ): Promise<AgentTaskExecutionResult> {
    // Abort any existing request for this agent
    this.cancelTask(agent.id);

    const controller = new AbortController();
    this.inFlightControllers.set(agent.id, controller);

    // 1. Execute authorized tools if relevant
    const { results: toolResults, toolNames } = await this.executeRelevantTools(
      agent,
      task,
      onToolActivity
    );

    const prompt = this.buildAgentPrompt(agent, task, toolResults);
    const sessionId = `agent_town_${agent.id}`;

    try {
      const response = await sendChatMessage(
        prompt,
        sessionId,
        controller.signal,
        'auto'
      );

      this.inFlightControllers.delete(agent.id);

      if (response && response.status === 'success' && response.reply) {
        const replyText = response.reply.trim();

        // Record task memory upon successful synthesis
        agentMemoryManager.addMemory({
          agentId: agent.id,
          type: 'TASK_MEMORY',
          content: replyText.slice(0, 240) + (replyText.length > 240 ? '...' : ''),
          source: 'Task Synthesis',
          relatedTaskId: task.id,
          importance: 'HIGH'
        });

        return {
          success: true,
          result: replyText,
          toolsUsed: toolNames
        };
      } else if (response && response.reply) {
        const replyText = response.reply.trim();

        agentMemoryManager.addMemory({
          agentId: agent.id,
          type: 'TASK_MEMORY',
          content: replyText.slice(0, 240) + (replyText.length > 240 ? '...' : ''),
          source: 'Task Synthesis',
          relatedTaskId: task.id,
          importance: 'MEDIUM'
        });

        return {
          success: true,
          result: replyText,
          toolsUsed: toolNames
        };
      } else {
        return {
          success: false,
          toolsUsed: toolNames,
          error: 'Agent could not complete the task.'
        };
      }
    } catch (err: any) {
      this.inFlightControllers.delete(agent.id);

      if (err.message === 'ABORTED' || err.name === 'AbortError') {
        return {
          success: false,
          cancelled: true,
          toolsUsed: toolNames
        };
      }

      console.warn(`[AgentAIService] Error executing task for ${agent.name}:`, err);
      return {
        success: false,
        toolsUsed: toolNames,
        error: 'Agent could not complete the task.'
      };
    }
  }

  /**
   * Safely cancels any active in-flight AI request for a specific agent.
   */
  public cancelTask(agentId: string): void {
    const controller = this.inFlightControllers.get(agentId);
    if (controller) {
      try {
        controller.abort();
      } catch {}
      this.inFlightControllers.delete(agentId);
    }
  }

  /**
   * Checks if an agent is currently awaiting an AI response.
   */
  public isAgentThinking(agentId: string): boolean {
    return this.inFlightControllers.has(agentId);
  }
}

export const agentAIService = new AgentAIService();
