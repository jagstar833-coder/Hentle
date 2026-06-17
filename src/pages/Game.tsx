import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useWordle, getFallbackWord } from '../hooks/useWordle'
import Board from '../components/Board'
import Keyboard from '../components/Keyboard'
import Header from '../components/Header'
import Toast from '../components/Toast'
import HelpModal from '../components/HelpModal'
import ResultModal from '../components/ResultModal'

const WORD_CACHE_KEY = 'hentle-word-cache'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function getCachedWord(): string | null {
  try {
    const raw = sessionStorage.getItem(WORD_CACHE_KEY)
    if (!raw) return null
    const { date, word } = JSON.parse(raw)
    return date === todayStr() ? word : null
  } catch {
    return null
  }
}

function setCachedWord(word: string) {
  sessionStorage.setItem(WORD_CACHE_KEY, JSON.stringify({ date: todayStr(), word }))
}

export default function Game() {
  const cached = getCachedWord()
  const [answer, setAnswer] = useState(cached ?? '')
  const [loading, setLoading] = useState(!cached)
  const [showHelp, setShowHelp] = useState(false)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (cached) return

    async function fetchWord() {
      try {
        const { data } = await supabase
          .from('daily_words')
          .select('word')
          .eq('date', todayStr())
          .single()
        const word = data?.word ?? getFallbackWord()
        setCachedWord(word)
        setAnswer(word)
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

  useEffect(() => {
    if (gameStatus !== 'playing') {
      const t = setTimeout(() => setShowResult(true), 2200)
      return () => clearTimeout(t)
    }
  }, [gameStatus])

  if (loading) {
    return (
      <div className="h-dvh bg-dark-600 flex items-center justify-center">
        <div className="text-white text-2xl font-black tracking-widest animate-pulse">HENTLE</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-dark-600 flex flex-col items-center overflow-x-hidden">
      <Header
        onHelp={() => setShowHelp(true)}
        onShare={() => setShowResult(true)}
        gameOver={gameStatus !== 'playing'}
      />

      <Toast message={toast} />

      <div className="flex-1 flex items-center justify-center min-h-0">
        <Board
          rows={rows}
          shakeRow={shakeRow}
          bounceRow={bounceRow}
          revealingRow={revealingRow}
        />
      </div>

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
