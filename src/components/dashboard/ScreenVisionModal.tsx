import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Eye, 
  X, 
  Camera, 
  RefreshCw, 
  Volume2, 
  Square, 
  Sparkles, 
  Monitor, 
  Video, 
  VideoOff, 
  Radio, 
  Crosshair, 
  ShieldAlert, 
  Cpu, 
  Layers,
  CheckCircle2,
  Sliders,
  Maximize2
} from 'lucide-react';
import { analyzeScreenVisionApi, analyzeCameraVisionApi } from '../../services/api';
import { jarvisTTSService } from '../../services/ttsService';
import { soundFx } from '../../services/soundFxService';

interface ScreenVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
}

export const ScreenVisionModal: React.FC<ScreenVisionModalProps> = ({
  isOpen,
  onClose,
  primaryColor = '#00f0ff'
}) => {
  // Mode: 'camera' | 'screen' | 'sentinel'
  const [visionMode, setVisionMode] = useState<'camera' | 'screen' | 'sentinel'>('camera');
  
  // Results & Loading
  const [visionResult, setVisionResult] = useState<any>(null);
  const [query, setQuery] = useState('Describe what you see in front of the camera');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Camera Eye Stream & Hardware
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sentinelEnabled, setSentinelEnabled] = useState(false);
  const [sentinelInterval, setSentinelInterval] = useState(10); // seconds
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sentinelTimerRef = useRef<any>(null);

  /**
   * Starts user's webcam for real-time optical vision.
   */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      soundFx.playSuccess();
    } catch (err: any) {
      console.warn('Camera access warning:', err);
      setCameraError(err?.message || 'Could not access webcam device. Please grant camera permission.');
      setCameraActive(false);
    }
  }, []);

  /**
   * Stops user's webcam.
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  /**
   * Captures a high-resolution JPEG frame from the live webcam.
   */
  const captureCameraBase64 = useCallback((): string | null => {
    if (!videoRef.current || !cameraActive) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [cameraActive]);

  /**
   * Executes AI Vision Analysis (Camera Eye or Screen Display).
   */
  const runVisionAnalysis = useCallback(async (userQuery = query, isSentinel = false) => {
    if (loading && !isSentinel) return;
    setLoading(true);
    if (!isSentinel) soundFx.playClick();

    try {
      if (visionMode === 'camera' || (visionMode === 'sentinel' && isSentinel)) {
        const frameB64 = captureCameraBase64();
        if (!frameB64) {
          throw new Error('Camera feed not ready or inactive. Please start camera first.');
        }

        const data = await analyzeCameraVisionApi({
          image_base64: frameB64,
          query: userQuery,
          language: 'auto',
          continuous: isSentinel
        });
        
        data.image_data_url = frameB64;
        setVisionResult(data);
        setLastScanTime(new Date().toLocaleTimeString());
        if (!isSentinel) soundFx.playSuccess();
      } else {
        // Screen Vision Mode
        const data = await analyzeScreenVisionApi(userQuery);
        setVisionResult(data);
        setLastScanTime(new Date().toLocaleTimeString());
        if (!isSentinel) soundFx.playSuccess();
      }
    } catch (e: any) {
      console.warn('Vision analysis notice:', e);
      if (!isSentinel) {
        setVisionResult({
          status: 'error',
          analysis: `Optical Vision notice: ${e?.message || 'Check connection and try again.'}`
        });
      }
    } finally {
      setLoading(false);
    }
  }, [visionMode, query, loading, captureCameraBase64]);

  // Handle modal open / close lifecycle
  useEffect(() => {
    if (isOpen) {
      if (visionMode === 'camera' || visionMode === 'sentinel') {
        startCamera().then(() => {
          setTimeout(() => runVisionAnalysis(query), 900);
        });
      } else {
        runVisionAnalysis(query);
      }
    } else {
      stopCamera();
      jarvisTTSService.stop();
      setIsSpeaking(false);
      if (sentinelTimerRef.current) {
        clearInterval(sentinelTimerRef.current);
        sentinelTimerRef.current = null;
      }
    }
  }, [isOpen, visionMode]);

  // Handle Sentinel (Continuous Auto-Scan) Mode
  useEffect(() => {
    if (sentinelTimerRef.current) {
      clearInterval(sentinelTimerRef.current);
      sentinelTimerRef.current = null;
    }

    if (sentinelEnabled && cameraActive && isOpen) {
      sentinelTimerRef.current = setInterval(() => {
        runVisionAnalysis('Observe user, environment, objects in hand, and presence', true);
      }, sentinelInterval * 1000);
    }

    return () => {
      if (sentinelTimerRef.current) {
        clearInterval(sentinelTimerRef.current);
        sentinelTimerRef.current = null;
      }
    };
  }, [sentinelEnabled, cameraActive, isOpen, sentinelInterval, runVisionAnalysis]);

  const handleSpeak = () => {
    if (!visionResult?.analysis) return;
    if (isSpeaking) {
      jarvisTTSService.stop();
      setIsSpeaking(false);
      return;
    }

    soundFx.playSuccess();
    setIsSpeaking(true);
    jarvisTTSService.speak(visionResult.analysis, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        style={{
          width: '900px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          background: 'linear-gradient(135deg, rgba(3, 10, 24, 0.98) 0%, rgba(6, 18, 36, 0.98) 100%)',
          border: `1px solid ${primaryColor}45`,
          borderRadius: '12px',
          boxShadow: `0 0 60px ${primaryColor}25, 0 24px 60px rgba(0,0,0,0.85)`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* ── HEADER ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.09)',
          background: `linear-gradient(90deg, ${primaryColor}12, transparent)`
        }}>
          {/* Left Title & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px',
              borderRadius: '8px',
              background: `${primaryColor}15`,
              border: `1px solid ${primaryColor}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Eye size={20} color={primaryColor} />
            </div>
            <div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 700,
                color: primaryColor,
                letterSpacing: '0.1em'
              }}>
                // JARVIS CYBER VISION &amp; OPTICAL EYE //
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                letterSpacing: '0.06em',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>REAL-TIME OPTICAL PERCEPTION &amp; MULTIMODAL SENSORS</span>
                {cameraActive && (
                  <span style={{
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '9px'
                  }}>
                    ● EYE ONLINE
                  </span>
                )}
                {sentinelEnabled && (
                  <span style={{
                    color: primaryColor,
                    background: `${primaryColor}15`,
                    border: `1px solid ${primaryColor}35`,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '9px'
                  }}>
                    🛡️ SENTINEL ({sentinelInterval}s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Matrix with Big, Clear Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Quick Re-scan button */}
            <button
              onClick={() => runVisionAnalysis(query)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: 700,
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.35)',
                color: primaryColor,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Camera size={12} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'ANALYZING...' : 'OPTICAL SCAN'}</span>
            </button>

            {/* TTS Voice Readout */}
            {visionResult?.analysis && (
              <button
                onClick={handleSpeak}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: isSpeaking ? '#ef4444' : primaryColor,
                  color: '#020617',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: `0 0 14px ${isSpeaking ? '#ef444480' : `${primaryColor}60`}`,
                  transition: 'all 0.2s'
                }}
              >
                {isSpeaking ? <Square size={12} className="fill-current" /> : <Volume2 size={12} />}
                <span>{isSpeaking ? 'STOP' : 'SPEAK SIGHT'}</span>
              </button>
            )}

            {/* Prominent Cross / Close Button */}
            <button
              onClick={onClose}
              title="Close Optical Vision Modal (Esc)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              <X size={14} />
              <span>CLOSE</span>
            </button>
          </div>
        </div>

        {/* ── TABS BAR (Mode Switcher) ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex' }}>
            <button
              onClick={() => {
                setVisionMode('camera');
                setQuery('Describe what you see in front of the camera');
                if (!cameraActive) startCamera();
              }}
              style={{
                padding: '12px 18px',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: visionMode === 'camera' ? primaryColor : 'rgba(255, 255, 255, 0.45)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: visionMode === 'camera' ? `2px solid ${primaryColor}` : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Video size={13} />
              <span>LIVE CAMERA EYE (ক্যামেরা চোখ)</span>
            </button>

            <button
              onClick={() => {
                setVisionMode('screen');
                setQuery('Analyze and summarize the contents of this display');
                stopCamera();
              }}
              style={{
                padding: '12px 18px',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: visionMode === 'screen' ? primaryColor : 'rgba(255, 255, 255, 0.45)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: visionMode === 'screen' ? `2px solid ${primaryColor}` : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Monitor size={13} />
              <span>SCREEN OCR SCANNER (স্ক্রিন ভিষণ)</span>
            </button>

            <button
              onClick={() => {
                setVisionMode('sentinel');
                if (!cameraActive) startCamera();
              }}
              style={{
                padding: '12px 18px',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: visionMode === 'sentinel' ? '#10b981' : 'rgba(255, 255, 255, 0.45)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: visionMode === 'sentinel' ? '2px solid #10b981' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Radio size={13} />
              <span>SENTINEL CONFIG (সার্বক্ষণিক নজরদারি)</span>
            </button>
          </div>

          {/* Quick Sentinel Toggle on Top Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
              AUTO-EYE:
            </span>
            <button
              onClick={() => {
                soundFx.playClick();
                setSentinelEnabled(!sentinelEnabled);
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                background: sentinelEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${sentinelEnabled ? '#10b98150' : 'rgba(255, 255, 255, 0.1)'}`,
                color: sentinelEnabled ? '#10b981' : 'rgba(255, 255, 255, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              {sentinelEnabled ? '● SENTINEL ON' : '○ SENTINEL OFF'}
            </button>
          </div>
        </div>

        {/* ── MODAL BODY CONTENT ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Query Bar */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  visionMode === 'screen'
                    ? "Ask JARVIS about your active display (e.g. Find syntax errors in this code, Explain graph)..."
                    : "Ask JARVIS about what is in front of the camera (e.g. What am I holding? Describe room)..."
                }
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(6, 18, 36, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#ffffff',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                onKeyDown={(e) => e.key === 'Enter' && runVisionAnalysis(query)}
              />
            </div>
            <button
              onClick={() => runVisionAnalysis(query)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 16px',
                borderRadius: '6px',
                background: primaryColor,
                color: '#020617',
                border: 'none',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: `0 0 15px ${primaryColor}40`
              }}
            >
              {loading ? <RefreshCw size={13} className="animate-spin" /> : <Eye size={13} />}
              <span>{loading ? 'SCANNING...' : 'ANALYZE'}</span>
            </button>
          </div>

          {/* Quick Action Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {visionMode === 'screen' ? (
              <>
                <button
                  onClick={() => { const q = 'Summarize all open apps and active windows'; setQuery(q); runVisionAnalysis(q); }}
                  style={{
                    padding: '4px 10px', borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer'
                  }}
                >
                  🔍 Summarize Display
                </button>
                <button
                  onClick={() => { const q = 'Spot any bugs, warnings or syntax errors on screen'; setQuery(q); runVisionAnalysis(q); }}
                  style={{
                    padding: '4px 10px', borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer'
                  }}
                >
                  🐛 Spot Code Errors
                </button>
                <button
                  onClick={() => { const q = 'Extract all key text and metrics on this screen'; setQuery(q); runVisionAnalysis(q); }}
                  style={{
                    padding: '4px 10px', borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer'
                  }}
                >
                  📄 Extract Text &amp; OCR
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { const q = 'Describe everything you see in front of the camera'; setQuery(q); runVisionAnalysis(q); }}
                  style={{
                    padding: '4px 10px', borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer'
                  }}
                >
                  👁️ Describe Surroundings
                </button>
                <button
                  onClick={() => { const q = 'Identify what object I am holding in my hand'; setQuery(q); runVisionAnalysis(q); }}
                  style={{
                    padding: '4px 10px', borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer'
                  }}
                >
                  ✋ Identify Hand Object
                </button>
                <button
                  onClick={() => { const q = 'Observe user posture, facial expression and active state'; setQuery(q); runVisionAnalysis(q); }}
                  style={{
                    padding: '4px 10px', borderRadius: '4px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer'
                  }}
                >
                  👤 User Posture &amp; Mood
                </button>
                <button
                  onClick={() => { const q = 'আমার দিকে তাকাও এবং বলো আমি কি করছি'; setQuery(q); runVisionAnalysis(q); }}
                  style={{
                    padding: '4px 10px', borderRadius: '4px',
                    background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)',
                    color: primaryColor, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer'
                  }}
                >
                  🇧🇩 আমার দিকে দেখো
                </button>
              </>
            )}
          </div>

          {/* Sentinel Configuration Card if in Sentinel Mode */}
          {visionMode === 'sentinel' && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                  <Radio size={14} className="animate-spin" />
                  <span>SENTINEL CONTINUOUS OBSERVATION CONTROLLER</span>
                </div>
                <button
                  onClick={() => setSentinelEnabled(!sentinelEnabled)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '5px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: sentinelEnabled ? '#10b981' : 'rgba(255,255,255,0.1)',
                    color: sentinelEnabled ? '#020617' : '#ffffff',
                    border: 'none',
                    boxShadow: sentinelEnabled ? '0 0 12px rgba(16,185,129,0.5)' : 'none'
                  }}
                >
                  {sentinelEnabled ? '✓ SENTINEL EYE IS ACTIVE' : 'ACTIVATE SENTINEL EYE'}
                </button>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
                When Sentinel Eye is ON, JARVIS automatically inspects your camera feed every {sentinelInterval} seconds. Visual observations are continuously fed into JARVIS's neural memory so JARVIS is always aware of your surroundings, activities, and presence.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#ffffff' }}>
                <span>Scan Interval Frequency:</span>
                <select
                  value={sentinelInterval}
                  onChange={(e) => setSentinelInterval(Number(e.target.value))}
                  style={{
                    background: 'rgba(6, 18, 36, 0.95)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                >
                  <option value={5}>Every 5 Seconds (High Fidelity)</option>
                  <option value={10}>Every 10 Seconds (Recommended)</option>
                  <option value={20}>Every 20 Seconds (Balanced)</option>
                  <option value={30}>Every 30 Seconds (Low Power)</option>
                </select>
              </div>
            </div>
          )}

          {/* Main 2-Column Vision Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Viewport Column (Camera Feed or Screen Preview) */}
            <div style={{
              background: 'rgba(6, 18, 36, 0.9)',
              border: `1px solid ${primaryColor}30`,
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'monospace', fontSize: '10.5px' }}>
                <span style={{ color: primaryColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {visionMode === 'screen' ? <Monitor size={12} /> : <Video size={12} />}
                  <span>{visionMode === 'screen' ? 'ACTIVE SCREEN DISPLAY' : 'OPTICAL CAMERA EYE FEED'}</span>
                </span>
                <span style={{ color: '#10b981' }}>
                  {lastScanTime ? `LAST SCAN: ${lastScanTime}` : 'STANDBY'}
                </span>
              </div>

              {visionMode === 'screen' ? (
                /* Screen Capture Preview */
                <div style={{
                  position: 'relative',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  minHeight: '260px',
                  maxHeight: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#000000'
                }}>
                  {visionResult?.image_data_url ? (
                    <img 
                      src={visionResult.image_data_url} 
                      alt="Screen Capture" 
                      style={{ width: '100%', height: 'auto', maxHeight: '320px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '11px' }}>
                      <Monitor size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                      <div>Ready to scan desktop display.</div>
                    </div>
                  )}
                </div>
              ) : (
                /* Live WebRTC Camera Video Element */
                <div style={{
                  position: 'relative',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: `1px solid ${primaryColor}40`,
                  minHeight: '260px',
                  maxHeight: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#000000'
                }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '320px',
                      objectFit: 'cover',
                      display: cameraActive ? 'block' : 'none'
                    }}
                  />

                  {/* Camera Offline Notice */}
                  {!cameraActive && (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '11px' }}>
                      <VideoOff size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                      <div style={{ marginBottom: '12px' }}>
                        {cameraError || 'Camera Optical Sensor is standby.'}
                      </div>
                      <button
                        onClick={startCamera}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '5px',
                          background: primaryColor,
                          color: '#020617',
                          border: 'none',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ACTIVATE OPTICAL EYE
                      </button>
                    </div>
                  )}

                  {/* Cybernetic HUD Reticle Overlay */}
                  {cameraActive && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '9px', color: primaryColor }}>
                        <span style={{ borderTop: `2px solid ${primaryColor}`, borderLeft: `2px solid ${primaryColor}`, padding: '2px 4px' }}>
                          JARVIS//OPTIC_01
                        </span>
                        <span style={{ borderTop: `2px solid ${primaryColor}`, borderRight: `2px solid ${primaryColor}`, padding: '2px 4px' }}>
                          FPS: 30 // LIVE
                        </span>
                      </div>

                      {/* Center Reticle */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.65
                      }}>
                        <div style={{
                          width: '90px',
                          height: '90px',
                          border: `1px solid ${primaryColor}`,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{ width: '60px', height: '60px', border: `1px dashed ${primaryColor}`, borderRadius: '50%' }} />
                        </div>
                        <div style={{ position: 'absolute', width: '20px', height: '20px', border: `1px solid ${primaryColor}` }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '9px', color: primaryColor }}>
                        <span style={{ borderBottom: `2px solid ${primaryColor}`, borderLeft: `2px solid ${primaryColor}`, padding: '2px 4px' }}>
                          LUMINANCE: OPTIMAL
                        </span>
                        <span style={{ borderBottom: `2px solid ${primaryColor}`, borderRight: `2px solid ${primaryColor}`, padding: '2px 4px' }}>
                          PERCEPTION: LOCKED
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Neural Insights Output Column */}
            <div style={{
              background: 'rgba(6, 18, 36, 0.9)',
              border: `1px solid ${primaryColor}30`,
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'monospace', fontSize: '10.5px' }}>
                <span style={{ color: primaryColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={12} />
                  <span>NEURAL OPTICAL INSIGHTS (জারভিস বিশ্লেষণ)</span>
                </span>
                {loading && (
                  <span style={{ color: primaryColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={11} className="animate-spin" /> SCANNING...
                  </span>
                )}
              </div>

              <div style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '12px',
                minHeight: '260px',
                maxHeight: '320px',
                overflowY: 'auto',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.88)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {loading && !visionResult ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    <RefreshCw size={24} color={primaryColor} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                    <div>SYNTHESIZING OPTICAL TENSORS...</div>
                  </div>
                ) : visionResult?.analysis ? (
                  visionResult.analysis
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                    <Eye size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <div>Click "OPTICAL SCAN" to observe through the camera.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
