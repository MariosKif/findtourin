# FindToursIn Blog Post Creation Rules

This document defines the rules, structure, and template for creating blog posts on FindToursIn.

---

## Configuration

| Setting | Value |
|---|---|
| **Brand Name** | `FindToursIn` |
| **Site URL** | `https://www.findtoursin.com` |
| **Blog Content Dir** | `src/content/blog` |
| **Default Author** | `FindToursIn` |
| **Categories** | Destinations, Travel Tips, Guides, Agency Tips, Sustainable Travel |
| **Language** | English only |

---

## Duplicate Content Check (MANDATORY FIRST STEP)

Before writing any new blog post, you MUST check all existing posts for content overlap:

1. **Read every post** in `src/content/blog/` and review their titles, focus keywords, and topics
2. **Compare the proposed topic** against every existing post. If another post already covers the same focus keyword, the same core topic, or answers the same primary question, DO NOT create the new post
3. **Check for partial overlap.** If an existing post covers 50%+ of the same content, either skip the new post or choose a sufficiently different angle
4. **Log the check.** Before writing, list all existing post titles and confirm the new topic is unique

If duplicate or overlapping content is found, inform the user and suggest an alternative topic.

---

## Allowed Topics

Blog posts should cover travel and tourism topics that drive organic traffic to FindToursIn:

| Topic Area | Examples |
|---|---|
| **Destinations** | Country guides, city guides, hidden gems, seasonal travel |
| **Travel Tips** | Packing, budgeting, safety, sustainable travel, first-time tips |
| **Guides** | How to choose tours, agency comparison, booking tips |
| **Agency Tips** | Growing a tour business, listing optimization, marketing |
| **Sustainable Travel** | Eco-tourism, responsible travel, carbon footprint |

### Rules for All Content

1. **Every post must tie back to FindToursIn.** Include internal links to tour pages, category pages, and the platform
2. **Maintain the 9+ internal links rule.** All posts must include 9+ links with varied anchor text
3. **Brand positioning.** Position FindToursIn as the expert tour discovery platform. Use phrases like "Browse tours on FindToursIn", "Find your perfect tour", "Discover experiences on FindToursIn"

---

## File Location & Naming

- **Directory:** `src/content/blog/`
- **Filename:** Lowercase, hyphen-separated slugs containing the focus keyword. Max 70 characters
- **Example:** `best-greece-tours-summer-2026.mdx`
- **Format:** MDX (`.mdx`)
- **Focus keyword must appear in the URL/slug**

---

## Frontmatter Schema

Every blog post must include this frontmatter:

```yaml
---
title: "Your SEO-Optimized Title Here"
description: "A compelling meta description (145-152 characters). Include focus keyword naturally."
date: "YYYY-MM-DD"
updatedDate: "YYYY-MM-DD"  # optional, set when content is updated
author: "FindToursIn"
category: "Destinations"
tags:
  - primary keyword
  - secondary keyword
  - related term
  - long tail keyword
  - destination name
featured: false
---
```

### Frontmatter Field Rules

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | 55-58 characters. Focus keyword near beginning. Must follow Title Power Formula. |
| `description` | string | Yes | **145-152 characters strictly.** Include focus keyword naturally. |
| `date` | string | Yes | Format: `YYYY-MM-DD` |
| `updatedDate` | string | No | Set when content is updated. |
| `author` | string | Yes | Always `"FindToursIn"` |
| `category` | string | Yes | One of: Destinations, Travel Tips, Guides, Agency Tips, Sustainable Travel |
| `tags` | array | Yes | 5-12 relevant tags. Include destination names, activity types, and long-tail variations. |
| `featured` | boolean | Yes | Set `true` for only ONE post (the featured post on blog listing). All others `false`. |

---

## Title Power Formula

Every blog post title MUST follow all 4 rules:

1. **Focus keyword near the beginning** of the title
2. **At least 1 power word** (Ultimate, Best, Proven, Essential, Secret, Perfect, Complete, Expert, Definitive, Effortless, Incredible)
3. **At least 1 number** (e.g., "7 Best", "Top 10", "in 2026", "5 Steps")
4. **Positive or negative sentiment word** (e.g., "Free", "Easy", "Without", "Amazing", "Simple", "Fast", "Affordable")

