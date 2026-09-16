import React, { useState } from 'react';
import { TownSector, AgentTownMember, AtmosphereMode, SimulationSpeed, TownViewTab } from './types';
import { useAgentTownState } from './useAgentTownState';
import { TownWorkspace } from './TownWorkspace';
import { AgentInfoPanel } from './AgentInfoPanel';
import { PixelTownHeader } from './world/pixel/PixelTownHeader';
import { PixelTownFooter } from './world/pixel/PixelTownFooter';
import { TacticalVisualHub } from './world/visual_hub/TacticalVisualHub';
import { SectorRoomInspector } from './world/rooms/SectorRoomInspector';
import { AutonomousOfficeLifeHub } from './world/social/AutonomousOfficeLifeHub';
import { AssignTaskModal } from './AssignTaskModal';
import { UniversalTaskModal } from './UniversalTaskModal';
import { GlobalTaskControlModal } from './GlobalTaskControlModal';
import { BangladeshNewsModal } from './BangladeshNewsModal';

interface AgentTownViewProps {
  onClose: () => void;
  primaryColor?: string;
}

export const AgentTownView: React.FC<AgentTownViewProps> = ({
  onClose,
  primaryColor = '#00e8ff'
}) => {
  const {
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
    consolidateKnowledge,
    toggleGlobalTools,
    toggleAgentTools,
    executeToolDirectly
  } = useAgentTownState('agent-alice');

  const [selectedSector, setSelectedSector] = useState<TownSector>('ALL');
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUniversalModalOpen, setIsUniversalModalOpen] = useState(false);
  const [isCancelAllModalOpen, setIsCancelAllModalOpen] = useState(false);
  const [isBDNewsModalOpen, setIsBDNewsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TownViewTab>('agents');
  const [atmosphere, setAtmosphere] = useState<AtmosphereMode>('NIGHT');
  const [simulationSpeed, setSimulationSpeed] = useState<SimulationSpeed>(1);

  const handleOpenAssignModal = () => {
    if (selectedAgent) {
      setIsAssignModalOpen(true);
    }
  };

  const handleAssignTask = (agentId: string, taskTitle: string) => {
    assignTask(agentId, taskTitle);
  };

  const handleCancelTask = (agentId: string, taskId?: string) => {
    cancelTask(agentId, taskId);
  };

  const handleUniversalDispatch = (targetAgentId: string, taskTitle: string, isOrchestration: boolean) => {
    if (isOrchestration) {
      dispatchOrchestration(taskTitle, '', targetAgentId);
    } else {
      assignTask(targetAgentId, taskTitle);
    }
  };

  const handleOpenAssignModalForAgent = (agent: AgentTownMember) => {
    selectAgent(agent);
    setIsAssignModalOpen(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(145deg, rgba(2, 6, 18, 0.98) 0%, rgba(6, 12, 30, 0.98) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 1. RETRO PIXEL & CYBER TOP BAR v4 */}
      <PixelTownHeader
        agents={agents}
        selectedAgentId={selectedAgentId}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSelectAgent={(ag) => {
          selectAgent(ag);
          setIsInfoPanelOpen(true);
        }}
        atmosphere={atmosphere}
        onToggleAtmosphere={setAtmosphere}
        simulationSpeed={simulationSpeed}
        onChangeSpeed={setSimulationSpeed}
        onOpenNewTaskModal={() => setIsUniversalModalOpen(true)}
        onRefresh={() => setSelectedSector('ALL')}
        onOpenBDNews={() => setIsBDNewsModalOpen(true)}
        onClose={onClose}
        primaryColor={primaryColor}
      />

      {/* 2. MAIN WORKSPACE VIEW (MULTI-TAB ROUTED) & RIGHT INFO PANEL */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Tab 1: 2.5D Animated Living Campus */}
        {activeTab === 'agents' && (
          <TownWorkspace
            agents={agents}
            selectedAgentId={selectedAgentId}
            selectedSector={selectedSector}
            activeConnections={activeConnections}
            activeParentTask={activeParentTask}
            onCancelParentTask={cancelParentTask}
            onSelectAgent={(ag) => {
              selectAgent(ag);
              setIsInfoPanelOpen(true);
            }}
            onSelectSector={setSelectedSector}
            onDispatchPreset={(title, desc, coord) => dispatchOrchestration(title, desc, coord)}
            onDeselect={() => selectAgent(null)}
            primaryColor={primaryColor}
          />
        )}

        {/* Tab 2: Tactical Visual Command & DAG Workflow Matrix */}
        {activeTab === 'visual_hub' && (
          <TacticalVisualHub
            agents={agents}
            selectedAgentId={selectedAgentId}
            activeConnections={activeConnections}
            activeParentTask={activeParentTask}
            metrics={metrics}
            onSelectAgent={(ag) => {
              selectAgent(ag);
              setIsInfoPanelOpen(true);
            }}
            onOpenUniversalModal={() => setIsUniversalModalOpen(true)}
            primaryColor={primaryColor}
          />
        )}

        {/* Tab 3: Sector & Mega-Room Deep Inspector */}
        {activeTab === 'rooms' && (
          <SectorRoomInspector
            agents={agents}
            selectedSector={selectedSector}
            onSelectSector={setSelectedSector}
            onSelectAgent={(ag) => {
              selectAgent(ag);
              setIsInfoPanelOpen(true);
            }}
            onOpenAssignModal={handleOpenAssignModalForAgent}
            onOpenBDNews={() => setIsBDNewsModalOpen(true)}
            primaryColor={primaryColor}
          />
        )}

        {/* Tab 4: Autonomous Office Life & Social Hub */}
        {activeTab === 'social' && (
          <AutonomousOfficeLifeHub
            agents={agents}
            onSelectAgent={(ag) => {
              selectAgent(ag);
              setIsInfoPanelOpen(true);
            }}
            primaryColor={primaryColor}
          />
        )}

        {/* Right Collapsible Info Panel with 7 Sub-Tabs */}
        {isInfoPanelOpen && (
          <AgentInfoPanel
            selectedAgent={selectedAgent}
            allAgents={agents}
            metrics={metrics}
            messages={messages}
            memories={memories}
            memoryCounts={memoryCounts}
            tools={tools}
            auditLogs={auditLogs}
            globalToolsEnabled={globalToolsEnabled}
            activeParentTask={activeParentTask}
            onSelectAgent={selectAgent}
            onOpenAssignModal={handleOpenAssignModal}
            onCancelTask={handleCancelTask}
            onRetryTask={retryTask}
            onCompleteTask={completeTask}
            onRequestCollaboration={requestCollaboration}
            onAddMemory={addMemory}
            onPromoteToAgent={promoteToAgent}
            onPromoteToShared={promoteToShared}
            onDeleteMemory={deleteMemory}
            onConsolidateKnowledge={consolidateKnowledge}
            onToggleGlobalTools={toggleGlobalTools}
            onToggleAgentTools={toggleAgentTools}
            onExecuteToolDirectly={executeToolDirectly}
            onFocusAgent={(agentId) => {
              setSelectedSector('ALL');
              selectAgent(agents.find((a) => a.id === agentId) || null);
            }}
            onFollowAgent={(agentId) => {
              selectAgent(agents.find((a) => a.id === agentId) || null);
            }}
            onClose={() => setIsInfoPanelOpen(false)}
            primaryColor={primaryColor}
          />
        )}
      </div>

      {/* 3. RETRO PIXEL & CYBER BOTTOM STATUS BAR v4 */}
      <PixelTownFooter
        agents={agents}
        metrics={metrics}
        atmosphere={atmosphere}
        simulationSpeed={simulationSpeed}
        onOpenChat={() => setIsUniversalModalOpen(true)}
        primaryColor={primaryColor}
      />

      {/* 4. INDIVIDUAL AGENT ASSIGN MODAL */}
      <AssignTaskModal
        isOpen={isAssignModalOpen}
        agent={selectedAgent}
        onAssign={handleAssignTask}
        onDispatchOrchestration={(title, desc, coordId) => dispatchOrchestration(title, desc, coordId)}
        onCancelTask={handleCancelTask}
        onClose={() => setIsAssignModalOpen(false)}
        primaryColor={primaryColor}
      />

      {/* 5. UNIVERSAL NEW TASK MODAL */}
      <UniversalTaskModal
        isOpen={isUniversalModalOpen}
        agents={agents}
        onDispatch={handleUniversalDispatch}
        onClose={() => setIsUniversalModalOpen(false)}
        primaryColor={primaryColor}
      />

      {/* 6. GLOBAL CANCEL ALL CONFIRMATION MODAL */}
      <GlobalTaskControlModal
        isOpen={isCancelAllModalOpen}
        onConfirmCancelAll={cancelAllTasks}
        onClose={() => setIsCancelAllModalOpen(false)}
      />

      {/* 7. 🇧🇩 BANGLADESH BREAKING NEWS & OFFICE DEBATE MODAL */}
      <BangladeshNewsModal
        isOpen={isBDNewsModalOpen}
        onClose={() => setIsBDNewsModalOpen(false)}
        primaryColor={primaryColor}
        onSelectAgentId={(agentId) => {
          selectAgent(agents.find((a) => a.id === agentId) || null);
        }}
      />
    </div>
  );
};
