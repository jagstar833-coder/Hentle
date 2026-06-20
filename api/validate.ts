import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const word = (req.query.word as string ?? '').toLowerCase().trim()
  if (!word || !/^[a-z]+$/.test(word)) {
    return res.json({ valid: false })
  }

  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
    res.json({ valid: r.ok })
  } catch {
    res.json({ valid: true })
  }
}