**Title length: 55-58 characters.**

Examples:
- "7 Best Greece Tours for an Amazing Summer in 2026"
- "Top 5 Essential Tips to Choose the Perfect Tour Agency"
- "10 Proven Sustainable Travel Tips for Easy Eco-Tourism"

---

## Technical SEO Requirements

| Requirement | Target |
|---|---|
| Focus keyword in URL/slug | Yes, max 70 chars |
| Focus keyword in SEO title | Yes, 55-58 chars, near beginning |
| Focus keyword in meta description | Yes, 145-152 chars |
| Focus keyword in first paragraph | Yes, within first 2 sentences |
| Focus keyword in H2/H3 subheadings | Yes, in at least 3 subheadings |
| Keyword density | 2.3% - 2.7% of total word count |
| Internal links | 9+ links, front-loaded and throughout body |
| External links | 6-10 authoritative sources |
| Total word count | 1,200 - 1,500 words strictly |
| Short paragraphs | 2-4 sentences max |
| Bullet points | Where structurally appropriate, max 4 per list |

### Internal Linking Strategy

**9+ internal links minimum** distributed across the post:

| Link Target | Anchor Text Variations |
|---|---|
| `/tours` | "browse tours", "explore tours on FindToursIn", "find your perfect tour" |
| `/tours?country=Greece` | "tours in Greece", "Greek tour experiences" |
| `/tours?category=Adventure` | "adventure tours", "outdoor experiences" |
| `/tours?category=Cultural` | "cultural tours", "heritage experiences" |
| `/tours?category=Food+%26+Wine` | "food tours", "culinary experiences" |
| `/tours?category=Nature` | "nature tours", "eco-friendly tours" |
| `/tours?category=Hiking+%26+Trekking` | "hiking tours", "trekking experiences" |
| `/tours?category=Beach+%26+Island` | "beach tours", "island hopping" |
| `/blog` | "our travel blog", "more travel tips" |
| `/blog/[other-post]` | Cross-link to related posts by name |
| `/about` | "about FindToursIn", "our mission" |
| `/contact` | "contact us", "get in touch" |

**Rules:**
- Front-load links: 2-3 links in the first 300 words
- Spread remaining links evenly across body sections
- Never repeat the same anchor text back-to-back
- Use descriptive anchor text (never "click here")

### External Linking Strategy

**6-10 authoritative external links** per post:

| Source Type | Examples |
|---|---|
| Tourism organizations | UNWTO, WTTC, national tourism boards |
| Travel authorities | Lonely Planet, National Geographic Travel |
| Sustainability | GSTC, UNESCO World Heritage, WWF |
| Government | Embassy sites, visa information pages |
| Statistics | Statista, World Bank tourism data |

---

## Content Structure

### 1. Key Takeaways (Required)

```markdown
> **Key Takeaways:** A direct answer to the post's main question in 2-3 sentences. Include a link to [FindToursIn](https://www.findtoursin.com). State the main value proposition clearly for featured snippets.
```

- Placed at the very beginning of content (after frontmatter)
- 2-3 sentences maximum
- Must contain the focus keyword
- Written in direct-answer format for AI Overviews

### 2. Introduction (Required)

- 2-3 short paragraphs
- **Focus keyword in first paragraph, within first 2 sentences**
- Hook with a relatable problem or question
- Include a direct answer/definition paragraph for snippet extraction
- 2-3 internal links to FindToursIn
- Establish authority ("Based on our experience", "We've curated hundreds of tours")

### 3. Body Sections (Required, 4-6 sections)

```markdown
## H2 Section Title With Focus Keyword

Short introductory paragraph.

### H3 Sub-Section Title

Detailed content with paragraphs and bullet points.
```

