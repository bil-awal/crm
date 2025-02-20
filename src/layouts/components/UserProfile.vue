<script setup>
import { useCookie } from '@/@core/composable/useCookie'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { $crmApi } from '@/api/crmApi'

const router = useRouter()
const ability = useAbility()

const userData = useCookie('userData')
const token = useCookie('crmAccessToken')

const logout = async () => {
  try {
    const apiLogout = await $crmApi('/auth/logout', {
      method: 'DELETE',
      body: {
        token: token.value,
      },
    })
  } catch (error) {
    console.error('ERROR:', error)
  }

  /**
   * PAKSA LOGOUT KARENA ALASAN:
   * 1. DALAM TAHAP PENGEMBANGAN
   * 2. TOKEN VALID DALAM KURUN WAKTU 8 JAM. 
   *    LOGOUT TIDAK AKAN BERHASIL DARI API 
   *    KARENA TOKEN TIDAK VALID (EXPIRED)
   * 
   * CATATAN:
   * 1. TOKEN TIDAK AKAN MENUMPUK DI DATABASE
   *    KARENA TOKEN AKAN REPLACE SETELAH LOGIN.
   * 
   * PERTANYAAN:
   * 1. APAKAH KONSEP SEPERTI INI DIPERBOLEHKAN
   */

  // Remove "accessToken" from cookie
  useCookie('crmAccessToken').value = null

  // Remove "userData" from cookie
  userData.value = null

  // ℹ️ We had to remove abilities in then block because if we don't nav menu items mutation is visible while redirecting user to login page

  // Remove "userAbilities" from cookie
  useCookie('userAbilityRules').value = null

  // Reset ability to initial ability
  ability.update([])

  localStorage.removeItem('userMaps')

  await nextTick(() => {
    eventBus.value.emit('handleLogout')
    router.push('/login')
  })
}

const userProfileList = [
  // {
  //   type: 'navItem',
  //   icon: 'ri-user-line',
  //   title: 'Profile',
  //   to: {
  //     name: 'apps-user-view-id',
  //     params: { id: 21 },
  //   },
  // },
  { type: 'divider' },
]
</script>

<template>
  <VBadge
    v-if="userData"
    dot
    bordered
    location="bottom right"
    offset-x="3"
    offset-y="3"
    color="success"
  >
    <VAvatar
      class="cursor-pointer"
      size="38"
      :color="!(userData && userData.avatar) ? 'primary' : undefined"
      :variant="!(userData && userData.avatar) ? 'tonal' : undefined"
    >
      <VImg
        v-if="userData && userData.avatar"
        :src="userData.avatar"
      />
      <VIcon
        v-else
        icon="ri-user-line"
      />

      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        width="230"
        location="bottom end"
        offset="15px"
      >
        <VList>
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar
                    :color="!(userData && userData.avatar) ? 'primary' : undefined"
                    :variant="!(userData && userData.avatar) ? 'tonal' : undefined"
                  >
                    <VImg
                      v-if="userData && userData.avatar"
                      :src="userData.avatar"
                    />
                    <VIcon
                      v-else
                      icon="ri-user-line"
                    />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <h6 class="text-h6 font-weight-medium">
              {{ userData.name }}
            </h6>
            <VListItemSubtitle class="text-disabled">
              {{ userData.email }}
            </VListItemSubtitle>
          </VListItem>

          <PerfectScrollbar :options="{ wheelPropagation: false }">
            <template
              v-for="item in userProfileList"
              :key="item.title"
            >
              <VListItem
                v-if="item.type === 'navItem'"
                :to="item.to"
              >
                <template #prepend>
                  <VIcon
                    :icon="item.icon"
                    size="22"
                  />
                </template>

                <VListItemTitle>{{ item.title }}</VListItemTitle>

                <template
                  v-if="item.badgeProps"
                  #append
                >
                  <VBadge
                    inline
                    v-bind="item.badgeProps"
                  />
                </template>
              </VListItem>

              <VDivider
                v-else
                class="my-1"
              />
            </template>

            <VListItem>
              <VBtn
                block
                color="error"
                size="small"
                append-icon="ri-logout-box-r-line"
                @click="logout"
              >
                Sign Out
              </VBtn>
            </VListItem>
          </PerfectScrollbar>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
