import type { H3Event } from 'h3'
import { hash } from 'ohash'

type HTTPMethod = 'GET' | 'POST'
export async function fetchFromTwitchAPI<T>(endpoint: string, params: URLSearchParams, method: HTTPMethod = 'GET', clientToken?: string) {
  try {
    const token = clientToken || await getTwitchToken()
    const url = `https://api.twitch.tv/helix${endpoint}?${params}`
    const data = await $fetch<TwitchAPIResponse<T>>(url, {
      method,
      headers: {
        'Client-ID': useRuntimeConfig().twitchClientId as string,
        'Authorization': `Bearer ${token}`,
      },
    })
    return data
  }
  catch (error) {
    throw new Error(`Error fetching from Twitch API: ${error}`)
  }
}

export async function getTwitchToken() {
  const tokenData = await useStorage('data').getItem('twitchToken') as TwitchToken
  const currentTime = Math.floor(Date.now() / 1000)
  const isTokenValid = tokenData
    && tokenData.expires_at
    && currentTime < tokenData.expires_at

  if (isTokenValid) {
    return tokenData.access_token
  }

  const newTokenData = await getToken()
  const expiresAt = Math.floor(Date.now() / 1000) + newTokenData.expires_in
  const tokenToStore = {
    ...newTokenData,
    expires_at: expiresAt,
  }
  await useStorage('data').setItem('twitchToken', tokenToStore, { expires: newTokenData.expires_in })
  return newTokenData.access_token
}

async function getToken() {
  const data = await $fetch<TwitchToken>('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: `client_id=${useRuntimeConfig().twitchClientId}&client_secret=${useRuntimeConfig().twitchClientSecret}&grant_type=client_credentials`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  return data
}

const validateToken = defineCachedFunction(async (event: H3Event, accessToken: string) => {
  try {
    const response = await $fetch('https://id.twitch.tv/oauth2/validate', {
      method: 'GET',
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    })
    return !!response
  }
  catch (error) {
    console.error('Error validating token:', error)
    return false
  }
}, {
  maxAge: 60 * 60,
  swr: false,
  name: 'validate-token',
  getKey: (event: H3Event, accessToken: string) => hash(accessToken),
})

export async function getUserToken(event: H3Event, token: { access_token: string, refresh_token: string, expires_at: number }) {
  const now = new Date()
  const expirationDate = new Date(token.expires_at)

  if (expirationDate > now) {
    const isValid = await validateToken(event, token.access_token)
    if (isValid)
      return token
  }

  try {
    const body = new URLSearchParams({
      client_id: useRuntimeConfig().twitchClientId as string,
      client_secret: useRuntimeConfig().twitchClientSecret as string,
      refresh_token: token.refresh_token ?? '',
      grant_type: 'refresh_token',
    })

    const data = await $fetch<{ access_token: string, refresh_token: string, expires_in: number }>(
      'https://id.twitch.tv/oauth2/token',
      { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    if (!data)
      throw new Error('Failed to refresh token')

    return data
  }
  catch (error) {
    console.error('Error refreshing oAuth token:', error)
    return null
  }
}
