export interface ExecutionStep {
  step_index?: number;
  title: string;
  tool?: string;
  arguments?: Record<string, any>;
  status: 'executing' | 'completed' | 'failed' | 'awaiting_confirmation' | 'canceled';
  message?: string;
  error?: string;
  verified?: boolean;
  duration_ms?: number;
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface ChatApiResponse {
  reply: string;
  status: 'success' | 'error';
  intent?: string;
  steps?: ExecutionStep[];
  is_configured: boolean;
  model_used?: string;
  mode_used?: string;
  route_reason?: string;
  sources?: ResearchSource[];
  timestamp: string;
}

export interface HealthApiResponse {
  status: string;
  service: string;
  model: string;
  is_configured: boolean;
  total_tools?: number;
  memory_enabled?: boolean;
  reminders_enabled?: boolean;
  smart_home_provider?: string;
  active_task?: AutonomousTaskRecord | null;
  timestamp: string;
}

export interface AutonomousStepRecord {
  step_index: number;
  title: string;
  tool_name: string;
  arguments: Record<string, any>;
  expected_result: string;
  status: 'pending' | 'executing' | 'verifying' | 'completed' | 'failed' | 'awaiting_confirmation' | 'canceled';
  retry_count: number;
  observation: string;
  error: string;
  verified: boolean;
}

export interface AutonomousTaskRecord {
  task_id: string;
  goal: string;
  status: 'planning' | 'waiting_confirmation' | 'executing' | 'verifying' | 'paused' | 'completed' | 'failed' | 'cancelled';
  steps: AutonomousStepRecord[];
  current_step: number;
  requires_confirmation: boolean;
  created_at: string;
  updated_at: string;
  duration_seconds: number;
  error_message: string;
  result_summary: string;
}

export interface MemoryRecord {
  id: string;
  category: string;
  topic_key: string;
  content: string;
  importance: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ReminderRecord {
  id: string;
  title: string;
  due_timestamp: string;
  due_epoch: number;
  recurring: boolean;
  recurrence_rule: string;
  status: 'pending' | 'completed' | 'missed' | 'canceled';
  created_at: string;
}

export interface TimerRecord {
  id: string;
  label: string;
  duration_seconds: number;
  remaining_seconds: number;
  start_epoch: number;
  end_epoch: number;
  status: 'running' | 'paused' | 'completed' | 'canceled';
  created_at: string;
}

export interface ContactRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegram_handle: string;
  whatsapp_id: string;
  notes: string;
}

export interface EmailRecord {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  snippet: string;
  body: string;
  timestamp: string;
  is_unread: boolean;
}

export interface SmartDeviceRecord {
  id: string;
  name: string;
  type: string;
  room: string;
  capabilities: string[];
  state: {
    power?: 'on' | 'off';
    brightness?: number;
    speed?: number;
    volume?: number;
    [key: string]: any;
  };
  provider: string;
  online: boolean;
}

export interface SmartRoomRecord {
  id: string;
  name: string;
  description: string;
}

export interface AssistantNotification {
  type: 'reminder' | 'timer' | 'missed_summary';
  id?: string;
  title?: string;
  label?: string;
  due_timestamp?: string;
  speech: string;
  count?: number;
  timestamp?: string;
}

const API_BASE_URL = '/api';

export async function sendChatMessage(
  message: string,
  sessionId: string = 'default',
  signal?: AbortSignal,
  mode: string = 'auto',
  modelOverride?: string
): Promise<ChatApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        mode,
        model_override: modelOverride
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server returned HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('ABORTED');
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Unable to communicate with the JARVIS AI service.');
  }
}

export async function stopAgentExecution(sessionId: string = 'default'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function confirmAgentAction(
  confirm: boolean,
  sessionId: string = 'default'
): Promise<ChatApiResponse> {
  const response = await fetch(`${API_BASE_URL}/agent/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, confirm }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Confirmation failed with HTTP ${response.status}`);
  }

  return await response.json();
}

export async function checkBackendHealth(): Promise<HealthApiResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) return await response.json();
    return null;
  } catch {
    return null;
  }
}

