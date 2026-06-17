import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { Link } from 'react-router-dom'

interface DailyWord {
  id: string
  word: string
  date: string
  created_at: string
}

export default function Admin() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  const [words, setWords] = useState<DailyWord[]>([])
  const [newWord, setNewWord] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) fetchWords()
  }, [user])

  async function fetchWords() {
    const { data } = await supabase
      .from('daily_words')
      .select('*')
      .order('date', { ascending: false })
      .limit(30)
    setWords(data ?? [])
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setSigningIn(true)
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginError(error.message)
    setSigningIn(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function handleSaveWord(e: React.FormEvent) {
    e.preventDefault()
    const word = newWord.trim().toLowerCase()
    if (word.length !== 5) {
      setSaveMsg('Word must be exactly 5 letters.')
      return
    }
    if (!/^[a-z]+$/.test(word)) {
      setSaveMsg('Word must contain only letters.')
      return
    }

    setSaving(true)
    setSaveMsg('')

    const { error } = await supabase
      .from('daily_words')
      .upsert({ word, date: newDate }, { onConflict: 'date' })

    if (error) {
      setSaveMsg(`Error: ${error.message}`)
    } else {
      setSaveMsg(`✓ Set "${word.toUpperCase()}" for ${newDate}`)
      setNewWord('')
      await fetchWords()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeleteId(id)
    await supabase.from('daily_words').delete().eq('id', id)
    setDeleteId(null)
    await fetchWords()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-600 flex items-center justify-center">
        <div className="text-white animate-pulse font-bold">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-600 flex flex-col items-center justify-center p-4">
        <Link to="/" className="text-dark-100 hover:text-white mb-8 text-sm">← Back to game</Link>
        <div className="bg-dark-500 border border-dark-300 rounded-xl p-8 w-full max-w-sm">
          <h1 className="text-white font-black text-2xl tracking-wider mb-6 text-center">HENTLE ADMIN</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-dark-100 text-xs font-bold uppercase tracking-wider block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-dark-400 border border-dark-300 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#538d4e]"
                required
              />
            </div>
            <div>
              <label className="text-dark-100 text-xs font-bold uppercase tracking-wider block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-dark-400 border border-dark-300 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#538d4e]"
                required
              />
            </div>

            {loginError && (
              <p className="text-red-400 text-xs">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={signingIn}
              className="w-full bg-[#538d4e] hover:bg-[#6aaf63] disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              {signingIn ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-600 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-dark-100 hover:text-white text-sm">← Game</Link>
            <h1 className="text-white font-black text-xl tracking-wider">HENTLE ADMIN</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="text-dark-100 hover:text-white text-sm border border-dark-300 px-3 py-1 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Set Word Form */}
        <div className="bg-dark-500 border border-dark-300 rounded-xl p-6 mb-6">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Set Daily Word</h2>

          <form onSubmit={handleSaveWord} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-dark-100 text-xs font-bold uppercase tracking-wider block mb-1">Word</label>
                <input
                  type="text"
                  value={newWord}
                  onChange={e => setNewWord(e.target.value.toUpperCase().slice(0, 5))}
                  placeholder="APPLE"
                  maxLength={5}
                  className="w-full bg-dark-400 border border-dark-300 text-white rounded-lg px-3 py-2.5 font-mono text-lg tracking-widest uppercase focus:outline-none focus:border-[#538d4e] placeholder:text-dark-200"
                />
              </div>
              <div>
                <label className="text-dark-100 text-xs font-bold uppercase tracking-wider block mb-1">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="bg-dark-400 border border-dark-300 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#538d4e]"
                />
              </div>
            </div>

            {saveMsg && (
              <p className={`text-sm ${saveMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                {saveMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || newWord.length !== 5}
              className="bg-[#538d4e] hover:bg-[#6aaf63] disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save Word'}
            </button>
          </form>
        </div>

        {/* Scheduled Words */}
        <div className="bg-dark-500 border border-dark-300 rounded-xl p-6">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
            Scheduled Words ({words.length})
          </h2>

          {words.length === 0 ? (
            <p className="text-dark-100 text-sm">No words scheduled yet.</p>
          ) : (
            <div className="space-y-2">
              {words.map(w => {
                const isToday = w.date === new Date().toISOString().slice(0, 10)
                const isPast = w.date < new Date().toISOString().slice(0, 10)
                return (
                  <div
                    key={w.id}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                      isToday ? 'bg-[#538d4e]/20 border border-[#538d4e]/40' : 'bg-dark-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`font-mono font-black text-lg tracking-widest ${isPast && !isToday ? 'text-dark-100' : 'text-white'}`}>
                        {w.word.toUpperCase()}
                      </span>
                      <span className="text-dark-100 text-sm">{w.date}</span>
                      {isToday && (
                        <span className="text-xs bg-[#538d4e] text-white px-2 py-0.5 rounded font-bold">TODAY</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={deleteId === w.id}
                      className="text-dark-100 hover:text-red-400 transition-colors text-sm disabled:opacity-40"
                    >
                      {deleteId === w.id ? '…' : '✕'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
