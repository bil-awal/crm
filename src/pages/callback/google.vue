<!-- google.vue -->
<script setup>
import { eventBus } from '@/utils/eventBus'
import { $wso2Api } from '@/utils/wso2Api'
import { nextTick, onMounted, ref } from 'vue'
import { jwtDecode } from 'jwt-decode'
import { $crmApiLogin } from '@/utils/crmApiLogin'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const route = useRoute()
const router = useRouter()
const routeCode = route.query.code
const googleCallback = ref(`${import.meta.env.VITE_GOOGLE_REDIRECT_URI}`)
const ability = useAbility()

const forceLogout = () => {
  window.location.href = `${import.meta.env.VITE_IS}/${import.meta.env.VITE_IS_LOGOUT_URI}`
}

const redirectToLogout = () => {
  router.replace('/logout')
}

onMounted(async () => {
  if (routeCode) {
    const timeoutId = setTimeout(redirectToLogout, 5000)

    try {
      // Debug log for WSO2 request
      console.log('Requesting WSO2 token with code:', routeCode)

      const response = await $wso2Api(`${import.meta.env.VITE_IS_TOKEN_URI}`, {
        method: 'POST',
        body: {
          client_id: `${import.meta.env.VITE_IS_CLIENT_ID}`,
          code: routeCode,
          code_verifier: `${import.meta.env.VITE_IS_CODE_VERIFIER}`,
          grant_type: `${import.meta.env.VITE_IS_GRANT_TYPE}`,
          redirect_uri: "http://localhost:5173/callback/google",
        },
      })

      const tokens = await response

      console.log('Received WSO2 tokens') // Debug log

      useCookie('accessToken').value = tokens.access_token
      useCookie('refreshToken').value = tokens.refresh_token

      await fetchLoginJwt(tokens.access_token)

      clearTimeout(timeoutId)

    } catch (error) {
      console.error('WSO2 ERROR:', error)
      clearTimeout(timeoutId)
      redirectToLogout()
    }
  }
})

const fetchLoginJwt = async accessToken => {
  try {
    console.log('Starting JWT login process') // Debug log

    // Decode WSO2 token untuk mendapatkan email
    const decodedToken = jwtDecode(accessToken)
    const email = decodedToken.email

    console.log('Decoded email from token:', email) // Debug log

    if (!email) {
      throw new Error('Email not found in token')
    }

    // Prepare request options
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
      }),
    }

    console.log('Sending request to /auth/login-jwt:', {
      url: '/auth/login-jwt',
      options: requestOptions,
    }) // Debug log

    const response = await $crmApiLogin('/auth/login-jwt', requestOptions)

    console.log('Received CRM login response:', response) // Debug log

    const result = await response

    if (result.resultCode === 1) {
      console.log('Login successful, processing user data') // Debug log
      
      const userAbilityRules = []

      // Iterate through each role
      result.data.roles.forEach(roleItem => {
        const role = roleItem.role

        // Iterate through each module in the role
        role.modules.forEach(module => {
          // Iterate through each submodule in the module
          module.submodules.forEach(submodule => {
            // Add the ability rule for each module-submodule combination
            userAbilityRules.push({
              subject: `${module.name}${submodule.name}`,
              action: "manage",
            })
          })
        })
      })

      console.log('User ability rules created:', userAbilityRules) // Debug log

      useCookie('userAbilityRules').value = userAbilityRules

      const userData = {
        name: result.data.name,
        email: result.data.email,
        avatar: result.data.avatar,
      }

      console.log('Setting user data:', userData) // Debug log

      useCookie('userData').value = userData
      localStorage.setItem('userRoles', JSON.stringify(result.data.roles))

      const accessToken = result.data.secrets[0].token

      ability.update(userAbilityRules)
      useCookie('crmAccessToken').value = accessToken

      await nextTick(() => {
        console.log('Emitting updateUserRoles event') // Debug log
        eventBus.value.emit('updateUserRoles')

        // Check if the current route is the same as the target route
        const targetRoute = route.query.to ? String(route.query.to) : '/'

        console.log('Redirecting to:', targetRoute) // Debug log
        
        if (router.currentRoute.value.path !== targetRoute) {
          router.replace(targetRoute)
        }
      })
    } else if (result.resultCode === 0) {
      console.log('User not found, redirecting to registration') // Debug log
      router.replace('/guest/user-not-registered')
    }
  } catch (error) {
    console.error('Login JWT ERROR:', {
      message: error.message,
      stack: error.stack,
      response: error.response,
    })
    redirectToLogout()
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4">
        Processing Login
      </h1>
      <p class="text-gray-600">
        Please wait while we complete your login...
      </p>
    </div>
  </div>
</template>
