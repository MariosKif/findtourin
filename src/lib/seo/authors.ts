// Author profiles — Person entities for E-E-A-T (experience, expertise,
// authoritativeness, trustworthiness). Every blog post and guide should
// reference an author here by slug; the Person JSON-LD links to a
// discoverable bio page so Google can attribute editorial output to a
// real person rather than an anonymous brand.

export interface Author {
  slug: string;
  name: string;
  /** Job title at FindToursIn. */
  jobTitle: string;
  /** 60-100 word bio rendered on the author page and reused in passages. */
  bio: string;
  /** Areas of stated expertise — fed to Person.knowsAbout. AI engines
   *  use this when matching the author to query topics. */
  knowsAbout: string[];
  /** External profiles (LinkedIn, Twitter, personal site). Empty list is
   *  fine — only add verified profiles. */
  sameAs: string[];
  /** Image relative to /images/authors/ or absolute URL. Falls back to
   *  the FindToursIn logo if missing. */
  imageUrl?: string;
}

export const AUTHORS: Author[] = [
  {
    slug: 'findtoursin-editorial',
    name: 'FindToursIn Editorial',
    jobTitle: 'Editorial team',
    bio: 'The FindToursIn editorial team writes destination guides, planning advice, and tour-comparison content. We work with our network of vetted local agencies to fact-check on-the-ground details and update guides annually. All content is human-edited; we do not publish unedited AI-generated material.',
    knowsAbout: [
      'Tour planning',
      'Greek tourism',
      'Italian tourism',
      'Turkish tourism',
      'Balkan tourism',
      'Tour-operator vetting',
      'Travel safety',
    ],
    sameAs: [],
  },
];

export function getAuthor(slug: string): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}