export async function resetSessionMemory(sessionId: string = 'default'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// â”€â”€ Phase 12 Autonomous Tasks API â”€â”€
export async function fetchActiveTask(): Promise<{ active_task: AutonomousTaskRecord | null }> {
  const res = await fetch(`${API_BASE_URL}/tasks/active`);
  if (!res.ok) throw new Error('Failed to fetch active task');
  return await res.json();
}

export async function fetchTaskHistory(limit: number = 20): Promise<{ total: number; tasks: AutonomousTaskRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/tasks/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch task history');
  return await res.json();
}

export async function pauseTaskApi(taskId?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/tasks/pause`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId })
  });
  return await res.json();
}

export async function resumeTaskApi(taskId?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/tasks/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId })
  });
  return await res.json();
}

export async function cancelTaskApi(taskId?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/tasks/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId })
  });
  return await res.json();
}

export async function fetchTaskCheckpoints(): Promise<{ total: number; checkpoints: AutonomousTaskRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/tasks/checkpoints`);
  if (!res.ok) throw new Error('Failed to fetch checkpoints');
  return await res.json();
}

export async function discardTaskCheckpoint(taskId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/tasks/checkpoints/discard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId })
  });
  return await res.json();
}

// â”€â”€ Phase 8 Memory API â”€â”€
export async function fetchMemories(category?: string): Promise<{ enabled: boolean; total: number; memories: MemoryRecord[] }> {
  const url = category ? `${API_BASE_URL}/memory?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/memory`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch memories');
  return await res.json();
}

export async function createMemory(content: string, category: string = 'preference', topicKey?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, category, topic_key: topicKey })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save memory');
  }
  return await res.json();
}

export async function editMemory(memoryId: string, content: string, category?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/memory/${memoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, category })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update memory');
  }
  return await res.json();
}

export async function deleteMemory(memoryId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/memory/${memoryId}`, { method: 'DELETE' });
  return res.ok;
}

export async function clearAllMemories(): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/memory`, { method: 'DELETE' });
  return res.ok;
}

// â”€â”€ Phase 9 Assistant & Reminders API â”€â”€
export async function fetchReminders(status: string = 'pending'): Promise<{ total: number; reminders: ReminderRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/assistant/reminders?status=${status}`);
  if (!res.ok) throw new Error('Failed to fetch reminders');
  return await res.json();
}

export async function createReminder(title: string, timeExpression: string, recurring: boolean = false, recurrenceRule: string = 'none'): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/assistant/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, time_expression: timeExpression, recurring, recurrence_rule: recurrenceRule })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create reminder');
  }
  return await res.json();
}

export async function deleteReminder(reminderId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/assistant/reminders/${reminderId}`, { method: 'DELETE' });
  return res.ok;
}

export async function clearAllReminders(): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/assistant/reminders`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchTimers(): Promise<{ timers: TimerRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/assistant/timers`);
  if (!res.ok) throw new Error('Failed to fetch timers');
  return await res.json();
}

export async function createTimer(durationSeconds: number, label: string = 'Timer'): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/assistant/timers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration_seconds: durationSeconds, label })
  });
  if (!res.ok) throw new Error('Failed to start timer');
  return await res.json();
}

export async function stopTimer(timerId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/assistant/timers/${timerId}/stop`, { method: 'POST' });
  return res.ok;
}

export async function pollAssistantNotifications(): Promise<AssistantNotification[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/assistant/notifications`);
    if (res.ok) {
      const data = await res.json();
      return data.notifications || [];
    }
  } catch {
    // ignore
  }
  return [];
}

// â”€â”€ Phase 10 Communication API â”€â”€
export async function fetchContacts(): Promise<{ total: number; contacts: ContactRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/communication/contacts`);
  if (!res.ok) throw new Error('Failed to fetch contacts');
  return await res.json();
}

export async function fetchEmails(): Promise<{ recent_emails: EmailRecord[]; active_draft: any }> {
  const res = await fetch(`${API_BASE_URL}/communication/emails`);
  if (!res.ok) throw new Error('Failed to fetch emails');
  return await res.json();
}

export async function draftEmailApi(recipient: string, body: string, subject?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/communication/emails/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient, body, subject })
  });
  return await res.json();
}

export async function sendEmailApi(draftId?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/communication/emails/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draft_id: draftId })
  });
  return await res.json();
}

export async function getUnreadSummary(): Promise<{ summary: string }> {
  const res = await fetch(`${API_BASE_URL}/communication/emails/unread/summary`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return await res.json();
}

// â”€â”€ Phase 11 Smart Home API â”€â”€
export async function fetchSmartDevices(room?: string, type?: string): Promise<{ provider: string; total: number; devices: SmartDeviceRecord[] }> {
  let url = `${API_BASE_URL}/smart-home/devices`;
  const params: string[] = [];
  if (room) params.push(`room=${encodeURIComponent(room)}`);
  if (type) params.push(`type=${encodeURIComponent(type)}`);
  if (params.length) url += `?${params.join('&')}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch smart devices');
  return await res.json();
}

