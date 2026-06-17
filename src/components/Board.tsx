import type { GuessRow } from '../types'
import Tile from './Tile'
import { WORD_LENGTH } from '../hooks/useWordle'

interface BoardProps {
  rows: GuessRow[]
  shakeRow: number | null
  bounceRow: number | null
  revealingRow: number | null
}

export default function Board({ rows, shakeRow, bounceRow, revealingRow }: BoardProps) {
  return (
    <div className="flex flex-col gap-1.5 my-4">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1.5">
          {Array(WORD_LENGTH).fill(null).map((_, colIdx) => (
            <Tile
              key={colIdx}
              letter={row.letters[colIdx]}
              state={row.states[colIdx]}
              isRevealing={revealingRow === rowIdx}
              index={colIdx}
              isShaking={shakeRow === rowIdx}
              isBouncing={bounceRow === rowIdx}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
