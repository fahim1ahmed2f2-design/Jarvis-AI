import React, { useState, useEffect } from 'react';
import {
  X, Sliders, Mic, Clock, Zap, Volume2, Play, Eye, Monitor,
  ShieldAlert, Globe, Compass, BookOpen, Database, Trash2, Search,
  Edit2, Plus, Bell, Calendar, Timer, CheckCircle, AlertTriangle,
  Mail, MessageSquare, User, Send, Inbox, ShieldCheck,
  Home, Power, Lightbulb, Wind, Tv, Terminal, Code, Activity, Cpu,
  Radio, CheckSquare, Download, ExternalLink, Key, Sparkles, Layers
} from 'lucide-react';
import {
  VoiceSettings,
  AudioInputDevice,
  VoiceOption,
  loadVoiceSettings,
  saveVoiceSettings,
  getAvailableMicrophones,
  getAvailableVoices
} from '../../services/voiceSettings';
import {
  fetchMemories,
  createMemory,
  deleteMemory,
  clearAllMemories,
  editMemory,
  MemoryRecord,
  fetchReminders,
  deleteReminder,
  clearAllReminders,
  ReminderRecord,
  fetchTimers,
  stopTimer,
  TimerRecord,
  fetchContacts,
  fetchEmails,
  draftEmailApi,
  sendEmailApi,
  ContactRecord,
  EmailRecord,
  fetchSmartDevices,
  toggleSmartDevice,
  setSmartDeviceValue,
  controlSmartGroup,
  fetchSmartRooms,
  fetchSmartScenes,
  activateSmartScene,
  broadcastGoogleHome,
  fetchSmartHomeConfig,
  saveSmartHomeConfig,
  fetchVoiceConfig,
  saveVoiceConfig,
  SmartDeviceRecord,
  SmartRoomRecord,
  fetchOpenAIKeyStatus,
  saveOpenAIKey,
  removeOpenAIKey,
  testOpenAIConnection,
  fetchAllProvidersStatus,
  saveProviderKey,
  removeProviderKey,
  testProviderConnection,
  setActiveAIProvider,
  AllProvidersStatusRecord,
  ProviderStatusRecord,
  CredentialStatusRecord,
  fetchAlwaysOnStatus,
  toggleKeepAwakeApi,
  toggleAutostartApi,
  AlwaysOnStatusRecord,
  fetchAvailableTools,
  fetchActionHistory,
  clearActionHistory,
  ActionHistoryRecord,
  fetchUserTasks,
  createUserTask,
  updateUserTask,
  completeUserTask,
  deleteUserTask,
  clearAllUserTasks,
  UserTaskRecord,
  exportAllDataApi,
  importMemoryDataApi,
  deleteAllDataApi
} from '../../services/api';
import { TTSPlaybackCallbacks } from '../../services/ttsService';
import { AmbientMemorySection } from './AmbientMemorySection';


