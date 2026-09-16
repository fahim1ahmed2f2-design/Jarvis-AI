/**
 * JARVIS Agent Town — Agent Mission Controller
 * Step 14: Task-to-Mission Mapper, Stage Derivation & Sector Destination Resolver
 */

import { ParentTask, TownSector } from '../../types';
import { AgentMission, MissionStage, MissionState, MissionPriority } from './types';

export class AgentMissionController {
  /**
   * Convert a real ParentTask into a structured AgentMission representation
   */
  public static fromParentTask(parentTask: ParentTask): AgentMission {
    let missionState: MissionState = 'ACTIVE';
    if (parentTask.status === 'COMPLETED') {
      missionState = 'COMPLETED';
    } else if (parentTask.status === 'FAILED') {
      missionState = 'FAILED';
    } else if (parentTask.status === 'CANCELLED') {
      missionState = 'CANCELLED';
    } else if (parentTask.progress < 20) {
      missionState = 'PLANNING';
    } else if (parentTask.progress >= 85) {
      missionState = 'COMPLETING';
    }

    // Derive Stages from Subtasks
    const stages: MissionStage[] = [];
    const assignedIdsSet = new Set<string>();
    if (parentTask.coordinatorId) assignedIdsSet.add(parentTask.coordinatorId);

    if (parentTask.subtasks && parentTask.subtasks.length > 0) {
      for (const st of parentTask.subtasks) {
        assignedIdsSet.add(st.assignedAgentId);
        let stageStatus: MissionStage['status'] = 'PENDING';
        if (st.status === 'COMPLETED') stageStatus = 'DONE';
        else if (st.status === 'WORKING') stageStatus = 'ACTIVE';
        else if (st.status === 'FAILED') stageStatus = 'FAILED';

        stages.push({
          id: st.id,
          name: this.shortenStageTitle(st.title, st.assignedAgentId),
          assignedAgentId: st.assignedAgentId,
          status: stageStatus
        });
      }
    } else {
      // Default 3-stage representation for simple tasks
      stages.push({
        id: `stg_exec_${parentTask.id}`,
        name: 'Direct Execution',
        assignedAgentId: parentTask.coordinatorId || 'agent-dave',
        status: parentTask.status === 'COMPLETED' ? 'DONE' : 'ACTIVE'
      });
    }

    // Determine current primary target sector
    const activeSubtask = parentTask.subtasks?.find((s) => s.status === 'WORKING');
    let targetSector: TownSector = 'COMMAND';
    if (activeSubtask) {
      if (activeSubtask.assignedAgentId === 'agent-alice') targetSector = 'RESEARCH';
      else if (activeSubtask.assignedAgentId === 'agent-bob') targetSector = 'OPERATIONS';
      else if (activeSubtask.assignedAgentId === 'agent-carol') targetSector = 'KNOWLEDGE';
      else if (activeSubtask.assignedAgentId === 'agent-dave') targetSector = 'COMMAND';
    }

    return {
      missionId: `msn_${parentTask.id}`,
      taskId: parentTask.id,
      title: parentTask.title,
      description: parentTask.description,
      priority: 'HIGH',
      status: missionState,
      coordinatorId: parentTask.coordinatorId || 'agent-dave',
      assignedAgentIds: Array.from(assignedIdsSet),
      stages,
      progress: parentTask.progress,
      targetSector,
      createdAt: parentTask.createdAt,
      completedAt: parentTask.completedAt
    };
  }

  private static shortenStageTitle(rawTitle: string, agentId: string): string {
    if (agentId === 'agent-alice') return 'Research & Data Analysis';
    if (agentId === 'agent-bob') return 'Operations Roadmap';
    if (agentId === 'agent-carol') return 'Knowledge Synthesis';
    if (agentId === 'agent-dave') return 'Master Strategic Review';
    return rawTitle.length > 24 ? `${rawTitle.slice(0, 22)}...` : rawTitle;
  }
}
