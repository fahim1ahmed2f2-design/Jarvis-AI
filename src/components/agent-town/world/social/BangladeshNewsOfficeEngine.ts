import { bangladeshNewsService, ActiveNewsDebateSession } from '../../bangladeshNewsService';
import { PIXEL_DESKS } from '../pixel/PixelOfficeData';

export interface BDNewsDialogueBubble {
  id: string;
  speakerId: string;
  speakerName: string;
  color: string;
  text: string;
  subtext?: string;
  category: string;
  storyTitle: string;
  position: { x: number; y: number };
  expiresAt: number;
  turnIndex: number;
  totalTurns: number;
}

type BDNewsListener = (
  activeBubble: BDNewsDialogueBubble | null,
  activeDebate: ActiveNewsDebateSession | null
) => void;

class BangladeshNewsOfficeEngine {
  private activeBubble: BDNewsDialogueBubble | null = null;
  private activeDebate: ActiveNewsDebateSession | null = null;
  private listeners: Set<BDNewsListener> = new Set();
  private unsubscribeNews: (() => void) | null = null;

  constructor() {
    this.init();
  }

  private init() {
    this.unsubscribeNews = bangladeshNewsService.subscribe((_stories, debate, _loading) => {
      this.activeDebate = debate;
      if (debate && debate.activeSpeaker && !debate.isComplete) {
        const spk = debate.activeSpeaker;
        const desk = PIXEL_DESKS[spk.speakerId];
        const basePos = desk ? { x: desk.x, y: desk.y } : { x: 800, y: 760 };

        this.activeBubble = {
          id: `bd_bubble_${debate.sessionId}_${debate.currentTurnIndex}`,
          speakerId: spk.speakerId,
          speakerName: spk.speakerName,
          color: spk.color || '#00e8ff',
          text: spk.text,
          subtext: spk.subtext,
          category: debate.category,
          storyTitle: debate.storyTitle,
          position: { ...basePos },
          expiresAt: Date.now() + 3800,
          turnIndex: debate.currentTurnIndex + 1,
          totalTurns: debate.totalTurns
        };
      } else {
        this.activeBubble = null;
      }
      this.notify();
    });
  }

  public subscribe(listener: BDNewsListener): () => void {
    this.listeners.add(listener);
    listener(this.activeBubble, this.activeDebate);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) {
      l(this.activeBubble, this.activeDebate);
    }
  }

  public getActiveBubble(): BDNewsDialogueBubble | null {
    if (this.activeBubble && this.activeBubble.expiresAt < Date.now()) {
      this.activeBubble = null;
    }
    return this.activeBubble;
  }

  public getActiveDebate(): ActiveNewsDebateSession | null {
    return this.activeDebate;
  }

  public cleanup() {
    if (this.unsubscribeNews) {
      this.unsubscribeNews();
    }
    this.listeners.clear();
  }
}

export const bdNewsOfficeEngine = new BangladeshNewsOfficeEngine();
