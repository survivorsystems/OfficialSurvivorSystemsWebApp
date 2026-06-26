import {
  ArrowDownToLine,
  ArrowLeft,
  BadgeDollarSign,
  BookOpenCheck,
  Compass,
  FileText,
  Map,
  MessageCircle,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import heroLandscape from "./assets/brand/hero-landscape.webp";

type Resource = {
  title: string;
  description: string;
  items: string[];
};

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

function leaveSite() {
  window.location.replace("https://iluvrocks.rocks");
}

const resourcePages: Record<
  string,
  {
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  "/planning": {
    eyebrow: "Planning resources",
    title: "Planning",
    description:
      "This page will hold safety planning tools, document checklists, contact worksheets, and preparation resources.",
  },
  "/leaving": {
    eyebrow: "Leaving resources",
    title: "Leaving",
    description:
      "This page will hold go-bag resources, device safety reminders, transportation planning, and immediate support links.",
  },
  "/rebuilding": {
    eyebrow: "Rebuilding resources",
    title: "Rebuilding",
    description:
      "This page will hold housing, legal, money, support network, and stabilization resources for the next chapter.",
  },
  "/local-help": {
    eyebrow: "Local support",
    title: "Find Local Help",
    description:
      "This page will hold links and tools for finding survivor-centered support in your area.",
  },
  "/legal": {
    eyebrow: "Legal basics",
    title: "Legal",
    description:
      "This page will hold plain-language legal rights resources, document checklists, and next-step guides.",
  },
};

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Survivor Systems home">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span>Survivor Systems</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="/planning">Planning</a>
        <a href="/leaving">Leaving</a>
        <a href="/rebuilding">Rebuilding</a>
        <a href="/local-help">Find Local Help</a>
        <a href="/legal">Legal</a>
        <a href="/#downloads">Downloads</a>
      </nav>
      <button className="quick-exit" type="button" onClick={leaveSite}>
        <ShieldAlert aria-hidden="true" />
        Leave Site
      </button>
    </header>
  );
}

function ResourcePage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <main>
      <Header />
      <section className="page-shell">
        <a className="back-link" href="/">
          <ArrowLeft aria-hidden="true" />
          Home
        </a>
        <div className="page-kicker">
          <Compass aria-hidden="true" />
          <p className="eyebrow">{eyebrow}</p>
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="blank-state" aria-label={`${title} resources coming soon`}>
          <FileText aria-hidden="true" />
          <h2>Resources coming soon</h2>
          <p>
            This space is ready for the downloadable guides, checklists, and support content we
            will add next.
          </p>
        </div>
      </section>
    </main>
  );
}

export function App() {
  const currentPage = resourcePages[window.location.pathname];

  if (currentPage) {
    return <ResourcePage {...currentPage} />;
  }

  return (
    <main>
      <Header />

      <section className="hero" id="home">
        <div className="hero-copy">
          <h1>Survivor Systems: Built for support.</h1>
          <p>
            Explore practical tools and resources designed to help you move forward in the way
            that feels right for you.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#resources">
              <BookOpenCheck aria-hidden="true" />
              Get Started
            </a>
            <a className="secondary-action" href="/local-help">
              <MessageCircle aria-hidden="true" />
              Talk to Someone
            </a>
          </div>
        </div>
        <img
          className="hero-art"
          src={heroLandscape}
          alt="Watercolor hills with a winding path and sunrise"
        />
      </section>

      <section className="resource-section" id="resources" aria-labelledby="resources-title">
        <aside className="support-card" aria-labelledby="support-title">
          <div className="support-icon">
            <ShieldCheck aria-hidden="true" />
          </div>
          <div>
            <h2 id="support-title">Support is available.</h2>
            <p>Wherever you are on your path, you can access resources that fit your needs.</p>
            <a className="text-link" href="/local-help">
              Find local help near you
            </a>
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
                <a className="text-link" href={`/${resource.title.toLowerCase()}`}>
                  View Resource
                </a>
              </article>
            ))}
            <article className="resource-card">
              <div className="card-icon">
                <Scale aria-hidden="true" />
              </div>
              <h3>Legal Rights Basics</h3>
              <p>Understand basic rights, documents, and next-step options.</p>
              <a className="text-link" href="/legal">
                View Resource
              </a>
            </article>
          </div>
        </div>
      </section>

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
            <img src={heroLandscape} alt="" />
            <div>
              <h3>Building a New Future</h3>
              <p>Set goals, build confidence, and create the life you deserve.</p>
            </div>
          </article>
        </div>
      </section>

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

      <footer className="site-footer">
        <a className="brand" href="/" aria-label="Survivor Systems home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>Survivor Systems</span>
        </a>
        <button className="quick-exit" type="button" onClick={leaveSite}>
          <ShieldAlert aria-hidden="true" />
          Leave Site
        </button>
      </footer>
    </main>
  );
}
