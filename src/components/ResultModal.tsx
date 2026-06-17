import type { GameStatus, GuessRow } from '../types'

interface ResultModalProps {
  status: GameStatus
  answer: string
  rows: GuessRow[]
  onClose: () => void
}

const TILE_EMOJI: Record<string, string> = {
  correct: '🟩',
  present: '🟨',
  absent:  '⬛',
  empty:   '⬛',
  filled:  '⬛',
}

export default function ResultModal({ status, answer, rows, onClose }: ResultModalProps) {
  if (status === 'playing') return null

  const completedRows = rows.filter(r => r.letters.some(l => l !== '') && r.states.some(s => s !== 'empty' && s !== 'filled'))
  const guessCount = status === 'won' ? completedRows.length : 'X'

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-500 border border-dark-300 rounded-xl p-6 max-w-sm w-full text-center"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-100 hover:text-white text-2xl">×</button>

        {status === 'won' ? (
          <>
            <h2 className="text-white font-black text-2xl tracking-wider mb-1">
              {['GENIUS', 'MAGNIFICENT', 'IMPRESSIVE', 'SPLENDID', 'GREAT', 'PHEW'][Math.min(completedRows.length - 1, 5)]}
            </h2>
            <p className="text-dark-100 text-sm mb-4">You got it in <span className="text-white font-bold">{guessCount}</span> {guessCount === 1 ? 'guess' : 'guesses'}!</p>
          </>
        ) : (
          <>
            <h2 className="text-white font-black text-2xl tracking-wider mb-1">GAME OVER</h2>
            <p className="text-dark-100 text-sm mb-1">The word was</p>
            <p className="text-white font-black text-3xl tracking-widest mb-4">{answer.toUpperCase()}</p>
          </>
        )}

        <div className="font-mono text-2xl leading-tight mb-6">
          {completedRows.map((row, i) => (
            <div key={i}>{row.states.map(s => TILE_EMOJI[s]).join('')}</div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#538d4e] hover:bg-[#6aaf63] text-white font-bold py-3 rounded-lg transition-colors tracking-wider"
        >
          OK
        </button>

        <p className="text-dark-100 text-xs mt-3">Come back tomorrow for a new word!</p>
      </div>
    </div>
  )
}
