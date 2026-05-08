// Dynamic OG image generator. Renders a 1200x630 PNG social-share card
// with the requested title, optional subtitle, and the FindToursIn brand
// stripe. Used by:
//   - Tour detail pages: /api/og?title=Acropolis%20Walking%20Tour&subtitle=Athens%2C%20Greece
//   - Blog posts:        /api/og?title=Best%20Greece%20Tours%202026&subtitle=Travel%20guide
//   - Hub pages:         /api/og?title=Tours%20in%20Greece%202026&subtitle=Browse%2016%20tours
//
// Vercel @vercel/og uses Satori to render React-style elements to PNG at
// edge-function speed (~50-150ms). Output is cached aggressively (1 year)
// because the same query string always produces the same image.

import { ImageResponse } from '@vercel/og';
import type { APIRoute } from 'astro';

export const prerender = false;

const PRIMARY = '#4361ee';
const PRIMARY_DARK = '#3046b3';
const BG = '#0b1220';
const TEXT = '#ffffff';
const MUTED = 'rgba(255, 255, 255, 0.7)';

function safeText(input: string | null, fallback: string, max = 100): string {
  if (!input) return fallback;
  const s = input.trim();
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const title = safeText(url.searchParams.get('title'), 'FindToursIn', 80);
  const subtitle = safeText(url.searchParams.get('subtitle'), 'Tours from trusted local agencies', 90);
  const eyebrow = safeText(url.searchParams.get('eyebrow'), 'findtoursin.com', 50);

  // Title length determines font size — longer titles shrink to fit.
  const titleSize = title.length > 60 ? 56 : title.length > 40 ? 68 : 80;

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${BG} 0%, ${PRIMARY_DARK} 100%)`,
          color: TEXT,
          padding: '70px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        },
        children: [
          // Brand stripe accent in the top-left
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '8px',
                height: '100%',
                background: PRIMARY,
              },
            },
          },
          // Eyebrow row (small, top)
          {
            type: 'div',
            props: {
              style: {
                fontSize: 22,
                color: MUTED,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
              },
              children: eyebrow,
            },
          },
          // Spacer
          {
            type: 'div',
            props: {
              style: { flex: 1 },
            },
          },
          // Main title (huge)
          {
            type: 'div',
            props: {
              style: {
                fontSize: titleSize,
                lineHeight: 1.1,
                fontWeight: 700,
                color: TEXT,
                marginBottom: 24,
                display: 'flex',
                width: '100%',
              },
              children: title,
            },
          },
          // Subtitle (smaller)
          {
            type: 'div',
            props: {
              style: {
                fontSize: 30,
                color: MUTED,
                lineHeight: 1.3,
                marginBottom: 40,
                display: 'flex',
                width: '100%',
              },
              children: subtitle,
            },
          },
          // Footer brand row
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                fontSize: 28,
                fontWeight: 600,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      width: 14,
                      height: 14,
                      background: PRIMARY,
                      borderRadius: 4,
                    },
                  },
                },
                'FindToursIn',
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      headers: {
        // OG images are content-addressable by their query string —
        // safe to cache aggressively. 1 year matches our other static
        // assets in vercel.json.
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    },
  );
};
