<script setup>
import asana from '@images/icons/brands/asana.png'
import behance from '@images/icons/brands/behance.png'
import dribbble from '@images/icons/brands/dribbble.png'
import facebook from '@images/icons/brands/facebook.png'
import github from '@images/icons/brands/github.png'
import google from '@images/icons/brands/google.png'
import linkedin from '@images/icons/brands/linkedin.png'
import mailchimp from '@images/icons/brands/mailchimp.png'
import slack from '@images/icons/brands/slack.png'
import twitter from '@images/icons/brands/twitter.png'

const connectedAccounts = ref([
  {
    img: google,
    title: 'Google',
    text: 'Calendar and contacts',
    connected: true,
  },
  {
    img: slack,
    title: 'Slack',
    text: 'Communication',
    connected: false,
  },
  {
    img: github,
    title: 'GitHub',
    text: 'Manage your Git repositories',
    connected: true,
  },
  {
    img: mailchimp,
    title: 'Mailchimp',
    text: 'Email marketing service',
    connected: false,
  },
  {
    img: asana,
    title: 'Asana',
    text: 'Communication',
    connected: false,
  },
])

const socialAccounts = ref([
  {
    img: google,
    title: 'Google',
    link: 'https://google.com',
    username: 'Connected',
    connected: true,
  },
  {
    img: facebook,
    title: 'Facebook',
    link: 'https://facebook.com',
    username: 'Connected',
    connected: true,
  },
  {
    img: twitter,
    title: 'Twitter',
    link: 'https://twitter.com',
    username: 'Connected',
    connected: false,
  },
  {
    img: linkedin,
    title: 'LinkedIn',
    link: 'https://www.linkedin.com',
    username: 'Connected',
    connected: false,
  },
])
</script>

<template>
  <VRow>
    <!-- 👉 social accounts -->
    <VCol cols="12">
      <VCard
        title="Social Accounts"
        subtitle="Display content from social accounts on your site"
      >
        <VCardText>
          <VList class="card-list">
            <VListItem
              v-for="(account) in socialAccounts"
              :key="account.title"
            >
              <template #prepend>
                <VAvatar
                  start
                  size="36"
                  rounded="0"
                  :image="account.img"
                />
              </template>

              <VListItemTitle class="font-weight-medium">
                {{ account.title }}
              </VListItemTitle>

              <VListItemSubtitle v-if="account.connected">
                <a
                  :href="account.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-base text-primary"
                >
                  {{ account.username }}
                </a>
              </VListItemSubtitle>

              <VListItemSubtitle
                v-else
                class="text-body-1"
              >
                Not connected
              </VListItemSubtitle>

              <template #append>
                <VBtn
                  icon
                  :color="account.connected ? 'error' : 'secondary'"
                  variant="outlined"
                  class="rounded"
                >
                  <VIcon
                    size="20"
                    :icon="account.connected ? 'ri-delete-bin-7-line' : 'ri-link'"
                  />
                </VBtn>
              </template>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 16px;
}
</style>
