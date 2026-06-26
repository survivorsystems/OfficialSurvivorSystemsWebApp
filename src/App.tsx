import { useEffect, useMemo, useState } from "react";
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

type ModuleKey =
  | "home"
  | "am-i-crazy"
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

const modulePages: Record<
  Exclude<ModuleKey, "home" | "am-i-crazy">,
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
  { key: "planning", label: "Planning", path: "/planning" },
  { key: "leaving", label: "Leaving", path: "/leaving" },
  { key: "rebuilding", label: "Rebuilding", path: "/rebuilding" },
  { key: "local-help", label: "Find Local Help", path: "/local-help" },
  { key: "legal", label: "Legal", path: "/legal" },
];

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

const denialImages = [denialSupportOne, denialSupportTwo];

const checkpointMessage =
  "Survivor Systems cannot tell whether your device, browser, accounts, or connection are being monitored.\n\nPrivate or Incognito browsing may reduce some local history, but it does not hide activity from monitoring software, shared accounts, phone plans, networks, connected devices, or someone with access to this device.\n\nIf you think someone may be monitoring you, consider using a device and account they have never accessed before.\n\nContinuing is your choice.";

const privateBrowsingHelp = [
  "Private or Incognito windows can reduce some local browser history on this device.",
  "They do not hide activity from monitoring software, shared accounts, phone plans, networks, routers, backups, or someone with device access.",
  "If it is safe, open a private window from your browser menu before continuing.",
];

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

function TypedText({ text, onDone }: { text: string; onDone: () => void }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visibleLength, setVisibleLength] = useState(prefersReducedMotion ? text.length : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleLength(text.length);
      onDone();
      return;
    }

    setVisibleLength(0);
    const step = Math.max(8, Math.floor(text.length / 90));
    const interval = window.setInterval(() => {
      setVisibleLength((current) => {
        const next = Math.min(text.length, current + step);
        if (next >= text.length) {
          window.clearInterval(interval);
          onDone();
        }
        return next;
      });
    }, 16);

    return () => window.clearInterval(interval);
  }, [onDone, prefersReducedMotion, text]);

  const finished = visibleLength >= text.length;

  return (
    <>
      <pre className="typed-text">
        {text.slice(0, visibleLength)}
        <span className="terminal-cursor" aria-hidden="true" />
      </pre>
      {!finished && (
        <button className="text-button" type="button" onClick={() => setVisibleLength(text.length)}>
          Skip Typing
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
        <h1 id="checkpoint-title">Survivor Systems</h1>
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

function TerminalChrome({
  activeModule,
  children,
  onNavigate,
}: {
  activeModule: ModuleKey;
  children: React.ReactNode;
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
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>Survivor Systems</span>
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
        <div className="clarity-meter" aria-hidden="true">
          <span />
          <strong>CLARITY METER</strong>
        </div>
      </aside>
      <section className="terminal-screen">
        <header className="terminal-topbar">
          <div>
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
      </section>
    </main>
  );
}

function HomeModule({ onNavigate }: { onNavigate: (module: ModuleKey, path: string) => void }) {
  const homeOptions = navItems.filter((item) => item.key !== "home");

  return (
    <section className="home-terminal" aria-labelledby="home-title">
      <div className="terminal-label">USER TERMINAL</div>
      <h1 id="home-title">CHOOSE HOW TO PROCEED</h1>
      <p>
        Select a module. No account is required, and assessment answers stay only in this browser
        while the tool is open.
      </p>
      <div className="home-option-grid">
        {homeOptions.map((item, index) => (
          <button
            className={item.key === "am-i-crazy" ? "home-option primary-module" : "home-option"}
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key, item.path)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.label}</strong>
            <small>
              {item.key === "am-i-crazy"
                ? "Start a guided reality check."
                : `Open the ${item.label.toLowerCase()} module.`}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}

function AmICrazyModule({ onNavigate }: { onNavigate: (module: ModuleKey, path: string) => void }) {
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [activeResponse, setActiveResponse] = useState<AssessmentAnswer | null>(null);
  const [mode, setMode] = useState<"intro" | "question" | "response" | "denial" | "complete">("intro");
  const [denialImage, setDenialImage] = useState(denialImages[0]);

  const currentQuestion = assessmentQuestions[questionIndex];
  const patterns = Array.from(new Set(answers.map((answer) => answer.pattern).filter(Boolean)));

  function beginAssessment() {
    setStarted(true);
    setMode("question");
  }

  function selectAnswer(answer: AssessmentAnswer) {
    setAnswers((current) => [...current, answer]);
    setActiveResponse(answer);
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
  }

  function clearAndExit() {
    clearAssessment();
    leaveSite();
  }

  function startPlanning() {
    onNavigate("planning", "/planning");
  }

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
          <p>{activeResponse.response}</p>
          <ProceedControls
            onDeny={showDenial}
            onExit={clearAndExit}
            onNext={loadNextQuestion}
            onPlanning={startPlanning}
          />
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

function ResourceModule({ moduleKey }: { moduleKey: Exclude<ModuleKey, "home" | "am-i-crazy"> }) {
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
  const [loadingModule, setLoadingModule] = useState<ModuleKey | null>(null);

  useEffect(() => {
    const syncRoute = () => setActiveModule(getInitialModule());
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
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
    <TerminalChrome activeModule={loadingModule ?? activeModule} onNavigate={navigate}>
      {loadingModule && loadingLabel ? (
        <ModuleLoading label={loadingLabel} />
      ) : activeModule === "home" ? (
        <HomeModule onNavigate={navigate} />
      ) : activeModule === "am-i-crazy" ? (
        <AmICrazyModule onNavigate={navigate} />
      ) : (
        <ResourceModule moduleKey={activeModule} />
      )}
    </TerminalChrome>
  );
}
