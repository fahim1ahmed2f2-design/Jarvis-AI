import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Zap,
  Volume2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Shield,
  Activity,
  Flame,
  Globe,
  Radio,
  CheckCircle2,
  Layers,
  Square,
  Play,
  VolumeX
} from 'lucide-react';
import { bangladeshNewsService, ActiveNewsDebateSession } from './bangladeshNewsService';
import { BangladeshNewsItem, sendChatMessage } from '../../services/api';
import { soundFx } from '../../services/soundFxService';
import { jarvisTTSService } from '../../services/ttsService';

interface BangladeshNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
  onSelectAgentId?: (agentId: string) => void;
}

export const BangladeshNewsModal: React.FC<BangladeshNewsModalProps> = ({
  isOpen,
  onClose,
  primaryColor = '#a855f7',
  onSelectAgentId
}) => {
  const [stories, setStories] = useState<BangladeshNewsItem[]>([]);
  const [activeDebate, setActiveDebate] = useState<ActiveNewsDebateSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isReadingAloud, setIsReadingAloud] = useState<boolean>(false);
  const [isSynthesizingBriefing, setIsSynthesizingBriefing] = useState<boolean>(false);
  const [activeBriefingStoryId, setActiveBriefingStoryId] = useState<string | null>(null);
  const [jarvisBriefing, setJarvisBriefing] = useState<string | null>(null);

  const handleClose = () => {
    jarvisTTSService.stop();
    setIsReadingAloud(false);
    setIsSynthesizingBriefing(false);
    setActiveBriefingStoryId(null);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    return bangladeshNewsService.subscribe((newsStories, currentDebate, loading) => {
      setStories(newsStories);
      setActiveDebate(currentDebate);
      setIsLoading(loading);
    });
  }, []);

  if (!isOpen) return null;

  const categories = [
    'ALL',
    'Politics & Governance',
    'Economy & Trade',
    'Technology & AI',
    'Sports',
    'National & Society'
  ];

  const filteredStories = stories.filter((s: BangladeshNewsItem) => {
    if (selectedCategory === 'ALL') return true;
    return s.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handleLaunchDebate = async (story: BangladeshNewsItem) => {
    soundFx.playChime();
    await bangladeshNewsService.launchAgentOfficeDebate(story);
  };

  const handleStopSpeech = () => {
    soundFx.playClick();
    jarvisTTSService.stop();
    setIsReadingAloud(false);
  };

  const handleReplaySpeech = () => {
    if (!jarvisBriefing) return;
    soundFx.playClick();
    jarvisTTSService.stop();
    setIsReadingAloud(true);
    jarvisTTSService.speak(jarvisBriefing, {
      onStart: () => setIsReadingAloud(true),
      onEnd: () => setIsReadingAloud(false),
      onError: () => setIsReadingAloud(false)
    });
  };

  const handleAskJarvisToBrief = async (story: BangladeshNewsItem) => {
    soundFx.playClick();

    // If currently speaking this story, clicking toggles stop
    if (isReadingAloud && activeBriefingStoryId === story.id) {
      handleStopSpeech();
      return;
    }

    jarvisTTSService.stop();
    setIsReadingAloud(false);
    setIsSynthesizingBriefing(true);
    setActiveBriefingStoryId(story.id);
    setJarvisBriefing('জারভিস লাইভ ইন্টেলিজেন্স বিশ্লেষণ ও মৌখিক ব্রিফিং প্রস্তুত করছে...');

    try {
      const prompt = `[JARVIS EXECUTIVE SPOKEN BRIEFING DIRECTIVE]
সংবাদটির ওপর একজন মার্জিত ও শীর্ষস্থানীয় কৌশলগত বিশ্লেষকের মতো অত্যন্ত স্পষ্ট, প্রাঞ্জল ও প্রমিত বাংলায় একটি পূর্ণাঙ্গ মৌখিক ব্রিফিং (Spoken Briefing) উপস্থাপন করুন:
সংবাদের শিরোনাম: "${story.title}"
বিভাগ: "${story.category}"
উৎস: "${story.source}"

কঠোর গাইডলাইন:
- কথা বলার শুরুতেই অত্যন্ত বিনীত ও মার্জিতভাবে বলুন: "আসসালামু আলাইকুম স্যার। ${story.title}-এর ওপর বিস্তারিত কৌশলগত ব্রিফিং তুলে ধরছি।"
- বক্তব্য হবে জীবন্ত, প্রমিত, স্বাভাবিক মানুষের মতো স্পষ্ট ও গোছানো।
- কোনো জটিল অবোধ্য প্রতীক বা অতিরিক্ত কোড ব্লক ব্যবহার করবেন না যাতে স্পিচ ইঞ্জিন একনাগাড়ে চমৎকার ছন্দে কথা বলতে পারে।
- কাঠামো:
  ১. সারসংক্ষেপ: মূল ঘটনা ও তথ্যসমূহ।
  ২. কৌশলগত প্রভাব: দেশের অর্থনীতি, সমাজ ও প্রযুক্তিতে এর তাৎপর্য।
  ৩. এজেন্ট টাউনের পর্যবেক্ষণ ও সার্বিক সুপারিশ।`;

      const res = await sendChatMessage(prompt, 'jarvis_bd_news_brief', undefined, 'auto');
      if (res && res.reply) {
        setJarvisBriefing(res.reply);
        setIsSynthesizingBriefing(false);
        setIsReadingAloud(true);

        // Trigger crystal-clear spoken voice synthesis immediately
        await jarvisTTSService.speak(res.reply, {
          onStart: () => setIsReadingAloud(true),
          onEnd: () => setIsReadingAloud(false),
          onError: () => setIsReadingAloud(false)
        });
      }
    } catch (err) {
      setJarvisBriefing('Could not fetch Jarvis briefing at this time.');
      setIsReadingAloud(false);
      setIsSynthesizingBriefing(false);
    }
  };

  const handleRefresh = async () => {
    await bangladeshNewsService.refreshNews(true);
  };

  const getCategoryColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('politics')) return '#ef4444';
    if (c.includes('economy')) return '#10e890';
    if (c.includes('tech')) return '#00e8ff';
    if (c.includes('sports')) return '#f59e0b';
    return '#a855f7';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          backgroundColor: '#040b20',
          border: '1px solid rgba(0, 232, 255, 0.35)',
          borderRadius: '14px',
          boxShadow: '0 0 40px rgba(0, 232, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(0, 232, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(6, 18, 48, 0.95) 0%, rgba(4, 12, 32, 0.95) 100%)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(16, 232, 144, 0.3) 100%)',
                border: '1px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.35)'
              }}
            >
              🇧🇩
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    color: '#ffffff',
                    margin: 0
                  }}
                >
                  BANGLADESH BREAKING NEWSROOM
                </h2>
                <span
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.65rem',
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'v3Pulse 1.2s infinite' }} />
                  LIVE MATRIX
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.72rem',
                  color: 'rgba(255, 255, 255, 0.65)',
                  margin: '2px 0 0 0'
                }}
              >
                Real-time Bangladesh intelligence streams • Multi-agent office debate with speech bubbles
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'rgba(0, 232, 255, 0.1)',
                border: '1px solid rgba(0, 232, 255, 0.3)',
                borderRadius: '6px',
                color: '#00e8ff',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.7rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <RefreshCw size={12} className={isLoading ? 'spin' : ''} />
              <span>{isLoading ? 'SYNCING...' : 'REFRESH'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.7)',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div
          style={{
            padding: '10px 24px',
            background: 'rgba(3, 8, 26, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            flexShrink: 0
          }}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  background: isActive ? 'linear-gradient(135deg, rgba(0, 232, 255, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)' : 'rgba(255, 255, 255, 0.03)',
                  border: isActive ? '1px solid #00e8ff' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Body Content: Split View (Stories on Left, Active Debate / Jarvis Brief on Right) */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: activeDebate || jarvisBriefing ? '1.1fr 1fr' : '1fr',
            overflow: 'hidden',
            background: '#020614'
          }}
        >
          {/* Left Column: News Stories Feed */}
          <div
            style={{
              padding: '16px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderRight: activeDebate || jarvisBriefing ? '1px solid rgba(0, 232, 255, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.72rem',
                  color: 'rgba(0, 232, 255, 0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                TOP BREAKING HEADLINES ({filteredStories.length})
              </span>
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.62rem',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                AUTO-SYNC ENABLED
              </span>
            </div>

            {filteredStories.map((story: BangladeshNewsItem) => {
              const catColor = getCategoryColor(story.category);
              const isSelectedForDebate = activeDebate?.storyTitle === story.title;

              return (
                <div
                  key={story.id}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: isSelectedForDebate ? 'rgba(0, 232, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelectedForDebate ? '1px solid #00e8ff' : '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Category & Source Metadata */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontFamily: "'Share Tech Mono', monospace",
                          fontWeight: 700,
                          color: catColor,
                          background: `${catColor}18`,
                          border: `1px solid ${catColor}40`,
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {story.category.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontFamily: "'Share Tech Mono', monospace",
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}
                      >
                        ● {story.source}
                      </span>
                    </div>

                    {story.hot_level === 'BREAKING' && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.58rem',
                          fontFamily: "'Orbitron', sans-serif",
                          fontWeight: 800,
                          color: '#ef4444',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          padding: '1px 5px',
                          borderRadius: '4px'
                        }}
                      >
                        <Flame size={10} color="#ef4444" />
                        BREAKING
                      </span>
                    )}
                  </div>

                  {/* Headline Title */}
                  <h4
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      lineHeight: '1.4',
                      margin: 0
                    }}
                  >
                    {story.title}
                  </h4>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <button
                      onClick={() => handleLaunchDebate(story)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 10px',
                        background: 'linear-gradient(135deg, rgba(0, 232, 255, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
                        border: '1px solid #00e8ff',
                        borderRadius: '5px',
                        color: '#ffffff',
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        boxShadow: '0 0 10px rgba(0, 232, 255, 0.2)'
                      }}
                    >
                      <Zap size={11} color="#00e8ff" />
                      <span>AGENT TOWN DEBATE</span>
                    </button>

                    <button
                      onClick={() => handleAskJarvisToBrief(story)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 10px',
                        background:
                          activeBriefingStoryId === story.id && isReadingAloud
                            ? 'linear-gradient(135deg, rgba(16, 232, 144, 0.3) 0%, rgba(0, 232, 255, 0.3) 100%)'
                            : activeBriefingStoryId === story.id && isSynthesizingBriefing
                            ? 'rgba(234, 179, 8, 0.2)'
                            : 'rgba(245, 165, 36, 0.12)',
                        border: `1px solid ${
                          activeBriefingStoryId === story.id && isReadingAloud
                            ? '#10e890'
                            : activeBriefingStoryId === story.id && isSynthesizingBriefing
                            ? '#eab308'
                            : 'rgba(245, 165, 36, 0.35)'
                        }`,
                        borderRadius: '5px',
                        color: activeBriefingStoryId === story.id && isReadingAloud ? '#10e890' : '#f5a524',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow:
                          activeBriefingStoryId === story.id && isReadingAloud
                            ? '0 0 10px rgba(16, 232, 144, 0.4)'
                            : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {activeBriefingStoryId === story.id && isReadingAloud ? (
                        <>
                          <Volume2 size={11} style={{ animation: 'pulse 1s infinite' }} />
                          <span>SPEAKING (STOP)</span>
                        </>
                      ) : activeBriefingStoryId === story.id && isSynthesizingBriefing ? (
                        <>
                          <Sparkles size={11} />
                          <span>SYNTHESIZING...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={11} />
                          <span>JARVIS BRIEFING</span>
                        </>
                      )}
                    </button>

                    {story.url && (
                      <a
                        href={story.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '5px',
                          color: 'rgba(255, 255, 255, 0.65)',
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '0.60rem',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={10} />
                        <span>SOURCE</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Multi-Agent Debate Transcript or Jarvis Briefing */}
          {(activeDebate || jarvisBriefing) && (
            <div
              style={{
                width: '450px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflowY: 'auto',
                flexShrink: 0
              }}
            >
              {/* Active Debate Section */}
              {activeDebate && (
                <div
                  style={{
                    padding: '14px',
                    background: 'rgba(4, 9, 24, 0.85)',
                    border: '1px solid rgba(0, 232, 255, 0.35)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={14} color="#00e8ff" />
                      <span
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          color: '#00e8ff',
                          letterSpacing: '0.05em'
                        }}
                      >
                        LIVE AGENT OFFICE DEBATE
                      </span>
                    </div>

                    <span
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.65rem',
                        color: '#f5a524',
                        background: 'rgba(245, 165, 36, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700
                      }}
                    >
                      TURN {activeDebate.currentTurnIndex + 1}/{activeDebate.totalTurns}
                    </span>
                  </div>

                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.70rem',
                      color: 'rgba(255, 255, 255, 0.65)',
                      lineHeight: '1.35',
                      borderLeft: '2px solid #00e8ff',
                      paddingLeft: '8px'
                    }}
                  >
                    Topic: "{activeDebate.storyTitle}"
                  </div>

                  {/* Turns Transcript */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                    {activeDebate.turns.slice(0, activeDebate.currentTurnIndex + 1).map((turn: any, idx: number) => {
                      return (
                        <div
                          key={turn.id || idx}
                          onClick={() => {
                            if (turn.agentId && onSelectAgentId) {
                              onSelectAgentId(turn.agentId);
                            }
                          }}
                          style={{
                            padding: '8px 10px',
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: `1px solid ${turn.color}40`,
                            borderRadius: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            cursor: 'pointer',
                            animation: 'fadeIn 0.25s ease-out'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span
                              style={{
                                fontFamily: "'Orbitron', sans-serif",
                                fontSize: '0.70rem',
                                fontWeight: 800,
                                color: turn.color
                              }}
                            >
                              {turn.speakerName}
                            </span>
                            {turn.subtext && (
                              <span
                                style={{
                                  fontFamily: "'Share Tech Mono', monospace",
                                  fontSize: '0.58rem',
                                  color: 'rgba(216, 180, 254, 0.75)'
                                }}
                              >
                                {turn.subtext}
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: '0.75rem',
                              color: '#ffffff',
                              lineHeight: '1.4',
                              margin: 0
                            }}
                          >
                            "{turn.text}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Jarvis Briefing Section with Full Voice Spoken Output & Controls */}
              {jarvisBriefing && (
                <div
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(16, 232, 144, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
                    border: `1px solid ${isReadingAloud ? '#10e890' : 'rgba(16, 232, 144, 0.4)'}`,
                    borderRadius: '8px',
                    boxShadow: isReadingAloud ? '0 0 20px rgba(16, 232, 144, 0.2)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Volume2 size={16} color="#10e890" style={{ animation: isReadingAloud ? 'pulse 1.2s infinite' : 'none' }} />
                      <span
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          color: '#10e890',
                          letterSpacing: '0.06em'
                        }}
                      >
                        JARVIS STRATEGIC SYNTHESIS
                      </span>
                    </div>

                    {/* Voice Play / Stop Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isReadingAloud ? (
                        <button
                          onClick={handleStopSpeech}
                          title="Stop Spoken Voice"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            borderRadius: '5px',
                            color: '#fca5a5',
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Square size={10} fill="#ef4444" />
                          <span>MUTE VOICE</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleReplaySpeech}
                          title="Replay Spoken Briefing"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: 'rgba(16, 232, 144, 0.2)',
                            border: '1px solid #10e890',
                            borderRadius: '5px',
                            color: '#86efac',
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Play size={10} fill="#10e890" />
                          <span>SPEAK AGAIN</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spoken Text Presentation */}
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.80rem',
                      color: '#f8fafc',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-line',
                      background: 'rgba(2, 6, 22, 0.6)',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {jarvisBriefing}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#03081a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={12} color="#00e8ff" />
            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.64rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}
            >
              Sources: Google News BD • Prothom Alo • Dhaka Tribune • The Daily Star
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '5px 14px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#ffffff',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.68rem',
              cursor: 'pointer'
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
