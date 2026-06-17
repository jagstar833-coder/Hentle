import type { TileState } from '../types'

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

interface KeyboardProps {
  keyStates: Record<string, TileState>
  onKey: (key: string) => void
  onEnter: () => void
  onDelete: () => void
}

const keyColor: Record<TileState, string> = {
  empty:   'bg-dark-200 text-white hover:bg-dark-100',
  filled:  'bg-dark-200 text-white hover:bg-dark-100',
  correct: 'bg-[#538d4e] text-white',
  present: 'bg-[#b59f3b] text-white',
  absent:  'bg-dark-400 text-dark-100',
}

export default function Keyboard({ keyStates, onKey, onEnter, onDelete }: KeyboardProps) {
  const handleClick = (key: string) => {
    if (key === 'ENTER') onEnter()
    else if (key === '⌫') onDelete()
    else onKey(key)
  }

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[580px] mx-auto px-2 pb-4 sm:pb-6">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1.5">
          {row.map(key => {
            const state = keyStates[key] ?? 'empty'
            const isWide = key === 'ENTER' || key === '⌫'
            return (
              <button
                key={key}
                onClick={() => handleClick(key)}
                className={`
                  ${isWide ? 'flex-[1.5] text-xs' : 'flex-1'}
                  h-14 sm:h-16 rounded font-bold text-sm sm:text-base uppercase
                  transition-colors duration-150 select-none
                  active:scale-95
                  ${keyColor[state]}
                `}
              >
                {key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
