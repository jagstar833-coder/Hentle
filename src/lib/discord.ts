import { DiscordSDK } from '@discord/embedded-app-sdk'

// Discord adds a frame_id param when running as an Activity
export const isDiscord = new URLSearchParams(window.location.search).has('frame_id')

export async function initDiscord() {
  if (!isDiscord) return

  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID as string
  if (!clientId) return

  const sdk = new DiscordSDK(clientId)
  await sdk.ready()
}
