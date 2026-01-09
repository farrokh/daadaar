import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const alt = 'Daadaar Platform';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Fonts
// We'd ideally load a font here, but for now we'll use system fonts or fetch if needed.
// Using standard CSS fonts for simplicity first.

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(to bottom right, #020617, #1e293b)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        {/* Fallback visual if logo fetch fails or complex */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="Daadaar Logo"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M8 11h8" />
          <path d="M12 11v4" />
        </svg>
      </div>
      <div
        style={{
          fontSize: 70,
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '10px',
          letterSpacing: '-2px',
        }}
      >
        Daadaar
      </div>
      <div
        style={{
          fontSize: 30,
          color: '#94a3b8',
          textAlign: 'center',
          maxWidth: '800px',
        }}
      >
        Decentralized, anonymous platform for exposing Iranian government injustices
      </div>
    </div>,
    {
      ...size,
    }
  );
}