export async function toggleSmartDevice(deviceId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/smart-home/devices/${deviceId}/toggle`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to toggle device');
  }
  return await res.json();
}

export async function setSmartDeviceValue(deviceId: string, capability: string, value: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/smart-home/devices/${deviceId}/value`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capability, value })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to set device value');
  }
  return await res.json();
}

export async function controlSmartGroup(groupType: string, action: string, room?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/smart-home/groups/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group_type: groupType, action, room })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to control group');
  }
  return await res.json();
}

export async function fetchSmartRooms(): Promise<{ total: number; rooms: SmartRoomRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/smart-home/rooms`);
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return await res.json();
}

export async function fetchSmartScenes(): Promise<{ total: number; scenes: Record<string, any> }> {
  const res = await fetch(`${API_BASE_URL}/smart-home/scenes`);
  if (!res.ok) throw new Error('Failed to fetch scenes');
  return await res.json();
}

export async function activateSmartScene(sceneName: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/smart-home/scenes/${encodeURIComponent(sceneName)}/activate`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to activate scene');
  return await res.json();
}

export async function broadcastGoogleHome(message: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/smart-home/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error('Failed to broadcast announcement');
  return await res.json();
}

export async function fetchSmartHomeConfig(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/smart-home/config`);
  if (!res.ok) throw new Error('Failed to fetch smart home config');
  return await res.json();
}

export async function saveSmartHomeConfig(config: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/smart-home/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to save smart home config');
  return await res.json();
}

export async function setSmartHomeProvider(provider: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/smart-home/provider`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider })
  });
  if (!res.ok) throw new Error('Failed to set smart home provider');
  return await res.json();
}

export async function fetchVoiceEngines(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/voice/engines`);
  if (!res.ok) throw new Error('Failed to fetch voice engines');
  return await res.json();
}

export async function fetchVoiceConfig(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/voice/config`);
  if (!res.ok) throw new Error('Failed to fetch voice config');
  return await res.json();
}

export async function saveVoiceConfig(config: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/voice/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to save voice config');
  return await res.json();
}

// ── Credential / Multi-Provider API Key Management ────────────────────────────

export interface ProviderFreeInfo {
  is_free: string;
  badge: string;
  url: string;
  note: string;
}

export interface ProviderStatusRecord {
  provider: string;
  name: string;
  configured: boolean;
  masked_key: string | null;
  key_prefix: string | null;
  default_model: string;
  available_models: string[];
  free_info?: ProviderFreeInfo;
}

export interface AllProvidersStatusRecord {
  active_provider: string;
  active_model: string;
  configured_count: number;
  providers: Record<string, ProviderStatusRecord>;
}

export interface CredentialStatusRecord {
  configured: boolean;
  masked_key: string | null;
  key_prefix: string | null;
}

export interface CredentialActionRecord {
  success: boolean;
  message: string;
}

export interface ConnectionTestRecord {
  success: boolean;
  message: string;
  model_id: string | null;
}

export async function fetchAllProvidersStatus(): Promise<AllProvidersStatusRecord> {
  const res = await fetch(`${API_BASE_URL}/credentials/providers/status`);
  if (!res.ok) throw new Error('Failed to fetch AI providers status');
  return await res.json();
}

