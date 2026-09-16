/**
 * JARVIS Agent Town — Autonomous Living Office Life Engine
 * 
 * Manages 9 agents:
 * - Sitting & working at assigned desks with typing animations
 * - Autonomously getting up to walk to Central Plaza (Cafeteria / Water Cooler / Fountain)
 * - Meeting teammates for spontaneous dynamic office dialogue & speech bubbles
 * - Walking back to their dedicated rooms and resuming work tasks
 */

import { PIXEL_DESKS } from '../pixel/PixelOfficeData';

export interface OfficeDialogueBubble {
  id: string;
  speakerId: string;
  speakerName: string;
  color: string;
  text: string;
  position: { x: number; y: number };
  expiresAt: number;
}

export interface AutonomousAgentState {
  agentId: string;
  currentPos: { x: number; y: number };
  deskPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  facing: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
  isWalking: boolean;
  isSitting: boolean;
  actionState: 'WORKING_AT_DESK' | 'WALKING_TO_SPOT' | 'CHATTING' | 'AT_CAFETERIA' | 'RETURNING_HOME';
  partnerId: string | null;
  nextDecisionTime: number;
}

const COMMON_OFFICE_SPOTS = [
  { name: 'Cafeteria Coffee Bar', pos: { x: 640, y: 460 } },
  { name: 'Water Cooler 1', pos: { x: 750, y: 460 } },
  { name: 'Water Cooler 2', pos: { x: 890, y: 460 } },
  { name: 'Central Fountain Lounge', pos: { x: 800, y: 760 } },
  { name: 'Plaza South Couch', pos: { x: 650, y: 980 } },
  { name: 'Plaza East Couch', pos: { x: 950, y: 980 } }
];

