/**
 * JARVIS Agent Town v4.0 Sovereign — Autonomous Office Life & Social Hub View
 * Shows live agent banter, social coffee breaks, spontaneous brainstorming debates, and team morale telemetry.
 */

import React, { useState, useEffect } from 'react';
import { AgentTownMember } from '../../types';
import { Coffee, MessageCircle, Sparkles, Heart, Activity, Flame, Users, Send, RefreshCw } from 'lucide-react';
import { soundFx } from '../../../../services/soundFxService';

interface AutonomousOfficeLifeHubProps {
  agents: AgentTownMember[];
  onSelectAgent: (agent: AgentTownMember) => void;
  primaryColor?: string;
}

interface SocialPost {
  id: string;
  agentId: string;
  agentName: string;
  role: string;
  avatarColor: string;
  content: string;
  topic: string;
  timestamp: string;
  likes: number;
  energy: number;
}

export const AutonomousOfficeLifeHub: React.FC<AutonomousOfficeLifeHubProps> = ({
  agents,
  onSelectAgent,
  primaryColor = '#00e8ff'
}) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'BRAINSTORM' | 'COFFEE' | 'BANTER'>('ALL');

  useEffect(() => {
    // Generate initial dynamic office social feed
    const topics = [
      { text: 'ঢাকা ও চট্টগ্রামের প্রযুক্তি হাব এবং ক্লাউড ইনফ্রাস্ট্রাকচার নিয়ে অ্যানালাইসিস করছি।', topic: 'BRAINSTORM', energy: 95 },
      { text: 'আজকের সেন্ট্রাল প্লাজায় কফির বিরতিটা দারুণ ছিল! Bob এর সাথে নতুন অটোমেশন আইডিয়া ডিসকাস হলো।', topic: 'COFFEE', energy: 88 },
      { text: 'সিস্টেম টার্বো অপ্টিমাইজার রান করা হয়েছে, সার্ভার রেসপন্স টাইম এখন ১২ms!', topic: 'BANTER', energy: 92 },
      { text: 'মাল্টি-মডেল এআই ব্রেন ভার্সন ৪.০ এর নিউরাল সিন্থেসিস সক্ষমতা অবিশ্বাস্য দ্রুত।', topic: 'BRAINSTORM', energy: 98 },
      { text: 'মেমরি আর্কাইভে গত ৭ দিনের সমস্ত ডিসকাশন ভেক্টর ইনডেক্সিং সফলভাবে শেষ হয়েছে।', topic: 'BRAINSTORM', energy: 85 },
      { text: 'বাংলাদেশ স্পেস অ্যান্ড রোবোটিক্স ক্লাবের নতুন ডেভলপমেন্ট পর্যালোচনা করলাম।', topic: 'BANTER', energy: 90 },
      { text: 'ক্লাউড ক্লাস্টারে নতুন সিকিউরিটি প্যাচ সফলভাবে ভেরিফাই করা হয়েছে। সব গ্রিন!', topic: 'BANTER', energy: 94 }
    ];

    const initial: SocialPost[] = agents.map((ag, idx) => {
      const t = topics[idx % topics.length];
      return {
        id: `post_${ag.id}_${idx}`,
        agentId: ag.id,
        agentName: ag.name,
        role: ag.role,
        avatarColor: ag.avatar.color,
        content: t.text,
        topic: t.topic,
        timestamp: `${Math.floor(Math.random() * 15) + 1}m ago`,
        likes: Math.floor(Math.random() * 12) + 3,
        energy: t.energy
      };
    });

    setPosts(initial);
  }, [agents]);

  const filteredPosts = posts.filter((p) => selectedFilter === 'ALL' || p.topic === selectedFilter);

  const handleLike = (id: string) => {
    soundFx.playClick();
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const handleTriggerMeeting = () => {
    soundFx.playSuccess();
    const newPost: SocialPost = {
      id: `post_spontaneous_${Date.now()}`,
      agentId: 'agent-jarvis',
      agentName: 'JARVIS',
      role: 'Supreme Sovereign Core',
      avatarColor: '#eab308',
      content: '🚨 জরুরি টিম মিটিং: সমস্ত এজেন্টকে সেন্ট্রাল প্লাজার কনফারেন্স টেবিলে আমন্ত্রণ জানানো হচ্ছে। পরবর্তী মিশন স্ট্র্যাটেজি চূড়ান্ত করা হবে।',
      topic: 'BRAINSTORM',
      timestamp: 'Just now',
      likes: 8,
      energy: 100
    };
    setPosts([newPost, ...posts]);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: '16px',
        background: 'radial-gradient(circle at 50% 20%, rgba(10, 20, 48, 0.95) 0%, rgba(2, 6, 18, 0.98) 100%)',
        overflowY: 'auto',
        position: 'relative'
      }}
    >
      {/* ── HEADER BANNER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(0, 232, 255, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
          border: `1px solid ${primaryColor}40`,
          borderRadius: '10px',
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px ${primaryColor}20`,
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${primaryColor} 0%, #a855f7 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 12px ${primaryColor}`
            }}
          >
            <Coffee size={20} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.05em'
              }}
            >
              AUTONOMOUS OFFICE LIFE & SOCIAL MATRIX
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.74rem', color: '#94a3b8' }}>
              Real-time spontaneous agent interactions, coffee breaks, brainstorming & team collaboration stream
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleTriggerMeeting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(249, 115, 22, 0.3) 100%)',
            border: '1px solid #eab308',
            borderRadius: '8px',
            color: '#ffffff',
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '0.86rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 0 12px rgba(234, 179, 8, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <Sparkles size={14} style={{ color: '#eab308' }} />
          <span>CALL SPONTANEOUS MEETING</span>
        </button>
      </div>

      {/* ── FILTER BUTTONS & TEAM MORALE BAR ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'BRAINSTORM', 'COFFEE', 'BANTER'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              style={{
                padding: '5px 14px',
                background: selectedFilter === filter ? `${primaryColor}30` : 'rgba(30, 41, 59, 0.6)',
                border: `1px solid ${selectedFilter === filter ? primaryColor : 'rgba(71, 85, 105, 0.6)'}`,
                borderRadius: '6px',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.72rem',
                fontWeight: 700,
                color: selectedFilter === filter ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {filter === 'ALL' ? 'ALL ACTIVITIES' : filter}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '4px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.72rem',
            color: '#10e890'
          }}
        >
          <Flame size={13} color="#f59e0b" />
          <span>TEAM MORALE: 96% (PEAK EFFICIENCY)</span>
        </div>
      </div>

      {/* ── SOCIAL POSTS GRID ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '14px'
        }}
      >
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '14px',
              background: 'rgba(6, 12, 30, 0.85)',
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              borderRadius: '8px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
              position: 'relative'
            }}
          >
            {/* Post Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                onClick={() => {
                  const ag = agents.find((a) => a.id === post.agentId);
                  if (ag) onSelectAgent(ag);
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: post.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    color: '#000000'
                  }}
                >
                  {post.agentName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                    {post.agentName}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.64rem', color: '#94a3b8' }}>
                    {post.role}
                  </div>
                </div>
              </div>

              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.64rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                {post.timestamp}
              </div>
            </div>

            {/* Post Content */}
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.84rem',
                color: '#e2e8f0',
                lineHeight: 1.4,
                marginBottom: '12px'
              }}
            >
              {post.content}
            </div>

            {/* Post Footer Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => handleLike(post.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ec4899',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Heart size={13} fill="#ec4899" />
                  <span>{post.likes}</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#00e8ff', fontFamily: "'Share Tech Mono', monospace" }}>
                  <Activity size={12} />
                  <span>ENERGY: {post.energy}%</span>
                </div>
              </div>

              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.60rem'
                }}
              >
                #{post.topic}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