export async function saveProviderKey(provider: string, rawKey: string): Promise<CredentialActionRecord> {
  const res = await fetch(`${API_BASE_URL}/credentials/providers/${provider}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: rawKey }),
  });
  const data = await res.json().catch(() => ({ success: false, message: 'Server error' }));
  if (!res.ok) throw new Error(data.detail || data.message || 'Failed to save provider API key');
  return data;
}

export async function removeProviderKey(provider: string): Promise<CredentialActionRecord> {
  const res = await fetch(`${API_BASE_URL}/credentials/providers/${provider}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({ success: false, message: 'Server error' }));
  if (!res.ok) throw new Error(data.detail || data.message || 'Failed to remove provider key');
  return data;
}

export async function testProviderConnection(provider: string): Promise<ConnectionTestRecord> {
  const res = await fetch(`${API_BASE_URL}/credentials/providers/${provider}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Connection test failed for ${provider}`);
  return await res.json();
}

export async function setActiveAIProvider(provider: string, model?: string): Promise<CredentialActionRecord> {
  const res = await fetch(`${API_BASE_URL}/credentials/active-provider`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model })
  });
  const data = await res.json().catch(() => ({ success: false, message: 'Server error' }));
  if (!res.ok) throw new Error(data.detail || data.message || 'Failed to switch active provider');
  return data;
}

export async function fetchOpenAIKeyStatus(): Promise<CredentialStatusRecord> {
  const res = await fetch(`${API_BASE_URL}/credentials/openai/status`);
  if (!res.ok) throw new Error('Failed to fetch API key status');
  return await res.json();
}

export async function saveOpenAIKey(rawKey: string): Promise<CredentialActionRecord> {
  return saveProviderKey('openai', rawKey);
}

export async function removeOpenAIKey(): Promise<CredentialActionRecord> {
  return removeProviderKey('openai');
}

export async function testOpenAIConnection(): Promise<ConnectionTestRecord> {
  return testProviderConnection('openai');
}


export interface ToolRecord {
  name: string;
  description: string;
  permission_level?: string;
  timeout_seconds?: number;
}

export async function fetchAvailableTools(): Promise<{ total_tools: number; tools: ToolRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/agent/tools`);
  if (!res.ok) throw new Error('Failed to fetch tools');
  return await res.json();
}

export interface SystemMetricsResponse {
  status: string;
  health?: string;
  version?: string;
  cpu: {
    usage_percent: number;
    brand: string;
    physical_cores: number;
    logical_cores: number;
    frequency_mhz?: number;
    temperatures?: Record<string, any>;
  };
  ram: {
    total_gb: number;
    used_gb: number;
    available_gb: number;
    percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    percent: number;
    read_bytes?: number;
    write_bytes?: number;
  };
  battery: {
    percent: number;
    plugged: boolean;
    minutes_left?: number | null;
  };
  network?: {
    bytes_sent: number;
    bytes_recv: number;
    active_connections?: number;
  };
  threads: number;
  top_processes?: Array<{
    pid: number;
    name: string;
    cpu_pct: number;
    mem_pct: number;
  }>;
  os: {
    name: string;
    machine: string;
    computer_name: string;
  };
}

export async function fetchSystemMetrics(): Promise<SystemMetricsResponse> {
  const res = await fetch(`${API_BASE_URL}/system/metrics`);
  if (!res.ok) throw new Error('Failed to fetch system metrics');
  return await res.json();
}

// ── 24/7 Always-Online & Persistence API ───────────────────────────────────────

export interface AlwaysOnStatusRecord {
  status: string;
  is_24x7: boolean;
  keep_awake: {
    enabled: boolean;
    running: boolean;
    keep_display_on: boolean;
    platform: string;
    last_heartbeat: number;
  };
  autostart: {
    autostart_enabled: boolean;
    launcher_vbs: string;
    launcher_bat: string;
    vbs_exists: boolean;
    bat_exists: boolean;
  };
  watchdog: {
    status?: string;
    pid?: number;
    backend_pid?: number;
    started_at?: string;
    last_healthy?: string;
    total_recoveries?: number;
    consecutive_failures?: number;
  };
  server_time: string;
}

export async function fetchAlwaysOnStatus(): Promise<AlwaysOnStatusRecord> {
  const res = await fetch(`${API_BASE_URL}/system/always-on`);
  if (!res.ok) throw new Error('Failed to fetch always-on status');
  return await res.json();
}

export async function toggleKeepAwakeApi(enabled: boolean, keepDisplayOn: boolean = false): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/system/always-on/keep-awake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled, keep_display_on: keepDisplayOn })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to toggle keep-awake mode');
  }
  return await res.json();
}

export async function toggleAutostartApi(enabled: boolean): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/system/always-on/autostart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to toggle autostart mode');
  }
  return await res.json();
}

export interface ActionHistoryRecord {
  timestamp: string;
  time_display: string;
  user_command: string;
  tool: string;
  status: string;
  result: string;
  duration_ms: number;
  arguments?: Record<string, any>;
}

export async function fetchActionHistory(limit: number = 50): Promise<{ total: number; history: ActionHistoryRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/agent/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch action history');
  return await res.json();
}

export async function clearActionHistory(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/agent/history`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear action history');
  return await res.json();
}