interface VoiceSettingsModalProps {
  isOpen: boolean;
  primaryColor: string;
  onClose: () => void;
  onSettingsSaved: (settings: VoiceSettings) => void;
  onTestVoice?: (callbacks: TTSPlaybackCallbacks) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  primaryColor,
  onClose,
  onSettingsSaved,
  onTestVoice
}) => {
  const [settings, setSettings] = useState<VoiceSettings>(loadVoiceSettings());
  const [devices, setDevices] = useState<AudioInputDevice[]>([]);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  // Phase 8 Memory state
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [memorySearch, setMemorySearch] = useState('');
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Phase 9 Assistant state
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [timers, setTimers] = useState<TimerRecord[]>([]);

  // Phase 10 Communication state
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [recentEmails, setRecentEmails] = useState<EmailRecord[]>([]);
  const [activeDraft, setActiveDraft] = useState<any>(null);
  const [contactSearch, setContactSearch] = useState('');

  // Phase 11 Smart Home state
  const [smartDevices, setSmartDevices] = useState<SmartDeviceRecord[]>([]);
  const [smartRooms, setSmartRooms] = useState<SmartRoomRecord[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [smartProvider, setSmartProvider] = useState<string>('virtual');
  const [smartHomeConfig, setSmartHomeConfig] = useState<any>(null);
  const [googleProjectId, setGoogleProjectId] = useState<string>('');
  const [googleAccessToken, setGoogleAccessToken] = useState<string>('');
  const [haHostUrl, setHaHostUrl] = useState<string>('http://homeassistant.local:8123');
  const [haAccessToken, setHaAccessToken] = useState<string>('');
  const [smartConfigSavedMsg, setSmartConfigSavedMsg] = useState<string>('');

  // Voice Engines State
  const [voiceConfig, setVoiceConfig] = useState<any>(null);
  const [elevenLabsKey, setElevenLabsKey] = useState<string>('');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState<string>('pNInz6obpgDQGcFmaJgB');
  const [selectedTtsEngine, setSelectedTtsEngine] = useState<string>('edge_tts');
  const [selectedSttEngine, setSelectedSttEngine] = useState<string>('groq_whisper');
  const [voiceConfigSavedMsg, setVoiceConfigSavedMsg] = useState<string>('');
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'VOICE' | 'AMBIENT_MEMORY' | 'AI_MODELS' | 'SMART_HOME' | 'PERSISTENCE' | 'TASKS_LOGS' | 'MEMORY_DATA'>('VOICE');

  const SETTINGS_TABS = [
    { id: 'VOICE' as const, label: 'VOICE & SPEECH', title: 'VOICE SYNTHESIS & STT', icon: Mic },
    { id: 'AMBIENT_MEMORY' as const, label: 'AMBIENT MEMORY', title: 'AUDITORY MEMORY & VAD', icon: Activity },
    { id: 'AI_MODELS' as const, label: 'AI MODELS & KEYS', title: 'MULTI-PROVIDER AI MATRIX', icon: Cpu },
    { id: 'SMART_HOME' as const, label: 'SMART HOME / IOT', title: 'GOOGLE HOME & IOT MATRIX', icon: Home },
    { id: 'PERSISTENCE' as const, label: '24/7 PERSISTENCE', title: 'ALWAYS-ONLINE & WATCHDOG', icon: Radio },
    { id: 'TASKS_LOGS' as const, label: 'TASKS & AUDIT', title: 'TASK MANAGER & ACTION LOGS', icon: CheckSquare },
    { id: 'MEMORY_DATA' as const, label: 'DATA & BACKUP', title: 'COMMUNICATION & DATABASE', icon: Database },
  ];

  // Phase 15 24/7 Always-Online state
  const [alwaysOnStatus, setAlwaysOnStatus] = useState<AlwaysOnStatusRecord | null>(null);
  const [alwaysOnLoading, setAlwaysOnLoading] = useState<boolean>(false);
  const [alwaysOnMessage, setAlwaysOnMessage] = useState<string>('');

  // Multi-Provider AI Intelligence state
  const [providersData, setProvidersData] = useState<AllProvidersStatusRecord | null>(null);
  const [selectedProviderTab, setSelectedProviderTab] = useState<string>('gemini');
  const [providerInputs, setProviderInputs] = useState<Record<string, string>>({});
  const [showProviderKeys, setShowProviderKeys] = useState<Record<string, boolean>>({});
  const [providerLoading, setProviderLoading] = useState<Record<string, boolean>>({});
  const [providerTestResults, setProviderTestResults] = useState<Record<string, 'idle' | 'testing' | 'success' | 'fail'>>({});
  const [providerMessages, setProviderMessages] = useState<Record<string, string>>({});

  // Legacy single API Key Manager state
  const [apiKeyStatus, setApiKeyStatus] = useState<CredentialStatusRecord | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [apiKeyLoading, setApiKeyLoading] = useState<boolean>(false);
  const [apiKeyTestResult, setApiKeyTestResult] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
  const [apiKeyMessage, setApiKeyMessage] = useState<string>('');

  // Developer & Debug Mode state (Section 18)
  const [toolsList, setToolsList] = useState<any[]>([]);
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>('');
  const [actionHistoryList, setActionHistoryList] = useState<ActionHistoryRecord[]>([]);

  // User Tasks state (Section 7, 8, 9)
  const [userTasksList, setUserTasksList] = useState<UserTaskRecord[]>([]);
  const [userTaskFilter, setUserTaskFilter] = useState<string>('ALL');
  const [userTaskSearch, setUserTaskSearch] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<string>('medium');

  useEffect(() => {
    if (isOpen) {
      setSettings(loadVoiceSettings());
      setTestResult('idle');
      getAvailableMicrophones().then(setDevices);
      getAvailableVoices().then(setVoices);
      loadMemoryData();
      loadAssistantData();
      loadCommunicationData();
      loadSmartHomeData();
      loadApiKeyStatus();
      loadProvidersData();
      loadAlwaysOnData();
      loadToolsData();
      loadActionHistoryData();
      loadUserTasksData();
    }
  }, [isOpen]);


  const loadUserTasksData = async () => {
    try {
      const data = await fetchUserTasks(userTaskFilter === 'ALL' ? undefined : userTaskFilter, userTaskSearch || undefined);
      if (data && data.tasks) {
        setUserTasksList(data.tasks);
      }
    } catch {
      // non-fatal
    }
  };

  const handleCreateUserTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await createUserTask({ title: newTaskTitle.trim(), priority: newTaskPriority });
      setNewTaskTitle('');
      await loadUserTasksData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleCompleteUserTask = async (taskId: string) => {
    try {
      await completeUserTask(taskId);
      await loadUserTasksData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDeleteUserTask = async (taskId: string) => {
    try {
      await deleteUserTask(taskId);
      await loadUserTasksData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleClearAllTasks = async () => {
    if (!window.confirm('Delete all tasks from Task Manager?')) return;
    try {
      await clearAllUserTasks();
      await loadUserTasksData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportAllDataApi();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jarvis_data_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + (e as Error).message);
    }
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm('DANGER: This will permanently wipe all memories, conversations, tasks, and reminders. Continue?')) return;
    try {
      await deleteAllDataApi();
      alert('All JARVIS data has been permanently cleared.');
      await loadMemoryData();
      await loadAssistantData();
      await loadUserTasksData();
    } catch (e) {
      alert('Delete failed: ' + (e as Error).message);
    }
  };

  const loadActionHistoryData = async () => {
    try {
      const data = await fetchActionHistory(30);
      if (data && data.history) {
        setActionHistoryList(data.history);
      }
    } catch {
      // non-fatal
    }
  };

  const handleClearActionHistory = async () => {
    try {
      await clearActionHistory();
      setActionHistoryList([]);
    } catch {
      // non-fatal
    }
  };

  const loadToolsData = async () => {
    try {
      const data = await fetchAvailableTools();
      if (data && data.tools) {
        setToolsList(data.tools);
      }
    } catch {
      // non-fatal
    }
  };

  const loadAlwaysOnData = async () => {
    try {
      const data = await fetchAlwaysOnStatus();
      setAlwaysOnStatus(data);
    } catch {
      // non-fatal
    }
  };

  const loadMemoryData = async () => {
    try {
      const data = await fetchMemories();
      setMemories(data.memories || []);
    } catch {
      // ignore
    }
  };

  const loadApiKeyStatus = async () => {
    try {
      const status = await fetchOpenAIKeyStatus();
      setApiKeyStatus(status);
      setApiKeyMessage('');
    } catch {
      // ignore
    }
  };

  const loadProvidersData = async () => {
    try {
      const data = await fetchAllProvidersStatus();
      setProvidersData(data);
      if (data && data.providers && data.providers.openai) {
        setApiKeyStatus({
          configured: data.providers.openai.configured,
          masked_key: data.providers.openai.masked_key,
          key_prefix: data.providers.openai.key_prefix,
        });
      }
    } catch {
      // ignore
    }
  };


  const loadAssistantData = async () => {
    try {
      const remData = await fetchReminders('pending');
      setReminders(remData.reminders || []);
      const timerData = await fetchTimers();
      setTimers(timerData.timers || []);
    } catch {
      // ignore
    }
  };

  const loadCommunicationData = async () => {
    try {
      const cData = await fetchContacts();
      setContacts(cData.contacts || []);
      const emData = await fetchEmails();
      setRecentEmails(emData.recent_emails || []);
      setActiveDraft(emData.active_draft || null);
    } catch {
      // ignore
    }
  };

  const loadSmartHomeData = async () => {
    try {
      const devData = await fetchSmartDevices();
      setSmartDevices(devData.devices || []);
      const rData = await fetchSmartRooms();
      setSmartRooms(rData.rooms || []);
      const cfg = await fetchSmartHomeConfig();
      setSmartHomeConfig(cfg);
      setSmartProvider(cfg.active_provider || 'virtual');
      if (cfg.google_home) {
        setGoogleProjectId(cfg.google_home.project_id || '');
      }
      if (cfg.home_assistant) {
        setHaHostUrl(cfg.home_assistant.host_url || 'http://homeassistant.local:8123');
      }
      const vCfg = await fetchVoiceConfig();
      setVoiceConfig(vCfg);
      setSelectedTtsEngine(vCfg.engine || 'edge_tts');
      setElevenLabsVoiceId(vCfg.elevenlabs_voice_id || 'pNInz6obpgDQGcFmaJgB');
    } catch {
      // ignore
    }
  };

  const handleSaveSmartHomeConfig = async () => {
    try {
      await saveSmartHomeConfig({
        active_provider: smartProvider,
        google_home: {
          project_id: googleProjectId,
          access_token: googleAccessToken || undefined
        },
        home_assistant: {
          host_url: haHostUrl,
          access_token: haAccessToken || undefined
        }
      });
      setSmartConfigSavedMsg('Smart Home configuration updated successfully!');
      setTimeout(() => setSmartConfigSavedMsg(''), 3500);
      loadSmartHomeData();
    } catch (e: any) {
      alert(e.message || 'Failed to save smart home config');
    }
  };

  const handleSaveVoiceEngineConfig = async () => {
    try {
      await saveVoiceConfig({
        engine: selectedTtsEngine,
        elevenlabs_api_key: elevenLabsKey || undefined,
        elevenlabs_voice_id: elevenLabsVoiceId
      });
      setVoiceConfigSavedMsg('Voice API configuration updated successfully!');
      setTimeout(() => setVoiceConfigSavedMsg(''), 3500);
    } catch (e: any) {
      alert(e.message || 'Failed to save voice config');
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    saveVoiceSettings(settings);
    onSettingsSaved(settings);
    onClose();
  };

  const handleTestVoice = () => {
    if (isTesting) return;
    setIsTesting(true);
    setTestResult('idle');

    if (onTestVoice) {
      saveVoiceSettings(settings);
      onTestVoice({
        onStart: () => setTestResult('idle'),
        onEnd: () => { setIsTesting(false); setTestResult('success'); },
        onError: () => { setIsTesting(false); setTestResult('error'); }
      });
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance('Hello, sir. All JARVIS smart home, communication, memory, and cognitive systems are operational.');
        u.rate = settings.ttsSpeed;
        u.volume = settings.ttsVolume / 100;
        u.onend = () => { setIsTesting(false); setTestResult('success'); };
        u.onerror = () => { setIsTesting(false); setTestResult('error'); };
        window.speechSynthesis.speak(u);
      } else {
        setIsTesting(false);
        setTestResult('error');
      }
    }
  };

  // Memory Actions
  const handleAddMemory = async () => {
    if (!newMemoryContent.trim()) return;
    try {
      await createMemory(newMemoryContent.trim(), 'preference');
      setNewMemoryContent('');
      await loadMemoryData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    await deleteMemory(id);
    await loadMemoryData();
  };

  const handleSaveEditMemory = async (id: string) => {
    if (!editingContent.trim()) return;
    await editMemory(id, editingContent.trim());
    setEditingMemoryId(null);
    setEditingContent('');
    await loadMemoryData();
  };

  const handleClearMemories = async () => {
    if (window.confirm('Are you sure you want to clear all stored long-term memories?')) {
      await clearAllMemories();
      await loadMemoryData();
    }
  };

  // Assistant Actions
  const handleDeleteReminder = async (id: string) => {
    await deleteReminder(id);
    await loadAssistantData();
  };

  const handleClearReminders = async () => {
    if (window.confirm('Delete all scheduled reminders?')) {
      await clearAllReminders();
      await loadAssistantData();
    }
  };

  const handleStopTimer = async (id: string) => {
    await stopTimer(id);
    await loadAssistantData();
  };

  // Communication Actions
  const handleSendDraft = async (draftId?: string) => {
    try {
      await sendEmailApi(draftId);
      await loadCommunicationData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // Smart Home Actions
  const handleToggleSmartDevice = async (id: string) => {
    try {
      await toggleSmartDevice(id);
      await loadSmartHomeData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleBrightnessChange = async (id: string, val: number) => {
    try {
      await setSmartDeviceValue(id, 'brightness', val);
      await loadSmartHomeData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleTurnAllLights = async (action: 'turn_on' | 'turn_off') => {
    try {
      await controlSmartGroup('lights', action);
      await loadSmartHomeData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // Multi-Provider AI Key & Settings Handlers
  const handleSaveProviderKey = async (provider: string) => {
    const rawKey = (providerInputs[provider] || '').trim();
    if (!rawKey) {
      setProviderMessages(prev => ({ ...prev, [provider]: 'Please enter an API key.' }));
      return;
    }
    setProviderLoading(prev => ({ ...prev, [provider]: true }));
    setProviderMessages(prev => ({ ...prev, [provider]: '' }));
    try {
      const result = await saveProviderKey(provider, rawKey);
      setProviderInputs(prev => ({ ...prev, [provider]: '' }));
      setShowProviderKeys(prev => ({ ...prev, [provider]: false }));
      setProviderMessages(prev => ({ ...prev, [provider]: result.message }));
      setProviderTestResults(prev => ({ ...prev, [provider]: 'success' }));
      await loadProvidersData();
    } catch (e) {
      setProviderMessages(prev => ({ ...prev, [provider]: (e as Error).message }));
      setProviderTestResults(prev => ({ ...prev, [provider]: 'fail' }));
    } finally {
      setProviderLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleRemoveProviderKey = async (provider: string) => {
    if (!window.confirm(`Remove the stored API key for ${provider.toUpperCase()}?`)) return;
    setProviderLoading(prev => ({ ...prev, [provider]: true }));
    setProviderMessages(prev => ({ ...prev, [provider]: '' }));
    try {
      const result = await removeProviderKey(provider);
      setProviderMessages(prev => ({ ...prev, [provider]: result.message }));
      setProviderTestResults(prev => ({ ...prev, [provider]: 'idle' }));
      await loadProvidersData();
    } catch (e) {
      setProviderMessages(prev => ({ ...prev, [provider]: (e as Error).message }));
    } finally {
      setProviderLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleTestProviderConnection = async (provider: string) => {
    setProviderTestResults(prev => ({ ...prev, [provider]: 'testing' }));
    setProviderMessages(prev => ({ ...prev, [provider]: '' }));
    try {
      const result = await testProviderConnection(provider);
      setProviderTestResults(prev => ({ ...prev, [provider]: result.success ? 'success' : 'fail' }));
      setProviderMessages(prev => ({ ...prev, [provider]: result.message }));
    } catch (e) {
      setProviderTestResults(prev => ({ ...prev, [provider]: 'fail' }));
      setProviderMessages(prev => ({ ...prev, [provider]: (e as Error).message }));
    }
  };

  const handleSetActiveProvider = async (provider: string, model?: string) => {
    try {
      await setActiveAIProvider(provider, model);
      await loadProvidersData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // Legacy single API Key handlers
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setApiKeyMessage('Please enter an API key.');
      return;
    }
    setApiKeyLoading(true);
    setApiKeyMessage('');
    try {
      const result = await saveOpenAIKey(apiKeyInput.trim());
      setApiKeyInput('');
      setShowApiKey(false);
      setApiKeyMessage(result.message);
      setApiKeyTestResult('success');
      await loadApiKeyStatus();
      await loadProvidersData();
    } catch (e) {
      setApiKeyMessage((e as Error).message);
      setApiKeyTestResult('fail');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!window.confirm('Remove the stored OpenAI API key? JARVIS will switch to offline mode.')) return;
    setApiKeyLoading(true);
    setApiKeyMessage('');
    try {
      const result = await removeOpenAIKey();
      setApiKeyMessage(result.message);
      setApiKeyTestResult('idle');
      await loadApiKeyStatus();
      await loadProvidersData();
    } catch (e) {
      setApiKeyMessage((e as Error).message);
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleTestApiKey = async () => {
    setApiKeyTestResult('testing');
    setApiKeyMessage('');
    try {
      const result = await testOpenAIConnection();
      setApiKeyTestResult(result.success ? 'success' : 'fail');
      setApiKeyMessage(result.message);
    } catch (e) {
      setApiKeyTestResult('fail');
      setApiKeyMessage((e as Error).message);
    }
  };


  // Phase 15 Always-Online Handlers
  const handleToggleKeepAwake = async () => {
    if (alwaysOnLoading) return;
    setAlwaysOnLoading(true);
    setAlwaysOnMessage('');
    try {
      const current = alwaysOnStatus?.keep_awake?.enabled ?? false;
      const res = await toggleKeepAwakeApi(!current);
      setAlwaysOnMessage(res.message || 'Keep-awake status updated.');
      await loadAlwaysOnData();
    } catch (e) {
      setAlwaysOnMessage((e as Error).message);
    } finally {
      setAlwaysOnLoading(false);
    }
  };

  const handleToggleAutostart = async () => {
    if (alwaysOnLoading) return;
    setAlwaysOnLoading(true);
    setAlwaysOnMessage('');
    try {
      const current = alwaysOnStatus?.autostart?.autostart_enabled ?? false;
      const res = await toggleAutostartApi(!current);
      setAlwaysOnMessage(res.message || 'Windows boot auto-start status updated.');
      await loadAlwaysOnData();
    } catch (e) {
      setAlwaysOnMessage((e as Error).message);
    } finally {
      setAlwaysOnLoading(false);
    }
  };

  const filteredMemories = memories.filter((m) =>
    !memorySearch || m.content.toLowerCase().includes(memorySearch.toLowerCase()) || m.category.toLowerCase().includes(memorySearch.toLowerCase())
  );

  const filteredContacts = contacts.filter((c) =>
    !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.email.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const filteredSmartDevices = smartDevices.filter((d) =>
    selectedRoom === 'all' || d.room.toLowerCase() === selectedRoom.toLowerCase()
  );

  const neuralVoices = voices.filter((v) => v.category === 'neural');
  const systemVoices = voices.filter((v) => v.category === 'system');

  const getDeviceIcon = (type: string, power: string) => {
    const color = power === 'on' ? primaryColor : 'rgba(255,255,255,0.4)';
    if (type === 'light') return <Lightbulb size={14} style={{ color }} />;
    if (type === 'fan') return <Wind size={14} style={{ color }} />;
    if (type === 'tv') return <Tv size={14} style={{ color }} />;
    return <Zap size={14} style={{ color }} />;
  };

  return (
    <div className="jarvis-section-modal-overlay">
      <div className="voice-settings-split-modal font-mono" style={{ borderColor: primaryColor }}>
        {/* Header */}
        <div className="section-modal-header">
          <div className="modal-title-group">
            <Sliders size={16} style={{ color: primaryColor }} />
            <span className="modal-title font-display">JARVIS PROTOCOL CONFIGURATION</span>
            <span className="font-mono" style={{ fontSize: '10px', background: `${primaryColor}20`, color: primaryColor, padding: '2px 8px', borderRadius: '3px', fontWeight: 700 }}>
              [{SETTINGS_TABS.find(t => t.id === activeTab)?.title}]
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Settings">
            <X size={15} />
          </button>
        </div>

        {/* Split Body: Left Sidebar + Right Workspace Content */}
        <div className="settings-split-body">
          {/* Left Tabs Sidebar */}
          <aside className="settings-tabs-sidebar custom-scrollbar">
            {SETTINGS_TABS.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={`settings-tab-btn ${isActive ? 'active' : ''}`}
                  style={{
                    borderColor: isActive ? `${primaryColor}60` : 'transparent',
                    backgroundColor: isActive ? `${primaryColor}18` : undefined,
                    color: isActive ? '#fff' : undefined
                  }}
                >
                  <Icon size={14} style={{ color: isActive ? primaryColor : '#94a3b8' }} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Right Active Tab Content */}
          <main className="settings-tab-content custom-scrollbar">
            {activeTab === 'AMBIENT_MEMORY' && (
              <div style={{ padding: '4px' }}>
                <div className="settings-section-header font-display" style={{ marginBottom: '16px' }}>
                  <Activity size={14} style={{ color: primaryColor }} />
                  <span>AMBIENT AUDITORY MEMORY &amp; REAL-TIME RECALL</span>
                </div>
                <AmbientMemorySection primaryColor={primaryColor} />
              </div>
            )}

            {activeTab === 'PERSISTENCE' && (
              <>

          {/* ─── 24/7 ALWAYS-ONLINE & PERSISTENCE (PHASE 15) ─── */}
          <div className="settings-section-header font-display">
            <Radio size={13} style={{ color: primaryColor }} />
            <span>24/7 ALWAYS-ONLINE &amp; PERSISTENCE</span>
          </div>

          <div className="setting-group" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px', marginBottom: '16px' }}>
            
            {/* Status Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: alwaysOnStatus?.is_24x7 ? '#10b981' : primaryColor,
                  boxShadow: `0 0 8px ${alwaysOnStatus?.is_24x7 ? '#10b981' : primaryColor}`,
                  flexShrink: 0
                }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                  24/7 PERSISTENCE: {alwaysOnStatus?.is_24x7 ? 'FULLY ACTIVE' : 'ONLINE (SUPERVISED)'}
                </span>
              </div>
              <button
                type="button"
                className="sci-fi-btn font-display"
                onClick={loadAlwaysOnData}
                style={{ padding: '2px 8px', fontSize: '9px', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                REFRESH STATUS
              </button>
            </div>

            {/* Persistence Toggles Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              
              {/* Toggle 1: Keep-Awake / Sleep Prevention */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 500 }}>PREVENT PC SLEEP</span>
                  <button
                    type="button"
                    onClick={handleToggleKeepAwake}
                    disabled={alwaysOnLoading}
                    className={`toggle-switch-btn ${alwaysOnStatus?.keep_awake?.enabled ? 'is-on' : 'is-off'}`}
                    style={{
                      padding: '2px 8px',
                      fontSize: '9px',
                      background: alwaysOnStatus?.keep_awake?.enabled ? primaryColor : 'rgba(255,255,255,0.1)',
                      color: alwaysOnStatus?.keep_awake?.enabled ? '#000' : '#fff',
                      fontWeight: 700,
                      borderRadius: '3px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {alwaysOnStatus?.keep_awake?.enabled ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                  Keeps Windows awake &amp; prevents sleep or standby.
                </div>
              </div>

              {/* Toggle 2: Auto-Start on Boot */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 500 }}>AUTO-START ON BOOT</span>
                  <button
                    type="button"
                    onClick={handleToggleAutostart}
                    disabled={alwaysOnLoading}
                    className={`toggle-switch-btn ${alwaysOnStatus?.autostart?.autostart_enabled ? 'is-on' : 'is-off'}`}
                    style={{
                      padding: '2px 8px',
                      fontSize: '9px',
                      background: alwaysOnStatus?.autostart?.autostart_enabled ? primaryColor : 'rgba(255,255,255,0.1)',
                      color: alwaysOnStatus?.autostart?.autostart_enabled ? '#000' : '#fff',
                      fontWeight: 700,
                      borderRadius: '3px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {alwaysOnStatus?.autostart?.autostart_enabled ? 'ENABLED' : 'OFF'}
                  </button>
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                  Launches JARVIS silently in background on PC startup.
                </div>
              </div>

            </div>

            {/* Watchdog & Health Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'rgba(255,255,255,0.45)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
              <div>
                WATCHDOG SUPERVISOR: <strong style={{ color: primaryColor }}>ACTIVE</strong>
              </div>
              <div>
                AUTO-RECOVERY: <strong style={{ color: '#10b981' }}>ENABLED</strong>
              </div>
              <div>
                TOTAL RECOVERIES: <strong style={{ color: '#fff' }}>{alwaysOnStatus?.watchdog?.total_recoveries ?? 0}</strong>
              </div>
            </div>

            {alwaysOnMessage && (
              <div style={{
                marginTop: '8px', fontSize: '10px', padding: '4px 8px', borderRadius: '3px',
                background: 'rgba(0, 240, 255, 0.08)', border: `1px solid rgba(0, 240, 255, 0.3)`, color: primaryColor
              }}>
                ✓ {alwaysOnMessage}
              </div>
            )}
          </div>
          </>
        )}

        {/* ─── AI MODELS & INTELLIGENCE TAB ─── */}
        {activeTab === 'AI_MODELS' && (
          <>
          {/* ─── NEURAL INTELLIGENCE & MULTI-MODEL AI HUB ─── */}
          <div className="settings-section-header font-display">
            <Sparkles size={13} style={{ color: primaryColor }} />
            <span>NEURAL INTELLIGENCE &amp; MULTI-MODEL AI</span>
            <span style={{ marginLeft: 'auto', fontSize: '9px', background: 'rgba(0, 240, 255, 0.15)', color: primaryColor, padding: '2px 6px', borderRadius: '3px' }}>
              {providersData ? `${providersData.configured_count} ACTIVE / CONFIGURED` : 'LOADING...'}
            </span>
          </div>

          <div className="setting-group" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
            
            {/* Active Provider Engine Selector & Auto-Cascade */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={12} style={{ color: primaryColor }} />
                  ACTIVE AI ENGINE:
                </span>
                <select
                  value={providersData?.active_provider || 'auto'}
                  onChange={(e) => handleSetActiveProvider(e.target.value)}
                  className="sci-fi-select"
                  style={{ fontSize: '10px', padding: '3px 8px', width: 'auto', color: primaryColor, fontWeight: 'bold' }}
                >
                  <option value="auto">⚡ AUTO-CASCADE (Recommended - Failover)</option>
                  <option value="gemini">Google Gemini (Free Tier)</option>
                  <option value="groq">Groq AI (100% Free &amp; Fast)</option>
                  <option value="openai">OpenAI ChatGPT (GPT-4o / 4o-mini)</option>
                  <option value="claude">Anthropic Claude (3.5 Sonnet / Haiku)</option>
                  <option value="openrouter">OpenRouter (Free Models Hub)</option>
                  <option value="deepseek">DeepSeek (V3 / R1)</option>
                </select>
              </div>
              <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                Auto-Cascade automatically tries your free and active providers (Gemini ➔ Groq ➔ OpenAI ➔ Claude ➔ OpenRouter) with real-time web intelligence fallback so JARVIS never fails to answer any question.
              </div>
            </div>

            {/* Provider Tabs Navigation */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { id: 'gemini', label: 'Google Gemini', isFree: true, badge: 'FREE' },
                { id: 'groq', label: 'Groq AI', isFree: true, badge: '100% FREE' },
                { id: 'openai', label: 'OpenAI ChatGPT', isFree: false, badge: 'GPT-4o' },
                { id: 'claude', label: 'Anthropic Claude', isFree: false, badge: 'Claude 3.5' },
                { id: 'openrouter', label: 'OpenRouter', isFree: true, badge: 'FREE HUB' },
                { id: 'deepseek', label: 'DeepSeek', isFree: false, badge: 'R1/V3' },
              ].map(tab => {
                const isSelected = selectedProviderTab === tab.id;
                const provInfo = providersData?.providers?.[tab.id];
                const isConfigured = provInfo?.configured;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedProviderTab(tab.id)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      borderRadius: '4px',
                      border: isSelected ? `1px solid ${primaryColor}` : '1px solid rgba(255,255,255,0.1)',
                      background: isSelected ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.02)',
                      color: isSelected ? primaryColor : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: isConfigured ? '#10b981' : 'rgba(255,255,255,0.25)',
                      boxShadow: isConfigured ? '0 0 4px #10b981' : 'none'
                    }} />
                    <span>{tab.label}</span>
                    {tab.isFree && (
                      <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '2px', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontWeight: 600 }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Provider Card Details */}
            {(() => {
              const currentProv = selectedProviderTab;
              const provInfo = providersData?.providers?.[currentProv];
              const isConfigured = provInfo?.configured;
              const testRes = providerTestResults[currentProv] || 'idle';
              const message = providerMessages[currentProv] || '';
              const isLoading = providerLoading[currentProv] || false;
              const rawInput = providerInputs[currentProv] || '';
              const isKeyVisible = showProviderKeys[currentProv] || false;
              const freeInfo = provInfo?.free_info;

              const providerTitles: Record<string, string> = {
                gemini: 'Google Gemini (Free API)',
                groq: 'Groq AI (Free Ultra-Fast Inference)',
                openai: 'OpenAI ChatGPT (GPT-4o & GPT-4o-mini)',
                claude: 'Anthropic Claude (Claude 3.5 Sonnet)',
                openrouter: 'OpenRouter (Free Multi-Model Hub)',
                deepseek: 'DeepSeek AI (Direct Reasoning)'
              };

              const keyPlaceholders: Record<string, string> = {
                gemini: 'AIzaSy... (Get free from Google AI Studio)',
                groq: 'gsk_... (Get 100% free from Groq Console)',
                openai: 'sk-proj-... / sk-...',
                claude: 'sk-ant-...',
                openrouter: 'sk-or-v1-... (Get free models key)',
                deepseek: 'sk-...'
              };

              return (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  
                  {/* Provider Header & Free Key Link */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: testRes === 'fail' ? '#ef4444' : testRes === 'testing' ? '#f59e0b' : isConfigured ? '#10b981' : 'rgba(255,255,255,0.25)',
                        boxShadow: isConfigured && testRes !== 'fail' ? '0 0 6px #10b981' : testRes === 'fail' ? '0 0 6px #ef4444' : 'none'
                      }} />
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>
                        {providerTitles[currentProv] || currentProv.toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 600,
                        color: isConfigured ? '#10b981' : 'rgba(255,255,255,0.4)',
                        background: isConfigured ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                        padding: '1px 6px',
                        borderRadius: '3px'
                      }}>
                        {testRes === 'testing' ? 'TESTING...' : isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                      </span>
                    </div>

                    {freeInfo?.url && (
                      <a
                        href={freeInfo.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '10px',
                          color: '#10b981',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.3)',
                          padding: '2px 8px',
                          borderRadius: '3px'
                        }}
                      >
                        <Key size={10} /> Get Free Key <ExternalLink size={9} />
                      </a>
                    )}
                  </div>

                  {freeInfo?.note && (
                    <div style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
                      💡 {freeInfo.note}
                    </div>
                  )}

                  {/* Masked Key Display */}
                  {provInfo?.masked_key && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '10px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>STORED KEY:</span>
                      <code style={{ color: primaryColor, background: 'rgba(0,240,255,0.08)', padding: '2px 8px', borderRadius: '3px', border: `1px solid rgba(0,240,255,0.2)` }}>
                        {provInfo.masked_key}
                      </code>
                    </div>
                  )}

                  {/* Key Input Row */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        id={`${currentProv}-api-key-input`}
                        type={isKeyVisible ? 'text' : 'password'}
                        className="sci-fi-input"
                        placeholder={isConfigured ? 'Enter new key to replace…' : keyPlaceholders[currentProv] || 'Enter API key…'}
                        value={rawInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProviderInputs(prev => ({ ...prev, [currentProv]: val }));
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveProviderKey(currentProv); }}
                        autoComplete="new-password"
                        style={{ paddingRight: '60px', fontSize: '11px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowProviderKeys(prev => ({ ...prev, [currentProv]: !isKeyVisible }))}
                        style={{
                          position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                          background: 'transparent', border: 'none', color: primaryColor, cursor: 'pointer',
                          fontSize: '9px', padding: '2px 4px'
                        }}
                      >
                        {isKeyVisible ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>

                  {/* Model Selector for this provider */}
                  {provInfo?.available_models && provInfo.available_models.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>DEFAULT MODEL:</span>
                      <select
                        value={provInfo.default_model}
                        onChange={(e) => handleSetActiveProvider(currentProv, e.target.value)}
                        className="sci-fi-select"
                        style={{ fontSize: '10px', padding: '2px 6px', flex: 1, color: '#fff' }}
                      >
                        {provInfo.available_models.map((m: string) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="sci-fi-btn save font-display"
                      disabled={isLoading || !rawInput.trim()}
                      onClick={() => handleSaveProviderKey(currentProv)}
                      style={{
                        borderColor: primaryColor, color: primaryColor, padding: '4px 12px', fontSize: '10px',
                        display: 'flex', alignItems: 'center', gap: '4px', opacity: (!rawInput.trim() || isLoading) ? 0.5 : 1
                      }}
                    >
                      <ShieldCheck size={11} /> {isLoading ? 'SAVING…' : 'SAVE KEY'}
                    </button>

                    <button
                      type="button"
                      className="sci-fi-btn font-display"
                      disabled={isLoading || testRes === 'testing' || !isConfigured}
                      onClick={() => handleTestProviderConnection(currentProv)}
                      style={{
                        borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', padding: '4px 12px', fontSize: '10px',
                        display: 'flex', alignItems: 'center', gap: '4px', opacity: (!isConfigured || testRes === 'testing') ? 0.5 : 1
                      }}
                    >
                      <Zap size={11} /> {testRes === 'testing' ? 'TESTING…' : 'TEST CONNECTION'}
                    </button>

                    {isConfigured && (
                      <button
                        type="button"
                        className="sci-fi-btn font-display"
                        onClick={() => handleSetActiveProvider(currentProv)}
                        style={{
                          borderColor: providersData?.active_provider === currentProv ? '#10b981' : 'rgba(255,255,255,0.2)',
                          color: providersData?.active_provider === currentProv ? '#10b981' : 'rgba(255,255,255,0.7)',
                          padding: '4px 12px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <Sparkles size={11} /> {providersData?.active_provider === currentProv ? 'ACTIVE ENGINE' : 'SET AS ACTIVE'}
                      </button>
                    )}

                    {isConfigured && (
                      <button
                        type="button"
                        className="sci-fi-btn cancel font-display"
                        disabled={isLoading}
                        onClick={() => handleRemoveProviderKey(currentProv)}
                        style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px 12px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}
                      >
                        <Trash2 size={11} /> REMOVE
                      </button>
                    )}
                  </div>

                  {/* Feedback message banner */}
                  {message && (
                    <div style={{
                      marginTop: '10px', fontSize: '10px', padding: '6px 10px', borderRadius: '4px',
                      background: testRes === 'fail' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      border: `1px solid ${testRes === 'fail' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
                      color: testRes === 'fail' ? '#ef4444' : '#10b981',
                    }}>
                      {testRes === 'fail' ? '✗' : '✓'} {message}
                    </div>
                  )}

                </div>
              );
            })()}

            {/* Zero-Key Dynamic Answering & Security Notice */}
            <div style={{ marginTop: '12px', fontSize: '9.5px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                <Globe size={11} style={{ color: primaryColor }} />
                <span><strong>Zero-Key Dynamic Answering:</strong> When keys are unconfigured, JARVIS uses real-time live search, Wikipedia &amp; computational engines to answer any query.</span>
              </div>
              <ShieldAlert size={9} style={{ display: 'inline', marginRight: '4px', color: 'rgba(255,255,255,0.4)' }} />
              API keys stored locally in <code style={{ color: primaryColor }}>backend/.env</code> only · Never transmitted to external third parties · Never logged
            </div>

          </div>
          </>
        )}

        {/* ─── SMART HOME & IOT TAB ─── */}
        {activeTab === 'SMART_HOME' && (
          <>
          {/* ─── SMART HOME & DEVICE CONTROL (PHASE 11) ─── */}
          <div className="settings-section-header font-display">
            <Home size={13} style={{ color: primaryColor }} />
            <span>SMART HOME &amp; DEVICE CONTROL</span>
          </div>

          <div className="setting-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#fff' }}>PROVIDER:</span>
                <span style={{ fontSize: '10px', background: 'rgba(0, 240, 255, 0.2)', color: primaryColor, padding: '2px 6px', borderRadius: '3px' }}>
                  {smartProvider.toUpperCase()} [ONLINE]
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleTurnAllLights('turn_on')}
                  className="sci-fi-btn save font-display"
                  style={{ padding: '2px 6px', fontSize: '9px', borderColor: primaryColor, color: primaryColor }}
                >
                  ALL LIGHTS ON
                </button>
                <button
                  type="button"
                  onClick={() => handleTurnAllLights('turn_off')}
                  className="sci-fi-btn cancel"
                  style={{ padding: '2px 6px', fontSize: '9px' }}
                >
                  ALL LIGHTS OFF
                </button>
              </div>
            </div>

            {/* Active Provider Selector & Bridge Credentials */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span className="font-mono" style={{ fontSize: '10px', color: '#fff' }}>ACTIVE IOT BRIDGE:</span>
                <select
                  value={smartProvider}
                  onChange={(e) => setSmartProvider(e.target.value)}
                  className="sci-fi-select font-mono"
                  style={{ width: 'auto', padding: '2px 8px', fontSize: '10px' }}
                >
                  <option value="virtual">Virtual Simulator (Local Zero-Config)</option>
                  <option value="google_home">Google Home / Cloud Home Graph API</option>
                  <option value="home_assistant">Home Assistant REST Bridge</option>
                </select>
              </div>

              {smartProvider === 'google_home' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  <input
                    type="text"
                    className="sci-fi-input font-mono"
                    placeholder="Google Cloud Project ID (e.g. jarvis-home-3982)"
                    value={googleProjectId}
                    onChange={(e) => setGoogleProjectId(e.target.value)}
                    style={{ fontSize: '10px', padding: '4px 8px' }}
                  />
                  <input
                    type="password"
                    className="sci-fi-input font-mono"
                    placeholder="Google Home Access Token (OAuth Bearer token)"
                    value={googleAccessToken}
                    onChange={(e) => setGoogleAccessToken(e.target.value)}
                    style={{ fontSize: '10px', padding: '4px 8px' }}
                  />
                </div>
              )}

              {smartProvider === 'home_assistant' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  <input
                    type="text"
                    className="sci-fi-input font-mono"
                    placeholder="Home Assistant Host URL (e.g. http://homeassistant.local:8123)"
                    value={haHostUrl}
                    onChange={(e) => setHaHostUrl(e.target.value)}
                    style={{ fontSize: '10px', padding: '4px 8px' }}
                  />
                  <input
                    type="password"
                    className="sci-fi-input font-mono"
                    placeholder="Long-Lived Access Token"
                    value={haAccessToken}
                    onChange={(e) => setHaAccessToken(e.target.value)}
                    style={{ fontSize: '10px', padding: '4px 8px' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleSaveSmartHomeConfig}
                  className="sci-fi-btn save font-mono"
                  style={{ padding: '3px 10px', fontSize: '9.5px', borderColor: primaryColor, color: primaryColor }}
                >
                  SAVE BRIDGE CONFIG
                </button>
                {smartConfigSavedMsg && (
                  <span className="font-mono" style={{ fontSize: '10px', color: '#10b981' }}>
                    ✓ {smartConfigSavedMsg}
                  </span>
                )}
              </div>
            </div>

            {/* Room Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
              <button
                type="button"
                className={`toggle-switch-btn ${selectedRoom === 'all' ? 'is-on' : 'is-off'}`}
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => setSelectedRoom('all')}
              >
                ALL ROOMS
              </button>
              {smartRooms.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`toggle-switch-btn ${selectedRoom === r.id ? 'is-on' : 'is-off'}`}
                  style={{ fontSize: '10px', padding: '2px 8px' }}
                  onClick={() => setSelectedRoom(r.id)}
                >
                  {r.name.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Device Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {filteredSmartDevices.map((d) => {
                const isPowerOn = d.state.power === 'on';
                return (
                  <div
                    key={d.id}
                    style={{
                      background: isPowerOn ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      padding: '8px',
                      borderRadius: '4px',
                      border: `1px solid ${isPowerOn ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getDeviceIcon(d.type, d.state.power || 'off')}
                        <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>{d.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSmartDevice(d.id)}
                        style={{
                          background: isPowerOn ? primaryColor : 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: isPowerOn ? '#000' : '#fff',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          fontSize: '9px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <Power size={10} /> {isPowerOn ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>
                      <span>{d.room.replace('_', ' ').toUpperCase()}</span>
                      <span style={{ color: d.online ? '#10b981' : '#ef4444' }}>{d.online ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>

                    {d.capabilities.includes('brightness') && isPowerOn && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '9px', color: primaryColor }}>{d.state.brightness || 100}%</span>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={d.state.brightness || 100}
                          onChange={(e) => handleBrightnessChange(d.id, parseInt(e.target.value))}
                          style={{ flex: 1, accentColor: primaryColor }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </>
        )}

        {/* ─── DATA & BACKUP TAB ─── */}
        {activeTab === 'MEMORY_DATA' && (
          <>
          {/* ─── COMMUNICATION AGENT & CONTACTS (PHASE 10) ─── */}
          <div className="settings-section-header font-display">
            <Mail size={13} style={{ color: primaryColor }} />
            <span>COMMUNICATION AGENT &amp; CONTACTS</span>
          </div>

          {/* Active Email Draft Box */}
          {activeDraft && (
            <div className="setting-group" style={{ background: 'rgba(0, 240, 255, 0.08)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: primaryColor, fontWeight: 'bold' }}>ACTIVE DRAFT [CONFIRMATION REQUIRED]</span>
                <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '1px 5px', borderRadius: '2px' }}>UNSENT</span>
              </div>
              <div style={{ fontSize: '12px', color: '#fff', marginBottom: '2px' }}>To: {activeDraft.recipient_name} ({activeDraft.recipient_email})</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Subject: {activeDraft.subject}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', marginBottom: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '3px' }}>
                "{activeDraft.body}"
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleSendDraft(activeDraft.draft_id)}
                  className="sci-fi-btn save font-display"
                  style={{ borderColor: '#10b981', color: '#10b981', padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Send size={11} /> SEND CONFIRMED
                </button>
              </div>
            </div>
          )}

          {/* Contacts Directory */}
          <div className="setting-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="setting-label">
                <User size={12} style={{ color: primaryColor }} />
                <span>CONTACT DIRECTORY ({contacts.length})</span>
              </label>
              <div style={{ width: '130px' }}>
                <input
                  type="text"
                  className="sci-fi-input"
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                  placeholder="Filter contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
              {filteredContacts.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '5px 8px', borderRadius: '3px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div>
                    <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>{c.name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginLeft: '6px' }}>{c.email}</span>
                  </div>
                  <span style={{ fontSize: '9px', color: primaryColor }}>{c.telegram_handle || c.phone}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Inbox Emails */}
          <div className="setting-group">
            <label className="setting-label">
              <Inbox size={12} style={{ color: primaryColor }} />
              <span>RECENT INBOX EMAILS</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto', marginTop: '4px' }}>
              {recentEmails.map((em) => (
                <div key={em.id} style={{ background: em.is_unread ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)', padding: '5px 8px', borderRadius: '3px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '11px', fontWeight: em.is_unread ? 'bold' : 'normal' }}>{em.sender_name}</span>
                    {em.is_unread && <span style={{ fontSize: '8px', background: primaryColor, color: '#000', padding: '1px 4px', borderRadius: '2px' }}>UNREAD</span>}
                  </div>
                  <div style={{ color: primaryColor, fontSize: '10px' }}>{em.subject}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── PERSONAL ASSISTANT, REMINDERS & TIMERS (PHASE 9) ─── */}
          <div className="settings-section-divider" />
          <div className="settings-section-header font-display">
            <Bell size={13} style={{ color: primaryColor }} />
            <span>PERSONAL ASSISTANT &amp; SCHEDULER</span>
          </div>

          <div className="setting-group">
            <div className="setting-label-row">
              <label className="setting-label">
                <Calendar size={12} style={{ color: primaryColor }} />
                <span>REMINDERS SYSTEM</span>
              </label>
              <button
                type="button"
                className={`toggle-switch-btn ${settings.remindersEnabled ? 'is-on' : 'is-off'}`}
                onClick={() => setSettings({ ...settings, remindersEnabled: !settings.remindersEnabled })}
              >
                {settings.remindersEnabled ? 'ENABLED [ON]' : 'DISABLED [OFF]'}
              </button>
            </div>
            <span className="setting-hint">Persistent local scheduler running in background.</span>
          </div>

          <div className="setting-group">
            <div className="setting-label-row">
              <label className="setting-label">
                <Volume2 size={12} style={{ color: primaryColor }} />
                <span>VOICE &amp; AUDIO ALERTS</span>
              </label>
              <button
                type="button"
                className={`toggle-switch-btn ${settings.reminderVoiceEnabled ? 'is-on' : 'is-off'}`}
                onClick={() => setSettings({ ...settings, reminderVoiceEnabled: !settings.reminderVoiceEnabled })}
              >
                {settings.reminderVoiceEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Active Timers List */}
          {timers.length > 0 && (
            <div className="setting-group">
              <label className="setting-label" style={{ color: '#f59e0b' }}>
                <Timer size={12} />
                <span>ACTIVE COUNTDOWN TIMERS ({timers.length})</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                {timers.map((t) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <span>{t.label} — {t.remaining_seconds}s remaining</span>
                    <button type="button" onClick={() => handleStopTimer(t.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Reminders List */}
          <div className="setting-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="setting-label">
                <Clock size={12} style={{ color: primaryColor }} />
                <span>UPCOMING REMINDERS ({reminders.length})</span>
              </label>
              {reminders.length > 0 && (
                <button type="button" onClick={handleClearReminders} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer' }}>
                  CLEAR ALL
                </button>
              )}
            </div>

            {reminders.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', padding: '6px' }}>No scheduled reminders.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                {reminders.map((r) => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 240, 255, 0.05)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '12px' }}>{r.title}</div>
                      <div style={{ color: primaryColor, fontSize: '10px' }}>{r.due_timestamp.slice(0, 16).replace('T', ' ')} {r.recurring ? `(${r.recurrence_rule})` : ''}</div>
                    </div>
                    <button type="button" onClick={() => handleDeleteReminder(r.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── LONG-TERM MEMORY (PHASE 8) ─── */}
          <div className="settings-section-divider" />
          <div className="settings-section-header font-display">
            <Database size={13} style={{ color: primaryColor }} />
            <span>LONG-TERM MEMORY &amp; CONTEXT</span>
          </div>

          {/* Memory Toggle */}
          <div className="setting-group">
            <div className="setting-label-row">
              <label className="setting-label">
                <Database size={12} style={{ color: primaryColor }} />
                <span>PERSISTENT MEMORY</span>
              </label>
              <button
                type="button"
                className={`toggle-switch-btn ${settings.memoryEnabled ? 'is-on' : 'is-off'}`}
                onClick={() => setSettings({ ...settings, memoryEnabled: !settings.memoryEnabled })}
              >
                {settings.memoryEnabled ? 'ENABLED [ON]' : 'DISABLED [OFF]'}
              </button>
            </div>
            <span className="setting-hint">Stores user preferences and project facts locally in SQLite database.</span>
          </div>

          {/* Memory Search & List */}
          <div className="setting-group">
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={12} style={{ position: 'absolute', left: '8px', top: '9px', color: primaryColor }} />
                <input
                  type="text"
                  className="sci-fi-input"
                  style={{ paddingLeft: '26px' }}
                  placeholder="Filter memories..."
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                />
              </div>
              {memories.length > 0 && (
                <button type="button" onClick={handleClearMemories} className="sci-fi-btn cancel" style={{ padding: '4px 8px', fontSize: '10px' }}>
                  CLEAR ALL
                </button>
              )}
            </div>

            {/* Quick Add Memory */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                type="text"
                className="sci-fi-input"
                placeholder="Add manual memory (e.g. 'User prefers Bengali')..."
                value={newMemoryContent}
                onChange={(e) => setNewMemoryContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddMemory(); }}
              />
              <button type="button" onClick={handleAddMemory} className="sci-fi-btn save font-display" style={{ borderColor: primaryColor, color: primaryColor, padding: '4px 10px' }}>
                <Plus size={12} />
              </button>
            </div>

            {/* Memory Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
              {filteredMemories.length === 0 ? (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', padding: '6px' }}>No long-term memories found.</div>
              ) : (
                filteredMemories.map((m) => (
                  <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {editingMemoryId === m.id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="sci-fi-input"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                        />
                        <button type="button" onClick={() => handleSaveEditMemory(m.id)} style={{ color: '#10b981', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                          <CheckCircle size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '9px', background: 'rgba(0, 240, 255, 0.2)', color: primaryColor, padding: '2px 4px', borderRadius: '2px', marginRight: '6px' }}>
                            {m.category.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '12px', color: '#fff' }}>{m.content}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button type="button" onClick={() => { setEditingMemoryId(m.id); setEditingContent(m.content); }} style={{ background: 'transparent', border: 'none', color: primaryColor, cursor: 'pointer' }}>
                            <Edit2 size={12} />
                          </button>
                          <button type="button" onClick={() => handleDeleteMemory(m.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          </>
        )}

        {/* ─── TASKS & AUDIT LOGS TAB ─── */}
        {activeTab === 'TASKS_LOGS' && (
          <>
          {/* ─── REAL TASK MANAGER (STEP 5 / SECTION 7, 8, 9) ─── */}
          <div className="settings-section-header font-display">
            <CheckSquare size={13} style={{ color: primaryColor }} />
            <span>TASK MANAGER ({userTasksList.length})</span>
          </div>

          <div className="setting-group" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px' }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', overflowX: 'auto' }}>
              {['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`toggle-switch-btn ${userTaskFilter === f ? 'is-on' : 'is-off'}`}
                  style={{ fontSize: '9px', padding: '2px 6px' }}
                  onClick={() => {
                    setUserTaskFilter(f);
                    loadUserTasksData();
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Quick Add Task */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                type="text"
                className="sci-fi-input"
                placeholder="Create new task (e.g. 'Learn AWS', 'Study Python')..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateUserTask(); }}
                style={{ flex: 1 }}
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="sci-fi-input"
                style={{ width: '80px', padding: '2px 4px', fontSize: '9px' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                type="button"
                onClick={handleCreateUserTask}
                className="sci-fi-btn save font-display"
                style={{ borderColor: primaryColor, color: primaryColor, padding: '2px 10px', fontSize: '10px' }}
              >
                <Plus size={11} /> ADD
              </button>
            </div>

            {/* Task List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {userTasksList.length === 0 ? (
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', padding: '6px' }}>
                  No tasks found. Say "Create a task called Learn AWS" or use the input above.
                </div>
              ) : (
                userTasksList.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleCompleteUserTask(t.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: t.status === 'COMPLETED' ? '#10b981' : 'rgba(255,255,255,0.3)',
                          cursor: 'pointer'
                        }}
                      >
                        <CheckCircle size={14} />
                      </button>
                      <div>
                        <div style={{
                          fontSize: '11px',
                          color: t.status === 'COMPLETED' ? 'rgba(255,255,255,0.4)' : '#fff',
                          textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none',
                          fontWeight: 600
                        }}>
                          {t.title}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '8.5px', color: 'rgba(255,255,255,0.4)' }}>
                          <span style={{
                            color: t.priority === 'urgent' ? '#ef4444' : t.priority === 'high' ? '#f59e0b' : '#10b981'
                          }}>
                            {t.priority.toUpperCase()}
                          </span>
                          <span>•</span>
                          <span>{t.status}</span>
                          {t.dueAt && <span>• Due: {t.dueAt.slice(0, 10)}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteUserTask(t.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          </>
        )}

        {/* ─── DATA MANAGEMENT (MEMORY_DATA) ─── */}
        {activeTab === 'MEMORY_DATA' && (
          <>
          {/* ─── DATA MANAGEMENT & EXPORT/IMPORT (SECTION 22) ─── */}
          <div className="settings-section-header font-display">
            <Download size={13} style={{ color: primaryColor }} />
            <span>DATA MANAGEMENT &amp; BACKUP</span>
          </div>

          <div className="setting-group" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '10px' }}>
              Export your memories, tasks, and conversation logs in JSON format. API keys and passwords remain automatically redacted.
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportData}
                className="sci-fi-btn save font-display"
                style={{ borderColor: primaryColor, color: primaryColor, padding: '4px 10px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Download size={11} /> EXPORT DATA (JSON)
              </button>

              <button
                type="button"
                onClick={handleDeleteAllData}
                className="sci-fi-btn cancel font-display"
                style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px 10px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={11} /> DELETE ALL DATA
              </button>
            </div>
          </div>
          </>
        )}

        {/* ─── WEB & SCREEN VISION (AI_MODELS) ─── */}
        {activeTab === 'AI_MODELS' && (
          <>
          {/* ─── WEB INTELLIGENCE & RESEARCH (PHASE 7) ─── */}
          <div className="settings-section-header font-display">
            <Globe size={13} style={{ color: primaryColor }} />
            <span>WEB RESEARCH &amp; REAL-TIME INTELLIGENCE</span>
          </div>

          <div className="setting-group">
            <div className="setting-label-row">
              <label className="setting-label">
                <Globe size={12} style={{ color: primaryColor }} />
                <span>WEB ACCESS &amp; LIVE RESEARCH</span>
              </label>
              <button
                type="button"
                className={`toggle-switch-btn ${settings.webAccessEnabled ? 'is-on' : 'is-off'}`}
                onClick={() => setSettings({ ...settings, webAccessEnabled: !settings.webAccessEnabled })}
              >
                {settings.webAccessEnabled ? 'ENABLED [ON]' : 'DISABLED [OFF]'}
              </button>
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              <Compass size={12} style={{ color: primaryColor }} />
              <span>DEFAULT RESEARCH DEPTH</span>
            </label>
            <select
              className="sci-fi-select"
              value={settings.researchDepth}
              disabled={!settings.webAccessEnabled}
              onChange={(e) => setSettings({ ...settings, researchDepth: e.target.value as 'quick' | 'normal' | 'deep' })}
            >
              <option value="quick">Quick (1–2 Concise Sources)</option>
              <option value="normal">Normal (3–4 Verified Sources)</option>
              <option value="deep">Deep (5+ Cross-Validated Sources)</option>
            </select>
          </div>

          {/* ─── SCREEN VISION & COMPUTER AGENT (PHASE 6) ─── */}
          <div className="settings-section-divider" />
          <div className="settings-section-header font-display">
            <Eye size={13} style={{ color: primaryColor }} />
            <span>SCREEN VISION &amp; COMPUTER AGENT</span>
          </div>

          <div className="setting-group">
            <div className="setting-label-row">
              <label className="setting-label">
                <Eye size={12} style={{ color: primaryColor }} />
                <span>SCREEN VISION PERMISSION</span>
              </label>
              <button
                type="button"
                className={`toggle-switch-btn ${settings.screenVisionEnabled ? 'is-on' : 'is-off'}`}
                onClick={() => setSettings({ ...settings, screenVisionEnabled: !settings.screenVisionEnabled })}
              >
                {settings.screenVisionEnabled ? 'ENABLED [ON]' : 'DISABLED [OFF]'}
              </button>
            </div>
          </div>
          </>
        )}

        {/* ─── VOICE & AUDIO TAB ─── */}
        {activeTab === 'VOICE' && (
          <>
          {/* ─── VOICE INPUT & OUTPUT SECTION ─── */}
          <div className="settings-section-header">
            <Mic size={15} style={{ color: primaryColor }} />
            <span>VOICE INPUT, WAKE WORD &amp; SYNTHESIS</span>
          </div>

          {/* Wake Word Enable Toggle */}
          <div className="setting-group">
            <div className="setting-label-row">
              <label className="setting-label">
                <Radio size={13} style={{ color: primaryColor }} />
                <span>WAKE WORD LISTENER ("Hello Jarvis")</span>
              </label>
              <button
                type="button"
                className={`toggle-switch-btn ${settings.wakeWordEnabled ? 'is-on' : 'is-off'}`}
                onClick={() => setSettings({ ...settings, wakeWordEnabled: !settings.wakeWordEnabled })}
              >
                {settings.wakeWordEnabled ? 'ENABLED [ON]' : 'DISABLED [OFF]'}
              </button>
            </div>
            <span className="setting-hint">Continuously listens for wake words in background (English &amp; বাংলা).</span>
          </div>

          {/* Custom Wake Word Phrase */}
          <div className="setting-group">
            <label className="setting-label">
              <Sparkles size={13} style={{ color: primaryColor }} />
              <span>CUSTOM WAKE WORD PHRASE</span>
            </label>
            <input
              type="text"
              className="sci-fi-input"
              placeholder="e.g. Hello Jarvis, Jarvis, হ্যালো জারভিস"
              value={settings.wakeWord}
              onChange={(e) => setSettings({ ...settings, wakeWord: e.target.value })}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {['Hello Jarvis', 'Jarvis', 'Hey Jarvis'].map((phrase) => {
                const isSelected = settings.wakeWord === phrase;
                return (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => setSettings({ ...settings, wakeWord: phrase })}
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: isSelected ? `1px solid ${primaryColor}` : '1px solid rgba(0, 232, 255, 0.18)',
                      background: isSelected ? `${primaryColor}22` : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? primaryColor : '#b8d4e0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 0 10px ${primaryColor}40` : 'none',
                    }}
                  >
                    {phrase}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speech Recognition Language */}
          <div className="setting-group">
            <label className="setting-label">
              <Globe size={13} style={{ color: primaryColor }} />
              <span>SPEECH RECOGNITION LANGUAGE</span>
            </label>
            <select
              className="sci-fi-select"
              value={settings.speechLanguage || 'en-US'}
              onChange={(e) => setSettings({ ...settings, speechLanguage: e.target.value })}
            >
              <option value="en-US">English (United States) — en-US</option>
              <option value="en-GB">English (United Kingdom) — en-GB</option>
              <option value="en-IN">English (India) — en-IN</option>
            </select>
            <span className="setting-hint">Select the primary spoken language for the speech recognition engine.</span>
          </div>

          {/* Wake Word Sci-Fi Chime Toggle */}
          <div className="setting-group">
            <div className="setting-label-row">
              <label className="setting-label">
                <Zap size={13} style={{ color: primaryColor }} />
                <span>INSTANT SCI-FI WAKE CHIME</span>
              </label>
              <button
                type="button"
                className={`toggle-switch-btn ${settings.wakeChimeEnabled ? 'is-on' : 'is-off'}`}
                onClick={() => setSettings({ ...settings, wakeChimeEnabled: !settings.wakeChimeEnabled })}
              >
                {settings.wakeChimeEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <span className="setting-hint">Plays a synthesized harmonic audio pulse as soon as wake word is verified.</span>
          </div>

          {/* Wake Word "Yes?" Acknowledgment Toggle */}
          <div className="setting-group">
            <div className="setting-label-row">
              <label className="setting-label">
                <Volume2 size={13} style={{ color: primaryColor }} />
                <span>VOICE ACKNOWLEDGMENT ("Yes?")</span>
              </label>
              <button
                type="button"
                className={`toggle-switch-btn ${settings.wakeWordAck ? 'is-on' : 'is-off'}`}
                onClick={() => setSettings({ ...settings, wakeWordAck: !settings.wakeWordAck })}
              >
                {settings.wakeWordAck ? 'ON' : 'OFF'}
              </button>
            </div>
            <span className="setting-hint">JARVIS speaks a brief vocal acknowledgment upon detecting wake word.</span>
          </div>

          {/* Microphone Input Device */}
          <div className="setting-group">
            <label className="setting-label">
              <Mic size={13} style={{ color: primaryColor }} />
              <span>AUDIO INPUT DEVICE</span>
            </label>
            <select
              className="sci-fi-select"
              value={settings.selectedDeviceId}
              onChange={(e) => setSettings({ ...settings, selectedDeviceId: e.target.value })}
            >
              {devices.map((dev) => (
                <option key={dev.deviceId} value={dev.deviceId}>{dev.label}</option>
              ))}
            </select>
          </div>

          {/* Microphone Sensitivity Slider */}
          <div className="setting-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="setting-label">
                <Sliders size={12} style={{ color: primaryColor }} />
                <span>MICROPHONE SENSITIVITY</span>
              </label>
              <span style={{ fontSize: '11px', color: primaryColor, fontWeight: 700 }}>{settings.sensitivity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.sensitivity}
              onChange={(e) => setSettings({ ...settings, sensitivity: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: primaryColor }}
            />
          </div>

          {/* Voice Output (TTS) Master Enable Toggle */}
          <div className="setting-group">
            <div className="setting-label-row">
              <label className="setting-label">
                <Volume2 size={12} style={{ color: primaryColor }} />
                <span>VOICE OUTPUT / SPEECH (TTS)</span>
              </label>
              <button
                type="button"
                className={`toggle-switch-btn ${settings.ttsEnabled ? 'is-on' : 'is-off'}`}
                onClick={() => setSettings({ ...settings, ttsEnabled: !settings.ttsEnabled })}
              >
                {settings.ttsEnabled ? 'ENABLED [VOICE ON]' : 'DISABLED [VOICE MUTED]'}
              </button>
            </div>
            <span className="setting-hint">JARVIS speaks every answer out loud in real-time when you type commands or talk.</span>
          </div>

          {/* Voice Synthesis Engine (Multi-Provider) */}
          <div className="setting-group" style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="setting-label">
                <Cpu size={12} style={{ color: primaryColor }} />
                <span>VOICE ENGINE (MULTI-PROVIDER)</span>
              </label>
              <span className="font-mono" style={{ fontSize: '9px', color: primaryColor }}>
                {selectedTtsEngine.toUpperCase()}
              </span>
            </div>
            <select
              className="sci-fi-select font-mono"
              value={selectedTtsEngine}
              onChange={(e) => setSelectedTtsEngine(e.target.value)}
              style={{ fontSize: '10px', marginBottom: '8px' }}
            >
              <option value="edge_tts">Microsoft Edge Neural TTS (Free, Low Latency, Bengali+English)</option>
              <option value="elevenlabs">ElevenLabs Cinematic Voice API (Ultra-HD AI Voice)</option>
              <option value="openai">OpenAI HD Speech Audio (tts-1-hd, Crisp Quality)</option>
            </select>

            {selectedTtsEngine === 'elevenlabs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                <input
                  type="password"
                  className="sci-fi-input font-mono"
                  placeholder="ElevenLabs API Key (sk_...)"
                  value={elevenLabsKey}
                  onChange={(e) => setElevenLabsKey(e.target.value)}
                  style={{ fontSize: '10px', padding: '4px 8px' }}
                />
                <input
                  type="text"
                  className="sci-fi-input font-mono"
                  placeholder="Voice ID (e.g. pNInz6obpgDQGcFmaJgB for JARVIS British)"
                  value={elevenLabsVoiceId}
                  onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                  style={{ fontSize: '10px', padding: '4px 8px' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleSaveVoiceEngineConfig}
                className="sci-fi-btn save font-mono"
                style={{ padding: '3px 10px', fontSize: '9.5px', borderColor: primaryColor, color: primaryColor }}
              >
                SAVE VOICE ENGINE
              </button>
              {voiceConfigSavedMsg && (
                <span className="font-mono" style={{ fontSize: '10px', color: '#10b981' }}>
                  ✓ {voiceConfigSavedMsg}
                </span>
              )}
            </div>
          </div>

          {/* Speech-to-Text (STT) Transcription Engine */}
          <div className="setting-group">
            <label className="setting-label">
              <Mic size={12} style={{ color: primaryColor }} />
              <span>WHISPER SPEECH-TO-TEXT (STT) ENGINE</span>
            </label>
            <select
              className="sci-fi-select font-mono"
              value={selectedSttEngine}
              onChange={(e) => setSelectedSttEngine(e.target.value)}
              style={{ fontSize: '10px' }}
            >
              <option value="groq_whisper">Groq Whisper-large-v3 (Ultra-Fast 500 WPM, Real-Time)</option>
              <option value="openai_whisper">OpenAI Whisper-1 (Industry Benchmark Accuracy)</option>
              <option value="web_speech">Browser Native Web Speech API</option>
            </select>
            <span className="setting-hint">Transcribes your spoken voice with ultra-high accuracy and speed.</span>
          </div>

          {/* Voice Output Profile */}
          <div className="setting-group">
            <label className="setting-label">
              <Volume2 size={12} style={{ color: primaryColor }} />
              <span>VOICE SYNTHESIS PROFILE (TTS)</span>
            </label>
            <select
              className="sci-fi-select"
              value={settings.ttsVoice}
              disabled={!settings.ttsEnabled}
              onChange={(e) => setSettings({ ...settings, ttsVoice: e.target.value })}
            >
              {neuralVoices.length > 0 && (
                <optgroup label="── Neural TTS Voices (Crystal Clear Edge-TTS) ──">
                  {neuralVoices.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </optgroup>
              )}
              {systemVoices.length > 0 && (
                <optgroup label="── System Voices (Browser Fallback) ──">
                  {systemVoices.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="setting-group">
            <button
              type="button"
              className="test-voice-btn"
              style={{ borderColor: primaryColor }}
              disabled={isTesting || !settings.ttsEnabled}
              onClick={handleTestVoice}
            >
              <Play size={12} />
              <span>{isTesting ? 'PLAYING TEST AUDIO...' : 'TEST VOICE OUTPUT'}</span>
            </button>
            {testResult === 'success' && (
              <span className="setting-hint" style={{ color: '#10b981' }}>✓ Voice output is working correctly.</span>
            )}
            {testResult === 'error' && (
              <span className="setting-hint" style={{ color: '#ef4444' }}>✗ Audio output test failed.</span>
            )}
          </div>
          </>
        )}

        {/* ─── TASKS & AUDIT LOGS (DEBUG & HISTORY) ─── */}
        {activeTab === 'TASKS_LOGS' && (
          <>
          {/* ─── DEVELOPER & AGENT DEBUG MODE (SECTION 18) ─── */}
          <div className="settings-section-header font-display">
            <Terminal size={13} style={{ color: primaryColor }} />
            <span>DEVELOPER &amp; AGENT DEBUG MODE</span>
          </div>

          <div className="setting-group" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px', marginBottom: '16px' }}>
            <div className="setting-label-row" style={{ marginBottom: '10px' }}>
              <label className="setting-label">
                <Code size={12} style={{ color: primaryColor }} />
                <span>DEVELOPER DEBUG TELEMETRY</span>
              </label>
              <button
                type="button"
                className={`toggle-switch-btn ${settings.debugModeEnabled ? 'is-on' : 'is-off'}`}
                onClick={() => setSettings({ ...settings, debugModeEnabled: !settings.debugModeEnabled })}
              >
                {settings.debugModeEnabled ? 'ENABLED [ON]' : 'DISABLED [OFF]'}
              </button>
            </div>

            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '12px' }}>
              Inspects intent recognition, tool selection, parameters (sanitized), execution durations, and error traces. API keys and passwords remain strictly hidden.
            </div>

            {/* Registered Tools Inspector */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={12} style={{ color: primaryColor }} />
                  REAL COMPUTER TOOLS REGISTRY ({toolsList.length})
                </span>
                <input
                  type="text"
                  placeholder="Filter tools..."
                  value={selectedToolFilter}
                  onChange={(e) => setSelectedToolFilter(e.target.value)}
                  className="sci-fi-input"
                  style={{ width: '140px', padding: '2px 8px', fontSize: '9px' }}
                />
              </div>

              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {toolsList
                  .filter((t: any) => !selectedToolFilter || (t.name && t.name.toLowerCase().includes(selectedToolFilter.toLowerCase())) || (t.description && t.description.toLowerCase().includes(selectedToolFilter.toLowerCase())))
                  .map((t: any) => (
                    <div
                      key={t.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '3px',
                        fontSize: '9px',
                        border: '1px solid rgba(255,255,255,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: primaryColor, fontWeight: 700 }}>{t.name}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>— {t.description.slice(0, 50)}{t.description.length > 50 ? '...' : ''}</span>
                      </div>
                      <span
                        style={{
                          padding: '1px 5px',
                          borderRadius: '2px',
                          fontSize: '8px',
                          fontWeight: 700,
                          background: t.permission_level === 'SAFE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: t.permission_level === 'SAFE' ? '#10b981' : '#ef4444',
                          border: `1px solid ${t.permission_level === 'SAFE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}
                      >
                        {t.permission_level}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Persistent Action History (Section 10) */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={12} style={{ color: primaryColor }} />
                  RECENT ACTION HISTORY ({actionHistoryList.length})
                </span>
                {actionHistoryList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearActionHistory}
                    className="sci-fi-btn"
                    style={{ fontSize: '8px', padding: '2px 6px', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
                  >
                    CLEAR HISTORY
                  </button>
                )}
              </div>

              {actionHistoryList.length === 0 ? (
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', padding: '4px 0' }}>
                  No recent actions logged. Actions performed by JARVIS will appear here.
                </div>
              ) : (
                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {actionHistoryList.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '3px',
                        border: '1px solid rgba(255,255,255,0.04)',
                        fontSize: '8.5px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{item.time_display}</span>
                        <span style={{ color: primaryColor, fontWeight: 700 }}>{item.tool}</span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: item.status === 'SUCCESS' ? '#10b981' : item.status === 'FAILED' ? '#ef4444' : '#f59e0b'
                          }}
                        >
                          {item.status} {item.duration_ms ? `(${item.duration_ms}ms)` : ''}
                        </span>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '8px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {item.result}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </>
        )}
          </main>
        </div>

        {/* Modern Sci-Fi Settings Footer */}
        <div className="settings-footer-bar font-mono">
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
            CONFIGURATION IS PERSISTED LOCALLY IN SQLITE &amp; SYSTEM STORAGE
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="sci-fi-btn cancel" onClick={onClose}>DISMISS</button>
            <button
              className="sci-fi-btn save font-display"
              onClick={handleSave}
              style={{ borderColor: primaryColor, color: primaryColor, padding: '4px 14px' }}
            >
              SAVE &amp; APPLY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
