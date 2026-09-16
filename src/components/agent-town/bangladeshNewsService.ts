import {
  fetchBangladeshNewsApi,
  analyzeBangladeshNewsStoryApi,
  BangladeshNewsItem,
  AgentNewsDialogueTurn,
  BangladeshNewsAnalysisResponse
} from '../../services/api';
import { agentActivityFeed } from './agentActivityFeed';
import { soundFx } from '../../services/soundFxService';

export interface ActiveNewsDebateSession {
  sessionId: string;
  storyTitle: string;
  category: string;
  startedAt: number;
  currentTurnIndex: number;
  totalTurns: number;
  turns: AgentNewsDialogueTurn[];
  activeSpeaker: AgentNewsDialogueTurn | null;
  executiveSummary: string;
  isComplete: boolean;
}

type NewsListener = (stories: BangladeshNewsItem[], activeDebate: ActiveNewsDebateSession | null, loading: boolean) => void;

const BANGLA_FALLBACK_STORIES: BangladeshNewsItem[] = [
  {
    id: 'news-bd-1',
    title: 'বাংলাদেশ ব্যাংকের বিশেষ পদক্ষেপে বৈদেশিক মুদ্রার রিজার্ভে উল্লেখযোগ্য প্রবৃদ্ধি',
    source: 'দৈনিক প্রথম আলো',
    category: 'Economy & Trade',
    url: 'https://www.prothomalo.com',
    hot_level: 'BREAKING',
    sentiment: 'Positive'
  },
  {
    id: 'news-bd-2',
    title: 'ঢাকায় জাতীয় প্রশাসনিক সংস্কার ও প্রাতিষ্ঠানিক জবাবদিহিতা নিশ্চিতের নতুন রূপরেখা ঘোষণা',
    source: 'ঢাকা ট্রিবিউন',
    category: 'Politics & Governance',
    url: 'https://www.dhakatribune.com',
    hot_level: 'BREAKING',
    sentiment: 'Positive'
  },
  {
    id: 'news-bd-3',
    title: 'বাংলাদেশের এআই ও প্রযুক্তি স্টার্টআপে বৈশ্বিক ভেঞ্চার ক্যাপিটালের নতুন তহবিল বরাদ্দ',
    source: 'দ্য বিজনেস স্ট্যান্ডার্ড',
    category: 'Technology & AI',
    url: 'https://tbsnews.net',
    hot_level: 'TRENDING',
    sentiment: 'Positive'
  },
  {
    id: 'news-bd-4',
    title: 'আসন্ন আন্তর্জাতিক সিরিজের জন্য জাতীয় ক্রিকেট দলের বিশেষ স্কিল ক্যাম্প শুরু',
    source: 'ইএসপিএন ক্রিকইনফো',
    category: 'Sports',
    url: 'https://www.espncricinfo.com',
    hot_level: 'TRENDING',
    sentiment: 'Neutral'
  },
  {
    id: 'news-bd-5',
    title: 'চট্টগ্রাম বন্দরে স্বয়ংক্রিয় ডিজিটাল কাস্টমস ক্লিয়ারেন্স চালু; পণ্য খালাসে সময় কমবে অর্ধেক',
    source: 'দৈনিক যুগান্তর',
    category: 'Economy & Trade',
    url: 'https://www.jugantor.com',
    hot_level: 'TRENDING',
    sentiment: 'Positive'
  },
  {
    id: 'news-bd-6',
    title: 'জাতীয় গ্রিডে ৫০০ মেগাওয়াট নবায়নযোগ্য সৌরবিদ্যুৎ যুক্ত করার মেগা প্রকল্প অনুমোদন',
    source: 'বণিক বার্তা',
    category: 'Technology & AI',
    url: 'https://bonikbarta.net',
    hot_level: 'TRENDING',
    sentiment: 'Positive'
  }
];