export interface TaskProgressRecord {
  taskId: string;
  userCommand: string;
  currentStep: number;
  totalSteps: number;
  currentTool: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  error?: string;
  steps: ExecutionStep[];
}

export async function fetchTaskProgress(): Promise<{ active: boolean; task: TaskProgressRecord | null }> {
  const res = await fetch(`${API_BASE_URL}/agent/task`);
  if (!res.ok) throw new Error('Failed to fetch task progress');
  return await res.json();
}

export async function cancelAgentSessionTaskApi(sessionId: string = 'default'): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/agent/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  });
  if (!res.ok) throw new Error('Failed to cancel task');
  return await res.json();
}

// ── User Tasks API (Section 7, 8, 9) ──
export interface UserTaskRecord {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  dueAt?: string | null;
  completedAt?: string | null;
}

export async function fetchUserTasks(status?: string, query?: string): Promise<{ total: number; tasks: UserTaskRecord[] }> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (query) params.append('query', query);
  const res = await fetch(`${API_BASE_URL}/user-tasks?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch user tasks');
  return await res.json();
}

export async function createUserTask(task: { title: string; description?: string; priority?: string; due_at?: string }): Promise<{ status: string; task: UserTaskRecord }> {
  const res = await fetch(`${API_BASE_URL}/user-tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  if (!res.ok) throw new Error('Failed to create task');
  return await res.json();
}

export async function updateUserTask(taskId: string, updates: Partial<UserTaskRecord>): Promise<{ status: string; task: UserTaskRecord }> {
  const res = await fetch(`${API_BASE_URL}/user-tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return await res.json();
}

export async function completeUserTask(taskId: string): Promise<{ status: string; task: UserTaskRecord }> {
  const res = await fetch(`${API_BASE_URL}/user-tasks/${taskId}/complete`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to complete task');
  return await res.json();
}

export async function deleteUserTask(taskId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/user-tasks/${taskId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
  return await res.json();
}

export async function clearAllUserTasks(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/user-tasks`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear user tasks');
  return await res.json();
}

// ── Conversation Sessions API (Section 6) ──
export interface ConversationRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: Array<{ id: string; role: string; content: string; timestamp: string; is_error?: boolean }>;
}

export async function fetchConversations(): Promise<{ total: number; conversations: ConversationRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/conversations`);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return await res.json();
}

export async function createConversation(title: string = 'New Chat'): Promise<{ status: string; conversation: ConversationRecord }> {
  const res = await fetch(`${API_BASE_URL}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return await res.json();
}

export async function getConversation(convId: string): Promise<{ conversation: ConversationRecord }> {
  const res = await fetch(`${API_BASE_URL}/conversations/${convId}`);
  if (!res.ok) throw new Error('Failed to fetch conversation');
  return await res.json();
}

export async function renameConversation(convId: string, title: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/conversations/${convId}/rename`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  if (!res.ok) throw new Error('Failed to rename conversation');
  return await res.json();
}

export async function deleteConversation(convId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/conversations/${convId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return await res.json();
}

export async function searchConversations(query: string): Promise<{ total: number; conversations: ConversationRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/conversations/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search conversations');
  return await res.json();
}

// ── Notifications & Snooze API (Section 13, 14) ──
export async function fetchAssistantNotifications(): Promise<{ total: number; notifications: any[] }> {
  const res = await fetch(`${API_BASE_URL}/assistant/notifications`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return await res.json();
}

export async function snoozeReminderApi(reminderId: string, minutes: number = 10): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/assistant/reminders/${reminderId}/snooze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutes })
  });
  if (!res.ok) throw new Error('Failed to snooze reminder');
  return await res.json();
}

export async function dismissReminderApi(reminderId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/assistant/reminders/${reminderId}/dismiss`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to dismiss reminder');
  return await res.json();
}