const OFFICE_DIALOGUES: Record<string, string[]> = {
  'agent-jarvis': [
    'সব ডিপার্টমেন্টের নিউরাল সিনক্রোনাইজেশন পর্যবেক্ষণ করছি... সব সিস্টেম গ্রিন।',
    'আজকের কাজের গতি অত্যন্ত প্রশংসনীয়। প্রায়োরিটি রুট বজায় রাখুন।',
    'ক্যাম্পাস নিরাপত্তা ও ডাটা অখণ্ডতা ১০০% নিশ্চিত করা হয়েছে।',
    'চলুন মাল্টি-এজেন্ট প্রজেক্টের পরবর্তী মাইলস্টোন পর্যালোচনা করি।'
  ],
  'agent-alice': [
    'রিসার্চ ল্যাবে অ্যালগরিদম ও ডাটার পারস্পরিক সম্পর্ক বিশ্লেষণ করছি।',
    'হাইপোথিসিস ভেরিফাই করা হয়েছে, নলেজ সিন্থেসিস প্রস্তুত।',
    'বাংলাদেশ ও আন্তর্জাতিক একাধিক সোর্সের ডাটা মিলিয়ে দেখছি।',
    'নিউরাল ক্লাস্টারে নতুন বেঞ্চমার্ক টেস্ট সফল হয়েছে।'
  ],
  'agent-bob': [
    'ব্যাকগ্রাউন্ড টাস্ক এক্সিকিউটর রিফ্যাক্টরিং করছি, লেটেন্সি অনেক কমেছে।',
    'টুল পারমিশন পলিসি ও স্যান্ডবক্স আইসোলেশন চেক করে নিলাম।',
    'পরবর্তী ব্যাচ অটোমেশন চালানোর আগে ছোট্ট একটা কফির বিরতি!',
    'সব ব্যাকগ্রাউন্ড ডেমন একদম মসৃণভাবে চলছে।'
  ],
  'agent-carol': [
    'নতুন নলেজ ডাটাবেজে পারসিস্টেন্ট মেমরি হিসেবে ক্যাটালগ করছি।',
    'আর্কাইভ থেকে অতীত সেশনের প্রাসঙ্গিক কনটেক্সট বের করে নিলাম।',
    'লাইব্রেরির ভেক্টর ইনডেক্সিং সম্পূর্ণ হলো, কোনো ডাটা লস হয়নি।',
    'সিমান্টিক মেমরির গ্রাফ নোডগুলো সুন্দরভাবে গুছিয়ে রেখেছি।'
  ],
  'agent-dave': [
    'সব রুমের কাজের সমন্বয় ও ডিপেনডেন্সি ট্র্যাক করছি।',
    'পরবর্তী স্প্রিন্টের জন্য ওয়ার-রুম স্ট্র্যাটেজি সেশন প্রস্তুত।',
    'টাস্ক ডিকম্পোজিশন গেটগুলো ঠিকঠাক এলাইন করা হয়েছে।',
    'টিমের সামগ্রিক পারফরম্যান্স ও রোডম্যাপ চেক করে নিচ্ছি।'
  ],
  'agent-tuly': [
    'চমৎকার নিয়ন গ্লাস মরফিজম ইউআই ডিজাইন বানাচ্ছি!',
    'আমাদের নতুন কালার প্যালেটটা কেমন লাগছে সবার?',
    'স্মুথ ট্রানজিশন ও মাইক্রো-অ্যানিমেশন পলিশ করছি।',
    'ক্রিয়েটিভ স্টুডিওতে হাই-রেজুলেশন ভিজ্যুয়াল এসেট ড্রাফট করা শেষ।'
  ],
  'agent-jonson': [
    'পেরিমিটার সিকিউরিটি স্ক্যান সম্পন্ন। কোনো থ্রেট ভেক্টর নেই।',
    'অভ্যন্তরীণ সাবনেটে ফায়ারওয়াল রুলস আরও কঠোর করা হয়েছে।',
    'ইনগ্রেস এনক্রিপশন কি এবং অথরাইজেশন টোকেন অডিট করছি।',
    'সাইবার থ্রেট রেসপন্স প্রটোকল সার্বক্ষণিক সক্রিয় আছে।'
  ],
  'agent-mob': [
    'ইটিএল স্ট্রিমিং পাইপলাইনে প্রতি সেকেন্ডে ৬৫ হাজার ইভেন্ট প্রসেস হচ্ছে!',
    'রেডিস ডিসট্রিবিউটেড ক্যাশ বাফার অপ্টিমাইজ করে নিয়েছি।',
    'হাই-থ্রুপুট অ্যানালিটিক্স স্ট্রিম একদম স্টেবল ও ফাস্ট।',
    'বিগ ডাটা পাইপলাইনগুলো আল্ট্রা-লো লেটেন্সিতে রান করছে।'
  ],
  'agent-knox': [
    'কুবারনেটিস পডগুলো মাল্টিপল রিজিয়নে ব্যালেন্স করা হয়েছে।',
    'ক্লাউড কনটেইনার হেলথ প্রোব ৯৯.৯৯% আপটাইম রিপোর্ট করছে।',
    'ইনফ্রাস্ট্রাকচার-অ্যাজ-কোড ডিপ্লয়মেন্ট কোনো সমস্যা ছাড়াই সম্পন্ন।',
    'ক্লাউড মেইনফ্রেম সার্ভারগুলো পারফেক্টলি সিঙ্কড রয়েছে।'
  ]
};

type OfficeLifeListener = (
  agentStates: Record<string, AutonomousAgentState>,
  activeDialogues: OfficeDialogueBubble[]
) => void;

class AutonomousOfficeLifeEngine {
  private agentStates: Record<string, AutonomousAgentState> = {};
  private activeDialogues: OfficeDialogueBubble[] = [];
  private listeners: Set<OfficeLifeListener> = new Set();
  private animationFrameId: number | null = null;
  private lastUpdate: number = Date.now();

  constructor() {
    this.initializeAgents();
    this.startEngine();
  }

  private initializeAgents() {
    for (const [id, desk] of Object.entries(PIXEL_DESKS)) {
      this.agentStates[id] = {
        agentId: id,
        currentPos: { x: desk.x, y: desk.y },
        deskPos: { x: desk.x, y: desk.y },
        targetPos: { x: desk.x, y: desk.y },
        facing: desk.facing,
        isWalking: false,
        isSitting: true,
        actionState: 'WORKING_AT_DESK',
        partnerId: null,
        nextDecisionTime: Date.now() + 4000 + Math.random() * 8000
      };
    }
  }

