import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useWordle, getFallbackWord } from '../hooks/useWordle'
import Board from '../components/Board'
import Keyboard from '../components/Keyboard'
import Header from '../components/Header'
import Toast from '../components/Toast'
import HelpModal from '../components/HelpModal'
import ResultModal from '../components/ResultModal'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function Game() {
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    async function fetchWord() {
      try {
        const { data } = await supabase
          .from('daily_words')
          .select('word')
          .eq('date', todayStr())
          .single()

        setAnswer(data?.word ?? getFallbackWord())
      } catch {
        setAnswer(getFallbackWord())
      } finally {
        setLoading(false)
      }
    }
    fetchWord()
  }, [])

  const {
    rows, gameStatus, keyStates,
    toast, shakeRow, bounceRow, revealingRow,
    addLetter, removeLetter, submitGuess,
  } = useWordle(answer)

  // Auto-open result modal after game ends
  useEffect(() => {
    if (gameStatus !== 'playing') {
      const t = setTimeout(() => setShowResult(true), 2200)
      return () => clearTimeout(t)
    }
  }, [gameStatus])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-600 flex items-center justify-center">
        <div className="text-white text-2xl font-black tracking-widest animate-pulse">HENTLE</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-600 flex flex-col items-center">
      <Header
        onHelp={() => setShowHelp(true)}
        onShare={() => setShowResult(true)}
        gameOver={gameStatus !== 'playing'}
      />

      <Toast message={toast} />

      <Board
        rows={rows}
        shakeRow={shakeRow}
        bounceRow={bounceRow}
        revealingRow={revealingRow}
      />

      <div className="flex-1" />

      <Keyboard
        keyStates={keyStates}
        onKey={addLetter}
        onEnter={submitGuess}
        onDelete={removeLetter}
      />

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showResult && (
        <ResultModal
          status={gameStatus}
          answer={answer}
          rows={rows}
          onClose={() => setShowResult(false)}
        />
      )}
    </div>
  )
}