// ── Data Management & Export/Import API (Section 22) ──
export async function exportAllDataApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/data/export`);
  if (!res.ok) throw new Error('Failed to export data');
  return await res.json();
}

export async function importMemoryDataApi(memories: any[]): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/data/import/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memories })
  });
  if (!res.ok) throw new Error('Failed to import memory');
  return await res.json();
}

export async function deleteAllDataApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/data/all`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm: true })
  });
  if (!res.ok) throw new Error('Failed to delete all data');
  return await res.json();
}

// ── Developer & Code Sandbox APIs ──
export async function runCodeApi(code: string, language: string = 'python', timeout: number = 10): Promise<{
  success: boolean;
  language: string;
  stdout: string;
  stderr: string;
  returncode: number;
  duration_ms: number;
}> {
  const res = await fetch(`${API_BASE_URL}/developer/run-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language, timeout })
  });
  if (!res.ok) throw new Error('Failed to execute code');
  return await res.json();
}

export async function fetchGitStatusApi(repoPath: string = '.'): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/developer/git-status?repo_path=${encodeURIComponent(repoPath)}`);
  if (!res.ok) throw new Error('Failed to fetch git status');
  return await res.json();
}

export async function fetchGitLogApi(repoPath: string = '.', limit: number = 5): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/developer/git-log?repo_path=${encodeURIComponent(repoPath)}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch git log');
  return await res.json();
}

// ── Deep Diagnostics & Process Matrix APIs ──
export async function fetchTopProcessesApi(limit: number = 15, sortBy: string = 'memory'): Promise<{
  success: boolean;
  sort_by: string;
  total_running: number;
  processes: Array<{
    pid: number;
    name: string;
    cpu_percent: number;
    memory_mb: number;
    memory_percent: number;
    status: string;
  }>;
}> {
  const res = await fetch(`${API_BASE_URL}/system/processes?limit=${limit}&sort_by=${sortBy}`);
  if (!res.ok) throw new Error('Failed to fetch processes');
  return await res.json();
}

export async function killProcessApi(params: { pid?: number; name?: string }): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_BASE_URL}/system/kill-process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to kill process');
  return await res.json();
}

export async function fetchStorageApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/system/storage`);
  if (!res.ok) throw new Error('Failed to fetch storage');
  return await res.json();
}

export async function fetchBatteryApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/system/battery`);
  if (!res.ok) throw new Error('Failed to fetch battery');
  return await res.json();
}

export async function deepCleanApi(): Promise<{ success: boolean; files_deleted: number; freed_mb: number; message: string }> {
  const res = await fetch(`${API_BASE_URL}/system/deep-clean`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to perform deep clean');
  return await res.json();
}

// ── Network Diagnostics APIs ──
export async function pingNetworkApi(host: string = '8.8.8.8', count: number = 4): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/system/network/ping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host, count })
  });
  if (!res.ok) throw new Error('Failed to ping host');
  return await res.json();
}

export async function fetchIpInfoApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/system/network/ip-info`);
  if (!res.ok) throw new Error('Failed to fetch IP info');
  return await res.json();
}

export async function fetchNetworkSpeedApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/system/network/speed`);
  if (!res.ok) throw new Error('Failed to test network speed');
  return await res.json();
}

// ── Live Intel & Market APIs ──
export async function fetchLiveWeatherApi(location: string = 'Dhaka'): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/intel/weather?location=${encodeURIComponent(location)}`);
  if (!res.ok) throw new Error('Failed to fetch weather');
  return await res.json();
}

export async function fetchCryptoFxApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/intel/crypto-fx`);
  if (!res.ok) throw new Error('Failed to fetch crypto & forex rates');
  return await res.json();
}

export async function fetchTechNewsApi(limit: number = 5): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/intel/tech-news?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch tech news');
  return await res.json();
}

// ── Media & Clipboard APIs ──
export async function sendMediaActionApi(action: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/system/media/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  if (!res.ok) throw new Error('Failed to execute media action');
  return await res.json();
}

