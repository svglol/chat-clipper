<template>
  <div class="min-h-screen flex flex-col items-center justify-between p-4">
    <div class="w-full max-w-2xl mx-auto flex-1 flex items-center">
      <div class="w-full">
        <div v-if="!createdID" class="bg-(--ui-bg-muted) rounded-lg shadow-lg p-6">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-(--ui-text) items-center">
              <UIcon name="solar:paperclip-2-bold" /> QuickClip
            </h2>
            <p class="text-(--ui-text-muted) mt-2">
              Set up your Twitch clip automation for use with Twitch chat bots like Nightbot, StreamElements, and more.
            </p>
          </div>

          <UForm :schema="schema" :state="{ ...state, loggedIn }" class="space-y-6" @submit="onSubmit">
            <UFormField label="Channel" description="The Twitch channel to create clips from" name="channel" required>
              <UInput v-model="state.channel" size="lg" class="w-full" />
            </UFormField>

            <UFormField label="Discord Webhook" description="Automatically send clips to this Discord webhook" name="discordWebhook">
              <UInput v-model="state.discordWebhook" size="lg" class="w-full" />
            </UFormField>

            <UFormField label="Twitch Login" name="loggedIn" description="Twitch account to create the clips from" :required="true">
              <div v-if="loggedIn" class="flex items-center justify-between p-2 bg-purple-500 rounded-lg border border-purple-600">
                <span class="text-sm text-purple-200">Logged in as {{ user?.name }}</span>
                <UButton size="sm" color="neutral" variant="soft" @click="clear">
                  Logout
                </UButton>
              </div>
              <div v-else class="text-center">
                <UButton size="lg" color="secondary" class="w-full" block icon="i-mdi-twitch" @click="openInPopup('/auth/twitch')">
                  Login with Twitch
                </UButton>
              </div>
            </UFormField>
            <p class="text-(--ui-text-dimmed) mt-2">
              Once you have a created a url, you can't edit it so make sure you have channel and webhook details correct.
            </p>
            <UButton type="submit" size="lg" color="primary" class="w-full" block :disabled="!loggedIn || !state.channel" icon="solar:paperclip-2-bold">
              Create Clip Command URL
            </UButton>
          </UForm>
        </div>

        <div v-else class="bg-(--ui-bg-muted) rounded-lg shadow-lg p-6">
          <div class="text-center">
            <h3 class="text-lg font-semibold text-(--ui-text) mb-2">
              Clip URL Created!
            </h3>
            <p class="text-(--ui-text-muted) mb-6">
              Clip Command for '{{ state.channel }}' has been successfully created.
            </p>

            <div class="space-y-4 text-left font-mono text-sm text-(--ui-text-muted) rounded-lg p-4 overflow-x-auto bg-(--ui-bg-accented)">
              <div>
                <span class="font-bold text-primary">URL</span><br>
                <code>{{ `${$config.public.baseUrl}/api/clip-create/${createdID}` }}</code>
              </div>
              <div>
                <span class="font-bold text-primary">Nightbot</span><br>
                <code>$urlfetch {{ `${$config.public.baseUrl}/api/clip-create/${createdID}` }}</code>
              </div>
              <div>
                <span class="font-bold text-primary">StreamElements Chatbot</span><br>
                <code>${customapi.{{ `${$config.public.baseUrl}/api/clip-create/${createdID}` }}}</code>
              </div>
              <div>
                <span class="font-bold text-primary">StreamLabs Cloudbot</span><br>
                <code>{readapi.{{ `${$config.public.baseUrl}/api/clip-create/${createdID}` }}}</code>
              </div>
              <div>
                <span class="font-bold text-primary">Fossabot</span><br>
                <code>${customapi {{ `${$config.public.baseUrl}/api/clip-create/${createdID}` }}}</code>
              </div>
            </div>

            <UButton color="primary" size="lg" class="w-full mt-6" block @click="reset">
              Create Another Clip Command URL
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <footer class="mt-8 text-sm text-center text-(--ui-text-muted)">
      Built by svglol – <a href="https://github.com/svglol/quickclip" target="_blank" class="underline hover:text-primary">View on GitHub</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

const { loggedIn, user, clear, openInPopup } = useUserSession()
const toast = useToast()

useSeoMeta({
  title: 'QuickClip  - Create Twitch Clip URLs',
  description: 'Easily create Twitch clip URLs for use with chat bots like Nightbot, StreamElements, and more.',
})

const twitchChannelSchema = z.string()
  .min(3, 'Channel name must be at least 3 characters')
  .max(25, 'Channel name cannot exceed 25 characters')
  .regex(/^\w+$/, 'Channel name can only contain letters, numbers, and underscores')
  .refine(
    async channelName => await validateTwitchChannel(channelName),
    {
      message: 'Twitch channel does not exist or could not be found',
    },
  )

const discordWebhookSchema = z.string()
  .url('Must be a valid URL')
  .refine(
    (url) => {
      // Discord webhook URLs follow this pattern:
      // https://discord.com/api/webhooks/{webhook.id}/{webhook.token}
      // or https://discordapp.com/api/webhooks/{webhook.id}/{webhook.token}
      // eslint-disable-next-line regexp/no-unused-capturing-group
      const discordWebhookRegex = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/
      return discordWebhookRegex.test(url)
    },
    {
      message: 'Must be a valid Discord webhook URL (https://discord.com/api/webhooks/...)',
    },
  )

const schema = z.object({
  channel: twitchChannelSchema,
  discordWebhook: z
    .string()
    .transform(val => val === '' ? undefined : val) // Convert empty string to undefined
    .pipe(discordWebhookSchema)
    .optional(),
  loggedIn: z.boolean().refine(val => val === true, {
    message: 'You must be logged into Twitch to create a url',
  }),
})

const state = reactive<Partial<Schema>>({
  channel: undefined,
  discordWebhook: undefined,
})

const createdID = ref<string | null>(null)

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const response = await $fetch('/api/create', {
      method: 'POST',
      query: {
        channel: event.data.channel,
        discordWebhook: event.data.discordWebhook,
      },
    })
    createdID.value = response.id
  }
  catch (error) {
    console.error('Error creating clip URL:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to create clip URL. Please try again.',
      color: 'error',
    })
  }
}

async function validateTwitchChannel(channelName: string) {
  try {
    const response = await $fetch(`/api/twitch/validate-channel/${channelName}`)
    return response.data && response.data.length > 0
  }
  catch (error) {
    console.error('Error validating Twitch channel:', error)
    return false
  }
}

function reset() {
  state.channel = undefined
  state.discordWebhook = undefined
  createdID.value = null
}
</script>
