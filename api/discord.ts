import type { VercelRequest, VercelResponse } from '@vercel/node'
import nacl from 'tweetnacl'

export const config = { api: { bodyParser: false } }

const PUBLIC_KEY = 'ee40199079da3b89f3645a332ca9a71884f25bfb6c1c9cb65861e44c23986569'
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID!
const APP_ID = '1517304672124403752'

function getRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: Buffer) => { data += chunk.toString() })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function verifySignature(sig: string, ts: string, body: string): boolean {
  try {
    return nacl.sign.detached.verify(
      Buffer.from(ts + body),
      Buffer.from(sig, 'hex'),
      Buffer.from(PUBLIC_KEY, 'hex'),
    )
  } catch {
    return false
  }
}

async function postReminder(channelId: string) {
  const date = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Try to create an Activity invite; fall back to website URL if it fails
  let playUrl = 'https://hentle.mom'
  try {
    const inviteRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/invites`, {
      method: 'POST',
      headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_age: 86400, max_uses: 0, target_type: 2, target_application_id: APP_ID }),
    })
    const invite = await inviteRes.json() as { code?: string }
    if (invite.code) playUrl = `https://discord.gg/${invite.code}`
  } catch { /* fall back to website */ }

  const msgRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: '🟩 Daily Hentle',
        description: `**${date}**\n\n⬛⬛⬛⬛⬛\n⬛⬛⬛⬛⬛\n⬛⬛⬛⬛⬛\n⬛⬛⬛⬛⬛\n⬛⬛⬛⬛⬛\n⬛⬛⬛⬛⬛\n\nCan you guess today's word in 6 tries?`,
        color: 5477454,
        footer: { text: 'hentle.mom' },
      }],
      components: [{
        type: 1,
        components: [{ type: 2, style: 5, label: '▶  Play Hentle', url: playUrl }],
      }],
    }),
  })

  if (!msgRes.ok) {
    const err = await msgRes.json()
    throw new Error(`Discord API error: ${JSON.stringify(err)}`)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['x-signature-ed25519'] as string
  const ts = req.headers['x-signature-timestamp'] as string
  const rawBody = await getRawBody(req)

  if (!sig || !ts || !verifySignature(sig, ts, rawBody)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const body = JSON.parse(rawBody)

  // Discord PING handshake
  if (body.type === 1) return res.json({ type: 1 })

  // /remind command
  if (body.type === 2 && body.data?.name === 'remind') {
    try {
      await postReminder(body.channel_id)
      return res.json({ type: 4, data: { content: '✅ Reminder posted!', flags: 64 } })
    } catch (e) {
      return res.json({ type: 4, data: { content: `❌ Failed: ${(e as Error).message}`, flags: 64 } })
    }
  }

  // /setword command
  if (body.type === 2 && body.data?.name === 'setword') {
    const word = (body.data.options?.[0]?.value as string ?? '').toUpperCase().trim()
    if (word.length !== 5 || !/^[A-Z]+$/.test(word)) {
      return res.json({ type: 4, data: { content: '❌ Word must be exactly 5 letters.', flags: 64 } })
    }
    try {
      const today = new Date().toISOString().slice(0, 10)
      const sbRes = await fetch(
        `${process.env.VITE_SUPABASE_URL}/rest/v1/daily_words`,
        {
          method: 'POST',
          headers: {
            apikey: process.env.VITE_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY!}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ date: today, word }),
        },
      )
      if (!sbRes.ok) {
        const err = await sbRes.json()
        throw new Error(JSON.stringify(err))
      }
      return res.json({ type: 4, data: { content: `✅ Today's word set to **${word}**`, flags: 64 } })
    } catch (e) {
      return res.json({ type: 4, data: { content: `❌ Failed: ${(e as Error).message}`, flags: 64 } })
    }
  }

  return res.status(400).json({ error: 'Unknown interaction' })
}