export async function readClipboardApi(): Promise<{ success: boolean; content: string; length: number }> {
  const res = await fetch(`${API_BASE_URL}/system/clipboard`);
  if (!res.ok) throw new Error('Failed to read clipboard');
  return await res.json();
}

export async function writeClipboardApi(text: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/system/clipboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error('Failed to write clipboard');
  return await res.json();
}

// ── Master Intelligence & Tactical Features APIs ──
export async function fetchTacticalBriefingApi(location: string = 'Dhaka'): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/intel/briefing?location=${encodeURIComponent(location)}`);
  if (!res.ok) throw new Error('Failed to fetch tactical briefing dossier');
  return await res.json();
}

export async function fetchRadarScanApi(location?: string): Promise<any> {
  const url = location 
    ? `${API_BASE_URL}/intel/radar/scan?location=${encodeURIComponent(location)}`
    : `${API_BASE_URL}/intel/radar/scan`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to execute geospatial radar sweep');
  return await res.json();
}

export async function analyzeScreenVisionApi(query: string = 'Analyze screen'): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/intel/analyze-screen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Failed to analyze screen vision');
  return await res.json();
}

export async function analyzeCameraVisionApi(params: {
  image_base64: string;
  query?: string;
  language?: string;
  continuous?: boolean;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/intel/camera/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: params.image_base64,
      query: params.query || 'Describe what you see in front of the camera',
      language: params.language || 'auto',
      continuous: params.continuous || false
    })
  });
  if (!res.ok) throw new Error('Failed to analyze camera vision');
  return await res.json();
}

export async function getCameraVisionStatusApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/intel/camera/status`);
  if (!res.ok) throw new Error('Failed to fetch camera status');
  return await res.json();
}

export async function fetchMacrosApi(): Promise<{ macros: any[] }> {
  const res = await fetch(`${API_BASE_URL}/intel/macros`);
  if (!res.ok) throw new Error('Failed to fetch macro presets');
  return await res.json();
}

export async function executeMacroApi(macro_id: string, params?: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/intel/macros/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ macro_id, params })
  });
  if (!res.ok) throw new Error(`Failed to execute macro '${macro_id}'`);
  return await res.json();
}

// ── Mark-VII Reactor Health Index & Turbo Boost APIs ──
export interface SystemHealthIndexResponse {
  success: boolean;
  health_index: number;
  rating: 'OPTIMAL' | 'NOMINAL' | 'CAUTION' | 'CRITICAL';
  status_color: string;
  cpu_percent: number;
  ram_percent: number;
  disk_max_percent: number;
  battery_percent: number;
  power_plugged: boolean;
  recommendations: string[];
  timestamp: string;
}

export interface SystemBoostResponse {
  success: boolean;
  files_deleted: number;
  disk_freed_mb: number;
  dns_flushed: boolean;
  available_ram_gb: number;
  ram_percent: number;
  status: string;
  message: string;
}

export async function fetchSystemHealthIndexApi(): Promise<SystemHealthIndexResponse> {
  const res = await fetch(`${API_BASE_URL}/system/health-index`);
  if (!res.ok) throw new Error('Failed to fetch system health index');
  return await res.json();
}

