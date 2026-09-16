import React, { useState, useEffect } from 'react';
import {
  Activity, Play, Pause, Square, CheckCircle, AlertTriangle,
  RotateCcw, XCircle, Clock, ShieldAlert, Check, RefreshCw, ChevronDown, ChevronUp, History
} from 'lucide-react';
import {
  AutonomousTaskRecord,
  AutonomousStepRecord,
  fetchActiveTask,
  fetchTaskHistory,
  pauseTaskApi,
  resumeTaskApi,
  cancelTaskApi,
  confirmAgentAction,
  fetchTaskCheckpoints,
  discardTaskCheckpoint
} from '../../services/api';

interface AgentTaskPanelProps {
  primaryColor: string;
}

export const AgentTaskPanel: React.FC<AgentTaskPanelProps> = ({ primaryColor }) => {
  const [activeTask, setActiveTask] = useState<AutonomousTaskRecord | null>(null);
  const [historyTasks, setHistoryTasks] = useState<AutonomousTaskRecord[]>([]);
  const [checkpoints, setCheckpoints] = useState<AutonomousTaskRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isActionBusy, setIsActionBusy] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1500);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const activeRes = await fetchActiveTask();
      setActiveTask(activeRes.active_task || null);

      const ckRes = await fetchTaskCheckpoints();
      setCheckpoints(ckRes.checkpoints || []);

      if (showHistory) {
        const histRes = await fetchTaskHistory(10);
        setHistoryTasks(histRes.tasks || []);
      }
    } catch {
      // ignore
    }
  };

  const handlePause = async () => {
    if (!activeTask) return;
    setIsActionBusy(true);
    await pauseTaskApi(activeTask.task_id);
    await loadData();
    setIsActionBusy(false);
  };

  const handleResume = async () => {
    if (!activeTask) return;
    setIsActionBusy(true);
    await resumeTaskApi(activeTask.task_id);
    await loadData();
    setIsActionBusy(false);
  };

  const handleCancel = async () => {
    if (!activeTask) return;
    setIsActionBusy(true);
    await cancelTaskApi(activeTask.task_id);
    await loadData();
    setIsActionBusy(false);
  };

  const handleConfirm = async (confirm: boolean) => {
    setIsActionBusy(true);
    await confirmAgentAction(confirm);
    await loadData();
    setIsActionBusy(false);
  };

  const handleDiscardCheckpoint = async (taskId: string) => {
    await discardTaskCheckpoint(taskId);
    await loadData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executing':
        return <span style={{ color: primaryColor, background: 'rgba(0, 240, 255, 0.15)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>EXECUTING</span>;
      case 'verifying':
        return <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>VERIFYING</span>;
      case 'paused':
        return <span style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>PAUSED</span>;
      case 'waiting_confirmation':
        return <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>CONFIRMATION REQ</span>;
      case 'completed':
        return <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>COMPLETED</span>;
      case 'failed':
        return <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>FAILED</span>;
      case 'cancelled':
        return <span style={{ color: 'rgba(255, 255, 255, 0.5)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px' }}>CANCELLED</span>;
      default:
        return <span style={{ color: 'rgba(255, 255, 255, 0.7)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px' }}>PLANNING</span>;
    }
  };

  const getStepIcon = (step: AutonomousStepRecord) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle size={12} style={{ color: '#10b981' }} />;
      case 'executing':
      case 'verifying':
        return <RefreshCw size={12} className="animate-spin" style={{ color: primaryColor }} />;
      case 'awaiting_confirmation':
        return <AlertTriangle size={12} style={{ color: '#f59e0b' }} />;
      case 'failed':
        return <XCircle size={12} style={{ color: '#ef4444' }} />;
      default:
        return <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.3)', margin: '2px' }} />;
    }
  };

  // If no active task and no unfinished checkpoints, display a compact idle banner
  if (!activeTask && checkpoints.length === 0 && !showHistory) {
    return (
      <div style={{ padding: '6px 12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
          <Activity size={12} style={{ color: primaryColor }} />
          <span>AUTONOMOUS TASK ENGINE: <span style={{ color: '#10b981' }}>STANDBY</span></span>
        </div>
        <button
          type="button"
          onClick={() => { setShowHistory(true); loadData(); }}
          style={{ background: 'transparent', border: 'none', color: primaryColor, fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
        >
          <History size={10} /> TASK HISTORY
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '10px', background: 'rgba(0, 10, 20, 0.85)', border: `1px solid ${primaryColor}44`, borderRadius: '6px', padding: '10px', backdropFilter: 'blur(8px)' }}>
      {/* Unfinished Task Checkpoint Alert */}
      {checkpoints.length > 0 && !activeTask && (
        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '4px', padding: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>UNFINISHED TASK CHECKPOINT FOUND</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => resumeTaskApi(checkpoints[0].task_id)}
                style={{ background: '#10b981', border: 'none', color: '#000', padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                RESUME
              </button>
              <button
                type="button"
                onClick={() => handleDiscardCheckpoint(checkpoints[0].task_id)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '2px 8px', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}
              >
                DISCARD
              </button>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
            "{checkpoints[0].goal}" (Step {checkpoints[0].current_step + 1}/{checkpoints[0].steps.length})
          </div>
        </div>
      )}

      {/* Active Task Section */}
      {activeTask && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} style={{ color: primaryColor }} />
              <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>AUTONOMOUS AGENT TASK</span>
              {getStatusBadge(activeTask.status)}
            </div>

            {/* Task Controls */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {activeTask.status === 'executing' && (
                <button
                  type="button"
                  onClick={handlePause}
                  disabled={isActionBusy}
                  style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  <Pause size={9} /> PAUSE
                </button>
              )}
              {activeTask.status === 'paused' && (
                <button
                  type="button"
                  onClick={handleResume}
                  disabled={isActionBusy}
                  style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  <Play size={9} /> RESUME
                </button>
              )}
              <button
                type="button"
                onClick={handleCancel}
                disabled={isActionBusy}
                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <Square size={9} /> STOP
              </button>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>
            "{activeTask.goal}"
          </div>

          {/* Steps Progress List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto', marginBottom: '8px' }}>
            {activeTask.steps.map((step, sIdx) => (
              <div
                key={sIdx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  padding: '4px 6px',
                  borderRadius: '3px',
                  background: step.status === 'executing' ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${step.status === 'executing' ? primaryColor + '44' : 'rgba(255, 255, 255, 0.04)'}`
                }}
              >
                <div style={{ marginTop: '2px' }}>{getStepIcon(step)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: step.status === 'completed' ? '#10b981' : (step.status === 'executing' ? '#fff' : 'rgba(255,255,255,0.7)') }}>
                      {step.step_index}. {step.title}
                    </span>
                    {step.verified && (
                      <span style={{ fontSize: '8px', color: '#10b981', border: '1px solid #10b98133', padding: '1px 3px', borderRadius: '2px' }}>
                        VERIFIED
                      </span>
                    )}
                  </div>
                  {step.observation && (
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                      {step.observation}
                    </div>
                  )}
                  {step.error && (
                    <div style={{ fontSize: '9px', color: '#ef4444', marginTop: '2px' }}>
                      {step.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Confirmation Prompt Controls */}
          {activeTask.status === 'waiting_confirmation' && (
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>ACTION REQUIRES EXPLICIT CONFIRMATION</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleConfirm(true)}
                  style={{ background: '#10b981', border: 'none', color: '#000', padding: '3px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  <Check size={10} /> CONFIRM
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirm(false)}
                  style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task History Drawer Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          type="button"
          onClick={() => { setShowHistory(!showHistory); loadData(); }}
          style={{ background: 'transparent', border: 'none', color: primaryColor, fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <History size={11} /> {showHistory ? 'HIDE TASK HISTORY' : 'VIEW TASK HISTORY'}
          {showHistory ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {showHistory && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto', marginTop: '6px' }}>
          {historyTasks.length === 0 ? (
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', padding: '4px' }}>No recorded tasks.</div>
          ) : (
            historyTasks.map((t) => (
              <div key={t.task_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '4px 6px', borderRadius: '3px' }}>
                <span style={{ fontSize: '10px', color: '#fff' }}>"{t.goal.slice(0, 32)}..."</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>{t.duration_seconds}s</span>
                  {getStatusBadge(t.status)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
