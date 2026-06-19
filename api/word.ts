import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const today = new Date().toISOString().slice(0, 10)
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/daily_words?select=word&date=eq.${today}&limit=1`

  const response = await fetch(url, {
    headers: {
      apikey: process.env.VITE_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY!}`,
    },
  })

  const data = await response.json() as Array<{ word: string }>
  const word = data[0]?.word ?? null

  res.setHeader('Cache-Control', 's-maxage=3600')
  res.json({ word })
}
