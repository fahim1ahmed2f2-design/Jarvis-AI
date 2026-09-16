import React from 'react';
import { useJarvisState } from './state/jarvisState';
import { CommandCenterDashboard } from './components/dashboard/CommandCenterDashboard';
import './styles/global.css';
import './styles/hud.css';
import './styles/controls.css';

export const App: React.FC = () => {
  const { 
    currentState, 
    setState, 
    setLiveAudioFrequencies, 
    config, 
    telemetry,
    events
  } = useJarvisState();

  return (
    <main className="jarvis-app-root">
      {/* Futuristic AI Command Center Dashboard */}
      <CommandCenterDashboard
        state={currentState}
        config={config}
        telemetry={telemetry}
        events={events}
        onStateChange={setState}
        onLiveAudioFrequencies={setLiveAudioFrequencies}
      />
    </main>
  );
};

export default App;