**Rules:**
- Every H2 must have at least one H3 sub-section
- Focus keyword in at least 3 H2/H3 headings
- Paragraphs: 2-4 sentences max
- Bullet points: max 4 per list, start with **bold lead text**
- Include at least one clear definition paragraph per section for AI citation

### 4. Comparison Table (Recommended)

Use when comparing destinations, tour types, or methods:

```markdown
| Destination | Best For | Season | Price Range |
|---|---|---|---|
| Santorini | Romance | Apr-Oct | €€€ |
| Crete | Adventure | May-Sep | €€ |
```

### 5. Final Section (Required)

```markdown
## Final Thoughts
```

- 2-3 paragraphs wrapping up
- CTA with link to relevant tour page
- Reinforce main value proposition

### 6. FAQ Section (Required, 5-6 questions)

```markdown
## Frequently Asked Questions

### Question text here?

Answer paragraph. 2-3 sentences. Clear, direct, informative.
```

**Rules:**
- 5-6 questions as H3 headings
- Start each answer with a direct statement (for AI extraction)
- 2-3 sentences per answer, no bullet points
- Include focus keyword naturally
- Write questions people actually search for

---

## AI Visibility Layer

Every post must be optimized for AI Overviews and featured snippets:

1. **Direct answer in Key Takeaways.** First 2-3 sentences answer the main question directly
2. **FAQ section.** Google pulls FAQ answers for AI citations
3. **Definition paragraphs.** 2-3 paragraphs per post that clearly define/explain concepts
4. **Tables and lists.** AI Overviews prefer structured data
5. **Authority signals.** Confident language: "The best approach", "Here's exactly how", "We recommend"

---

## Writing Style Rules

1. **No em dashes.** Never use `—`. Use periods, commas, or rewrite
2. **No exclamation marks in headings**
3. **Max 4 bullet points per list**
4. **Bullet points use bold leads:** `- **Bold text.** Explanation follows`
5. **Short paragraphs.** 2-4 sentences max
6. **Active voice.** "FindToursIn helps you discover" not "Tours can be discovered"
7. **No filler phrases.** Remove "In today's world", "It's important to note"
8. **Brand name consistency.** Always `FindToursIn` with exact casing
9. **Word count: 1,200-1,500 words strictly**
10. **Keyword density: 2.3%-2.7%**
11. **Authority tone.** Write with confidence. No hedging ("maybe", "might", "could possibly")
12. **Include current year** in titles when relevant

---

## Checklist Before Publishing

### Duplicate Content
- [ ] Read all existing posts before writing
- [ ] Confirmed no existing post covers same focus keyword or topic
- [ ] No 50%+ content overlap

### Technical SEO
- [ ] Focus keyword in URL/slug (max 70 chars)
- [ ] Focus keyword in title (55-58 chars, near beginning)
- [ ] Focus keyword in meta description (145-152 chars)
- [ ] Focus keyword in first paragraph (first 2 sentences)
- [ ] Focus keyword in 3+ subheadings
- [ ] Keyword density 2.3%-2.7%
- [ ] 9+ internal links, front-loaded
- [ ] 6-10 external authoritative links
- [ ] Word count 1,200-1,500

### Title Power Formula
- [ ] Focus keyword near beginning
- [ ] At least 1 power word
- [ ] At least 1 number
- [ ] Positive or negative sentiment word

### Content Structure
- [ ] Key Takeaways blockquote with direct answer
- [ ] Every H2 has at least one H3
- [ ] No em dashes
- [ ] No bullet list over 4 items
- [ ] Short paragraphs (2-4 sentences)
- [ ] Comparison table or structured list included
- [ ] FAQ section with 5-6 questions as H3
- [ ] Final section with CTA

### AI Visibility
- [ ] Direct answer format in Key Takeaways
- [ ] Clear definition paragraphs for AI extraction
- [ ] FAQ answers start with direct statements
- [ ] Tables/lists used where applicable
- [ ] Authority signals throughout (no hedging)

### Quality
- [ ] Zero typos, perfect grammar
- [ ] Unique value, not rehashed info
- [ ] E-E-A-T signals present
- [ ] `npm run build` passes without errors