export async function executeSystemBoostApi(): Promise<SystemBoostResponse> {
  const res = await fetch(`${API_BASE_URL}/system/boost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to execute system boost');
  return await res.json();
}

// ── Ambient Auditory Memory APIs ──────────────────────────────────────────────
export interface AmbientConfigRecord {
  enabled: boolean;
  paused: boolean;
  save_audio: boolean;
  retention_days: number;
  max_records: number;
  default_language: string;
  min_confidence_threshold: number;
  storage_dir?: string;
  audio_dir?: string;
}

export interface AmbientMemoryItemRecord {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  transcript: string;
  language: string;
  confidence: number;
  audio_reference?: string | null;
  status: 'processed' | 'uncertain' | 'pending' | 'failed';
  metadata: Record<string, any>;
  created_at: string;
}

export interface AmbientStatusRecord {
  status: string;
  module: string;
  version: string;
  stats: {
    total_records: number;
    dates_recorded: number;
    available_dates: string[];
    enabled: boolean;
    retention_days: number;
    max_records: number;
  };
  config: AmbientConfigRecord;
  pipeline: {
    current_state: 'OFF' | 'PAUSED' | 'LISTENING' | 'PROCESSING';
    pipeline_running: boolean;
    enabled: boolean;
    paused: boolean;
    save_audio: boolean;
    retention_days: number;
    listener: any;
    pending_queue_size: number;
    total_transcribed_count: number;
    last_transcription?: any;
  };
}

export async function fetchAmbientStatusApi(): Promise<AmbientStatusRecord> {
  const res = await fetch(`${API_BASE_URL}/ambient/status`);
  if (!res.ok) throw new Error('Failed to fetch ambient memory status');
  return await res.json();
}

export async function fetchAmbientConfigApi(): Promise<AmbientConfigRecord> {
  const res = await fetch(`${API_BASE_URL}/ambient/config`);
  if (!res.ok) throw new Error('Failed to fetch ambient config');
  return await res.json();
}

export async function updateAmbientConfigApi(config: Partial<AmbientConfigRecord>): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/ambient/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to update ambient config');
  return await res.json();
}

export async function startAmbientPipelineApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/ambient/pipeline/start`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start ambient pipeline');
  return await res.json();
}

export async function pauseAmbientPipelineApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/ambient/pipeline/pause`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to pause ambient pipeline');
  return await res.json();
}

export async function resumeAmbientPipelineApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/ambient/pipeline/resume`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to resume ambient pipeline');
  return await res.json();
}

export async function stopAmbientPipelineApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/ambient/pipeline/stop`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to stop ambient pipeline');
  return await res.json();
}

export async function fetchAmbientMemoriesApi(params?: { date?: string; search?: string; limit?: number; offset?: number }): Promise<{ total: number; memories: AmbientMemoryItemRecord[] }> {
  const query = new URLSearchParams();
  if (params?.date) query.append('date', params.date);
  if (params?.search) query.append('search', params.search);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());
  
  const res = await fetch(`${API_BASE_URL}/ambient/memories?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch ambient memories');
  return await res.json();
}

export async function deleteAmbientMemoryApi(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/ambient/memories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete ambient memory ${id}`);
  return await res.json();
}

export async function deleteAmbientMemoriesRangeApi(date: string, startTime: string, endTime: string): Promise<any> {
  const query = new URLSearchParams({ date, start_time: startTime, end_time: endTime });
  const res = await fetch(`${API_BASE_URL}/ambient/memories/range?${query.toString()}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete ambient memories in range');
  return await res.json();
}

export async function clearAllAmbientMemoriesApi(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/ambient/memories`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear ambient memories');
  return await res.json();
}

// ── BANGLADESH BREAKING NEWS & AGENT TOWN NEWSROOM API ──

export interface BangladeshNewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  url: string;
  published_at?: string;
  hot_level?: 'BREAKING' | 'TRENDING';
  sentiment?: string;
}

export interface BangladeshNewsResponse {
  success: boolean;
  cached?: boolean;
  count: number;
  last_updated: string;
  stories: BangladeshNewsItem[];
}

export interface AgentNewsDialogueTurn {
  speakerId: string;
  speakerName: string;
  color: string;
  text: string;
  subtext?: string;
  action?: string;
  delayMs?: number;
}

export interface BangladeshNewsAnalysisResponse {
  success: boolean;
  story: string;
  category: string;
  turn_count: number;
  dialogue_script: AgentNewsDialogueTurn[];
  executive_summary: string;
}

export async function fetchBangladeshNewsApi(limit: number = 8, forceRefresh: boolean = false): Promise<BangladeshNewsResponse> {
  const query = new URLSearchParams({ limit: limit.toString(), force_refresh: forceRefresh ? 'true' : 'false' });
  const res = await fetch(`${API_BASE_URL}/intel/bangladesh-news?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch Bangladesh breaking news');
  }
  return await res.json();
}

export async function analyzeBangladeshNewsStoryApi(storyTitle?: string, category?: string): Promise<BangladeshNewsAnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/intel/bangladesh-news/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ story_title: storyTitle, category })
  });
  if (!res.ok) {
    throw new Error('Failed to analyze Bangladesh news story');
  }
  return await res.json();
}


