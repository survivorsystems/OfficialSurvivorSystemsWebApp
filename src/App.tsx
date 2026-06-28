import { type CSSProperties, type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  Compass,
  FileText,
  Map,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import denialSupportOne from "./assets/support/denial-support-1.png";
import denialSupportTwo from "./assets/support/denial-support-2.png";
import GoBagSimulator from "./GoBagSimulator";

type ModuleKey =
  | "home"
  | "am-i-crazy"
  | "go-bag-prep"
  | "planning"
  | "leaving"
  | "rebuilding"
  | "local-help"
  | "legal";

type AssessmentAnswer = {
  id: string;
  label: string;
  responseTitle: string;
  response: string;
  pattern?: string;
  safetyFocused?: boolean;
};

type AssessmentQuestion = {
  prompt: string;
  answers: AssessmentAnswer[];
};

type GaugeValue = {
  label: string;
  value: number;
  lowLabel: string;
  highLabel: string;
  state: string;
  tone: "cyan" | "pink" | "purple" | "amber";
};

type ControlPanelState = {
  emphasis: string | null;
  gauges: GaugeValue[];
  notice: string;
};

type AssessmentGauges = {
  autonomy: number;
  danger: number;
  reality: number;
  dangerFloor: number;
};

type AssessmentGaugeEffect = {
  autonomy: number;
  danger: number;
  reality: number;
  emphasis: keyof Omit<AssessmentGauges, "dangerFloor">;
  notice: string;
  minDanger?: number;
};

type ExitGaugeState = {
  readiness: number;
  exposure: number;
  backup: number;
  exposureFloor: number;
};

type ExitGaugeEffect = {
  readiness: number;
  exposure: number;
  backup: number;
  emphasis: keyof Omit<ExitGaugeState, "exposureFloor">;
  notice: string;
  minExposure?: number;
};

type ExitAnswer = {
  id: string;
  label: string;
  responseTitle: string;
  response: string;
  effect: ExitGaugeEffect;
};

type ExitQuestion = {
  phase: string;
  prompt: string;
  answers: ExitAnswer[];
};

type LeavingLadderRung = {
  id: string;
  title: string;
  premise: string;
  systemResponse: string;
  suggestedAction: string;
  effect: {
    clarity: number;
    preparedness: number;
    reality: number;
    options: number;
    emphasis: string;
    notice: string;
  };
};

const modulePages: Record<
  Exclude<ModuleKey, "home" | "am-i-crazy" | "go-bag-prep">,
  {
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  planning: {
    eyebrow: "Planning resources",
    title: "Planning",
    description:
      "This page will hold safety planning tools, document checklists, contact worksheets, and preparation resources.",
  },
  leaving: {
    eyebrow: "Leaving resources",
    title: "Leaving",
    description:
      "This page will hold go-bag resources, device safety reminders, transportation planning, and immediate support links.",
  },
  rebuilding: {
    eyebrow: "Rebuilding resources",
    title: "Rebuilding",
    description:
      "This page will hold housing, legal, money, support network, and stabilization resources for the next chapter.",
  },
  "local-help": {
    eyebrow: "Local support",
    title: "Find Local Help",
    description: "This page will hold links and tools for finding survivor-centered support in your area.",
  },
  legal: {
    eyebrow: "Legal basics",
    title: "Legal",
    description:
      "This page will hold plain-language legal rights resources, document checklists, and next-step guides.",
  },
};

const navItems: Array<{ key: ModuleKey; label: string; path: string }> = [
  { key: "home", label: "Home", path: "/" },
  { key: "am-i-crazy", label: "Am I Crazy", path: "/am-i-crazy" },
  { key: "go-bag-prep", label: "Go-Bag Prep", path: "/go-bag-prep" },
  { key: "planning", label: "Planning", path: "/planning" },
  { key: "leaving", label: "Leaving", path: "/leaving" },
  { key: "rebuilding", label: "Rebuilding", path: "/rebuilding" },
  { key: "local-help", label: "Find Local Help", path: "/local-help" },
  { key: "legal", label: "Legal", path: "/legal" },
];

function navItemFor(key: ModuleKey) {
  return navItems.find((item) => item.key === key) ?? navItems[0];
}

const assessmentQuestions: AssessmentQuestion[] = [
  {
    prompt:
      "When you tell this person that something they did hurt, frightened, or upset you, what usually happens?",
    answers: [
      {
        id: "1a",
        label: "They listen, take me seriously, and try to understand.",
        responseTitle: "ALL SYSTEMS CLEAR",
        response:
          "Concern submitted. Concern acknowledged. No reality rewrite, punishment sequence, or personality trial detected. Healthy conflict protocol appears functional.",
      },
      {
        id: "1b",
        label: "They say it never happened or that I misunderstood.",
        responseTitle: "GASLIGHTING DETECTED",
        response:
          "Your lived experience has been submitted for unauthorized deletion. They do not receive administrator privileges over your memory simply because the facts are inconvenient.",
        pattern: "Gaslighting or reality rewriting",
      },
      {
        id: "1c",
        label: "They say I am too sensitive, dramatic, or crazy.",
        responseTitle: "REACTION DEFLECTION DETECTED",
        response:
          "Your response has been placed on trial while their behavior quietly exits through a side door. Too sensitive is not troubleshooting. It is avoidance wearing a cheap disguise.",
        pattern: "Reaction deflection",
      },
      {
        id: "1d",
        label: "The conversation becomes an investigation into everything I have ever done wrong.",
        responseTitle: "BLAME REDIRECTION ACTIVE",
        response:
          "One concern entered. Your entire personality archive was returned. Accountability has been rerouted away from the source.",
        pattern: "Blame redirection",
      },
      {
        id: "1e",
        label: "They become angry, threatening, or punish me later.",
        responseTitle: "RETALIATION PROTOCOL DETECTED",
        response:
          "Humor suspended. When honesty triggers threats, punishment, or fear, safe communication conditions are unavailable.",
        pattern: "Retaliation or threat response",
        safetyFocused: true,
      },
    ],
  },
  {
    prompt: "Do you change your behavior because you are trying to prevent their reaction?",
    answers: [
      {
        id: "2a",
        label: "Rarely. I generally feel free to make ordinary choices.",
        responseTitle: "AUTONOMY ONLINE",
        response:
          "Ordinary decisions do not require permission, advance warning, or consultation with the Threat Forecasting Department. Personal choice appears operational.",
      },
      {
        id: "2b",
        label: "Sometimes, mainly during specific disagreements.",
        responseTitle: "NORMAL CONFLICT LOAD",
        response:
          "Some adjustment detected. Current level may be ordinary compromise, provided it does not begin consuming the rest of your operating system.",
      },
      {
        id: "2c",
        label: "Often. I calculate how they might react before I do ordinary things.",
        responseTitle: "REACTION-PREDICTION SOFTWARE RUNNING",
        response:
          "Your brain is calculating another person's response before ordinary actions. That may be a survival adaptation, not evidence that you are overthinking.",
        pattern: "Reaction prediction",
      },
      {
        id: "2d",
        label: "Almost constantly. I feel like I am navigating an emotional minefield.",
        responseTitle: "BACKGROUND THREAT SCAN: CONSTANT",
        response:
          "System resources are being redirected toward preventing another person's reaction. Walking on eggshells is continuous threat management, not a quirky relationship dynamic.",
        pattern: "Constant threat management",
        safetyFocused: true,
      },
    ],
  },
  {
    prompt: "When something goes wrong, who usually ends up taking responsibility?",
    answers: [
      {
        id: "3a",
        label: "We both take responsibility when appropriate.",
        responseTitle: "ACCOUNTABILITY MODULE ONLINE",
        response:
          "Both parties can acknowledge impact without crashing, retaliating, or launching counterclaims. Repair capacity detected.",
      },
      {
        id: "3b",
        label: "Usually me, even when I raised the original concern.",
        responseTitle: "BLAME REVERSAL DETECTED",
        response: "You reported the malfunction. You were assigned responsibility for causing the malfunction. Logic failure confirmed.",
        pattern: "Blame reversal",
      },
      {
        id: "3c",
        label: "They apologize, but the same behavior keeps happening.",
        responseTitle: "APOLOGY RECEIVED - UPDATE NOT INSTALLED",
        response:
          "Correct words detected. Behavioral patch missing. System will not classify repeated apologies as change without performance updates.",
        pattern: "Repeated apology without change",
      },
      {
        id: "3d",
        label: "The conversation becomes so confusing that the original issue disappears.",
        responseTitle: "CHAOS INJECTION DETECTED",
        response:
          "Original concern entered. Conversation expanded, fragmented, looped, and expired without resolution. Accountability escaped through excessive confusion.",
        pattern: "Confusion blocking accountability",
      },
    ],
  },
  {
    prompt: "How safe do you feel disagreeing with them or saying no?",
    answers: [
      {
        id: "4a",
        label: "Safe. They may disagree, but they respect my answer.",
        responseTitle: "BOUNDARY SYSTEM FUNCTIONING",
        response: "Disagreement detected. Override attempt not detected. Your right to make a decision remains intact.",
      },
      {
        id: "4b",
        label: "Uncomfortable, but not afraid.",
        responseTitle: "MINOR CONFLICT LOAD",
        response:
          "Discomfort is not automatically danger. System recommends checking whether the tension comes from disagreement or anticipation of consequences.",
      },
      {
        id: "4c",
        label: "I carefully manage my words, tone, timing, and expression.",
        responseTitle: "MESSAGE DELIVERY REQUIRES 47 SAFETY CHECKS",
        response:
          "Tone calibrated. Timing optimized. Face neutralized. Vocabulary softened beyond recognition. Receiving system appears unstable.",
        pattern: "Careful self-editing for safety",
      },
      {
        id: "4d",
        label: "They pressure, guilt, punish, or wear me down until I give in.",
        responseTitle: "BATTERY-DRAIN OVERRIDE ATTEMPT",
        response: "Pressure continues until resistance shuts down. Exhaustion is not consent. Surrender is not mutual agreement.",
        pattern: "Pressure or coercive override",
      },
      {
        id: "4e",
        label: "I am afraid of what they might do.",
        responseTitle: "FEAR RESPONSE ACTIVATED",
        response:
          "Humor suspended. Fear changes whether silence, agreement, cooperation, and consent are genuinely voluntary. Signal is valid.",
        pattern: "Fear response",
        safetyFocused: true,
      },
    ],
  },
  {
    prompt: "Has your world become smaller since this relationship began?",
    answers: [
      {
        id: "5a",
        label: "No. I still have access to my people, interests, privacy, and choices.",
        responseTitle: "EXTERNAL CONNECTIONS ONLINE",
        response:
          "Friends, interests, identity, and independent choices remain available. Relationship has not consumed the full operating system.",
      },
      {
        id: "5b",
        label: "Some parts of my life faded, but I am not sure how.",
        responseTitle: "LIFE CONTRACTION DETECTED",
        response:
          "No dramatic shutdown found. Loss appears gradual: one cancelled plan, abandoned interest, or exhausting argument at a time.",
        pattern: "Gradual life contraction",
      },
      {
        id: "5c",
        label: "They create conflict around friends, family, work, or hobbies.",
        responseTitle: "ISOLATION SEQUENCE RUNNING",
        response: "Outside connection detected. Conflict automatically generated. Independence is being made expensive.",
        pattern: "Isolation sequence",
      },
      {
        id: "5d",
        label: "I feel isolated and increasingly dependent on them.",
        responseTitle: "SUPPORT NETWORK SEVERELY RESTRICTED",
        response:
          "Perspective, resources, and alternatives are increasingly offline. One person's version of reality now holds elevated permissions. Convenient for them. Catastrophic for user clarity.",
        pattern: "Restricted support network",
      },
    ],
  },
  {
    prompt: "How much control do you have over money, transportation, communication, and everyday resources?",
    answers: [
      {
        id: "6a",
        label: "I have meaningful access and can make ordinary decisions.",
        responseTitle: "RESOURCE ACCESS ONLINE",
        response:
          "User can meet ordinary needs without requesting authorization from the Department of Absolutely Not Their Business.",
      },
      {
        id: "6b",
        label: "Access is shared fairly.",
        responseTitle: "SHARED ACCESS VERIFIED",
        response: "Information, resources, and decision-making appear mutually available. Shared system functioning as advertised.",
      },
      {
        id: "6c",
        label: "They question, monitor, or criticize how I use resources.",
        responseTitle: "RESOURCE SURVEILLANCE DETECTED",
        response:
          "Routine action submitted. Budget hearing and character evaluation unexpectedly attached. Control may be masquerading as responsibility.",
        pattern: "Resource surveillance",
      },
      {
        id: "6d",
        label: "They control access to money, keys, transportation, phones, medication, or necessities.",
        responseTitle: "RESOURCE CONTROL ACTIVE",
        response:
          "Food, transportation, healthcare, communication, housing, or exit options may depend on another person's permission. This is control with real-world hardware.",
        pattern: "Resource control",
        safetyFocused: true,
      },
      {
        id: "6e",
        label: "They have used my identity, credit, accounts, or property without meaningful agreement.",
        responseTitle: "IDENTITY MISUSE DETECTED",
        response: "Your name, credit, accounts, and property are not complimentary system resources. Potential financial abuse flagged.",
        pattern: "Identity or financial misuse",
        safetyFocused: true,
      },
    ],
  },
  {
    prompt: "How much privacy do you have?",
    answers: [
      {
        id: "7a",
        label: "We respect each other's messages, belongings, location, and accounts.",
        responseTitle: "PRIVACY SETTINGS FUNCTIONING",
        response: "Trust does not require permanent administrator access to another adult. System functioning normally.",
      },
      {
        id: "7b",
        label: "They expect passwords or unrestricted access.",
        responseTitle: "UNAUTHORIZED ADMIN ACCESS REQUESTED",
        response: "Surveillance request detected wearing an intimacy costume. Total access is not proof of trust.",
        pattern: "Unauthorized access pressure",
      },
      {
        id: "7c",
        label: "They check my messages, location, call history, or belongings.",
        responseTitle: "MONITORING MODE ACTIVE",
        response:
          "The expectation of being watched can restrict behavior even when no rule is spoken aloud. Surveillance becomes the rule.",
        pattern: "Monitoring behavior",
        safetyFocused: true,
      },
      {
        id: "7d",
        label: "I believe they may be tracking, recording, or monitoring me.",
        responseTitle: "POSSIBLE DEVICE EXPOSURE",
        response:
          "Use caution. Consider using a safer device or account before researching plans, changing passwords, downloading files, or contacting support.",
        pattern: "Possible device exposure",
        safetyFocused: true,
      },
    ],
  },
  {
    prompt: "Do the relationship rules apply equally?",
    answers: [
      {
        id: "8a",
        label: "Yes. Expectations are generally mutual.",
        responseTitle: "MUTUAL STANDARDS VERIFIED",
        response: "Nobody appears to have secretly upgraded themselves to premium relationship permissions.",
      },
      {
        id: "8b",
        label: "Not always, but we can discuss and correct the mismatch.",
        responseTitle: "MINOR STANDARD MISMATCH",
        response: "Uneven expectation detected. Correction remains possible if discussion produces an actual update.",
      },
      {
        id: "8c",
        label: "They can do things I would be punished for doing.",
        responseTitle: "DOUBLE-STANDARD PROTOCOL RUNNING",
        response: "One user receives unrestricted access. The other receives penalties for identical behavior. Hierarchy confirmed.",
        pattern: "Double standards",
      },
      {
        id: "8d",
        label: "The rules change depending on what benefits them.",
        responseTitle: "GOALPOST LOCATION: UNKNOWN",
        response: "Rules change according to current advantage. Stable compliance is impossible under standards designed to move.",
        pattern: "Moving goalposts",
      },
    ],
  },
  {
    prompt: "What happens after a serious incident?",
    answers: [
      {
        id: "9a",
        label: "Harm is acknowledged, responsibility is accepted, and behavior changes.",
        responseTitle: "REPAIR PROTOCOL COMPLETE",
        response: "Harm acknowledged. Responsibility accepted. Behavior changed. No loophole or smoke machine required.",
      },
      {
        id: "9b",
        label: "They apologize and become intensely loving.",
        responseTitle: "LOVE-BOMBING LEVELS SUSPICIOUSLY HIGH",
        response: "Post-incident affection spike detected. System requests long-term performance data before classifying this as repair.",
        pattern: "Post-incident affection spike",
      },
      {
        id: "9c",
        label: "They blame stress, alcohol, trauma, work, or someone else.",
        responseTitle: "EXCUSE DATABASE FULL",
        response: "Stress. Alcohol. Trauma. Work. Childhood. Weather. Mercury retrograde. Explanation capacity exceeded. Responsibility remains pending.",
        pattern: "Excuse shifting",
      },
      {
        id: "9d",
        label: "They act like nothing happened.",
        responseTitle: "INCIDENT DELETED FROM THEIR SYSTEM ONLY",
        response: "Event appears erased from their active memory. Event remains fully installed in your nervous system. Reality sync failed.",
        pattern: "Incident erasure",
      },
      {
        id: "9e",
        label: "The same cycle keeps repeating.",
        responseTitle: "REPEATING LOOP DETECTED",
        response: "Harm. Apology. Calm. Hope. Repeat. Same program. New loading screen.",
        pattern: "Repeating harm cycle",
      },
    ],
  },
  {
    prompt: "If nothing changed and the relationship stayed exactly like this for another year, how would you feel?",
    answers: [
      {
        id: "10a",
        label: "Generally okay. The problems feel workable.",
        responseTitle: "FUTURE SYSTEM STATUS: WORKABLE",
        response:
          "Repair may be possible when both users acknowledge harm, accept responsibility, and install lasting behavioral updates.",
      },
      {
        id: "10b",
        label: "Sad, depleted, or trapped.",
        responseTitle: "FUTURE PROJECTION: DEPLETION",
        response:
          "Forecast returned exhaustion, sadness, and restricted movement. Future user may be reporting what present survival mode has not had capacity to process.",
        pattern: "Future depletion",
      },
      {
        id: "10c",
        label: "Afraid things would become worse.",
        responseTitle: "ESCALATION FORECAST DETECTED",
        response: "Fear of worsening conditions may be based on patterns already running. System recommends taking this forecast seriously.",
        pattern: "Escalation forecast",
        safetyFocused: true,
      },
      {
        id: "10d",
        label: "I cannot imagine surviving another year like this.",
        responseTitle: "DISTRESS LEVEL: CRITICAL",
        response:
          "Humor suspended. You do not have to solve your entire future tonight. This level of suffering deserves support and real options.",
        pattern: "Critical distress",
        safetyFocused: true,
      },
      {
        id: "10e",
        label: "I still genuinely do not know.",
        responseTitle: "FUTURE DATA UNAVAILABLE",
        response: "Forecasting capacity may currently be occupied by surviving today. No forced conclusion required.",
      },
    ],
  },
];

const assessmentGaugeEffects: Record<string, AssessmentGaugeEffect> = {
  "1a": { autonomy: 4, danger: -2, reality: 6, emphasis: "reality", notice: "HEALTHY FUNCTION DETECTED." },
  "1b": { autonomy: -3, danger: 2, reality: -14, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "1c": { autonomy: -4, danger: 3, reality: -12, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "1d": { autonomy: -5, danger: 4, reality: -10, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "1e": { autonomy: -10, danger: 18, reality: -8, emphasis: "danger", notice: "PREPAREDNESS CHECK REQUIRED.", minDanger: 21 },
  "2a": { autonomy: 5, danger: -2, reality: 3, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "2b": { autonomy: -1, danger: 2, reality: 0, emphasis: "danger", notice: "CONFLICT LOAD REGISTERED." },
  "2c": { autonomy: -10, danger: 9, reality: -3, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "2d": { autonomy: -16, danger: 16, reality: -5, emphasis: "danger", notice: "PREPAREDNESS CHECK REQUIRED.", minDanger: 21 },
  "3a": { autonomy: 3, danger: -2, reality: 6, emphasis: "reality", notice: "HEALTHY FUNCTION DETECTED." },
  "3b": { autonomy: -7, danger: 3, reality: -10, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "3c": { autonomy: -5, danger: 5, reality: -5, emphasis: "danger", notice: "REPEATING CYCLE PRESSURE DETECTED." },
  "3d": { autonomy: -4, danger: 3, reality: -13, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "4a": { autonomy: 8, danger: -4, reality: 3, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "4b": { autonomy: -2, danger: 3, reality: 0, emphasis: "danger", notice: "CONFLICT LOAD REGISTERED." },
  "4c": { autonomy: -10, danger: 10, reality: -2, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "4d": { autonomy: -15, danger: 15, reality: -4, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "4e": { autonomy: -18, danger: 24, reality: -5, emphasis: "danger", notice: "PREPAREDNESS SIGNAL LOW.", minDanger: 46 },
  "5a": { autonomy: 6, danger: -2, reality: 2, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "5b": { autonomy: -5, danger: 2, reality: -3, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "5c": { autonomy: -12, danger: 8, reality: -4, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "5d": { autonomy: -18, danger: 12, reality: -7, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "6a": { autonomy: 8, danger: -3, reality: 2, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "6b": { autonomy: 5, danger: -2, reality: 2, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "6c": { autonomy: -10, danger: 8, reality: -4, emphasis: "autonomy", notice: "RESOURCE CONTROL SIGNAL DETECTED." },
  "6d": { autonomy: -20, danger: 18, reality: -5, emphasis: "danger", notice: "PREPAREDNESS SIGNAL LOW.", minDanger: 46 },
  "6e": { autonomy: -16, danger: 14, reality: -7, emphasis: "danger", notice: "PREPAREDNESS SIGNAL LOW.", minDanger: 46 },
  "7a": { autonomy: 7, danger: -3, reality: 2, emphasis: "autonomy", notice: "HEALTHY FUNCTION DETECTED." },
  "7b": { autonomy: -8, danger: 7, reality: -3, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "7c": { autonomy: -14, danger: 13, reality: -4, emphasis: "autonomy", notice: "MONITORING SIGNAL DETECTED.", minDanger: 21 },
  "7d": { autonomy: -18, danger: 24, reality: -5, emphasis: "danger", notice: "POSSIBLE DEVICE EXPOSURE.", minDanger: 46 },
  "8a": { autonomy: 4, danger: -2, reality: 5, emphasis: "reality", notice: "HEALTHY FUNCTION DETECTED." },
  "8b": { autonomy: 0, danger: 0, reality: 1, emphasis: "reality", notice: "STANDARD MISMATCH LOGGED." },
  "8c": { autonomy: -9, danger: 5, reality: -8, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "8d": { autonomy: -8, danger: 5, reality: -12, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "9a": { autonomy: 5, danger: -5, reality: 6, emphasis: "reality", notice: "HEALTHY FUNCTION DETECTED." },
  "9b": { autonomy: -4, danger: 7, reality: -5, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "9c": { autonomy: -3, danger: 5, reality: -7, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "9d": { autonomy: -4, danger: 6, reality: -10, emphasis: "reality", notice: "REALITY INTERFERENCE DETECTED." },
  "9e": { autonomy: -8, danger: 13, reality: -8, emphasis: "danger", notice: "PREPAREDNESS CHECK REQUIRED.", minDanger: 21 },
  "10a": { autonomy: 3, danger: -3, reality: 3, emphasis: "autonomy", notice: "FUTURE STATUS WORKABLE." },
  "10b": { autonomy: -10, danger: 8, reality: 2, emphasis: "autonomy", notice: "AUTONOMY SIGNAL DECREASED." },
  "10c": { autonomy: -8, danger: 16, reality: 3, emphasis: "danger", notice: "ESCALATION FORECAST DETECTED.", minDanger: 21 },
  "10d": { autonomy: -12, danger: 24, reality: 2, emphasis: "danger", notice: "DISTRESS LEVEL CRITICAL.", minDanger: 71 },
  "10e": { autonomy: -2, danger: 2, reality: -2, emphasis: "reality", notice: "FUTURE DATA UNAVAILABLE." },
};

const exitPlanningQuestions: ExitQuestion[] = [
  {
    phase: "PHASE 1 - IMMEDIATE CONDITIONS",
    prompt: "Are you currently in immediate danger, or do you believe something may happen very soon?",
    answers: [
      {
        id: "ep1a",
        label: "No. I have time to think and plan.",
        responseTitle: "PLANNING WINDOW DETECTED",
        response: "Time appears available. System will focus on preparation, reducing exposure, and creating backup options before conditions change.",
        effect: { readiness: 8, exposure: -4, backup: 4, emphasis: "readiness", notice: "PLANNING WINDOW DETECTED." },
      },
      {
        id: "ep1b",
        label: "I am not sure.",
        responseTitle: "CONDITIONS UNCLEAR",
        response: "Uncertainty may mean the environment is unpredictable. System will continue cautiously and include an emergency backup plan.",
        effect: { readiness: 2, exposure: 8, backup: 6, emphasis: "exposure", notice: "EXPOSURE LEVEL ELEVATED." },
      },
      {
        id: "ep1c",
        label: "Things are escalating, but I am not in immediate danger right now.",
        responseTitle: "ESCALATION DETECTED",
        response: "Humor suspended. System will prioritize speed, safer communication, transportation, and emergency alternatives.",
        effect: { readiness: 4, exposure: 18, backup: 8, emphasis: "exposure", notice: "EXPOSURE LEVEL HIGH.", minExposure: 46 },
      },
      {
        id: "ep1d",
        label: "Yes. I may need to leave very soon.",
        responseTitle: "EXIT WINDOW MAY BE LIMITED",
        response: "Humor suspended. System will skip nonessential planning and identify the fastest available route to a safer location.",
        effect: { readiness: 5, exposure: 24, backup: 12, emphasis: "exposure", notice: "URGENT EXIT CONDITIONS LOGGED.", minExposure: 46 },
      },
      {
        id: "ep1e",
        label: "Yes. I need emergency help now.",
        responseTitle: "IMMEDIATE SAFETY MODE ACTIVATED",
        response: "Humor suspended. If contacting emergency services is safe and appropriate, use local emergency services. If calling is not safe, consider moving toward a public or populated location, contacting a trusted person, or using a safer device.",
        effect: { readiness: 0, exposure: 35, backup: 14, emphasis: "exposure", notice: "IMMEDIATE SAFETY MODE ACTIVE.", minExposure: 71 },
      },
    ],
  },
  {
    phase: "PHASE 1 - RETALIATION FORECAST",
    prompt: "What do you believe this person may do if they realize you are preparing to leave?",
    answers: [
      {
        id: "ep2a",
        label: "They may be upset, but I do not expect retaliation.",
        responseTitle: "LOW RETALIATION EXPECTATION",
        response: "Preparation may still be useful. System will continue without assuming cooperation.",
        effect: { readiness: 5, exposure: -4, backup: 3, emphasis: "readiness", notice: "RETALIATION EXPECTATION LOW." },
      },
      {
        id: "ep2b",
        label: "They may pressure, guilt, manipulate, or promise to change.",
        responseTitle: "EMOTIONAL OVERRIDE ATTEMPT ANTICIPATED",
        response: "Possible incoming commands include promises to change, guilt, blame, or one more chance. Promises made after loss of control is detected are not automatically software updates.",
        effect: { readiness: 2, exposure: 10, backup: 4, emphasis: "exposure", notice: "EXPOSURE LEVEL ELEVATED." },
      },
      {
        id: "ep2c",
        label: "They may interfere with money, transportation, housing, work, or communication.",
        responseTitle: "RESOURCE INTERFERENCE POSSIBLE",
        response: "Access may become restricted. System will prioritize independent access and backup routes.",
        effect: { readiness: -4, exposure: 18, backup: 8, emphasis: "exposure", notice: "RESOURCE INTERFERENCE POSSIBLE.", minExposure: 46 },
      },
      {
        id: "ep2d",
        label: "They may monitor, follow, threaten, expose, or punish me.",
        responseTitle: "HIGH-RISK RETALIATION PATTERN",
        response: "Humor suspended. Planning may need to occur through a safer device, safer account, trusted person, or location outside the other person's access.",
        effect: { readiness: -5, exposure: 26, backup: 10, emphasis: "exposure", notice: "HIGH-RISK RETALIATION PATTERN.", minExposure: 46 },
      },
      {
        id: "ep2e",
        label: "They may harm me, themselves, children, pets, family members, or property.",
        responseTitle: "SEVERE RETALIATION RISK",
        response: "Humor suspended. Threats involving harm, weapons, stalking, forced confinement, children, pets, or self-harm require a more cautious plan. System will build an emergency route before continuing.",
        effect: { readiness: -6, exposure: 35, backup: 16, emphasis: "exposure", notice: "SEVERE RETALIATION RISK.", minExposure: 71 },
      },
      {
        id: "ep2f",
        label: "I genuinely do not know what they may do.",
        responseTitle: "BEHAVIORAL FORECAST UNAVAILABLE",
        response: "Unpredictability is itself relevant data. System will not assume a calm response.",
        effect: { readiness: 0, exposure: 14, backup: 8, emphasis: "exposure", notice: "UNPREDICTABILITY LOGGED." },
      },
    ],
  },
  {
    phase: "PHASE 1 - DEVICE AND ACCOUNT SAFETY",
    prompt: "Are you confident that this device, browser, email, phone plan, and connected accounts are private?",
    answers: [
      {
        id: "ep3a",
        label: "Yes, as far as I know.",
        responseTitle: "DEVICE APPEARS USABLE",
        response: "No device is guaranteed safe. Continue with awareness of browser history, downloads, email alerts, shared accounts, backups, and billing notifications.",
        effect: { readiness: 5, exposure: -3, backup: 2, emphasis: "readiness", notice: "DEVICE APPEARS USABLE." },
      },
      {
        id: "ep3b",
        label: "I am not sure.",
        responseTitle: "DEVICE PRIVACY UNKNOWN",
        response: "System recommends avoiding saved plans, obvious filenames, password changes, or sensitive downloads until a safer device is available.",
        effect: { readiness: -3, exposure: 10, backup: 5, emphasis: "exposure", notice: "DEVICE PRIVACY UNKNOWN." },
      },
      {
        id: "ep3c",
        label: "They know my passwords or have access to my accounts.",
        responseTitle: "ACCOUNT ACCESS COMPROMISED",
        response: "Changing passwords from a monitored device may alert the person or expose the new password. Consider using a safer device and an account they do not know exists.",
        effect: { readiness: -7, exposure: 18, backup: 6, emphasis: "exposure", notice: "ACCOUNT ACCESS COMPROMISED.", minExposure: 46 },
      },
      {
        id: "ep3d",
        label: "They check my phone, location, messages, or browser activity.",
        responseTitle: "ACTIVE MONITORING POSSIBLE",
        response: "System recommends minimizing visible searches and downloads. Use Quick Exit whenever needed.",
        effect: { readiness: -8, exposure: 22, backup: 8, emphasis: "exposure", notice: "ACTIVE MONITORING POSSIBLE.", minExposure: 46 },
      },
      {
        id: "ep3e",
        label: "I believe the device may be tracked, monitored, or recorded.",
        responseTitle: "POSSIBLE DEVICE EXPOSURE",
        response: "Humor suspended. A safer device may be a library computer, trusted person's phone, workplace device where permitted, advocacy office, or device the other person has never accessed.",
        effect: { readiness: -10, exposure: 28, backup: 10, emphasis: "exposure", notice: "POSSIBLE DEVICE EXPOSURE.", minExposure: 46 },
      },
    ],
  },
  {
    phase: "PHASE 3 - PLAN A",
    prompt: "Where is the safest realistic place you could go first? No address needed.",
    answers: [
      {
        id: "ep4a",
        label: "Trusted person, shelter, hotel, hospital, or public location.",
        responseTitle: "PLAN A DESTINATION TYPE LOGGED",
        response: "Destination category identified. System will keep backup options online.",
        effect: { readiness: 16, exposure: -2, backup: 5, emphasis: "readiness", notice: "EXIT READINESS INCREASED." },
      },
      {
        id: "ep4b",
        label: "I have nowhere yet or cannot safely contact anyone.",
        responseTitle: "DESTINATION NOT YET IDENTIFIED",
        response: "This is a planning problem, not a moral failure. Relevant housing resources can be routed here later.",
        effect: { readiness: 4, exposure: 6, backup: 8, emphasis: "backup", notice: "BACKUP STATUS UPDATED." },
      },
    ],
  },
  {
    phase: "PHASE 3 - PLAN A",
    prompt: "How would you get there?",
    answers: [
      {
        id: "ep5a",
        label: "My vehicle, someone can drive me, rideshare, taxi, or public transportation.",
        responseTitle: "PRIMARY TRANSPORT IDENTIFIED",
        response: "Primary route logged. Backup route remains useful if timing changes.",
        effect: { readiness: 15, exposure: -2, backup: 5, emphasis: "readiness", notice: "EXIT READINESS INCREASED." },
      },
      {
        id: "ep5b",
        label: "I could walk to a safer location or I have no transportation option yet.",
        responseTitle: "TRANSPORTATION GAP LOGGED",
        response: "System will treat transportation as a primary blocker and keep emergency alternatives in view.",
        effect: { readiness: -4, exposure: 8, backup: 8, emphasis: "backup", notice: "BACKUP STATUS UPDATED." },
      },
    ],
  },
  {
    phase: "PHASE 3 - PLAN A",
    prompt: "When would leaving be least likely to trigger interference?",
    answers: [
      {
        id: "ep6a",
        label: "When they are away, while I am already out, during work, or with another person present.",
        responseTitle: "TIMING WINDOW IDENTIFIED",
        response: "Timing is a safety variable. No date is required today.",
        effect: { readiness: 14, exposure: -4, backup: 3, emphasis: "readiness", notice: "TIMING WINDOW IDENTIFIED." },
      },
      {
        id: "ep6b",
        label: "There is no predictable safe window or I am not ready to choose a time.",
        responseTitle: "TIMING WINDOW NOT YET IDENTIFIED",
        response: "No date required today. System will keep emergency and lower-visibility options available.",
        effect: { readiness: -3, exposure: 8, backup: 8, emphasis: "backup", notice: "BACKUP STATUS UPDATED." },
      },
    ],
  },
  {
    phase: "PLAN B - EMERGENCY EXIT",
    prompt: "If you had to leave within ten minutes, what could you do?",
    answers: [
      {
        id: "ep7a",
        label: "Leave to a known location, contact pickup, move to public place, or contact emergency services.",
        responseTitle: "EMERGENCY ROUTE IDENTIFIED",
        response: "Emergency plan does not need to be elegant. It needs to create distance and time.",
        effect: { readiness: 8, exposure: -2, backup: 24, emphasis: "backup", notice: "BACKUP STATUS AVAILABLE." },
      },
      {
        id: "ep7b",
        label: "I would have to leave without belongings or I do not have an emergency route yet.",
        responseTitle: "EMERGENCY ROUTE INCOMPLETE",
        response: "System will recommend one small next step instead of a giant checklist.",
        effect: { readiness: 0, exposure: 8, backup: 6, emphasis: "backup", notice: "BACKUP STATUS INCOMPLETE." },
      },
    ],
  },
];

const denialImages = [denialSupportOne, denialSupportTwo];

const checkpointMessage =
  "Survivor Systems cannot tell whether your device, browser, accounts, or connection are being monitored.\n\nPrivate or Incognito browsing may reduce some local history, but it does not hide activity from monitoring software, shared accounts, phone plans, networks, connected devices, or someone with access to this device.\n\nIf you think someone may be monitoring you, consider using a device and account they have never accessed before.\n\nContinuing is your choice.";

const privateBrowsingHelp = [
  "Private or Incognito windows can reduce some local browser history on this device.",
  "They do not hide activity from monitoring software, shared accounts, phone plans, networks, routers, backups, or someone with device access.",
  "If it is safe, open a private window from your browser menu before continuing.",
];

const leavingLadderRungs: LeavingLadderRung[] = [
  {
    id: "name-it",
    title: "Name What Is Happening",
    premise: "You do not have to call it abuse to notice it is costing you.",
    systemResponse:
      "SYSTEM:\nNaming the pattern is not betrayal. It is inventory. If your peace, sleep, money, movement, friendships, body, or sense of reality keeps shrinking around one person's reactions, something is asking to be taken seriously.",
    suggestedAction: "Write one sentence somewhere private: This relationship is costing me ______.",
    effect: {
      clarity: 16,
      preparedness: 4,
      reality: 10,
      options: 4,
      emphasis: "CLARITY",
      notice: "PATTERN NAMED. CLARITY SIGNAL INCREASED.",
    },
  },
  {
    id: "safe-hour",
    title: "Imagine One Safe Hour",
    premise: "Before you picture a whole new life, picture one hour with less control in it.",
    systemResponse:
      "SYSTEM:\nA safer future does not have to arrive fully furnished. Start smaller. One hour at a library. One phone call from a parking lot. One walk where nobody is interrogating your face. Your nervous system may need proof that quiet still exists.",
    suggestedAction: "Name one place, person, or time of day where control is lower.",
    effect: {
      clarity: 8,
      preparedness: 6,
      reality: 8,
      options: 18,
      emphasis: "OPTIONS",
      notice: "SAFE-HOUR POSSIBILITY FOUND. OPTIONS SIGNAL INCREASED.",
    },
  },
  {
    id: "dependency",
    title: "Reduce One Dependency",
    premise: "Control gets louder when one person holds too many switches.",
    systemResponse:
      "SYSTEM:\nYou do not have to solve money, transportation, documents, phone access, medication, housing, and support all at once. Pick one switch. Make it slightly less theirs. Slightly counts. Quiet preparation is still preparation.",
    suggestedAction: "Choose one dependency to reduce first: money, transportation, documents, phone, medication, housing, or support.",
    effect: {
      clarity: 8,
      preparedness: 18,
      reality: 8,
      options: 8,
      emphasis: "PREPAREDNESS",
      notice: "DEPENDENCY TARGET SELECTED. PREPAREDNESS SIGNAL INCREASED.",
    },
  },
  {
    id: "housing",
    title: "Housing Is Not One Thing",
    premise: "Housing does not mean finding a perfect new home immediately.",
    systemResponse:
      "SYSTEM:\nHousing can mean a first night, a couch, a shelter, a hotel, a car-safety plan, family, a friend, a motel voucher, transitional housing, or a waitlist. It also means documents, transportation, privacy, pets or kids, money, location safety, and whether they can find you. No perfect choice required. We are mapping possible doors.",
    suggestedAction: "List two first-night possibilities, even if both are imperfect.",
    effect: {
      clarity: 8,
      preparedness: 16,
      reality: 18,
      options: 12,
      emphasis: "REALITY",
      notice: "HOUSING DECODED AS A SET OF OPTIONS. REALITY SIGNAL INCREASED.",
    },
  },
  {
    id: "tiny-move",
    title: "Choose One Tiny Move",
    premise: "You do not need a dramatic announcement. You need one next move that belongs to you.",
    systemResponse:
      "SYSTEM:\nDecision pressure rejected. You can prepare without promising yourself you will leave today. Pack one thing. Learn one right. Identify one safe contact. Find one local resource. One move is not everything, but it is no longer nothing.",
    suggestedAction: "Pick one next module: Go-Bag Prep, Exit Planning, Local Help, or Legal.",
    effect: {
      clarity: 10,
      preparedness: 14,
      reality: 8,
      options: 18,
      emphasis: "OPTIONS",
      notice: "TINY MOVE AVAILABLE. OPTIONS SIGNAL INCREASED.",
    },
  },
];

const defaultControlPanel: ControlPanelState = {
  emphasis: null,
  gauges: [
    {
      label: "CLARITY",
      value: 58,
      lowLabel: "FOG",
      highLabel: "CLEAR",
      state: "STANDBY",
      tone: "cyan",
    },
    {
      label: "PREPAREDNESS",
      value: 28,
      lowLabel: "LOW",
      highLabel: "READY",
      state: "RULES PENDING",
      tone: "pink",
    },
    {
      label: "REALITY",
      value: 62,
      lowLabel: "LOCKED",
      highLabel: "ONLINE",
      state: "STANDBY",
      tone: "amber",
    },
    {
      label: "OPTIONS",
      value: 64,
      lowLabel: "LOCKED",
      highLabel: "OPEN",
      state: "AVAILABLE",
      tone: "purple",
    },
  ],
  notice: "COMMAND CENTER ONLINE. MODULE READINGS STANDBY.",
};

function leaveSite() {
  window.location.replace("https://iluvrocks.rocks");
}

const checkpointSessionKey = "survivorSystemsCheckpointCleared";

function getCheckpointCleared() {
  try {
    return window.sessionStorage.getItem(checkpointSessionKey) === "true";
  } catch {
    return false;
  }
}

function markCheckpointCleared() {
  try {
    window.sessionStorage.setItem(checkpointSessionKey, "true");
  } catch {
    // If sessionStorage is unavailable, the in-memory state still lets this visit continue.
  }
}

function getInitialModule(): ModuleKey {
  const path = window.location.pathname;

  const match = navItems.find((item) => item.path === path);
  return match?.key ?? "home";
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function clampGauge(value: number) {
  return Math.max(0, Math.min(100, value));
}

function gaugeState(value: number, strong = "READY", mid = "BUILDING", low = "LOW") {
  if (value >= 76) return strong;
  if (value >= 51) return mid;
  if (value >= 26) return low;
  return "NEEDS INPUT";
}

function gaugeByLabel(gauges: GaugeValue[], labels: string[], fallbackIndex: number) {
  const match = gauges.find((gauge) => labels.some((label) => gauge.label.toLowerCase().includes(label)));
  return match ?? gauges[fallbackIndex] ?? defaultControlPanel.gauges[fallbackIndex] ?? defaultControlPanel.gauges[0];
}

function commandCenterBars(gauges: GaugeValue[]): GaugeValue[] {
  const clarity = gaugeByLabel(gauges, ["clarity", "autonomy"], 0);
  const preparedness = gaugeByLabel(gauges, ["preparedness", "readiness", "bag", "core", "backup"], 1);
  const reality = gaugeByLabel(gauges, ["reality"], 2);
  const options = gaugeByLabel(gauges, ["options"], 3);
  const optionValue =
    options.label.toLowerCase().includes("options") && options.value
      ? options.value
      : Math.round((clarity.value + preparedness.value + reality.value) / 3);

  return [
    {
      label: "CLARITY",
      value: clarity.value,
      lowLabel: "FOG",
      highLabel: "CLEAR",
      state: clarity.state || gaugeState(clarity.value, "CLEAR", "ONLINE", "FUZZY"),
      tone: "cyan",
    },
    {
      label: "PREPAREDNESS",
      value: preparedness.value,
      lowLabel: "LOW",
      highLabel: "READY",
      state: preparedness.state || gaugeState(preparedness.value),
      tone: "pink",
    },
    {
      label: "REALITY",
      value: reality.value,
      lowLabel: "DISTORTED",
      highLabel: "STABLE",
      state: reality.state || gaugeState(reality.value, "STABLE", "CLEARING", "STATIC"),
      tone: "amber",
    },
    {
      label: "OPTIONS",
      value: optionValue,
      lowLabel: "LIMITED",
      highLabel: "OPEN",
      state: gaugeState(optionValue, "AVAILABLE", "OPENING", "LIMITED"),
      tone: "purple",
    },
  ];
}

function assessmentGaugeValues(gauges: AssessmentGauges): GaugeValue[] {
  const autonomyState =
    gauges.autonomy >= 76
      ? "AVAILABLE"
      : gauges.autonomy >= 51
        ? "PARTIAL"
        : gauges.autonomy >= 26
          ? "RESTRICTED"
          : "SEVERELY RESTRICTED";
  const preparedness = clampGauge(100 - gauges.danger);
  const preparednessState =
    preparedness >= 76 ? "READY" : preparedness >= 51 ? "BUILDING" : preparedness >= 26 ? "LOW" : "NEEDS SUPPORT";
  const realityState =
    gauges.reality >= 76 ? "STABLE" : gauges.reality >= 51 ? "CLEARING" : gauges.reality >= 26 ? "UNSTABLE" : "DISTORTED";

  return [
    {
      label: "AUTONOMY METER",
      value: gauges.autonomy,
      lowLabel: "RESTRICTED",
      highLabel: "AVAILABLE",
      state: autonomyState,
      tone: "cyan",
    },
    {
      label: "PREPAREDNESS",
      value: preparedness,
      lowLabel: "LOW",
      highLabel: "READY",
      state: preparednessState,
      tone: "pink",
    },
    {
      label: "REALITY SIGNAL",
      value: gauges.reality,
      lowLabel: "DISTORTED",
      highLabel: "STABLE",
      state: realityState,
      tone: "purple",
    },
  ];
}

function exitGaugeValues(gauges: ExitGaugeState): GaugeValue[] {
  const readinessState = gauges.readiness >= 76 ? "ROUTE IDENTIFIED" : gauges.readiness >= 41 ? "PARTIAL" : "BLOCKED";
  const exposureState = gauges.exposure >= 66 ? "HIGH" : gauges.exposure >= 31 ? "ELEVATED" : "LOW";
  const backupState = gauges.backup >= 76 ? "AVAILABLE" : gauges.backup >= 36 ? "INCOMPLETE" : "OFFLINE";

  return [
    {
      label: "EXIT READINESS",
      value: gauges.readiness,
      lowLabel: "BLOCKED",
      highLabel: "ROUTE IDENTIFIED",
      state: readinessState,
      tone: "cyan",
    },
    {
      label: "EXPOSURE LEVEL",
      value: gauges.exposure,
      lowLabel: "LOW",
      highLabel: "HIGH",
      state: exposureState,
      tone: "pink",
    },
    {
      label: "BACKUP STATUS",
      value: gauges.backup,
      lowLabel: "OFFLINE",
      highLabel: "AVAILABLE",
      state: backupState,
      tone: "purple",
    },
  ];
}

function GaugeDeck({
  compact = false,
  emphasis,
  gauges,
  notice,
}: {
  compact?: boolean;
  emphasis?: string | null;
  gauges: GaugeValue[];
  notice?: string;
}) {
  if (compact) {
    const bars = commandCenterBars(gauges);

    return (
      <section className="gauge-deck compact-gauges" aria-label="Command center status bars">
        <div className="gauge-row">
          {bars.map((gauge) => {
            const filledBlocks = Math.round(clampGauge(gauge.value) / 10);

            return (
              <article className={`status-bar ${gauge.tone} ${emphasis === gauge.label ? "pulse-gauge" : ""}`} key={gauge.label}>
                <h3>{gauge.label}</h3>
                <div className="status-blocks" aria-label={`${gauge.label} ${filledBlocks} out of 10`}>
                  {Array.from({ length: 10 }, (_, index) => (
                    <span className={index < filledBlocks ? "status-block filled" : "status-block"} key={index} />
                  ))}
                </div>
                <p>{gauge.state}</p>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className={compact ? "gauge-deck compact-gauges" : "gauge-deck"} aria-label="Temporary system readings">
      <div className="gauge-row">
        {gauges.map((gauge) => (
          <article
            className={`analog-gauge ${gauge.tone} ${emphasis === gauge.label ? "pulse-gauge" : ""}`}
            key={gauge.label}
            style={{ "--gauge-value": gauge.value } as CSSProperties}
          >
            <div className="gauge-window">
              <div className="gauge-arc" />
              <div className="gauge-needle" />
              <div className="gauge-hub" />
              <div className="gauge-scale">
                <span>{gauge.lowLabel}</span>
                <span>{gauge.highLabel}</span>
              </div>
            </div>
            <h3>{gauge.label}</h3>
            <p>{compact ? gauge.state : `CURRENT STATE: ${gauge.state}`}</p>
          </article>
        ))}
      </div>
      <p className="gauge-notice">{notice || "GAUGES INITIALIZED. CURRENT DATA: INSUFFICIENT. NO CONCLUSIONS LOADED."}</p>
    </section>
  );
}

function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-logo ${className}`} aria-label="Survivor Systems">
      <span className="brand-logo-survivor">Survivor</span>
      <span className="brand-logo-systems">Systems</span>
    </span>
  );
}

function CommandCenter({
  onNavigate,
  panel,
}: {
  onNavigate: (module: ModuleKey, path: string) => void;
  panel: ControlPanelState;
}) {
  return (
    <section className="command-center" aria-label="Command center">
      <div className="command-center-status">
        <span className="terminal-label">COMMAND CENTER</span>
        <p>{panel.notice}</p>
      </div>
      <GaugeDeck compact emphasis={panel.emphasis} gauges={panel.gauges} notice={panel.notice} />
      <TerminalCommand onNavigate={onNavigate} />
    </section>
  );
}

function TypedText({
  className = "typed-text",
  onDone,
  skipLabel = "Skip Typing",
  text,
}: {
  className?: string;
  onDone?: () => void;
  skipLabel?: string;
  text: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visibleLength, setVisibleLength] = useState(prefersReducedMotion ? text.length : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleLength(text.length);
      onDone?.();
      return;
    }

    setVisibleLength(0);
    const step = Math.max(8, Math.floor(text.length / 90));
    const interval = window.setInterval(() => {
      setVisibleLength((current) => {
        const next = Math.min(text.length, current + step);
        if (next >= text.length) {
          window.clearInterval(interval);
          onDone?.();
        }
        return next;
      });
    }, 16);

    return () => window.clearInterval(interval);
  }, [onDone, prefersReducedMotion, text]);

  const finished = visibleLength >= text.length;

  return (
    <>
      <pre className={className}>
        {text.slice(0, visibleLength)}
        <span className="terminal-cursor" aria-hidden="true" />
      </pre>
      {!finished && (
        <button className="text-button" type="button" onClick={() => setVisibleLength(text.length)}>
          {skipLabel}
        </button>
      )}
    </>
  );
}

function WelcomeCheckpoint({ onComplete }: { onComplete: () => void }) {
  const [typingComplete, setTypingComplete] = useState(false);
  const [mode, setMode] = useState<"options" | "instructions" | "ack" | "safer-device">("options");
  const [acknowledged, setAcknowledged] = useState(false);

  const typedIntro = useMemo(
    () => `Welcome To Survivor Systems.\n\n${checkpointMessage}`,
    [],
  );

  return (
    <main className="terminal-frame checkpoint-frame">
      <button className="quick-exit global-exit" type="button" onClick={leaveSite}>
        <ShieldAlert aria-hidden="true" />
        Quick Exit
      </button>
      <section className="checkpoint-panel" aria-labelledby="checkpoint-title">
        <div className="terminal-label">SYSTEM CHECKPOINT</div>
        <h1 id="checkpoint-title">
          <BrandLogo className="checkpoint-logo" />
        </h1>
        <TypedText text={typedIntro} onDone={() => setTypingComplete(true)} />

        {typingComplete && mode === "options" && (
          <div className="terminal-actions" aria-label="Welcome checkpoint options">
            <button type="button" onClick={() => setMode("instructions")}>
              Open Private Browsing Instructions
            </button>
            <button type="button" onClick={onComplete}>
              I&apos;m Already Using Private Browsing
            </button>
            <button type="button" onClick={() => setMode("ack")}>
              Continue Without Private Browsing
            </button>
            <button type="button" onClick={() => setMode("safer-device")}>
              Use a Safer Device Instead
            </button>
            <button type="button" onClick={leaveSite}>
              Quick Exit
            </button>
          </div>
        )}

        {typingComplete && mode === "instructions" && (
          <div className="sub-terminal">
            <h2>Private Browsing Instructions</h2>
            <ul>
              {privateBrowsingHelp.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="terminal-actions compact-actions">
              <button type="button" onClick={onComplete}>
                I&apos;m Already Using Private Browsing
              </button>
              <button type="button" onClick={() => setMode("ack")}>
                Continue Without Private Browsing
              </button>
              <button type="button" onClick={() => setMode("options")}>
                Go Back
              </button>
            </div>
          </div>
        )}

        {typingComplete && mode === "safer-device" && (
          <div className="sub-terminal">
            <h2>Use a Safer Device Instead</h2>
            <p>
              If you think this device, browser, account, network, or phone plan may be monitored,
              consider leaving now and using a device and account the other person has never
              accessed before.
            </p>
            <div className="terminal-actions compact-actions">
              <button type="button" onClick={leaveSite}>
                Quick Exit
              </button>
              <button type="button" onClick={() => setMode("options")}>
                Go Back
              </button>
            </div>
          </div>
        )}

        {typingComplete && mode === "ack" && (
          <div className="sub-terminal">
            <p>
              I understand that continuing may leave visible traces on this device, browser,
              connected accounts, network, bills, backups, or monitoring tools.
            </p>
            <label className="ack-check">
              <input
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                type="checkbox"
              />
              <span>I understand</span>
            </label>
            <div className="terminal-actions compact-actions">
              <button disabled={!acknowledged} type="button" onClick={onComplete}>
                I Understand - Continue
              </button>
              <button type="button" onClick={() => setMode("options")}>
                Go Back
              </button>
              <button type="button" onClick={leaveSite}>
                Quick Exit
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function ModuleLoading({ label }: { label: string }) {
  return (
    <div className="module-loading" role="status" aria-live="polite">
      <p>ACCESSING MODULE...</p>
      <p>LOADING {label.toUpperCase()}...</p>
      <p>CONNECTION ESTABLISHED</p>
    </div>
  );
}

function resolveCommand(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return { message: "NO QUERY ENTERED. TYPE A MODULE NAME OR A NEED.", target: null };
  }

  if (
    normalized === "exit" ||
    normalized === "escape" ||
    normalized.includes("quick exit") ||
    normalized.includes("iluvrocks")
  ) {
    return { message: "QUICK EXIT COMMAND ACCEPTED.", target: "quick-exit" as const };
  }

  if (/\b(help|menu|options|commands|where)\b/.test(normalized)) {
    return {
      message:
        "AVAILABLE COMMANDS: AM I CRAZY, GO-BAG PREP, PLANNING, LEAVING, REBUILDING, LOCAL HELP, LEGAL, QUICK EXIT.",
      target: null,
    };
  }

  const match = navItems.find((item) => {
    const label = item.label.toLowerCase();
    return normalized.includes(label) || label.includes(normalized);
  });

  if (match) {
    return { message: `QUERY ACCEPTED. ROUTING TO ${match.label.toUpperCase()}...`, target: match };
  }

  if (/\b(crazy|abused|abuse|assessment|gaslight|gaslighting|reality)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO AM I CRAZY...", target: navItemFor("am-i-crazy") };
  }

  if (/\b(go.?bag|bag|simulator|arcade|prep|pack)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO GO-BAG PREP...", target: navItemFor("go-bag-prep") };
  }

  if (/\b(plan|safety|prepare|documents|checklist)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO PLANNING...", target: navItemFor("planning") };
  }

  if (/\b(leave|leaving|go bag|escape|exit plan)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO LEAVING...", target: navItemFor("leaving") };
  }

  if (/\b(rebuild|money|housing|future|after)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO REBUILDING...", target: navItemFor("rebuilding") };
  }

  if (/\b(local|hotline|shelter|support|near)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO FIND LOCAL HELP...", target: navItemFor("local-help") };
  }

  if (/\b(legal|rights|court|order|documents)\b/.test(normalized)) {
    return { message: "QUERY ACCEPTED. ROUTING TO LEGAL...", target: navItemFor("legal") };
  }

  return {
    message:
      "QUERY NOT RECOGNIZED. TRY: AM I CRAZY, PLANNING, LEAVING, REBUILDING, LOCAL HELP, LEGAL, OR QUICK EXIT.",
    target: null,
  };
}

function TerminalCommand({
  onNavigate,
}: {
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [systemReply, setSystemReply] = useState("SYSTEM READY. TYPE A MODULE NAME OR WHAT YOU NEED.");

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = resolveCommand(query);
    setSystemReply(result.message);
    setQuery("");

    if (result.target === "quick-exit") {
      window.setTimeout(leaveSite, 240);
      return;
    }

    if (result.target) {
      window.setTimeout(() => onNavigate(result.target.key, result.target.path), 420);
    }
  }

  return (
    <form className="command-terminal" onSubmit={submitCommand}>
      <label htmlFor="terminal-command">NAV QUERY</label>
      <div className="command-input-row">
        <span aria-hidden="true">user@survivor-systems:~$</span>
        <input
          autoComplete="off"
          id="terminal-command"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="type: am i crazy, go-bag prep, planning, legal, quick exit..."
          spellCheck={false}
          type="search"
          value={query}
        />
      </div>
      <p aria-live="polite">{systemReply}</p>
    </form>
  );
}

function TerminalChrome({
  activeModule,
  children,
  controlPanel,
  onNavigate,
}: {
  activeModule: ModuleKey;
  children: React.ReactNode;
  controlPanel: ControlPanelState;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  return (
    <main className="terminal-frame app-frame">
      <aside className="terminal-sidebar" aria-label="Survivor Systems navigation">
        <a
          className="brand"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("home", "/");
          }}
        >
          <BrandLogo />
        </a>
        <p className="sidebar-tagline">TOOLS FOR CLARITY. POWER FOR YOUR FUTURE.</p>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              className={activeModule === item.key ? "active" : ""}
              href={item.path}
              key={item.key}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(item.key, item.path);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <button className="quick-exit" type="button" onClick={leaveSite}>
          <ShieldAlert aria-hidden="true" />
          Quick Exit
        </button>
      </aside>
      <section className="terminal-screen">
        <header className="terminal-topbar">
          <div className="terminal-topbar-title">
            <span className="terminal-label">MODULE</span>
            <h1>{navItems.find((item) => item.key === activeModule)?.label ?? "Home"}</h1>
          </div>
          <div className="system-status">
            <span>SYSTEM STATUS</span>
            <strong>ONLINE</strong>
            <small>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
          </div>
        </header>
        <div className="terminal-content">{children}</div>
        <CommandCenter panel={controlPanel} onNavigate={onNavigate} />
      </section>
    </main>
  );
}

function HomeModule() {
  return (
    <section className="home-terminal" aria-labelledby="home-title">
      <div className="home-terminal-command">
        <span aria-hidden="true">user@survivor-systems:~$</span>
        <strong>USER TERMINAL</strong>
      </div>
      <article className="home-message">
        <h1 id="home-title">&lt;Is There Any Hope?&gt;</h1>
        <p>
          &lt;If one of you has ended up here, wondering how to fix the other, the relationship may
          already be telling you the truth.&gt;
        </p>
        <p>
          &lt;Abusive behavior can come from childhood wounds, stress, trauma, or any number of other
          causes. Those things may explain it. They don&apos;t excuse it. It&apos;s still their
          responsibility not to pour their unhealed pain into someone else, especially someone they
          claim to love.&gt;
        </p>
        <p>&lt;Their potential does not make you safe.&gt;</p>
        <p>
          &lt;Leaving can be the most dangerous point in an abusive relationship. A person who has never
          used physical violence before may escalate when they feel their control slipping. That
          doesn&apos;t mean you should stay. It means you deserve a plan.&gt;
        </p>
        <p>
          &lt;Start small. Picture where you could go. Decide who you could call. Create a code word
          that means, &ldquo;Call the police.&rdquo; Begin preparing yourself for what leaving could
          involve, even if you are not ready to act yet.&gt;
        </p>
        <p>
          &lt;You aren&apos;t weak for struggling with this. You are navigating one of the hardest
          things a person can face.&gt;
        </p>
        <p>&lt;You&apos;re not alone, either.&gt;</p>
        <p>
          &lt;Survivor Systems is here to help you understand your choices, prepare safely, and decide
          what comes next.&gt;
        </p>
      </article>
    </section>
  );
}

function AmICrazyModule({
  onControlPanelChange,
  onNavigate,
}: {
  onControlPanelChange: (panel: ControlPanelState) => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [activeResponse, setActiveResponse] = useState<AssessmentAnswer | null>(null);
  const [mode, setMode] = useState<"intro" | "question" | "response" | "denial" | "complete">("intro");
  const [denialImage, setDenialImage] = useState(denialImages[0]);
  const [responseDone, setResponseDone] = useState(false);
  const [gauges, setGauges] = useState<AssessmentGauges>({
    autonomy: 65,
    danger: 10,
    reality: 55,
    dangerFloor: 10,
  });
  const [gaugeNotice, setGaugeNotice] = useState("GAUGES INITIALIZED. CURRENT DATA: INSUFFICIENT. NO CONCLUSIONS LOADED.");
  const [gaugeEmphasis, setGaugeEmphasis] = useState<string | null>(null);

  const currentQuestion = assessmentQuestions[questionIndex];
  const patterns = Array.from(new Set(answers.map((answer) => answer.pattern).filter(Boolean)));

  useEffect(() => {
    onControlPanelChange({
      emphasis: gaugeEmphasis,
      gauges: assessmentGaugeValues(gauges),
      notice: gaugeNotice,
    });
  }, [gaugeEmphasis, gaugeNotice, gauges, onControlPanelChange]);

  function beginAssessment() {
    setStarted(true);
    setMode("question");
  }

  function selectAnswer(answer: AssessmentAnswer) {
    setAnswers((current) => [...current, answer]);
    setActiveResponse(answer);
    setResponseDone(false);
    setGaugeEmphasis(null);
    setMode("response");
  }

  function loadNextQuestion() {
    setActiveResponse(null);
    if (questionIndex >= assessmentQuestions.length - 1) {
      setMode("complete");
      return;
    }
    setQuestionIndex((current) => current + 1);
    setMode("question");
  }

  function showDenial() {
    setDenialImage(denialImages[Math.floor(Math.random() * denialImages.length)]);
    setMode("denial");
  }

  function clearAssessment() {
    setStarted(false);
    setQuestionIndex(0);
    setAnswers([]);
    setActiveResponse(null);
    setMode("intro");
    setGauges({ autonomy: 65, danger: 10, reality: 55, dangerFloor: 10 });
    setGaugeNotice("GAUGES INITIALIZED. CURRENT DATA: INSUFFICIENT. NO CONCLUSIONS LOADED.");
    setGaugeEmphasis(null);
  }

  function clearAndExit() {
    clearAssessment();
    leaveSite();
  }

  function startPlanning() {
    onNavigate("planning", "/planning");
  }

  const completeSystemTyping = useCallback(() => {
    if (!activeResponse) {
      setResponseDone(true);
      return;
    }

    const effect = assessmentGaugeEffects[activeResponse.id];
    if (effect) {
      setGauges((current) => {
        const dangerFloor = Math.max(current.dangerFloor, effect.minDanger ?? current.dangerFloor);
        return {
          autonomy: clampGauge(current.autonomy + effect.autonomy),
          danger: Math.max(dangerFloor, clampGauge(current.danger + effect.danger)),
          reality: clampGauge(current.reality + effect.reality),
          dangerFloor,
        };
      });
      setGaugeNotice(`UPDATING SYSTEM READINGS... ${effect.notice}`);
      setGaugeEmphasis(
        effect.emphasis === "autonomy"
          ? "AUTONOMY METER"
          : effect.emphasis === "danger"
            ? "PREPAREDNESS"
            : "REALITY SIGNAL",
      );
    }
    setResponseDone(true);
  }, [activeResponse]);

  return (
    <section className="assessment-shell" aria-labelledby="assessment-title">
      {mode === "intro" && (
        <div className="assessment-panel">
          <div className="terminal-label">INITIALIZING REALITY CHECK...</div>
          <h1 id="assessment-title">AM I CRAZY?</h1>
          <p>
            Confusion is one of the telltale signs of abuse. People who want control benefit when
            you are too busy questioning yourself to question them.
          </p>
          <p className="neon-punch">Clarity is kryptonite.</p>
          <div className="terminal-actions compact-actions">
            <button type="button" onClick={beginAssessment}>
              Begin
            </button>
            <button type="button" onClick={() => onNavigate("home", "/")}>
              Back To Homepage
            </button>
            <button type="button" onClick={clearAndExit}>
              Quick Exit
            </button>
          </div>
        </div>
      )}

      {mode === "question" && currentQuestion && (
        <div className="assessment-panel">
          <div className="question-status">
            <span>QUESTION {questionIndex + 1} OF {assessmentQuestions.length}</span>
            <span>{started ? "TEMP MEMORY ONLY" : "OFFLINE"}</span>
          </div>
          <h2>{currentQuestion.prompt}</h2>
          <div className="answer-grid">
            {currentQuestion.answers.map((answer, index) => (
              <button key={answer.id} type="button" onClick={() => selectAnswer(answer)}>
                <span>{String.fromCharCode(65 + index)}</span>
                {answer.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "response" && activeResponse && (
        <div className={activeResponse.safetyFocused ? "assessment-panel direct-panel" : "assessment-panel"}>
          <div className="terminal-label">SYSTEM RESPONSE</div>
          <h2>{activeResponse.responseTitle}</h2>
          <TypedText
            className="system-typed-text"
            onDone={completeSystemTyping}
            skipLabel="Print Response"
            text={`SYSTEM:\n${activeResponse.response}`}
          />
          {responseDone && (
            <ProceedControls
              onDeny={showDenial}
              onExit={clearAndExit}
              onNext={loadNextQuestion}
              onPlanning={startPlanning}
            />
          )}
        </div>
      )}

      {mode === "denial" && (
        <div className="denial-panel">
          <div className="denial-copy">
            <div className="terminal-label">DENIAL MODE SELECTED.</div>
            <h2>DEPLOYING EMOTIONAL SUPPORT</h2>
            <p>PLEASE WAIT. CUTENESS.EXE LOADING...</p>
          </div>
          <img src={denialImage} alt="Bright support image for a denial break" />
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={loadNextQuestion}>
              Rude. Keep Asking Questions
            </button>
            <button type="button" onClick={startPlanning}>
              Fine. Start Planning My Exit
            </button>
            <button type="button" onClick={() => onNavigate("legal", "/legal")}>
              Understand My Choices
            </button>
            <button type="button" onClick={() => onNavigate("home", "/")}>
              Return To Homepage
            </button>
            <button type="button" onClick={clearAndExit}>
              Quick Exit
            </button>
          </div>
        </div>
      )}

      {mode === "complete" && (
        <div className="assessment-panel">
          <div className="terminal-label">ASSESSMENT COMPLETE.</div>
          <h2>REALITY CHECKS PROCESSED. FINAL DECISION NOT REQUIRED.</h2>
          <div className="pattern-panel">
            <h3>Patterns Identified</h3>
            {patterns.length > 0 ? (
              <ul>
                {patterns.map((pattern) => (
                  <li key={pattern}>{pattern}</li>
                ))}
              </ul>
            ) : (
              <p>No high-friction patterns were selected in this pass.</p>
            )}
          </div>
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={startPlanning}>
              Start Planning My Exit
            </button>
            <button type="button" onClick={() => onNavigate("legal", "/legal")}>
              Understand My Choices
            </button>
            <button type="button" onClick={() => onNavigate("go-bag-prep", "/go-bag-prep")}>
              Go-Bag Prep
            </button>
            <button type="button" onClick={() => setMode("complete")}>
              Review My Patterns
            </button>
            <button type="button" onClick={showDenial}>
              I Choose Denial
            </button>
            <button type="button" onClick={clearAndExit}>
              Clear And Exit
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ProceedControls({
  onDeny,
  onExit,
  onNext,
  onPlanning,
}: {
  onDeny: () => void;
  onExit: () => void;
  onNext: () => void;
  onPlanning: () => void;
}) {
  return (
    <div className="proceed-terminal">
      <div className="terminal-label">HOW WOULD YOU LIKE TO PROCEED?</div>
      <div className="terminal-actions denial-actions">
        <button type="button" onClick={onPlanning}>
          Start Planning My Exit
        </button>
        <button type="button" onClick={onNext}>
          Still Not Sure
        </button>
        <button type="button" onClick={onDeny}>
          I Choose Denial
        </button>
        <button type="button" onClick={onExit}>
          Quick Exit
        </button>
      </div>
    </div>
  );
}

function ladderGaugeValues(progress: { clarity: number; preparedness: number; reality: number; options: number }): GaugeValue[] {
  return [
    {
      label: "CLARITY",
      value: progress.clarity,
      lowLabel: "FOG",
      highLabel: "CLEAR",
      state: gaugeState(progress.clarity, "CLEARER", "ONLINE", "WARMING"),
      tone: "cyan",
    },
    {
      label: "PREPAREDNESS",
      value: progress.preparedness,
      lowLabel: "LOW",
      highLabel: "READY",
      state: gaugeState(progress.preparedness, "BUILDING", "STARTED", "SPARK"),
      tone: "pink",
    },
    {
      label: "REALITY",
      value: progress.reality,
      lowLabel: "DISTORTED",
      highLabel: "STABLE",
      state: gaugeState(progress.reality, "STABLE", "CLEARING", "STATIC"),
      tone: "amber",
    },
    {
      label: "OPTIONS",
      value: progress.options,
      lowLabel: "LIMITED",
      highLabel: "OPEN",
      state: gaugeState(progress.options, "AVAILABLE", "OPENING", "LIMITED"),
      tone: "purple",
    },
  ];
}

function PlanningModule({
  onControlPanelChange,
  onNavigate,
}: {
  onControlPanelChange: (panel: ControlPanelState) => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const [mode, setMode] = useState<"ladder" | "response" | "complete" | "exit-planning">("ladder");
  const [activeRung, setActiveRung] = useState<LeavingLadderRung | null>(null);
  const [visitedRungIds, setVisitedRungIds] = useState<string[]>([]);
  const [responseDone, setResponseDone] = useState(false);
  const [progress, setProgress] = useState({
    clarity: 32,
    preparedness: 18,
    reality: 34,
    options: 24,
  });
  const [gaugeNotice, setGaugeNotice] = useState("LEAVING LADDER ONLINE. NO DECISION REQUIRED.");
  const [gaugeEmphasis, setGaugeEmphasis] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "exit-planning") return;

    onControlPanelChange({
      emphasis: gaugeEmphasis,
      gauges: ladderGaugeValues(progress),
      notice: gaugeNotice,
    });
  }, [gaugeEmphasis, gaugeNotice, mode, onControlPanelChange, progress]);

  function openRung(rung: LeavingLadderRung) {
    setActiveRung(rung);
    setResponseDone(false);
    setMode("response");
  }

  function completeRungTyping() {
    if (!activeRung) {
      setResponseDone(true);
      return;
    }

    setVisitedRungIds((current) => (current.includes(activeRung.id) ? current : [...current, activeRung.id]));
    setProgress((current) => ({
      clarity: clampGauge(current.clarity + activeRung.effect.clarity),
      preparedness: clampGauge(current.preparedness + activeRung.effect.preparedness),
      reality: clampGauge(current.reality + activeRung.effect.reality),
      options: clampGauge(current.options + activeRung.effect.options),
    }));
    setGaugeNotice(activeRung.effect.notice);
    setGaugeEmphasis(activeRung.effect.emphasis);
    setResponseDone(true);
  }

  function resetLadder() {
    setMode("ladder");
    setActiveRung(null);
    setVisitedRungIds([]);
    setResponseDone(false);
    setProgress({ clarity: 32, preparedness: 18, reality: 34, options: 24 });
    setGaugeNotice("LEAVING LADDER ONLINE. NO DECISION REQUIRED.");
    setGaugeEmphasis(null);
  }

  if (mode === "exit-planning") {
    return <ExitPlanningModule onControlPanelChange={onControlPanelChange} onNavigate={onNavigate} />;
  }

  return (
    <section className="assessment-shell leaving-ladder" aria-labelledby="ladder-title">
      {mode === "ladder" && (
        <div className="assessment-panel ladder-panel">
          <div className="terminal-label">MODULE: LEAVING LADDER</div>
          <h1 id="ladder-title">NOT READY DOES NOT MEAN STUCK.</h1>
          <p>
            You do not have to decide today. You can look at the ladder, touch one rung, and still
            keep your choices private.
          </p>
          <div className="ladder-rung-grid">
            {leavingLadderRungs.map((rung, index) => (
              <button
                className={visitedRungIds.includes(rung.id) ? "ladder-rung visited" : "ladder-rung"}
                key={rung.id}
                type="button"
                onClick={() => openRung(rung)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{rung.title}</strong>
                <small>{rung.premise}</small>
              </button>
            ))}
          </div>
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={() => setMode("exit-planning")}>
              Start Exit Planning
            </button>
            <button type="button" onClick={() => onNavigate("go-bag-prep", "/go-bag-prep")}>
              Go-Bag Prep
            </button>
            <button type="button" onClick={() => setMode("complete")}>
              I&apos;m Not Ready, But I Understand More Now
            </button>
            <button type="button" onClick={leaveSite}>
              Quick Exit
            </button>
          </div>
        </div>
      )}

      {mode === "response" && activeRung && (
        <div className={activeRung.id === "housing" ? "assessment-panel direct-panel ladder-panel" : "assessment-panel ladder-panel"}>
          <div className="terminal-label">SYSTEM RESPONSE</div>
          <h2>{activeRung.title}</h2>
          <TypedText
            className="system-typed-text"
            onDone={completeRungTyping}
            skipLabel="Print Response"
            text={activeRung.systemResponse}
          />
          {responseDone && (
            <>
              <div className="pattern-panel">
                <h3>ONE SMALL ACTION</h3>
                <p>{activeRung.suggestedAction}</p>
              </div>
              <div className="terminal-actions denial-actions">
                <button type="button" onClick={() => setMode("ladder")}>
                  Choose Another Rung
                </button>
                <button type="button" onClick={() => setMode("exit-planning")}>
                  Start Exit Planning
                </button>
                <button type="button" onClick={() => onNavigate("go-bag-prep", "/go-bag-prep")}>
                  Go-Bag Prep
                </button>
                <button type="button" onClick={() => onNavigate("local-help", "/local-help")}>
                  Find Local Help
                </button>
                <button type="button" onClick={() => onNavigate("legal", "/legal")}>
                  Legal
                </button>
                <button type="button" onClick={() => setMode("complete")}>
                  I&apos;m Not Ready, But I Understand More Now
                </button>
                <button type="button" onClick={leaveSite}>
                  Quick Exit
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {mode === "complete" && (
        <div className="assessment-panel ladder-panel">
          <div className="terminal-label">LADDER PAUSED</div>
          <h2>YOU DID NOT FAIL THE MODULE.</h2>
          <p>
            Not being ready is information, not a character flaw. Your system noticed more than it
            did before. That counts.
          </p>
          <div className="pattern-panel">
            <h3>WHAT CHANGED</h3>
            <p>
              {visitedRungIds.length > 0
                ? `${visitedRungIds.length} rung${visitedRungIds.length === 1 ? "" : "s"} reviewed. No answers saved.`
                : "No rungs selected yet. No answers saved."}
            </p>
          </div>
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={() => setMode("ladder")}>
              Return To The Ladder
            </button>
            <button type="button" onClick={() => setMode("exit-planning")}>
              Start Exit Planning
            </button>
            <button type="button" onClick={() => onNavigate("home", "/")}>
              Back To Terminal
            </button>
            <button type="button" onClick={resetLadder}>
              Clear This Session
            </button>
            <button type="button" onClick={leaveSite}>
              Quick Exit
            </button>
          </div>
        </div>
      )}

      {visitedRungIds.length > 0 && (
        <p className="session-note">Temporary ladder signals are erased when this session clears, refreshes, or exits.</p>
      )}
    </section>
  );
}

function ExitPlanningModule({
  onControlPanelChange,
  onNavigate,
}: {
  onControlPanelChange: (panel: ControlPanelState) => void;
  onNavigate: (module: ModuleKey, path: string) => void;
}) {
  const [mode, setMode] = useState<"intro" | "question" | "response" | "complete">("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [activeAnswer, setActiveAnswer] = useState<ExitAnswer | null>(null);
  const [responseDone, setResponseDone] = useState(false);
  const [answered, setAnswered] = useState<ExitAnswer[]>([]);
  const [gauges, setGauges] = useState<ExitGaugeState>({
    readiness: 25,
    exposure: 12,
    backup: 18,
    exposureFloor: 12,
  });
  const [gaugeNotice, setGaugeNotice] = useState("GAUGES INITIALIZED. CURRENT DATA: INSUFFICIENT. NO PLAN LOADED.");
  const [gaugeEmphasis, setGaugeEmphasis] = useState<string | null>(null);

  const currentQuestion = exitPlanningQuestions[questionIndex];

  useEffect(() => {
    onControlPanelChange({
      emphasis: gaugeEmphasis,
      gauges: exitGaugeValues(gauges),
      notice: gaugeNotice,
    });
  }, [gaugeEmphasis, gaugeNotice, gauges, onControlPanelChange]);

  function beginPlanning() {
    setMode("question");
  }

  function showEmergencyOptions() {
    setActiveAnswer(null);
    setResponseDone(false);
    setQuestionIndex(0);
    setMode("question");
  }

  function selectExitAnswer(answer: ExitAnswer) {
    setAnswered((current) => [...current, answer]);
    setActiveAnswer(answer);
    setResponseDone(false);
    setGaugeEmphasis(null);
    setMode("response");
  }

  function continuePlan() {
    setActiveAnswer(null);
    if (questionIndex >= exitPlanningQuestions.length - 1) {
      setMode("complete");
      return;
    }
    setQuestionIndex((current) => current + 1);
    setMode("question");
  }

  function clearPlanning() {
    setMode("intro");
    setQuestionIndex(0);
    setActiveAnswer(null);
    setResponseDone(false);
    setAnswered([]);
    setGauges({ readiness: 25, exposure: 12, backup: 18, exposureFloor: 12 });
    setGaugeNotice("GAUGES INITIALIZED. CURRENT DATA: INSUFFICIENT. NO PLAN LOADED.");
    setGaugeEmphasis(null);
  }

  function quickExitPlanning() {
    clearPlanning();
    leaveSite();
  }

  const completeExitTyping = useCallback(() => {
    if (!activeAnswer) {
      setResponseDone(true);
      return;
    }

    const effect = activeAnswer.effect;
    setGauges((current) => {
      const exposureFloor = Math.max(current.exposureFloor, effect.minExposure ?? current.exposureFloor);
      return {
        readiness: clampGauge(current.readiness + effect.readiness),
        exposure: Math.max(exposureFloor, clampGauge(current.exposure + effect.exposure)),
        backup: clampGauge(current.backup + effect.backup),
        exposureFloor,
      };
    });
    setGaugeNotice(`UPDATING EXIT READINGS... ${effect.notice}`);
    setGaugeEmphasis(
      effect.emphasis === "readiness"
        ? "EXIT READINESS"
        : effect.emphasis === "exposure"
          ? "EXPOSURE LEVEL"
          : "BACKUP STATUS",
    );
    setResponseDone(true);
  }, [activeAnswer]);

  const highExposure = gauges.exposure >= 66;
  const backupAvailable = gauges.backup >= 76;
  const recommendedStep = highExposure
    ? "review device safety before making further plans"
    : backupAvailable
      ? "identify one possible first-night destination"
      : "identify one public place reachable without transportation";

  return (
    <section className="assessment-shell" aria-labelledby="exit-title">
      {mode === "intro" && (
        <div className="assessment-panel">
          <div className="terminal-label">MODULE: EXIT PLANNING</div>
          <h1 id="exit-title">I KNOW I NEED TO LEAVE - NOW WHAT?</h1>
          <TypedText
            className="system-typed-text"
            skipLabel="Print Module Brief"
            text={
              "SYSTEM:\nEXIT REQUEST RECEIVED.\n\nKnowing you need to leave and being able to leave are not the same thing.\n\nThis module will not tell you to just leave. It will help identify what must happen first, what could go wrong, what options are available, and what you can do next.\n\nYour answers will not be saved."
            }
          />
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={beginPlanning}>
              Begin Exit Planning
            </button>
            <button type="button" onClick={showEmergencyOptions}>
              I Need Emergency Options
            </button>
            <button type="button" onClick={() => onNavigate("legal", "/legal")}>
              Understand My Choices First
            </button>
            <button type="button" onClick={() => onNavigate("home", "/")}>
              Back To Homepage
            </button>
            <button type="button" onClick={quickExitPlanning}>
              Quick Exit
            </button>
          </div>
        </div>
      )}

      {mode === "question" && currentQuestion && (
        <div className="assessment-panel">
          <div className="question-status">
            <span>{currentQuestion.phase}</span>
            <span>TEMP MEMORY ONLY</span>
          </div>
          <h2>{currentQuestion.prompt}</h2>
          <div className="answer-grid">
            {currentQuestion.answers.map((answer, index) => (
              <button key={answer.id} type="button" onClick={() => selectExitAnswer(answer)}>
                <span>{String.fromCharCode(65 + index)}</span>
                {answer.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "response" && activeAnswer && (
        <div className={activeAnswer.effect.minExposure && activeAnswer.effect.minExposure >= 46 ? "assessment-panel direct-panel" : "assessment-panel"}>
          <div className="terminal-label">SYSTEM RESPONSE</div>
          <h2>{activeAnswer.responseTitle}</h2>
          <TypedText
            className="system-typed-text"
            onDone={completeExitTyping}
            skipLabel="Print Response"
            text={`SYSTEM:\n${activeAnswer.response}`}
          />
          {responseDone && (
            <div className="proceed-terminal">
              <div className="terminal-label">HOW WOULD YOU LIKE TO PROCEED?</div>
              <div className="terminal-actions denial-actions">
                <button type="button" onClick={continuePlan}>
                  Continue Building My Plan
                </button>
                <button type="button" onClick={showEmergencyOptions}>
                  Show Emergency Options
                </button>
                <button type="button" onClick={() => onNavigate("home", "/")}>
                  I Need To Think
                </button>
                <button type="button" onClick={quickExitPlanning}>
                  Quick Exit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "complete" && (
        <div className="assessment-panel">
          <div className="terminal-label">EXIT SYSTEM STATUS</div>
          <h2>EXIT PLAN INITIALIZED.</h2>
          <p>You do not have to complete every task today. You do not have to announce your plan.</p>
          <div className="pattern-panel">
            <h3>NEXT RECOMMENDED STEP</h3>
            <p>{recommendedStep.toUpperCase()}.</p>
            <p>ONE ACTION IS STILL ACTION. CONTROL RETURNS IN INCREMENTS.</p>
          </div>
          <div className="terminal-actions denial-actions">
            <button type="button" onClick={() => onNavigate("local-help", "/local-help")}>
              Show Relevant Free Resources
            </button>
            <button type="button" onClick={() => onNavigate("legal", "/legal")}>
              Understand My Choices
            </button>
            <button type="button" onClick={clearPlanning}>
              Restart With A Different Barrier
            </button>
            <button type="button" onClick={clearPlanning}>
              Clear This Session
            </button>
            <button type="button" onClick={quickExitPlanning}>
              Quick Exit
            </button>
          </div>
        </div>
      )}
      {answered.length > 0 && <p className="session-note">Temporary planning signals are erased when this session clears, refreshes, or exits.</p>}
    </section>
  );
}

function ResourceModule({ moduleKey }: { moduleKey: Exclude<ModuleKey, "home" | "am-i-crazy" | "go-bag-prep"> }) {
  const page = modulePages[moduleKey];

  return (
    <section className="page-shell">
      <div className="page-kicker">
        <Compass aria-hidden="true" />
        <p className="eyebrow">{page.eyebrow}</p>
      </div>
      <h1>{page.title}</h1>
      <p>{page.description}</p>
      <div className="blank-state" aria-label={`${page.title} resources coming soon`}>
        <FileText aria-hidden="true" />
        <h2>Resources coming soon</h2>
        <p>
          This space is ready for the guided tools, checklists, and support content we will add
          next.
        </p>
      </div>
      <div className="module-chip-row" aria-hidden="true">
        <span><BookOpenCheck /> Planning</span>
        <span><Map /> Steps</span>
        <span><ShieldCheck /> Safety</span>
        <span><Sprout /> Rebuilding</span>
        <span><Scale /> Choices</span>
      </div>
    </section>
  );
}

export function App() {
  const [checkpointPassed, setCheckpointPassed] = useState(() => getCheckpointCleared());
  const [activeModule, setActiveModule] = useState<ModuleKey>(() => getInitialModule());
  const [controlPanel, setControlPanel] = useState<ControlPanelState>(defaultControlPanel);
  const [loadingModule, setLoadingModule] = useState<ModuleKey | null>(null);

  useEffect(() => {
    const syncRoute = () => setActiveModule(getInitialModule());
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    if (activeModule !== "am-i-crazy" && activeModule !== "planning" && activeModule !== "go-bag-prep") {
      setControlPanel(defaultControlPanel);
    }
  }, [activeModule]);

  const updateControlPanel = useCallback((panel: ControlPanelState) => {
    setControlPanel(panel);
  }, []);

  function navigate(module: ModuleKey, path: string) {
    if (module === activeModule && !loadingModule) {
      return;
    }

    window.history.pushState({}, "", path);
    setLoadingModule(module);
    window.setTimeout(() => {
      setActiveModule(module);
      setLoadingModule(null);
    }, 520);
  }

  function completeCheckpoint() {
    markCheckpointCleared();
    setCheckpointPassed(true);
  }

  if (!checkpointPassed) {
    return <WelcomeCheckpoint onComplete={completeCheckpoint} />;
  }

  const loadingLabel = navItems.find((item) => item.key === loadingModule)?.label;

  return (
    <TerminalChrome activeModule={loadingModule ?? activeModule} controlPanel={controlPanel} onNavigate={navigate}>
      {loadingModule && loadingLabel ? (
        <ModuleLoading label={loadingLabel} />
      ) : activeModule === "home" ? (
        <HomeModule />
      ) : activeModule === "am-i-crazy" ? (
        <AmICrazyModule onControlPanelChange={updateControlPanel} onNavigate={navigate} />
      ) : activeModule === "go-bag-prep" ? (
        <GoBagSimulator onControlPanelChange={updateControlPanel} onNavigate={navigate} onQuickExit={leaveSite} />
      ) : activeModule === "planning" ? (
        <PlanningModule onControlPanelChange={updateControlPanel} onNavigate={navigate} />
      ) : (
        <ResourceModule moduleKey={activeModule} />
      )}
    </TerminalChrome>
  );
}
