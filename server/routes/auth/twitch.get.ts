export default defineOAuthTwitchEventHandler({
  config: {
    emailRequired: false,
    scope: ['clips:edit'],
    authorizationParams: {
      response_type: 'code',
    },
  },
  async onSuccess(event, { user, tokens }) {
    await setUserSession(event, {
      user: {
        id: user.id,
        name: user.login,
      },
      secure: {
        token: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + (tokens.expires_in * 1000),
        },
      },
    })
    return sendRedirect(event, '/loggedin')
  },
  onError(event, error) {
    console.error('Twitch OAuth error:', error)
    return sendRedirect(event, '/?error=auth_failed')
  },
})
