interface TwitchAPIResponse<T> {
  data: T[]
  pagination?: {
    cursor: string
  }
}

interface TwitchToken {
  access_token: string
  token_type: string
  expires_in: number
  expires_at?: number
}

type TwitchUserType = 'admin' | 'global_mod' | 'staff' | ''

type TwitchBroadcasterType = 'affiliate' | 'partner' | ''

interface TwitchUser {
  id: string
  login: string
  display_name: string
  type: TwitchUserType
  broadcaster_type: TwitchBroadcasterType
  description: string
  profile_image_url: string
  offline_image_url: string
  view_count: number // Deprecated - not valid data
  email?: string // Only included if user:read:email scope is present
  created_at: string // RFC3339 format
}

interface ClipUrlObject {
  broadcasterId: string
  discordWebhook?: string
  token: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

interface TwitchClip {
  id: string
  edit_url: string
}

interface TwitchStream {
  id: string
  user_id: string
  user_login: string
  user_name: string
  game_id: string
  game_name: string
  type: 'live' | ''
  title: string
  viewer_count: number
  started_at: string // RFC3339 format
  language: string
  thumbnail_url: string
  tag_ids: string[]
  tags: string[]
  is_mature: boolean
}
