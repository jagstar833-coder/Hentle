import { useState, useEffect, useCallback } from 'react'
import type { TileState, GameStatus, GuessRow } from '../types'
import { VALID_WORDS, ANSWER_WORDS } from '../utils/wordList'

const WORD_LENGTH = 5
const MAX_GUESSES = 6
const REVEAL_DELAY = 300 // ms per tile

function computeStates(guess: string, answer: string): TileState[] {
  const states: TileState[] = Array(WORD_LENGTH).fill('absent')
  const answerArr = answer.split('')
  const guessArr = guess.split('')

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === answerArr[i]) {
      states[i] = 'correct'
      answerArr[i] = '#'
      guessArr[i] = '*'
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === '*') continue
    const idx = answerArr.indexOf(guessArr[i])
    if (idx !== -1) {
      states[i] = 'present'
      answerArr[idx] = '#'
    }
  }

  return states
}

function buildEmptyRows(): GuessRow[] {
  return Array(MAX_GUESSES).fill(null).map(() => ({
    letters: Array(WORD_LENGTH).fill(''),
    states: Array(WORD_LENGTH).fill('empty') as TileState[],
    isRevealing: false,
  }))
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

interface SavedState {
  date: string
  rows: GuessRow[]
  currentRow: number
  status: GameStatus
}

function loadSaved(): SavedState | null {
  try {
    const raw = localStorage.getItem('hentle-state')
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedState
    if (parsed.date !== todayKey()) return null
    return parsed
  } catch {
    return null
  }
}

export function useWordle(answer: string) {
  const saved = loadSaved()

  const [rows, setRows] = useState<GuessRow[]>(saved?.rows ?? buildEmptyRows())
  const [currentRow, setCurrentRow] = useState(saved?.currentRow ?? 0)
  const [currentCol, setCurrentCol] = useState(0)
  const [gameStatus, setGameStatus] = useState<GameStatus>(saved?.status ?? 'playing')
  const [revealingRow, setRevealingRow] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [shakeRow, setShakeRow] = useState<number | null>(null)
  const [bounceRow, setBounceRow] = useState<number | null>(null)

  const keyStates = (() => {
    const map: Record<string, TileState> = {}
    for (const row of rows) {
      row.letters.forEach((letter, i) => {
        if (!letter || row.states[i] === 'empty' || row.states[i] === 'filled') return
        const existing = map[letter]
        const next = row.states[i]
        if (existing === 'correct') return
        if (existing === 'present' && next !== 'correct') return
        map[letter] = next
      })
    }
    return map
  })()

  const showToast = useCallback((msg: string, duration = 2000) => {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
  }, [])

  const addLetter = useCallback((letter: string) => {
    if (gameStatus !== 'playing') return
    if (revealingRow !== null) return
    if (currentCol >= WORD_LENGTH) return

    setRows(prev => {
      const next = prev.map(r => ({ ...r, letters: [...r.letters], states: [...r.states] }))
      next[currentRow].letters[currentCol] = letter
      next[currentRow].states[currentCol] = 'filled'
      return next
    })
    setCurrentCol(c => c + 1)
  }, [gameStatus, revealingRow, currentRow, currentCol])

  const removeLetter = useCallback(() => {
    if (gameStatus !== 'playing') return
    if (revealingRow !== null) return
    if (currentCol <= 0) return

    setRows(prev => {
      const next = prev.map(r => ({ ...r, letters: [...r.letters], states: [...r.states] }))
      next[currentRow].letters[currentCol - 1] = ''
      next[currentRow].states[currentCol - 1] = 'empty'
      return next
    })
    setCurrentCol(c => c - 1)
  }, [gameStatus, revealingRow, currentRow, currentCol])

  const submitGuess = useCallback(() => {
    if (gameStatus !== 'playing') return
    if (revealingRow !== null) return
    if (currentCol < WORD_LENGTH) {
      showToast('Not enough letters')
      setShakeRow(currentRow)
      setTimeout(() => setShakeRow(null), 600)
      return
    }

    const guess = rows[currentRow].letters.join('').toLowerCase()

    if (!VALID_WORDS.has(guess)) {
      showToast('Not in word list')
      setShakeRow(currentRow)
      setTimeout(() => setShakeRow(null), 600)
      return
    }

    const states = computeStates(guess, answer.toLowerCase())

    setRevealingRow(currentRow)

    setRows(prev => {
      const next = prev.map(r => ({ ...r, letters: [...r.letters], states: [...r.states] }))
      next[currentRow].states = states
      next[currentRow].isRevealing = true
      return next
    })

    const totalDelay = WORD_LENGTH * REVEAL_DELAY

    setTimeout(() => {
      setRows(prev => {
        const next = prev.map(r => ({ ...r, letters: [...r.letters], states: [...r.states] }))
        next[currentRow].isRevealing = false
        return next
      })
      setRevealingRow(null)

      const won = states.every(s => s === 'correct')
      const nextRow = currentRow + 1

      if (won) {
        setBounceRow(currentRow)
        setTimeout(() => setBounceRow(null), 1000)
        const messages = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!']
        showToast(messages[Math.min(currentRow, 5)], 3000)
        setGameStatus('won')
      } else if (nextRow >= MAX_GUESSES) {
        showToast(answer.toUpperCase(), 4000)
        setGameStatus('lost')
      } else {
        setCurrentRow(nextRow)
        setCurrentCol(0)
      }
    }, totalDelay + 100)
  }, [gameStatus, revealingRow, currentCol, currentRow, rows, answer, showToast])

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter') submitGuess()
      else if (e.key === 'Backspace') removeLetter()
      else if (/^[a-zA-Z]$/.test(e.key)) addLetter(e.key.toUpperCase())
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [addLetter, removeLetter, submitGuess])

  // Persist state
  useEffect(() => {
    if (!answer) return
    const state: SavedState = {
      date: todayKey(),
      rows,
      currentRow,
      status: gameStatus,
    }
    localStorage.setItem('hentle-state', JSON.stringify(state))
  }, [rows, currentRow, gameStatus, answer])

  return {
    rows,
    currentRow,
    gameStatus,
    keyStates,
    toast,
    shakeRow,
    bounceRow,
    revealingRow,
    addLetter,
    removeLetter,
    submitGuess,
  }
}

export { WORD_LENGTH, MAX_GUESSES, REVEAL_DELAY }

export function getFallbackWord(): string {
  const idx = Math.floor(Math.random() * ANSWER_WORDS.length)
  return ANSWER_WORDS[idx]
}
