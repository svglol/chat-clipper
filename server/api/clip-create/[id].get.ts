export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    createError({ statusCode: 404, statusMessage: 'No ID provided' })
  }
  if (id !== undefined) {
    const dataStorage = useStorage('data')
    const data = await dataStorage.getItem(id) as ClipUrlObject | null

    if (!data) {
      return 'Not a valid ID, please try again.'
    }

    // get updated token from stored data
    const userToken = await getUserToken(event, data.token)

    if (!userToken) {
      return 'Error Twitch token is no longer valid, please re-authenticate.'
    }

    // check if the channel is live
    const streamInfo = await fetchFromTwitchAPI<TwitchStream>('/streams', new URLSearchParams({
      user_id: data.broadcasterId,
    }))
    const isLive = streamInfo.data && streamInfo.data.length > 0

    if (!isLive) {
      return 'Channel isn\'t live, can\'t create clip!'
    }

    // call twitch api to create the clip
    const createClip = await fetchFromTwitchAPI<TwitchClip>('/clips', new URLSearchParams({ broadcaster_id: data.broadcasterId }), 'POST', userToken.access_token)

    if (!createClip.data || createClip.data.length === 0) {
      return 'Oops something went wrong while creating the clip.'
    }

    const clipData = createClip.data[0]!

    // send the clip URL to the Discord webhook if provided
    if (data.discordWebhook) {
      await $fetch(data.discordWebhook, {
        method: 'POST',
        body: {
          content: `https://clips.twitch.tv/${clipData.id}`,
        },
      })
    }

    // return the created clip URL
    return `https://clips.twitch.tv/${clipData.id}`
  }
})
