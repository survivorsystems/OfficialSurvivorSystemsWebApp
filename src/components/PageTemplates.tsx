import type { ReactNode } from "react";

type TemplateTone = "red" | "blue" | "green" | "yellow";

type BaseTemplateProps = {
  children: ReactNode;
  className?: string;
  eyebrow: string;
  intro: ReactNode;
  title: string;
  titleId: string;
  tone?: TemplateTone;
};

function templateClass(kind: string, tone: TemplateTone, className?: string) {
  return [`ss-template`, `ss-template-${kind}`, `ss-template-tone-${tone}`, className]
    .filter(Boolean)
    .join(" ");
}

export function EditorialPageTemplate({
  children,
  className,
  eyebrow,
  intro,
  quickMap = [],
  title,
  titleId,
  tone = "blue",
}: BaseTemplateProps & { quickMap?: string[] }) {
  return (
    <article className={templateClass("editorial", tone, className)} aria-labelledby={titleId}>
      <header className="ss-template-header">
        <div className="ss-template-heading">
          <p className="ss-template-eyebrow">{eyebrow}</p>
          <h1 id={titleId}>{title}</h1>
          <div className="ss-template-intro">{intro}</div>
        </div>
      </header>
      {quickMap.length ? (
        <nav className="ss-template-index" aria-label={`${title} section index`}>
          {quickMap.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </nav>
      ) : null}
      <div className="ss-template-body">{children}</div>
    </article>
  );
}

export function AssessmentPageTemplate({
  children,
  className,
  eyebrow = "PRIVATE SESSION",
  intro,
  progress,
  title,
  titleId,
  tone = "red",
}: BaseTemplateProps & { progress?: { current: number; total: number } }) {
  const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;
  return (
    <section className={templateClass("assessment", tone, className)} aria-labelledby={titleId}>
      <header className="ss-template-header ss-assessment-header">
        <div className="ss-template-heading">
          <p className="ss-template-eyebrow">{eyebrow}</p>
          <h1 id={titleId}>{title}</h1>
          <div className="ss-template-intro">{intro}</div>
        </div>
        <aside className="ss-template-status">
          <span>PRIVACY</span><strong>IN BROWSER</strong><small>ANSWERS ARE NOT SAVED</small>
        </aside>
      </header>
      {progress ? (
        <div className="ss-assessment-progress" aria-label={`Question ${progress.current} of ${progress.total}`}>
          <span style={{ width: `${percentage}%` }} /><b>{progress.current} / {progress.total}</b>
        </div>
      ) : null}
      <div className="ss-template-body">{children}</div>
    </section>
  );
}

export function InteractiveToolTemplate({
  actions,
  children,
  className,
  eyebrow,
  intro,
  output,
  title,
  titleId,
  tone = "green",
}: BaseTemplateProps & { actions?: ReactNode; output?: ReactNode }) {
  return (
    <section className={templateClass("tool", tone, className)} aria-labelledby={titleId}>
      <header className="ss-template-header">
        <div className="ss-template-heading">
          <p className="ss-template-eyebrow">{eyebrow}</p>
          <h1 id={titleId}>{title}</h1>
          <div className="ss-template-intro">{intro}</div>
        </div>
        <aside className="ss-template-status"><span>PRIVACY</span><strong>IN BROWSER</strong><small>NOT SAVED</small></aside>
      </header>
      <div className="ss-tool-workspace">
        <div className="ss-tool-input">{children}</div>
        {output ? <aside className="ss-tool-output" aria-live="polite">{output}</aside> : null}
      </div>
      {actions ? <footer className="ss-template-actions">{actions}</footer> : null}
    </section>
  );
}

export function CommercePageTemplate({
  children,
  className,
  eyebrow,
  intro,
  notice = "Preview first. Choose access only when it is useful.",
  title,
  titleId,
  tone = "yellow",
}: BaseTemplateProps & { notice?: string }) {
  return (
    <section className={templateClass("commerce", tone, className)} aria-labelledby={titleId}>
      <header className="ss-template-header">
        <div className="ss-template-heading">
          <p className="ss-template-eyebrow">{eyebrow}</p>
          <h1 id={titleId}>{title}</h1>
          <div className="ss-template-intro">{intro}</div>
        </div>
        <aside className="ss-template-status"><span>SUBSCRIPTION</span><strong>MONTHLY</strong><small>CANCEL ANYTIME</small></aside>
      </header>
      <p className="ss-commerce-notice">{notice}</p>
      <div className="ss-template-body">{children}</div>
    </section>
  );
}

export function TemplateSection({ children, eyebrow, title, titleId }: { children: ReactNode; eyebrow?: string; title: string; titleId?: string }) {
  return (
    <section className="ss-template-section" aria-labelledby={titleId}>
      {eyebrow ? <p className="ss-template-eyebrow">{eyebrow}</p> : null}
      <h2 id={titleId}>{title}</h2>
      {children}
    </section>
  );
}
