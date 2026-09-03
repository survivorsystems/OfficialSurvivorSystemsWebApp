# Survivor Systems Project Guidance

Read `docs/PROJECT_CONTEXT.md` before planning or implementing work in this repository.

## Product Principles

- Survivor Systems is a practical web application for people navigating domestic violence, coercive control, separation, and rebuilding.
- Preserve survivor agency. Do not diagnose users, order them to leave, or imply that one response fits every situation.
- Never recommend confronting an abusive person.
- Treat immediate danger, strangulation, stalking, confinement, credible threats, weapons, sexual violence, escalating behavior, and a survivor's own fear of serious harm as high-concern signals.
- Assessment answers, scores, circumstances, progress, and results remain temporary in-browser state. Do not persist or transmit them.
- Paid account and transaction data must be minimal and separate from assessment data.
- Every assessment result must include meaningful free direction. Paid resources may supplement, never replace, essential guidance.
- Quick Escape is a prominent, persistent safety control and must remain visually distinct.

## Current Product Direction

- Strategy owns assessments and the needs-based recommendation flow.
- Resources owns free guides and a clearly separate Subscriber Library.
- Surviving is the education area for staying safe while planning, documenting abuse, and preparing an exit.
- The preferred commercial model is recurring subscriber access, not per-file purchases or download-count passes.
- Supabase Storage holds private paid files; a database catalog describes them; server-side entitlement checks issue short-lived signed URLs.
- Owners receive permanent access independent of Stripe.

## Voice And Design

- Use plain, warm, direct language, like the founder speaking clearly to a friend.
- Use contractions. Avoid em dashes and institutional or clinical phrasing.
- Do not write as a large organization. Survivor Systems currently has one founder.
- Read `docs/DESIGN_CONSTITUTION.md` before any visual, layout, component, or page-template work. It is the current design source of truth.
- The current direction is an editorial publication and practical field manual: warm paper, ink, charcoal, muted olive, deep navy, rust, and ochre, with restrained semantic use of color.
- Do not over-cardify pages. Use cards only for genuine discrete objects or actions; prefer typography, rules, editorial grids, lists, indexes, whitespace, and full-width sections.
- Different page families must serve their distinct jobs: articles read, guides operationalize, directories scan and filter, and products shop.
- Do not revive earlier Matrix, terminal, Windows, faux-library, folk, neon, or heavily archival themes.
- Preserve the Go-Bag game's intentionally distinct visual language.

## Source Of Truth

When historical notes conflict, use this order:

1. The user's newest explicit instruction.
2. The current repository implementation.
3. `docs/PROJECT_CONTEXT.md`.
4. Older imported chat decisions.
