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

async function postReminder() {
  const date = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const inviteRes = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/invites`, {
    method: 'POST',
    headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ max_age: 86400, max_uses: 0, target_type: 2, target_application_id: APP_ID }),
  })
  const invite = await inviteRes.json() as { code: string }

  await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
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
        components: [{ type: 2, style: 5, label: '▶  Play Hentle', url: `https://discord.gg/${invite.code}` }],
      }],
    }),
  })
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

  // Slash command
  if (body.type === 2 && body.data?.name === 'remind') {
    await postReminder()
    return res.json({ type: 4, data: { content: '✅ Reminder posted!', flags: 64 } })
  }

  return res.status(400).json({ error: 'Unknown interaction' })
}