  public subscribe(listener: OfficeLifeListener): () => void {
    this.listeners.add(listener);
    listener(this.agentStates, this.activeDialogues);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) {
      l(this.agentStates, this.activeDialogues);
    }
  }

  private startEngine() {
    const loop = () => {
      const now = Date.now();
      const dt = Math.min((now - this.lastUpdate) / 1000, 0.1);
      this.lastUpdate = now;

      this.updateSimulation(now, dt);
      this.notify();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private updateSimulation(now: number, dt: number) {
    // 1. Clean expired dialogue bubbles
    this.activeDialogues = this.activeDialogues.filter((d) => d.expiresAt > now);

    // 2. Update each agent state
    const agentIds = Object.keys(this.agentStates);

    for (const id of agentIds) {
      const agent = this.agentStates[id];

      // Time to make a new decision?
      if (now >= agent.nextDecisionTime) {
        this.makeDecisionForAgent(agent, now, agentIds);
      }

      // Move toward target if walking
      if (agent.isWalking) {
        const dx = agent.targetPos.x - agent.currentPos.x;
        const dy = agent.targetPos.y - agent.currentPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const speed = 75; // pixels per second
        const moveDist = speed * dt;

        if (dist <= moveDist || dist < 4) {
          // Arrived at destination
          agent.currentPos = { ...agent.targetPos };
          agent.isWalking = false;

          if (agent.actionState === 'RETURNING_HOME') {
            agent.actionState = 'WORKING_AT_DESK';
            agent.isSitting = true;
            agent.facing = PIXEL_DESKS[id]?.facing || 'DOWN';
            agent.nextDecisionTime = now + 8000 + Math.random() * 12000;
          } else if (agent.actionState === 'WALKING_TO_SPOT') {
            agent.actionState = 'AT_CAFETERIA';
            agent.isSitting = false;
            agent.nextDecisionTime = now + 5000 + Math.random() * 6000;
            this.spawnRandomDialogue(id, agent.currentPos, now);
          }
        } else {
          // Step towards target
          agent.currentPos.x += (dx / dist) * moveDist;
          agent.currentPos.y += (dy / dist) * moveDist;

          // Update facing direction
          if (Math.abs(dx) > Math.abs(dy)) {
            agent.facing = dx > 0 ? 'RIGHT' : 'LEFT';
          } else {
            agent.facing = dy > 0 ? 'DOWN' : 'UP';
          }
        }
      }
    }
  }

  private makeDecisionForAgent(agent: AutonomousAgentState, now: number, allIds: string[]) {
    if (agent.actionState === 'WORKING_AT_DESK') {
      // 40% chance: walk to central plaza / cafeteria / water cooler
      // 30% chance: walk to visit a teammate
      // 30% chance: keep working at desk
      const roll = Math.random();

      if (roll < 0.40) {
        // Go to common spot
        const spot = COMMON_OFFICE_SPOTS[Math.floor(Math.random() * COMMON_OFFICE_SPOTS.length)];
        agent.targetPos = { ...spot.pos };
        agent.isWalking = true;
        agent.isSitting = false;
        agent.actionState = 'WALKING_TO_SPOT';
        agent.nextDecisionTime = now + 20000;
      } else if (roll < 0.70) {
        // Visit another agent
        const otherIds = allIds.filter((o) => o !== agent.agentId);
        const targetId = otherIds[Math.floor(Math.random() * otherIds.length)];
        const targetDesk = PIXEL_DESKS[targetId];
        if (targetDesk) {
          agent.targetPos = { x: targetDesk.x + (Math.random() > 0.5 ? 40 : -40), y: targetDesk.y + 20 };
          agent.isWalking = true;
          agent.isSitting = false;
          agent.actionState = 'WALKING_TO_SPOT';
          agent.nextDecisionTime = now + 20000;
        }
      } else {
        // Keep working at desk
        agent.nextDecisionTime = now + 6000 + Math.random() * 8000;
      }
    } else if (agent.actionState === 'AT_CAFETERIA' || agent.actionState === 'CHATTING') {
      // Done socializing -> walk back home to desk
      agent.targetPos = { ...agent.deskPos };
      agent.isWalking = true;
      agent.isSitting = false;
      agent.actionState = 'RETURNING_HOME';
      agent.nextDecisionTime = now + 20000;
    }
  }

  private spawnRandomDialogue(agentId: string, pos: { x: number; y: number }, now: number) {
    const list = OFFICE_DIALOGUES[agentId] || ['Operating smoothly.'];
    const text = list[Math.floor(Math.random() * list.length)];
    const desk = PIXEL_DESKS[agentId];

    this.activeDialogues.push({
      id: `diag_${now}_${agentId}`,
      speakerId: agentId,
      speakerName: desk?.agentName || 'Agent',
      color: desk?.screenColor || '#00e8ff',
      text,
      position: { ...pos },
      expiresAt: now + 3500
    });
  }
}

export const autonomousOfficeEngine = new AutonomousOfficeLifeEngine();
