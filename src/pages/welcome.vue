<script setup>
import miscMaskDark from '@images/misc/misc-mask-dark.png'
import miscMaskLight from '@images/misc/misc-mask-light.png'
import tree1 from '@images/misc/tree1.png'
import tree3 from '@images/misc/tree3.png'

const userData = useCookie('userData').value
const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)

definePage({
  meta: {
    public: true,
  },
})

const getGreeting = () => {
  const currentHour = new Date().getHours()
  if (currentHour < 12) return 'Good Morning'
  if (currentHour < 18) return 'Good Afternoon'
  
  return 'Good Evening'
}

const formatRoles = roles => {
  return roles.map(role => role.name).join(' | ')
}
</script>

<template>
  <div
    class="welcome-wrapper"
    style="zoom: 80%"
  >
    <div class="welcome-content text-center">
      <h1 class="text-h3 mb-4">
        {{ getGreeting() }}, {{ userData.name }}! 👋
      </h1>
      
      <div class="welcome-card elevation-6 pa-6 rounded-lg">
        <div class="d-flex justify-center mb-6">
          <VAvatar
            color="primary"
            size="100"
            class="elevation-3"
          >
            <span class="text-h4">{{ userData.name.charAt(0) }}</span>
          </VAvatar>
        </div>
        
        <div class="user-details">
          <h2 class="text-h5 mb-3">
            Profile Details
          </h2>
          <VDivider class="mb-4" />
          
          <div class="detail-item mb-2">
            <strong>Username:</strong> {{ userData.username }}
          </div>
          <div class="detail-item mb-2">
            <strong>Email:</strong> {{ userData.email }}
          </div>
          <div class="detail-item mb-2">
            <strong>Tenant:</strong> {{ userData.tenant }}
          </div>
          <div class="detail-item mb-2">
            <strong>Role:</strong> {{ userData.roleName }}
          </div>
          <div class="detail-item mb-2">
            <strong>All Roles:</strong> {{ formatRoles(userData.roles) }}
          </div>
          <div class="detail-item mb-2">
            <strong>Status:</strong> 
            <VChip 
              :color="userData.status === 'ACTIVE' ? 'success' : 'error'" 
              size="small"
            >
              {{ userData.status }}
            </VChip>
          </div>
        </div>
      </div>

      <div class="misc-footer-tree d-md-flex gap-x-2 mt-6 justify-center">
        <img
          :src="tree3"
          alt="tree"
          height="120"
          width="68"
        >
        <img
          :src="tree3"
          alt="tree"
          height="70"
          width="40"
          class="align-self-end"
        >
      </div>

      <img
        height="210"
        :src="tree1"
        class="misc-footer-tree-1 d-none d-md-block"
      >
      <img
        cover
        :src="authThemeMask"
        height="172"
        class="misc-footer-img d-none d-md-block flip-in-rtl"
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.welcome-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.welcome-content {
  max-width: 600px;
  width: 100%;
  padding: 20px;
}

.welcome-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);
  }
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.1);

  &:last-child {
    border-bottom: none;
  }
}
</style>