function generateLocalBanglaDebate(story: BangladeshNewsItem): AgentNewsDialogueTurn[] {
  const cat = story.category.toLowerCase();
  const title = story.title;

  if (cat.includes('economy') || cat.includes('trade') || title.includes('ব্যাংক') || title.includes('রিজার্ভ')) {
    return [
      {
        speakerId: 'agent-jarvis',
        speakerName: 'Jarvis',
        color: '#eab308',
        text: `সবাই মনোযোগ দিন, বাংলাদেশ থেকে গুরুত্বপূর্ণ অর্থনৈতিক খবর: "${title}"! চলুন পুরো ডাটা অ্যানালাইসিস করি।`,
        subtext: 'অর্থনৈতিক ডসিয়ার উন্মোচন',
        action: 'BROADCAST'
      },
      {
        speakerId: 'agent-alice',
        speakerName: 'Alice',
        color: '#00e8ff',
        text: 'আমি বাংলাদেশ ব্যাংক ও ডিএসই সূচক যাচাই করছি। রেমিট্যান্স প্রবাহ ও বৈদেশিক রিজার্ভ দ্রুত বৃদ্ধি পাচ্ছে।',
        subtext: 'ফাইন্যান্সিয়াল ডাটা অ্যানালাইসিস',
        action: 'ANALYZE'
      },
      {
        speakerId: 'agent-dave',
        speakerName: 'Dave',
        color: '#f5a524',
        text: 'কৌশলগত দিক থেকে মূল্যস্ফীতি নিয়ন্ত্রণে এলে স্থানীয় ক্ষুদ্র ও মাঝারি শিল্পে নতুন বিনিয়োগের জোয়ার আসবে।',
        subtext: 'পলিসি ও বাণিজ্য কৌশল পর্যালোচনা',
        action: 'STRATEGIZE'
      },
      {
        speakerId: 'agent-bob',
        speakerName: 'Bob',
        color: '#10e890',
        text: 'বাস্তবায়নের জন্য বন্দর কাস্টমস ও সাপ্লাই চেইন লজিস্টিকস সম্পূর্ণ অটোমেটেড করা জরুরি।',
        subtext: 'সাপ্লাই চেইন চেক',
        action: 'OPERATE'
      },
      {
        speakerId: 'agent-carol',
        speakerName: 'Carol',
        color: '#a855f7',
        text: 'আমাদের অতীত ডাটাবেজ অনুযায়ী, এ ধরণের নীতিমালায় দীর্ঘমেয়াদে জাতীয় রাজস্ব উল্লেখযোগ্যভাবে বাড়ে।',
        subtext: 'মেমরি ডাটাবেজ সিঙ্ক',
        action: 'RECALL'
      },
      {
        speakerId: 'agent-mob',
        speakerName: 'Mob',
        color: '#f97316',
        text: 'রিয়েল-টাইম স্ট্রিমিং চ্যানেলে ঢাকা ও চট্টগ্রামের বিজনেস ট্র্যাফিক স্পাইক ৩২০% বৃদ্ধি পেয়েছে!',
        subtext: 'বিগ ডাটা স্ট্রিমিং স্পাইক',
        action: 'METRICS'
      },
      {
        speakerId: 'agent-tuly',
        speakerName: 'Tuly',
        color: '#ec4899',
        text: 'সোশ্যাল মিডিয়া ও তরুণ উদ্যোক্তাদের মধ্যে এ নিয়ে দারুণ আশাবাদ দেখা যাচ্ছে! অসাধারণ পদক্ষেপ।',
        subtext: 'পাবলিক সেন্টিমেন্ট ট্র্যাকিং',
        action: 'OBSERVE'
      },
      {
        speakerId: 'agent-jarvis',
        speakerName: 'Jarvis',
        color: '#eab308',
        text: 'চমৎকার বিশ্লেষণ টিম। সম্পূর্ণ এক্সিকিউটিভ রিপোর্ট সিস্টেমে সংরক্ষিত ও প্রস্তুত।',
        subtext: 'ব্রিফিং সম্পন্ন',
        action: 'CONCLUDE'
      }
    ];
  } else if (cat.includes('politics') || cat.includes('governance') || title.includes('সংস্কার')) {
    return [
      {
        speakerId: 'agent-jarvis',
        speakerName: 'Jarvis',
        color: '#eab308',
        text: `মনোযোগ দিন সবাই, ঢাকা থেকে জাতীয় সংস্কার ও নীতিগত ব্রেকিং নিউজ: "${title}"!`,
        subtext: 'জাতীয় ইন্টেলিজেন্স সক্রিয়',
        action: 'BROADCAST'
      },
      {
        speakerId: 'agent-dave',
        speakerName: 'Dave',
        color: '#f5a524',
        text: 'এই প্রাতিষ্ঠানিক সংস্কার কার্যক্রম প্রশাসনের স্বচ্ছতা ও জনসেবার মান নিশ্চিত করতে দারুণ ভূমিকা রাখবে।',
        subtext: 'প্রাতিষ্ঠানিক নীতি মূল্যায়ন',
        action: 'STRATEGIZE'
      },
      {
        speakerId: 'agent-alice',
        speakerName: 'Alice',
        color: '#00e8ff',
        text: 'আমি সরকারি গেজেট ও নাগরিক অধিকার ফোরামের মতামত ক্রস-চেক করে বিস্তারিত ডাটা ভেরিফাই করেছি।',
        subtext: 'সোর্স ক্রস-ভেরিফিকেশন',
        action: 'ANALYZE'
      },
      {
        speakerId: 'agent-jonson',
        speakerName: 'Jonson',
        color: '#ef4444',
        text: 'জাতীয় ডিজিটাল নেটওয়ার্ক ও প্রশাসনিক সার্ভারে সার্বক্ষণিক নিরাপত্তা নজরদারি নিশ্চিত রয়েছে।',
        subtext: 'সাইবার ডিফেন্স স্বাভাবিক',
        action: 'SECURITY'
      },
      {
        speakerId: 'agent-carol',
        speakerName: 'Carol',
        color: '#a855f7',
        text: 'আইনি অধ্যাদেশ ও রূপরেখার কপিগুলো আমাদের স্থায়ী নলেজ ভল্টে ইনডেক্স করে রাখা হয়েছে।',
        subtext: 'গেজেট সংরক্ষণ',
        action: 'RECALL'
      },
      {
        speakerId: 'agent-tuly',
        speakerName: 'Tuly',
        color: '#ec4899',
        text: 'বিশ্ববিদ্যালয়গুলোর ছাত্রসমাজ ও তরুণদের মধ্যে এটি নিয়ে অত্যন্ত প্রাণবন্ত আলোচনা চলছে!',
        subtext: 'ডিজিটাল মিডিয়া সেন্টিমেন্ট',
        action: 'OBSERVE'
      },
      {
        speakerId: 'agent-jarvis',
        speakerName: 'Jarvis',
        color: '#eab308',
        text: 'আমাদের টিম পরবর্তী অগ্রগতির ওপর নিয়মিত নজর রাখবে।',
        subtext: 'ইন্টেল সিঙ্ক সম্পন্ন',
        action: 'CONCLUDE'
      }
    ];
  } else if (cat.includes('tech') || cat.includes('ai') || title.includes('প্রযুক্তি') || title.includes('স্টার্টআপ')) {
    return [
      {
        speakerId: 'agent-jarvis',
        speakerName: 'Jarvis',
        color: '#eab308',
        text: `বাংলাদেশের তথ্যপ্রযুক্তি খাতের জন্য দারুণ সুসংবাদ: "${title}"! চলুন বিস্তারিত দেখি।`,
        subtext: 'টেক ম্যাট্রিক্স ইনজেশন',
        action: 'BROADCAST'
      },
      {
        speakerId: 'agent-alice',
        speakerName: 'Alice',
        color: '#00e8ff',
        text: 'এতে বাংলাদেশি সফটওয়্যার ডেভেলপার ও এআই গবেষকদের আন্তর্জাতিক পরিমণ্ডলে বড় কর্মসংস্থান সৃষ্টি হবে।',
        subtext: 'গবেষণা ও প্রতিভা বিশ্লেষণ',
        action: 'ANALYZE'
      },
      {
        speakerId: 'agent-bob',
        speakerName: 'Bob',
        color: '#10e890',
        text: 'হাইটেক পার্ক ও স্থানীয় ডাটা সেন্টারে ক্লাউড পাইপলাইন স্কেলিং করার এখনই সেরা সময়।',
        subtext: 'ইনফ্রাস্ট্রাকচার স্কেলিং',
        action: 'OPERATE'
      },
      {
        speakerId: 'agent-knox',
        speakerName: 'Knox',
        color: '#10b981',
        text: 'দক্ষিণ এশিয়া ক্লাউড হাবের সাথে এপিআই লেটেন্সি মাত্র ১৫ms এ অপ্টিমাইজ করা হয়েছে!',
        subtext: 'ক্লাউড লেটেন্সি গ্রিন',
        action: 'DEVOPS'
      },
      {
        speakerId: 'agent-tuly',
        speakerName: 'Tuly',
        color: '#ec4899',
        text: 'আমাদের ঢাকা ও চট্টগ্রামের ইউআই/ইউএক্স ডিজাইনাররা বিশ্বমানের সব প্রডাক্ট ডিজাইন করছে!',
        subtext: 'ডিজাইন কমিউনিটি ইনসাইট',
        action: 'OBSERVE'
      },
      {
        speakerId: 'agent-jarvis',
        speakerName: 'Jarvis',
        color: '#eab308',
        text: 'সব সিস্টেম গ্রিন। বাংলাদেশের তথ্যপ্রযুক্তি খাতের এই অগ্রগতি আন্তর্জাতিকভাবে প্রশংসনীয়।',
        subtext: 'টেক ব্রিফিং সম্পন্ন',
        action: 'CONCLUDE'
      }
    ];
  } else {
    return [
      {
        speakerId: 'agent-jarvis',
        speakerName: 'Jarvis',
        color: '#eab308',
        text: `টিম, বাংলাদেশ থেকে গুরুত্বপূর্ণ আপডেট: "${title}"।`,
        subtext: 'জাতীয় সংবাদ পর্যালোচনা',
        action: 'BROADCAST'
      },
      {
        speakerId: 'agent-alice',
        speakerName: 'Alice',
        color: '#00e8ff',
        text: 'ঢাকা, চট্টগ্রাম ও সিলেট ব্যুরোর সমস্ত রিপোর্ট বিশ্লেষণ করে সমন্বিত ডাটা প্রস্তুত করা হয়েছে।',
        subtext: 'জেলা ভিত্তিক ডাটা সিন্থেসিস',
        action: 'ANALYZE'
      },
      {
        speakerId: 'agent-dave',
        speakerName: 'Dave',
        color: '#f5a524',
        text: 'নাগরিক সেবা ও সামগ্রিক উন্নয়নের লক্ষ্যে এই পদক্ষেপ অত্যন্ত সময়োপযোগী।',
        subtext: 'কর্মপরিকল্পনা প্রস্তুত',
        action: 'STRATEGIZE'
      },
      {
        speakerId: 'agent-tuly',
        speakerName: 'Tuly',
        color: '#ec4899',
        text: 'জনগণের মাঝে এ নিয়ে ব্যাপক উদ্দীপনা দেখা যাচ্ছে।',
        subtext: 'পাবলিক পালস ট্র্যাকিং',
        action: 'OBSERVE'
      },
      {
        speakerId: 'agent-jarvis',
        speakerName: 'Jarvis',
        color: '#eab308',
        text: 'টিম এজেন্ট টাউন সার্বক্ষণিক আপডেট বজায় রাখবে।',
        subtext: 'পর্যবেক্ষণ সক্রিয়',
        action: 'CONCLUDE'
      }
    ];
  }
}

