import { z } from 'zod'

const querySchema = z.object({
  channel: z.string().min(3, 'A Channel is required'),
  discordWebhook: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  const session = await requireUserSession(event)

  const broadcasterId = await fetchFromTwitchAPI<TwitchUser>('/users', new URLSearchParams({ login: query.channel }))

  if (!broadcasterId.data || broadcasterId.data.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Twitch Channel not found' })
  }

  if (!session.secure || !session.secure.token) {
    throw createError({ statusCode: 401, statusMessage: 'You are not logged in' })
  }

  const clipUrlObject = {
    broadcasterId: broadcasterId.data[0]?.id ?? '',
    discordWebhook: query.discordWebhook,
    token: {
      access_token: session.secure.token.access_token,
      refresh_token: session.secure.token.refresh_token,
      expires_at: session.secure.token.expires_at,
    },
  } satisfies ClipUrlObject

  // create a id to use as a key for the KV database and return this id to the client
  const clipId = `${session.user.id}-${crypto.randomUUID()}`

  // store this clipUrlObject on KV database
  const dataStorage = useStorage('data')
  dataStorage.setItem(clipId, clipUrlObject)

  return {
    id: clipId,
  }
})
