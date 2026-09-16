import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentTownMember, AgentStatus, AgentPosition, AgentMessage, AgentTask, TownMetrics, ActiveConnection, AgentMemoryRecord, MemoryCounts, MemoryType, MemoryImportance, ToolAuditEntry, ParentTask, ActivityEvent } from './types';
import { agentRegistry } from './agentRegistry';
import { agentCommunicationService } from './agentCommunicationService';
import { agentMemoryManager } from './agentMemoryManager';
import { agentToolRegistry, ToolDefinition } from './agentToolRegistry';
import { agentOrchestrator } from './agentOrchestrator';
import { agentActivityFeed } from './agentActivityFeed';

export function useAgentTownState(initialSelectedId: string = 'agent-alice') {
  const [agents, setAgents] = useState<AgentTownMember[]>(() => agentRegistry.getAllAgents());
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(initialSelectedId);
  const [metrics, setMetrics] = useState<TownMetrics>(() => agentRegistry.getMetrics());
  const [messages, setMessages] = useState<AgentMessage[]>(() => agentCommunicationService.getMessages());
  const [activeConnections, setActiveConnections] = useState<ActiveConnection[]>(() => agentCommunicationService.getActiveConnections());
  const [memories, setMemories] = useState<AgentMemoryRecord[]>(() => agentMemoryManager.getAllMemories());
  const [memoryCounts, setMemoryCounts] = useState<MemoryCounts>(() => agentMemoryManager.getMemoryCounts());
  const [tools, setTools] = useState<ToolDefinition[]>(() => agentToolRegistry.getAllTools());
  const [auditLogs, setAuditLogs] = useState<ToolAuditEntry[]>(() => agentToolRegistry.getAuditLogs());
  const [globalToolsEnabled, setGlobalToolsEnabled] = useState<boolean>(() => agentToolRegistry.isGlobalToolsEnabled());
  const [parentTasks, setParentTasks] = useState<ParentTask[]>(() => agentOrchestrator.getParentTasks());
  const [activeParentTask, setActiveParentTask] = useState<ParentTask | null>(() => agentOrchestrator.getActiveParentTask());
  const [activities, setActivities] = useState<ActivityEvent[]>(() => agentActivityFeed.getActivities());

  useEffect(() => {
    const unsubRegistry = agentRegistry.subscribe((updatedAgents) => {
      setAgents(updatedAgents);
      setMetrics(agentRegistry.getMetrics());
      setMessages(agentCommunicationService.getMessages());
      setActiveConnections(agentCommunicationService.getActiveConnections());
      setMemories(agentMemoryManager.getAllMemories());
      setMemoryCounts(agentMemoryManager.getMemoryCounts());
      setParentTasks(agentOrchestrator.getParentTasks());
      setActiveParentTask(agentOrchestrator.getActiveParentTask());
      setActivities(agentActivityFeed.getActivities());
    });

    const unsubComm = agentCommunicationService.subscribe(() => {
      setMessages(agentCommunicationService.getMessages());
      setActiveConnections(agentCommunicationService.getActiveConnections());
    });

    const unsubMem = agentMemoryManager.subscribe(() => {
      setMemories(agentMemoryManager.getAllMemories());
      setMemoryCounts(agentMemoryManager.getMemoryCounts());
    });

    const unsubTool = agentToolRegistry.subscribe(() => {
      setTools(agentToolRegistry.getAllTools());
      setAuditLogs(agentToolRegistry.getAuditLogs());
      setGlobalToolsEnabled(agentToolRegistry.isGlobalToolsEnabled());
    });

    const unsubOrch = agentOrchestrator.subscribe(() => {
      setParentTasks(agentOrchestrator.getParentTasks());
      setActiveParentTask(agentOrchestrator.getActiveParentTask());
      setMetrics(agentRegistry.getMetrics());
    });

    const unsubAct = agentActivityFeed.subscribe(() => {
      setActivities(agentActivityFeed.getActivities());
    });

    return () => {
      unsubRegistry();
      unsubComm();
      unsubMem();
      unsubTool();
      unsubOrch();
      unsubAct();
    };
  }, []);

  const selectedAgent = useMemo(() => {
    return agents.find((a) => a.id === selectedAgentId) || null;
  }, [agents, selectedAgentId]);

  const selectAgent = useCallback((agent: AgentTownMember | string | null) => {
    if (!agent) {
      setSelectedAgentId(null);
    } else if (typeof agent === 'string') {
      setSelectedAgentId(agent);
    } else {
      setSelectedAgentId(agent.id);
    }
  }, []);

  const updateAgentStatus = useCallback((id: string, status: AgentStatus, description?: string) => {
    return agentRegistry.updateAgentStatus(id, status, description);
  }, []);

  const assignTask = useCallback((id: string, task: string) => {
    return agentRegistry.assignTask(id, task);
  }, []);

  const dispatchOrchestration = useCallback((title: string, description: string = '', coordinatorId: string = 'agent-dave') => {
    return agentRegistry.dispatchOrchestration(title, description, coordinatorId);
  }, []);

  const cancelParentTask = useCallback((parentTaskId: string) => {
    return agentRegistry.cancelParentTask(parentTaskId);
  }, []);

  const pauseAllTasks = useCallback(() => {
    agentRegistry.pauseAllTasks();
  }, []);

  const cancelAllTasks = useCallback(() => {
    agentRegistry.cancelAllTasks();
  }, []);

  const retryTask = useCallback((id: string, taskId: string) => {
    return agentRegistry.retryTask(id, taskId);
  }, []);

  const cancelTask = useCallback((id: string, taskId?: string) => {
    return agentRegistry.cancelTask(id, taskId);
  }, []);

  const completeTask = useCallback((id: string, taskId?: string) => {
    return agentRegistry.completeTask(id, taskId);
  }, []);

  const requestCollaboration = useCallback((fromAgentId: string, toAgentId: string, prompt: string, taskId?: string | null) => {
    return agentRegistry.requestCollaboration(fromAgentId, toAgentId, prompt, taskId);
  }, []);

  const addMemory = useCallback((record: Omit<AgentMemoryRecord, 'id' | 'timestamp'>) => {
    return agentMemoryManager.addMemory(record);
  }, []);

  const promoteToAgent = useCallback((id: string) => {
    return agentMemoryManager.promoteToAgentMemory(id);
  }, []);

  const promoteToShared = useCallback((id: string) => {
    return agentMemoryManager.promoteToSharedMemory(id);
  }, []);

  const deleteMemory = useCallback((id: string, force: boolean = false) => {
    return agentMemoryManager.deleteMemory(id, force);
  }, []);

  const searchMemory = useCallback((query: string, filters?: { agentId?: string; type?: MemoryType | 'ALL'; importance?: MemoryImportance | 'ALL' }) => {
    return agentMemoryManager.searchMemory(query, filters);
  }, []);

  const consolidateKnowledge = useCallback(() => {
    return agentMemoryManager.consolidateKnowledge();
  }, []);

  const toggleGlobalTools = useCallback((enabled?: boolean) => {
    return agentRegistry.toggleGlobalTools(enabled);
  }, []);

  const toggleAgentTools = useCallback((agentId: string, enabled?: boolean) => {
    return agentRegistry.toggleAgentTools(agentId, enabled);
  }, []);

  const executeToolDirectly = useCallback((agent: AgentTownMember, toolId: string, input: any) => {
    return agentToolRegistry.executeTool(agent, toolId, input);
  }, []);

  const updatePosition = useCallback((id: string, position: AgentPosition) => {
    return agentRegistry.updatePosition(id, position);
  }, []);

  return {
    agents,
    metrics,
    messages,
    activeConnections,
    memories,
    memoryCounts,
    tools,
    auditLogs,
    globalToolsEnabled,
    parentTasks,
    activeParentTask,
    activities,
    selectedAgent,
    selectedAgentId,
    selectAgent,
    updateAgentStatus,
    assignTask,
    dispatchOrchestration,
    cancelParentTask,
    pauseAllTasks,
    cancelAllTasks,
    retryTask,
    cancelTask,
    completeTask,
    requestCollaboration,
    addMemory,
    promoteToAgent,
    promoteToShared,
    deleteMemory,
    searchMemory,
    consolidateKnowledge,
    toggleGlobalTools,
    toggleAgentTools,
    executeToolDirectly,
    updatePosition
  };
}
