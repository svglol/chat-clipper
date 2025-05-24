export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 404, statusMessage: 'No Channel name provided' })
  }
  return await fetchFromTwitchAPI<TwitchUser>('/users', new URLSearchParams({ login: name }))
})
