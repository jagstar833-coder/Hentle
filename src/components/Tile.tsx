import type { TileState } from '../types'
import { REVEAL_DELAY } from '../hooks/useWordle'

interface TileProps {
  letter: string
  state: TileState
  isRevealing: boolean
  index: number
  isShaking: boolean
  isBouncing: boolean
  tileVw: number
}

const stateColors: Record<TileState, string> = {
  empty: 'bg-transparent border-2 border-dark-300 text-white',
  filled: 'bg-transparent border-2 border-dark-100 text-white',
  correct: 'bg-[#538d4e] border-2 border-[#538d4e] text-white',
  present: 'bg-[#b59f3b] border-2 border-[#b59f3b] text-white',
  absent:  'bg-dark-300 border-2 border-dark-300 text-white',
}

export default function Tile({ letter, state, isRevealing, index, isShaking, isBouncing, tileVw }: TileProps) {
  const delay = isRevealing ? `${index * REVEAL_DELAY}ms` : '0ms'

  const animClass = isShaking
    ? 'tile-shake'
    : isBouncing
    ? 'tile-bounce'
    : isRevealing
    ? 'tile-flip'
    : letter && state === 'filled'
    ? 'tile-pop'
    : ''

  const colorClass = isRevealing
    ? stateColors[state]
    : state === 'correct' || state === 'present' || state === 'absent'
    ? stateColors[state]
    : stateColors[state]

  return (
    <div
      className={`
        max-w-24 max-h-24 flex items-center justify-center
        sm:text-3xl font-bold uppercase
        select-none cursor-default
        ${colorClass} ${animClass}
      `}
      style={{
        width: `${tileVw}vw`,
        height: `${tileVw}vw`,
        fontSize: `${Math.min(4, tileVw * 0.45)}vw`,
        animationDelay: delay,
        perspective: '250px',
      }}
    >
      {letter}
    </div>
  )
}
