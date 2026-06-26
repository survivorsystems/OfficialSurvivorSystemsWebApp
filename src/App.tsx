import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  BadgeDollarSign,
  BookOpenCheck,
  Compass,
  FileText,
  Map,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sprout,
} from "lucide-react";

type Resource = {
  title: string;
  description: string;
  items: string[];
};

type ModuleKey = "home" | "planning" | "leaving" | "rebuilding" | "local-help" | "legal" | "downloads";

const resources: Resource[] = [
  {
    title: "Planning",
    description: "Quiet preparation tools for decisions that may need to happen quickly.",
    items: [
      "Safety plan worksheet",
      "Document and identification checklist",
      "Emergency contact card",
      "Medication, children, and pet planning prompts",
    ],
  },
  {
    title: "Leaving",
    description: "Practical steps for leaving, relocating, or reaching immediate help.",
    items: [
      "Go-bag checklist",
      "Transportation and safe destination planning",
      "Phone and device safety reminders",
      "Emergency hotline and shelter links",
    ],
  },
  {
    title: "Rebuilding",
    description: "Resources for the long work after immediate danger has passed.",
    items: [
      "Housing and benefits checklist",
      "Financial recovery starter guide",
      "Legal and documentation next steps",
      "Support network and stabilization plan",
    ],
  },
];

const downloads = [
  {
    name: "Immediate Safety Checklist",
    price: "Free",
    description: "One-page checklist for urgent safety decisions.",
  },
  {
    name: "Safety Plan Worksheet",
    price: "$1.99",
    description: "A focused printable for mapping people, places, documents, and next moves.",
  },
  {
    name: "Go-Bag Checklist",
    price: "$1.99",
    description: "A practical packing list for essentials, medications, children, pets, and copies.",
  },
  {
    name: "Document Tracker",
    price: "$0.99",
    description: "A simple way to list IDs, records, benefits paperwork, and replacement steps.",
  },
  {
    name: "Rebuilding Budget Starter",
    price: "$1.99",
    description: "A low-pressure worksheet for urgent costs, income, aid, bills, and first goals.",
  },
];

const modulePages: Record<
  Exclude<ModuleKey, "home" | "downloads">,
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
  { key: "planning", label: "Planning", path: "/planning" },
  { key: "leaving", label: "Leaving", path: "/leaving" },
  { key: "rebuilding", label: "Rebuilding", path: "/rebuilding" },
  { key: "local-help", label: "Find Local Help", path: "/local-help" },
  { key: "legal", label: "Legal", path: "/legal" },
  { key: "downloads", label: "Downloads", path: "/#downloads" },
];

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

function getInitialModule(): ModuleKey {
  const path = window.location.pathname;
  const hash = window.location.hash;

  if (hash === "#downloads") {
    return "downloads";
  }

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
                I Understand — Continue
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
        <a className="brand" href="/" onClick={(event) => {
          event.preventDefault();
          onNavigate("home", "/");
        }}>
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
  return (
    <>
      <section className="hero" id="home">
        <div className="hero-copy">
          <h1>Survivor Systems: Built for support.</h1>
          <p>
            Explore practical tools and resources designed to help you move forward in the way
            that feels right for you.
          </p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => onNavigate("planning", "/planning")}>
              <BookOpenCheck aria-hidden="true" />
              Get Started
            </button>
          </div>
        </div>
      </section>

      <section className="resource-section" id="resources" aria-labelledby="resources-title">
        <aside className="support-card" aria-labelledby="support-title">
          <div className="support-icon">
            <ShieldCheck aria-hidden="true" />
          </div>
          <div>
            <h2 id="support-title">Support is available.</h2>
            <p>Wherever you are on your path, you can access resources that fit your needs.</p>
            <button className="text-link" type="button" onClick={() => onNavigate("local-help", "/local-help")}>
              Find local help near you
            </button>
          </div>
        </aside>
        <div className="library-panel">
          <div className="library-header">
            <div>
              <h2 id="resources-title">Resource Library</h2>
              <p>Search trusted guides, checklists, and tools.</p>
            </div>
            <label className="search-box">
              <Search aria-hidden="true" />
              <input type="search" placeholder="Search resources..." aria-label="Search resources" />
            </label>
          </div>
          <div className="resource-grid">
            {resources.map((resource) => (
              <article className="resource-card" key={resource.title}>
                <div className="card-icon">
                  {resource.title === "Planning" && <Map aria-hidden="true" />}
                  {resource.title === "Leaving" && <ShieldAlert aria-hidden="true" />}
                  {resource.title === "Rebuilding" && <Sprout aria-hidden="true" />}
                </div>
                <h3>{resource.title === "Planning" ? "Safety Planning Checklist" : resource.title}</h3>
                <p>{resource.description}</p>
                <button
                  className="text-link"
                  type="button"
                  onClick={() => onNavigate(resource.title.toLowerCase() as ModuleKey, `/${resource.title.toLowerCase()}`)}
                >
                  View Resource
                </button>
              </article>
            ))}
            <article className="resource-card">
              <div className="card-icon">
                <Scale aria-hidden="true" />
              </div>
              <h3>Legal Rights Basics</h3>
              <p>Understand basic rights, documents, and next-step options.</p>
              <button className="text-link" type="button" onClick={() => onNavigate("legal", "/legal")}>
                View Resource
              </button>
            </article>
          </div>
        </div>
      </section>

      <FeaturedGuides />
      <DownloadsModule />
    </>
  );
}