class BangladeshNewsService {
  private stories: BangladeshNewsItem[] = [...BANGLA_FALLBACK_STORIES];
  private activeDebate: ActiveNewsDebateSession | null = null;
  private listeners: Set<NewsListener> = new Set();
  private isLoading: boolean = false;
  private autoRefreshTimer: any = null;
  private autoDebateSchedulerTimer: any = null;
  private debateTurnTimer: any = null;
  private currentDebateStoryIndex: number = 0;

  constructor() {
    this.initService();
  }

  private async initService() {
    await this.refreshNews();

    // Auto-refresh news every 2.5 minutes
    this.autoRefreshTimer = setInterval(() => {
      this.refreshNews(false);
    }, 150000);

    // Autonomous Periodic News Debate Trigger (every 65-80 seconds)
    this.autoDebateSchedulerTimer = setInterval(() => {
      this.triggerAutonomousNewsDebate();
    }, 70000);
  }

  public subscribe(listener: NewsListener): () => void {
    this.listeners.add(listener);
    listener(this.stories, this.activeDebate, this.isLoading);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) {
      l(this.stories, this.activeDebate, this.isLoading);
    }
  }

  public getStories(): BangladeshNewsItem[] {
    return this.stories;
  }

  public getActiveDebate(): ActiveNewsDebateSession | null {
    return this.activeDebate;
  }

  public async refreshNews(force: boolean = false): Promise<BangladeshNewsItem[]> {
    this.isLoading = true;
    this.notify();
    try {
      const res = await fetchBangladeshNewsApi(10, force);
      if (res && res.stories && res.stories.length > 0) {
        this.stories = res.stories;
      }
    } catch (err) {
      console.warn('[BangladeshNewsService] Using Bangla news collection fallback');
      if (!this.stories || this.stories.length === 0) {
        this.stories = [...BANGLA_FALLBACK_STORIES];
      }
    } finally {
      this.isLoading = false;
      this.notify();
    }
    return this.stories;
  }

  /**
   * Autonomously picks a news headline and gathers agents for a Bengali debate
   */
  public triggerAutonomousNewsDebate() {
    if (this.activeDebate && !this.activeDebate.isComplete) {
      return; // A debate is already in progress
    }

    if (this.stories.length === 0) return;

    this.currentDebateStoryIndex = (this.currentDebateStoryIndex + 1) % this.stories.length;
    const story = this.stories[this.currentDebateStoryIndex];
    this.launchAgentOfficeDebate(story);
  }

  /**
   * Triggers a live multi-agent office debate on a specific news headline in Bangla.
   */
  public async launchAgentOfficeDebate(story: BangladeshNewsItem): Promise<ActiveNewsDebateSession | null> {
    if (this.debateTurnTimer) {
      clearTimeout(this.debateTurnTimer);
    }

    let dialogueTurns: AgentNewsDialogueTurn[] = [];
    let summary = `বাংলাদেশ ব্রেকিং নিউজ "${story.title}" নিয়ে এজেন্ট টাউনের বিশ্লেষণ সম্পন্ন।`;

    try {
      const analysis: BangladeshNewsAnalysisResponse = await analyzeBangladeshNewsStoryApi(
        story.title,
        story.category
      );
      if (analysis && analysis.dialogue_script && analysis.dialogue_script.length > 0) {
        dialogueTurns = analysis.dialogue_script;
        summary = analysis.executive_summary || summary;
      } else {
        dialogueTurns = generateLocalBanglaDebate(story);
      }
    } catch (err) {
      dialogueTurns = generateLocalBanglaDebate(story);
    }

    const session: ActiveNewsDebateSession = {
      sessionId: `debate_${Date.now()}`,
      storyTitle: story.title,
      category: story.category,
      startedAt: Date.now(),
      currentTurnIndex: 0,
      totalTurns: dialogueTurns.length,
      turns: dialogueTurns,
      activeSpeaker: dialogueTurns[0] || null,
      executiveSummary: summary,
      isComplete: false
    };

    this.activeDebate = session;
    this.notify();

    // Log to agent activity feed
    agentActivityFeed.logEvent({
      agentId: 'agent-jarvis',
      agentName: 'Jarvis',
      agentColor: '#eab308',
      eventType: 'AGENT_COMMUNICATION',
      title: `🇧🇩 বাংলাদেশ ব্রেকিং নিউজ আলোচনা`,
      description: `টিম সেন্ট্রাল প্লাজায় আলোচনা করছে: "${story.title}"`
    });

    // Sound chime when debate starts
    soundFx.playChime();

    // Progress through turns with realistic pauses
    this.scheduleNextTurn(0);

    return session;
  }

  private scheduleNextTurn(index: number) {
    if (!this.activeDebate || index >= this.activeDebate.turns.length) {
      if (this.activeDebate) {
        this.activeDebate.isComplete = true;
        this.activeDebate.activeSpeaker = null;
        this.notify();
      }
      return;
    }

    const currentTurn = this.activeDebate.turns[index];
    this.activeDebate.currentTurnIndex = index;
    this.activeDebate.activeSpeaker = currentTurn;
    this.notify();

    // Log dialogue event to activity feed
    agentActivityFeed.logEvent({
      agentId: currentTurn.speakerId,
      agentName: currentTurn.speakerName,
      agentColor: currentTurn.color,
      eventType: 'AGENT_COMMUNICATION',
      title: `${currentTurn.speakerName} (${currentTurn.subtext || 'মতামত'})`,
      description: currentTurn.text
    });

    // Realistic human cadence: 4 seconds per statement for comfortable reading of Bangla text
    const delay = 4000;
    this.debateTurnTimer = setTimeout(() => {
      this.scheduleNextTurn(index + 1);
    }, delay);
  }

  public stopActiveDebate() {
    if (this.debateTurnTimer) {
      clearTimeout(this.debateTurnTimer);
    }
    this.activeDebate = null;
    this.notify();
  }
}

export const bangladeshNewsService = new BangladeshNewsService();
