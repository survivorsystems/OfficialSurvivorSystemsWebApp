# Survivor Systems Project Context

Imported from prior Codex and ChatGPT tasks on 2026-08-10. This is a curated project memory, not a verbatim transcript. It preserves product decisions, requirements, content direction, architecture, and implementation history while excluding unrelated conversation.

## Mission

Survivor Systems is a web-based application offering planning, escape, stabilization, and rebuilding resources for survivors of domestic violence and coercive control. It exists because survivors are often forced to become experts in safety planning, housing, benefits, finances, documentation, family court, technology safety, and trauma while navigating fragmented systems.

Core framing:

> Practical tools for rebuilding every system abuse disrupted.

The product should help a person understand their circumstances, identify what matters first, and increase their practical options without taking away their agency.

## Safety Position

Survivor Systems does not automatically tell someone to leave immediately. Abrupt departure without housing, money, transportation, identification, communication, legal information, medication, documents, or a realistic plan can create additional danger and make a sustainable exit harder.

When there is no identified immediate danger, maintaining the safest workable status quo while quietly preparing may be appropriate. Preparation can include protecting access to housing, income, transportation, documents, benefits, children, pets, property, evidence, privacy, and outside support.

Urgency is not limited to prior physical or sexual assault. High-concern conditions include strangulation, confinement, stalking, escalating surveillance, credible threats, weapons, threats involving children or pets, medical sabotage, dangerous driving, abduction threats, severe escalation, and the survivor's belief that serious harm may occur.

Three planning lanes guide recommendations:

1. **Maintain and prepare:** Quietly stabilize money, housing, documents, transportation, privacy, evidence, and support.
2. **Accelerated planning:** Escalating control, stalking, threats, financial sabotage, housing interference, or growing unpredictability require contingencies and outside support.
3. **Immediate safety response:** Violence, sexual assault, strangulation, confinement, weapons, credible death or abduction threats, severe escalation, or imminent serious harm require urgent individualized support.

Never recommend confronting or announcing plans to the abusive person. The survivor remains the authority on when, where, and how to act.

## Privacy Model

The original promise was that Survivor Systems would collect no user data. The refined, accurate rule is:

- Assessment answers, scores, personal circumstances, progress, and results are never stored or transmitted.
- Assessments run in temporary React/browser state and disappear when cleared or closed.
- No assessment profiles or history.
- Public visitors can browse the resource catalog and previews without signing in.
- Paid access may use minimal email/account and transaction data needed to recognize entitlement.
- Stripe handles payment information.
- Subscriber identity and access data must remain separate from assessment data.

## Information Architecture

### Strategy

Strategy is the assessment hub. The former Advocacy route was renamed Strategy. Legacy `/advocacy` links may redirect for compatibility. Assessments open inline in the normal page instead of a modal.

The homepage entry point is a **Needs Assessment** or **Strategy Assessment**, not a clarity assessment. It helps a visitor determine where to start.

### Resources

Resources contains free guides, education, practical tools, and the separately labeled Subscriber Library.

Access states should be immediately understandable:

- Free / Open Now
- Subscriber / Preview
- Coming Soon

Free resources remain substantial. A person in crisis should never receive only a sales prompt.

### Surviving

The former Learn More area is named **Surviving**. Its planned content covers staying safe during the planning phase, documenting abuse, preparing an exit, and related education.

### Support

There is a Support page and a donation entry point from Resources. Stripe donation checkout is configured through `VITE_STRIPE_DONATION_URL` when available.

## Strategy Planner

The Strategy Planner is a rules-based, branching recommendation engine, not a diagnostic quiz and not an AI profiler. It should ask only relevant questions, allow skipping, keep answers temporary, and return a prioritized strategy map instead of a reductive danger percentage.

Core variables:

1. Current stage: seeking clarity, wants to leave but is not ready, preparing to leave, recently left, ongoing post-separation abuse, or rebuilding.
2. Immediate safety: no identified immediate danger, unsure, escalating, or immediate danger.
3. Financial access: stable/full access, monitored or restricted access, irregular income/benefits, or no income/access.
4. Housing: stable, temporary, needed before leaving, emergency need, homeless, or living in a vehicle.
5. Systems involved: family court, criminal/protective-order court, CPS/child welfare, police, benefits/public assistance, or none.

Additional pressure points and constraints include children, pets, disability, pregnancy, immigration, rural isolation, transportation, identification, digital monitoring, stalking, employment, documentation, legal deadlines, and professional support already involved.

Results should contain:

- Your Current Position
- Focus on These First
- Up to five Recommended Resources
- Up to three Useful Later resources
- Immediate-safety guidance when triggered
- Clear indications of what can be done independently and what needs outside help

Resource matching should use transparent tags and priority scores. Immediate-safety resources override ordinary scoring. Every result includes meaningful free resources.

Initial resource set discussed:

- Is It Love or Fear?
- Can They Change?
- Coercive Control Assessment
- Financial Captivity Assessment
- Exit Strategy Planner
- Financial Separation Checklist
- Housing Options Planner
- Digital Privacy Audit
- First 30 Days After Leaving
- Post-Separation Control Assessment
- Stalking Documentation Log
- Family Court Basics
- Benefits and Assistance Guide
- Financial Recovery Planner

Test scenarios should include gradual exit preparation with some income/freedom, recent departure with no income and temporary housing needs, post-separation stalking plus family court, uncertainty about whether behavior is abuse, and financial rebuilding after abuse.

