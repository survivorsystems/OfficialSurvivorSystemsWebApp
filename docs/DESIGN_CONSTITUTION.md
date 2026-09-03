# Survivor Systems Design Constitution

This document is the design source of truth for Survivor Systems. When older design notes, legacy CSS, or prior visual experiments conflict with it, this document wins unless the user gives a newer explicit instruction.

## Core Identity

Survivor Systems is an independent editorial publication that functions like a practical field manual. The design should help people understand complicated systems, locate useful resources, and determine what to do next.

The primary objective is: **Help users understand how the system works and what they can do about it.**

The design organizes, teaches, and provides personality without becoming the attraction itself. It should feel like a fiercely competent person has already studied the problem and organized the information for the user.

Before implementing a component, ask: **Does this help the user understand the system, find information, or know what to do next?** If not, simplify or remove it.

## Color System

Do not create a rainbow category system. The resource categories do not each receive their own color. Typography, labels, hierarchy, icons, section structure, and navigation carry most of the organizational burden.

- **Warm paper or cream:** primary page background.
- **Near-black or ink:** primary text and strong editorial typography.
- **Charcoal:** secondary text, borders, metadata, and secondary interface elements.
- **Muted olive:** primary supporting brand accent. Use for subtle brand details, section markers, selected navigation, quiet graphical details, and supporting controls. It is not the universal CTA color.
- **Deep navy:** legal, institutional, court, government, procedural, and authoritative reference material. Do not let it dominate the site.
- **Rust or brick red:** quotations, major ideas, key passages, editorial emphasis, and serious warnings where appropriate. Ordinary important information should not constantly look dangerous.
- **Ochre or mustard:** practical action, next steps, instructions, procedural guidance, and start-here pathways. It should not produce giant CTA buttons everywhere.

Warnings, serious limitations, deadlines, and information that could materially harm someone if missed receive a stronger rust or red treatment and an explicit textual label. Do not rely on color alone.

## Information Hierarchy

Visual emphasis follows this order:

1. Available resources and how to access them.
2. What the user should do next.
3. Understanding the system.
4. Supporting editorial context.
5. Brand decoration.
6. Product promotion.

Use explicit labels such as **Urgent**, **Important**, **Note**, **Eligibility**, **Deadline**, **Limitation**, and **Next Step**.

## Card Policy

Survivor Systems must not become a website made entirely of cards.

Cards are appropriate for actual discrete objects or actions, including a resource listing, tool, download, assessment, product, or next-action module.

Do not use cards for every paragraph, section, category, sentence needing emphasis, or navigation item. Prefer editorial grids, lists, rules, typography, whitespace, indexes, and full-width sections.

Never put cards inside cards unless the inner item is genuinely independent and the hierarchy cannot be expressed more clearly another way.

## Button Policy

Avoid giant promotional buttons and do not turn every interaction into a colorful rectangle. Primary actions should be obvious and visually sophisticated. Use restrained fills, borders, elegant typography, or strongly underlined text links according to the action's importance.

## Homepage

The homepage is the front page of a field manual, not a magazine cover, dashboard, store, or nonprofit landing page. Within about five seconds, the user should understand what they can do here.

Use a short editorial and functional hero followed immediately by visible navigation. Do not use an oversized decorative hero or begin with a giant mission statement.

Recommended flow:

1. Short editorial hero and immediate navigation.
2. Major system and category index.
3. Start-here pathways or high-value tools.
4. Featured practical guides and resources.
5. Selected editorial content.
6. About, methodology, and why Survivor Systems exists.

Present major problem areas as a beautiful field-manual index or table of contents, not a decorative card grid. Product promotion stays separate and must not compete with free help.

## Articles

Articles help someone deeply understand an issue. They prioritize readable line lengths, beautiful typography, headline hierarchy, narrative flow, evidence, and restrained editorial composition.

Articles may use pull quotes, illustrations, data, occasional callouts, section headings, and context boxes. Do not over-componentize long-form reading or turn every paragraph into a module.

Use a headline, deck, optional metadata, introduction, logical sections, restrained emphasis, conclusion, and a clearly identifiable **What You Can Do With This Information** section whenever meaningful action is available.

Articles explain. Guides operationalize.

## Guides

Guides function like operating manuals. They answer: **What do I do next?** and **Where can I quickly find the answer I need?**

Guides may use structured sections, anchored contents, checklists, diagrams, process navigation, expandable secondary detail, step modules, decision trees, and next-action panels. They should communicate location and navigation more strongly than articles.

Do not number every guide section. Use numbered steps only for a genuine sequence; otherwise use descriptive section names.

## Articles Versus Guides

Do not solve consistency by giving every content page an identical template.

- **Articles:** purpose is understanding; visual emphasis is typography, narrative, ideas, and evidence; structure is moderate.
- **Guides:** purpose is action; visual emphasis is navigation, process, actions, and reference material; structure is high.

Family resemblance comes from typography, palette, spacing, grid, labels, navigation, iconography, and interaction behavior.

## State Resource Pages

State pages are practical information systems, not editorial pages. Preserve the core flow:

**Choose resource type, narrow geographically, then view or download the relevant list.**

Do not require county selection first. Users often understand their need before they understand service geography.

State page order:

1. Short state-level introduction.
2. Restrained category selector.
3. County, region, or statewide filtering.
4. Results.
5. Download or export.

Use a compact index, filter, checklist, or selector rather than thirteen brightly colored category cards. Make statewide programs clearly distinguishable from local programs.

Resource results should be moderately dense, compact, scannable, and expandable. Do not create a huge card for every provider. Keep essential access information visible and allow secondary detail to expand.

Prominently show phone, website, application or access method, and physical location where relevant. Then show provider name, services, coverage, eligibility, limitations, and supporting details.

Explicitly label material limitations such as county restrictions, referral requirements, closure, immigration restrictions, unavailable funding, shelter restrictions, waitlists, and eligibility rules.

Aim for: **scan quickly, expand what matters.**

## Density And Disclosure

Primary information remains visible. Secondary context may collapse or expand. Do not solve density by splitting information across endless pages, hiding essential information, or dumping every detail onto the screen simultaneously.

## Page Families

Different information has different jobs:

- Articles read like articles.
- Guides function like operating manuals.
- Resource directories function like directories.
- Assessments function like interactive tools when assessments exist.
- Products function like a store.

The goal is not for visitors to admire the design system. The goal is for them to finally understand how the system works.
