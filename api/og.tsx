import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '1200px',
          height: '630px',
          background: '#080B14',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {/* ── Ambient gradient blobs ── */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '-80px',
            width: '680px',
            height: '560px',
            background:
              'radial-gradient(circle, rgba(91,33,182,0.28) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-60px',
            width: '560px',
            height: '440px',
            background:
              'radial-gradient(circle, rgba(29,78,216,0.22) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundImage:
              'radial-gradient(circle, rgba(139,92,246,0.09) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* ── Vertical divider ── */}
        <div
          style={{
            position: 'absolute',
            left: '686px',
            top: '60px',
            bottom: '60px',
            width: '1px',
            background:
              'linear-gradient(to bottom, rgba(99,102,241,0), rgba(99,102,241,0.35) 50%, rgba(99,102,241,0))',
          }}
        />

        {/* ══════════════════════════════════════════════ */}
        {/*  LEFT COLUMN                                   */}
        {/* ══════════════════════════════════════════════ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '660px',
            padding: '48px 55px 48px 80px',
            gap: '0px',
          }}
        >
          {/* Logo row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '26px',
            }}
          >
            {/* Icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0B0E1F 0%, #1A0B38 100%)',
                border: '1px solid rgba(99,102,241,0.45)',
                position: 'relative',
              }}
            >
              <span
                style={{
                  fontSize: '26px',
                  fontWeight: 900,
                  color: 'white',
                  lineHeight: 1,
                }}
              >
                P
              </span>
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  color: '#F59E0B',
                  fontSize: '8px',
                }}
              >
                ✦
              </div>
            </div>
            {/* Wordmark */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0px' }}>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'white',
                    letterSpacing: '-0.5px',
                  }}
                >
                  Promo
                </span>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#F59E0B',
                    letterSpacing: '-0.5px',
                  }}
                >
                  Gen
                </span>
              </div>
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 600,
                  color: '#475569',
                  letterSpacing: '2px',
                }}
              >
                BY 4OURMEDIA
              </span>
            </div>
          </div>

          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(99,102,241,0.13)',
              border: '1px solid rgba(99,102,241,0.38)',
              borderRadius: '100px',
              padding: '7px 18px',
              width: 'fit-content',
              marginBottom: '22px',
            }}
          >
            <span
              style={{
                color: '#818CF8',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '1px',
              }}
            >
              ✦  AI-POWERED MARKETING TOOL
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '18px',
              lineHeight: 0.92,
            }}
          >
            <span
              style={{
                fontSize: '90px',
                fontWeight: 900,
                color: 'white',
                letterSpacing: '-4px',
                lineHeight: 0.92,
              }}
            >
              Promo
            </span>
            <span
              style={{
                fontSize: '90px',
                fontWeight: 900,
                letterSpacing: '-4px',
                lineHeight: 0.92,
                background: 'linear-gradient(90deg, #A78BFA, #818CF8, #60A5FA)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Gen.
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: '21px',
              color: '#94A3B8',
              lineHeight: 1.5,
              margin: '0 0 24px 0',
            }}
          >
            Turn any product URL into a scroll-stopping
            <br />
            promo with AI copy &amp; cinematic visuals.
          </p>

          {/* Feature chips */}
          <div
            style={{ display: 'flex', gap: '10px', marginBottom: '26px' }}
          >
            {[
              { label: '⚡ AI Copywriting', bg: 'rgba(124,58,237,0.18)', border: 'rgba(124,58,237,0.3)', color: '#C4B5FD' },
              { label: '🎨 Visual Gen',     bg: 'rgba(79,70,229,0.18)',  border: 'rgba(79,70,229,0.3)',  color: '#A5B4FC' },
              { label: '⚡ 10 Seconds',    bg: 'rgba(37,99,235,0.18)',  border: 'rgba(37,99,235,0.3)',  color: '#93C5FD' },
            ].map((chip) => (
              <div
                key={chip.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: chip.bg,
                  border: `1px solid ${chip.border}`,
                  borderRadius: '8px',
                  padding: '7px 14px',
                  color: chip.color,
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {chip.label}
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#F59E0B', fontSize: '20px', letterSpacing: '2px' }}>
              ★★★★★
            </span>
            <span style={{ color: '#64748B', fontSize: '15px' }}>
              Trusted by{' '}
              <span style={{ color: '#94A3B8', fontWeight: 700 }}>
                2,800+ marketers
              </span>
            </span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/*  RIGHT COLUMN — Mock Promo Card               */}
        {/* ══════════════════════════════════════════════ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            position: 'relative',
          }}
        >
          {/* Card glow */}
          <div
            style={{
              position: 'absolute',
              width: '340px',
              height: '460px',
              borderRadius: '28px',
              background:
                'linear-gradient(145deg, #4338CA 0%, #5B21B6 55%, #6D28D9 100%)',
              opacity: 0.45,
              filter: 'blur(22px)',
              transform: 'rotate(-4deg) translateY(10px)',
            }}
          />

          {/* Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '322px',
              height: '456px',
              borderRadius: '26px',
              background:
                'linear-gradient(145deg, #4338CA 0%, #5B21B6 55%, #6D28D9 100%)',
              padding: '28px',
              position: 'relative',
              overflow: 'hidden',
              transform: 'rotate(-3deg)',
              border: '1.5px solid rgba(255,255,255,0.12)',
            }}
          >
            {/* Card inner highlight */}
            <div
              style={{
                position: 'absolute',
                top: '-60px',
                right: '-60px',
                width: '200px',
                height: '200px',
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 70%)',
                borderRadius: '50%',
              }}
            />

            {/* BEST DEAL badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                borderRadius: '100px',
                padding: '4px 14px',
                width: 'fit-content',
                marginBottom: '18px',
              }}
            >
              <span
                style={{
                  color: '#1C1400',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                }}
              >
                ✦ BEST DEAL
              </span>
            </div>

            {/* Big offer text */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  color: 'white',
                  fontSize: '92px',
                  fontWeight: 900,
                  letterSpacing: '-4px',
                  lineHeight: 1,
                  opacity: 0.97,
                }}
              >
                60%
              </span>
              <span
                style={{
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: '22px',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                OFF TODAY
              </span>
              <span
                style={{
                  color: 'rgba(255,255,255,0.42)',
                  fontSize: '12px',
                  marginTop: '6px',
                }}
              >
                Limited time · While stocks last
              </span>
            </div>

            {/* Product placeholder */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.09)',
                borderRadius: '14px',
                marginBottom: '16px',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              <span
                style={{
                  color: 'rgba(255,255,255,0.22)',
                  fontSize: '44px',
                }}
              >
                ✦
              </span>
            </div>

            {/* CTA */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
                borderRadius: '12px',
                padding: '13px 0',
              }}
            >
              <span
                style={{
                  color: '#4338CA',
                  fontSize: '15px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                }}
              >
                SHOP NOW  →
              </span>
            </div>

            {/* Sparkle accents */}
            <div
              style={{
                position: 'absolute',
                top: '22px',
                right: '22px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '18px',
              }}
            >
              ✦
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '82px',
                right: '16px',
                color: 'rgba(255,255,255,0.22)',
                fontSize: '12px',
              }}
            >
              ✦
            </div>
          </div>

          {/* "Sample AI Output" label */}
          <div
            style={{
              position: 'absolute',
              bottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            <span>✦  SAMPLE AI OUTPUT</span>
          </div>
        </div>

        {/* ── Bottom URL ── */}
        <div
          style={{
            position: 'absolute',
            bottom: '26px',
            left: '80px',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.5px',
          }}
        >
          4ourmedia.com
        </div>

        {/* ── Top-right decorative sparkle ── */}
        <div
          style={{
            position: 'absolute',
            top: '30px',
            right: '44px',
            color: 'rgba(167,139,250,0.35)',
            fontSize: '22px',
          }}
        >
          ✦
        </div>
        <div
          style={{
            position: 'absolute',
            top: '62px',
            right: '80px',
            color: 'rgba(167,139,250,0.18)',
            fontSize: '14px',
          }}
        >
          ✦
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
