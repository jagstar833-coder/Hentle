import type { GuessRow } from '../types'
import Tile from './Tile'

interface BoardProps {
  rows: GuessRow[]
  shakeRow: number | null
  bounceRow: number | null
  revealingRow: number | null
}

export default function Board({ rows, shakeRow, bounceRow, revealingRow }: BoardProps) {
  const wordLength = rows[0]?.letters.length || 5
  const tileVw = Math.min(15, Math.floor(85 / wordLength))

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 my-2 sm:my-4">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1 sm:gap-1.5">
          {row.letters.map((_, colIdx) => (
            <Tile
              key={colIdx}
              letter={row.letters[colIdx]}
              state={row.states[colIdx]}
              isRevealing={revealingRow === rowIdx}
              index={colIdx}
              isShaking={shakeRow === rowIdx}
              isBouncing={bounceRow === rowIdx}
              tileVw={tileVw}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
