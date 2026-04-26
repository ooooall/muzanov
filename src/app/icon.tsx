import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#0a0a0a',
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="8" rx="1" fill="#f5c518" />
          <rect x="8" y="1" width="5" height="5" rx="1" fill="#f5c518" opacity="0.6" />
          <rect x="8" y="8" width="5" height="5" rx="1" fill="#f5c518" opacity="0.3" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
