import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(_req: NextRequest, { params }: { params: { size: string } }) {
  const s = Math.min(Math.max(parseInt(params.size, 10) || 192, 32), 512)
  const pad = Math.round(s * 0.18)
  const gap = Math.round(s * 0.04)

  return new ImageResponse(
    <div
      style={{
        width: s,
        height: s,
        background: '#1e1e26',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap,
          width: s - pad * 2,
          height: s - pad * 2,
        }}
      >
        {/* Tall left block */}
        <div
          style={{
            flex: '0 0 38%',
            height: '100%',
            background: '#f5c518',
            borderRadius: Math.round(s * 0.03),
          }}
        />
        {/* Right column: two stacked blocks */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap,
          }}
        >
          <div
            style={{
              flex: '0 0 57%',
              background: '#f5c518',
              opacity: 0.65,
              borderRadius: Math.round(s * 0.03),
            }}
          />
          <div
            style={{
              flex: 1,
              background: '#f5c518',
              opacity: 0.3,
              borderRadius: Math.round(s * 0.03),
            }}
          />
        </div>
      </div>
    </div>,
    { width: s, height: s },
  )
}