function FeaturedGuides() {
  return (
    <section className="featured-section" aria-labelledby="featured-title">
      <div className="section-heading row-heading">
        <h2 id="featured-title">Featured Guides</h2>
        <a className="text-link" href="#downloads">
          View all guides
        </a>
      </div>
      <div className="featured-grid">
        <article className="featured-card">
          <div className="guide-art portrait-art" aria-hidden="true">
            <ShieldCheck />
          </div>
          <div>
            <h3>A Guide to Safety and Confidence</h3>
            <p>Practical ways to protect yourself and your well-being.</p>
          </div>
        </article>
        <article className="featured-card">
          <div className="guide-art calm-art" aria-hidden="true">
            <Sprout />
          </div>
          <div>
            <h3>Emotional Support and Healing</h3>
            <p>Care for your mind and body as you move forward.</p>
          </div>
        </article>
        <article className="featured-card">
          <div className="guide-art future-art" aria-hidden="true">
            <Compass />
          </div>
          <div>
            <h3>Building a New Future</h3>
            <p>Set goals, build confidence, and create the life you deserve.</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function DownloadsModule() {
  return (
    <section className="downloads-section" id="downloads" aria-labelledby="downloads-title">
      <div className="section-heading">
        <p className="eyebrow">Choose only what helps</p>
        <h2 id="downloads-title">Individual downloads</h2>
      </div>
      <div className="download-list">
        {downloads.map((download) => (
          <article className="download-row" key={download.name}>
            <FileText aria-hidden="true" />
            <div>
              <h3>{download.name}</h3>
              <p>{download.description}</p>
            </div>
            <strong>{download.price}</strong>
            <button type="button" disabled>
              {download.price === "Free" ? (
                <ArrowDownToLine aria-hidden="true" />
              ) : (
                <BadgeDollarSign aria-hidden="true" />
              )}
              Coming Soon
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ResourceModule({ moduleKey }: { moduleKey: Exclude<ModuleKey, "home" | "downloads"> }) {
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
          This space is ready for the downloadable guides, checklists, and support content we
          will add next.
        </p>
      </div>
    </section>
  );
}

export function App() {
  const [checkpointPassed, setCheckpointPassed] = useState(false);
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

  if (!checkpointPassed) {
    return <WelcomeCheckpoint onComplete={() => setCheckpointPassed(true)} />;
  }

  const loadingLabel = navItems.find((item) => item.key === loadingModule)?.label;

  return (
    <TerminalChrome activeModule={loadingModule ?? activeModule} onNavigate={navigate}>
      {loadingModule && loadingLabel ? (
        <ModuleLoading label={loadingLabel} />
      ) : activeModule === "home" ? (
        <HomeModule onNavigate={navigate} />
      ) : activeModule === "downloads" ? (
        <DownloadsModule />
      ) : (
        <ResourceModule moduleKey={activeModule} />
      )}
    </TerminalChrome>
  );
}