## Assessments

Known assessment work includes coercive control, financial captivity, and post-separation control. The Post-Separation Control Assessment was designed as a ten-page assessment with 50 scored questions across ten control domains, five interpretation ranges, high-concern overrides, course-of-conduct documentation guidance, and tactic-specific support options.

Assessment UI rules:

- One category per screen when appropriate.
- Visible progress.
- Back, next, close, and restart controls.
- Plain language and black text on light assessment surfaces.
- Inline, responsive presentation with normal page scrolling.
- No modal language or modal accessibility semantics for inline flows.
- No persistence or external transmission.

## Subscriber Library Architecture

The current commercial direction is one recurring subscription with unlimited library viewing/download language. Earlier per-file purchases, access passes, permanent unlock counts, and download counters are obsolete.

Recommended layers:

1. A public catalog with title, category, description, cover, preview, page count/type, and access label.
2. Private PDFs in Supabase Storage.
3. Minimal access records synchronized from Stripe.

Use durable paths such as `housing/housing-options/v1/housing-options.pdf`. Categories belong in folders and catalog records, not separate buckets.

The catalog should include fields such as `id`, `slug`, `title`, `description`, `category`, `subcategory`, `storage_path`, `preview_images`, `page_count`, `access_level`, `is_published`, `version`, `sort_order`, and timestamps.

Access flow:

1. Visitor browses catalog and previews.
2. Visitor subscribes through Stripe Checkout.
3. Stripe webhook updates access in Supabase.
4. Subscriber signs in with low-friction email magic link.
5. A server-side endpoint verifies authentication and entitlement.
6. The endpoint returns a Supabase signed URL lasting roughly two to five minutes.

Never expose a service key in frontend variables, make paid buckets public, embed permanent PDF URLs in React, or use filenames as the catalog.

Owner access must never depend on Stripe. The intended rule is:

```text
OWNER -> always allow
ACTIVE SUBSCRIBER -> allow while active
EVERYONE ELSE -> previews and subscription CTA
```

Suggested owner record: Supabase Auth UUID, `access_type = owner`, `active = true`, `expires_at = null`, `source = admin`. Do not identify the owner by a frontend email check. The username previously supplied was `survivorsystems`, but it still must be resolved to an Auth UUID securely.

The latest original task ended while attempting to create or verify this owner record. It was not confirmed complete.

## Voice

- Friendly, direct, warm, and practical.
- Written like the founder explaining something clearly to a friend.
- Use contractions.
- Avoid em dashes.
- Avoid generic nonprofit, clinical, legalistic, or patronizing language.
- Do not use organizational "we" language unless the founder explicitly changes that rule.
- Information can be neutral rather than awkwardly first- or third-person.
- Do not dramatize danger with loud screens that could increase risk if someone else sees the device.

## Current Visual Direction

Several earlier concepts were explored and later rejected or superseded: Matrix, terminal/operating-system UI, Windows, folk, neon, faux-library, antique archive, and modern field manual.

The newest implemented direction is Bauhaus-inspired and should be treated as current:

- Warm parchment canvas with balanced blue, yellow, green, and red accents.
- Flat geometric sections and asymmetric composition.
- Hard edges, clear rules, and strong information hierarchy.
- Space Grotesk for display typography and Inter for body/control typography.
- Black readable copy on white/parchment content surfaces.
- Consistent flat controls and yellow selected states for assessment answers.
- No decorative CSS icons outside navigation.
- No leftover terminal commands, system status labels, "LIVE", "OPENABLE", faux-window chrome, ornamental archival cards, gradients, glows, or rounded legacy surfaces.
- Quick Escape remains a large, distinctive emergency control.
- Go-Bag game artwork may retain its separate visual world because it supports gameplay.

Reusable template families were previously implemented for editorial guides/articles, assessments, interactive tools, and checkout/library pages.

## Latest Known Implementation History

The previous working repository was:

`C:\Users\heath\Documents\Codex\2026-06-25\let-s-start-building-survivor-systems`

Known pushed commits, oldest to newest among the imported recent work:

- `679df1d` reusable page templates
- `5418477` typography and flat geometric surfaces
- `ec8f441` simplified shell, Strategy rename, inline assessments
- `6d2b51a` unified controls and assessment restyle
- `1629f1f` separated free and paid resource paths
- `c8b2e9d` black assessment text
- `4f540ac` homepage Strategy Assessment panel and matched lower cards
- `8027888` assessment scrolling fix
- `c88f058` Strategy/Resources information architecture and subscriber model
- A later unlisted commit added the needs-assessment naming, larger Quick Escape, Surviving rename, and `/resources/access` routing.

The original codebase used React/Vite and deployed through GitHub to Vercel. It had Supabase and Stripe-related configuration. The current repository was empty when this memory was imported, so no source code was copied by this operation.

## Open Work

- Bring the actual application source into this official repository or connect it to the existing GitHub remote.
- Confirm the newest commit and deployment state from the old repository.
- Complete secure Supabase owner entitlement using the Auth UUID.
- Build the server-side signed-resource endpoint.
- Build and verify Stripe subscription webhook synchronization.
- Connect the Subscriber Library catalog to Supabase without exposing private storage.
- Finish the Surviving educational content.
- Continue developing the Strategy/Needs Assessment recommendation engine and map real resource metadata to it.

