import { useState, useEffect, useCallback, useRef } from 'react'
import type { TileState, GameStatus, GuessRow } from '../types'
import { ANSWER_WORDS } from '../utils/wordList'
import { isDiscord } from '../lib/discord'

const MAX_GUESSES = 6
const REVEAL_DELAY = 300

// Cache results so the same word isn't checked twice per session
const wordCache = new Map<string, boolean>()

async function isValidWord(word: string): Promise<boolean> {
  if (wordCache.has(word)) return wordCache.get(word)!
  try {
    const url = isDiscord
      ? `/api/validate?word=${encodeURIComponent(word)}`
      : `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    const res = await fetch(url)
    let valid: boolean
    if (isDiscord) {
      const json = await res.json() as { valid: boolean }
      valid = json.valid
    } else {
      valid = res.ok
    }
    wordCache.set(word, valid)
    return valid
  } catch {
    return true
  }
}

function computeStates(guess: string, answer: string): TileState[] {
  const len = guess.length
  const states: TileState[] = Array(len).fill('absent')
  const answerArr = answer.split('')
  const guessArr = guess.split('')

  for (let i = 0; i < len; i++) {
    if (guessArr[i] === answerArr[i]) {
      states[i] = 'correct'
      answerArr[i] = '#'
      guessArr[i] = '*'
    }
  }

  for (let i = 0; i < len; i++) {
    if (guessArr[i] === '*') continue
    const idx = answerArr.indexOf(guessArr[i])
    if (idx !== -1) {
      states[i] = 'present'
      answerArr[idx] = '#'
    }
  }

  return states
}

function buildEmptyRows(wordLength: number): GuessRow[] {
  return Array(MAX_GUESSES).fill(null).map(() => ({
    letters: Array(wordLength).fill(''),
    states: Array(wordLength).fill('empty') as TileState[],
    isRevealing: false,
  }))
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

interface SavedState {
  date: string
  word: string
  rows: GuessRow[]
  currentRow: number
  status: GameStatus
}

function loadSaved(answer: string): SavedState | null {
  try {
    const raw = sessionStorage.getItem('hentle-state')
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedState
    if (parsed.date !== todayKey()) return null
    if (answer && parsed.word !== answer) return null
    return parsed
  } catch {
    return null
  }
}

export function useWordle(answer: string) {
  const wordLength = answer.length || 5
  const saved = loadSaved(answer)

  const [rows, setRows] = useState<GuessRow[]>(saved?.rows ?? buildEmptyRows(wordLength))
  const [currentRow, setCurrentRow] = useState(saved?.currentRow ?? 0)
  const [currentCol, setCurrentCol] = useState(0)
  const [gameStatus, setGameStatus] = useState<GameStatus>(saved?.status ?? 'playing')
  const [revealingRow, setRevealingRow] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [shakeRow, setShakeRow] = useState<number | null>(null)
  const [bounceRow, setBounceRow] = useState<number | null>(null)

  // Refs so submitGuess closure always has latest values
  const rowsRef = useRef(rows)
  const currentRowRef = useRef(currentRow)
  const currentColRef = useRef(currentCol)
  const answerRef = useRef(answer)
  useEffect(() => { rowsRef.current = rows }, [rows])
  useEffect(() => { currentRowRef.current = currentRow }, [currentRow])
  useEffect(() => { currentColRef.current = currentCol }, [currentCol])
  useEffect(() => { answerRef.current = answer }, [answer])

  // Reset rows when word length changes (e.g. switching from 5-letter to 6-letter day)
  useEffect(() => {
    if (!answer) return
    setRows(prev => {
      if ((prev[0]?.letters.length ?? 0) === answer.length) return prev
      return buildEmptyRows(answer.length)
    })
  }, [answer])

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
    if (revealingRow !== null || checking) return
    if (currentColRef.current >= answerRef.current.length) return

    setRows(prev => {
      const next = prev.map(r => ({ ...r, letters: [...r.letters], states: [...r.states] }))
      next[currentRowRef.current].letters[currentColRef.current] = letter
      next[currentRowRef.current].states[currentColRef.current] = 'filled'
      return next
    })
    setCurrentCol(c => c + 1)
  }, [gameStatus, revealingRow, checking])

  const removeLetter = useCallback(() => {
    if (gameStatus !== 'playing') return
    if (revealingRow !== null || checking) return
    if (currentColRef.current <= 0) return

    setRows(prev => {
      const next = prev.map(r => ({ ...r, letters: [...r.letters], states: [...r.states] }))
      next[currentRowRef.current].letters[currentColRef.current - 1] = ''
      next[currentRowRef.current].states[currentColRef.current - 1] = 'empty'
      return next
    })
    setCurrentCol(c => c - 1)
  }, [gameStatus, revealingRow, checking])

  const submitGuess = useCallback(async () => {
    if (gameStatus !== 'playing') return
    if (revealingRow !== null || checking) return
    if (currentColRef.current < answer.length) {
      showToast('Not enough letters')
      setShakeRow(currentRowRef.current)
      setTimeout(() => setShakeRow(null), 600)
      return
    }

    const guess = rowsRef.current[currentRowRef.current].letters.join('').toLowerCase()

    setChecking(true)
    const valid = guess === answer.toLowerCase() || await isValidWord(guess)
    setChecking(false)

    if (!valid) {
      showToast('Not a valid word')
      setShakeRow(currentRowRef.current)
      setTimeout(() => setShakeRow(null), 600)
      return
    }

    const states = computeStates(guess, answer.toLowerCase())
    const row = currentRowRef.current

    setRevealingRow(row)
    setRows(prev => {
      const next = prev.map(r => ({ ...r, letters: [...r.letters], states: [...r.states] }))
      next[row].states = states
      next[row].isRevealing = true
      return next
    })

    setTimeout(() => {
      setRows(prev => {
        const next = prev.map(r => ({ ...r, letters: [...r.letters], states: [...r.states] }))
        next[row].isRevealing = false
        return next
      })
      setRevealingRow(null)

      const won = states.every(s => s === 'correct')
      const nextRow = row + 1

      if (won) {
        setBounceRow(row)
        setTimeout(() => setBounceRow(null), 1000)
        const messages = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!']
        showToast(messages[Math.min(row, 5)], 3000)
        setGameStatus('won')
      } else if (nextRow >= MAX_GUESSES) {
        showToast(answer.toUpperCase(), 4000)
        setGameStatus('lost')
      } else {
        setCurrentRow(nextRow)
        setCurrentCol(0)
      }
    }, answer.length * REVEAL_DELAY + 100)
  }, [gameStatus, revealingRow, checking, answer, showToast])

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
      word: answer,
      rows,
      currentRow,
      status: gameStatus,
    }
    sessionStorage.setItem('hentle-state', JSON.stringify(state))
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
    checking,
    addLetter,
    removeLetter,
    submitGuess,
  }
}

export { MAX_GUESSES, REVEAL_DELAY }

export function getFallbackWord(): string {
  return ANSWER_WORDS[Math.floor(Math.random() * ANSWER_WORDS.length)]
}
