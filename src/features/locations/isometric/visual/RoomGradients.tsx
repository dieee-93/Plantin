import React from 'react'

export const RoomGradients: React.FC = React.memo(() => {
  return (
    <>
      <linearGradient id="interior-wall-left" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="interior-wall-right" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="interior-glass-left" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(224, 242, 254, 0.78)" />
        <stop offset="50%" stopColor="rgba(186, 230, 253, 0.42)" />
        <stop offset="100%" stopColor="rgba(125, 211, 252, 0.65)" />
      </linearGradient>
      <linearGradient id="interior-glass-right" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(186, 230, 253, 0.68)" />
        <stop offset="100%" stopColor="rgba(56, 189, 248, 0.45)" />
      </linearGradient>
      <linearGradient id="interior-chamber-left" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3730a3" />
        <stop offset="100%" stopColor="#1e1b4b" />
      </linearGradient>
      <linearGradient id="interior-chamber-right" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#312e81" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="interior-floor-room" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
      <linearGradient id="interior-floor-greenhouse" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f0fdf4" />
        <stop offset="100%" stopColor="#dcfce7" />
      </linearGradient>
      <linearGradient id="interior-floor-chamber" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="interior-floor-field" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#5c2d0c" />
      </linearGradient>
    </>
  )
})
RoomGradients.displayName = 'RoomGradients'
