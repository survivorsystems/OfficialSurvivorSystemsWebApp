import {
  ArrowDownToLine,
  BadgeDollarSign,
  BookOpenCheck,
  ExternalLink,
  FileText,
  HeartHandshake,
  Home,
  Lock,
  Map,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

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
    title: "Escape",
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
    name: "Planning Bundle",
    price: "$1.99",
    description: "Printable planning worksheets and document trackers.",
  },
  {
    name: "Rebuilding Bundle",
    price: "$1.99",
    description: "Housing, money, legal, and support planning sheets.",
  },
];

function leaveSite() {
  window.location.replace("https://weather.com");
}

export function App() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Survivor Systems home">
          <ShieldCheck aria-hidden="true" />
          <span>Survivor Systems</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#resources">Resources</a>
          <a href="#downloads">Downloads</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <button className="quick-exit" type="button" onClick={leaveSite}>
          <ShieldAlert aria-hidden="true" />
          Leave Site
        </button>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">Private, practical, survivor-centered</p>
          <h1>Planning, escape, and rebuilding resources without accounts or tracking.</h1>
          <p>
            Survivor Systems is being built as a quiet resource library for people navigating
            domestic violence. The foundation is simple: useful information, low-friction
            downloads, and no survivor data collection.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#resources">
              <BookOpenCheck aria-hidden="true" />
              View Resources
            </a>
            <a className="secondary-action" href="#downloads">
              <ArrowDownToLine aria-hidden="true" />
              See Downloads
            </a>
          </div>
        </div>
        <aside className="safety-panel" aria-labelledby="safety-title">
          <Lock aria-hidden="true" />
          <h2 id="safety-title">Safety note</h2>
          <p>
            This site will not ask for accounts or personal details. Browser history, shared
            devices, phone monitoring, and payment records may still create risk.
          </p>
        </aside>
      </section>

      <section className="resource-section" id="resources" aria-labelledby="resources-title">
        <div className="section-heading">
          <p className="eyebrow">MVP content map</p>
          <h2 id="resources-title">Three core paths</h2>
        </div>
        <div className="resource-grid">
          {resources.map((resource) => (
            <article className="resource-card" key={resource.title}>
              <div className="card-icon">
                {resource.title === "Planning" && <Map aria-hidden="true" />}
                {resource.title === "Escape" && <ShieldAlert aria-hidden="true" />}
                {resource.title === "Rebuilding" && <HeartHandshake aria-hidden="true" />}
              </div>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <ul>
                {resource.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="downloads-section" id="downloads" aria-labelledby="downloads-title">
        <div className="section-heading">
          <p className="eyebrow">Free first, paid optional</p>
          <h2 id="downloads-title">Downloads</h2>
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

      <section className="privacy-section" id="privacy" aria-labelledby="privacy-title">
        <div>
          <p className="eyebrow">Architecture boundary</p>
          <h2 id="privacy-title">What we will and will not store</h2>
        </div>
        <div className="privacy-grid">
          <article>
            <Home aria-hidden="true" />
            <h3>Public app</h3>
            <p>Pages and free downloads can be static, cacheable, and hosted on Vercel.</p>
          </article>
          <article>
            <BadgeDollarSign aria-hidden="true" />
            <h3>Stripe</h3>
            <p>Stripe Checkout handles payments. Survivor Systems does not touch card data.</p>
          </article>
          <article>
            <ExternalLink aria-hidden="true" />
            <h3>Supabase later</h3>
            <p>Supabase can store public resource metadata or protected download files, not profiles.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
