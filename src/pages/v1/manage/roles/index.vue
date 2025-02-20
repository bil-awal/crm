<script setup>
import CredentialCard from '@/views/apps/credentials/CredentialCards.vue'

definePage({
  meta: {
    action: 'manage',
    subject: 'ManageRole',
  },
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <h5 class="text-h5 mb-1">
        Roles List
      </h5>
    </VCol>

    <VCol cols="12">
      <CredentialCard />
    </VCol>
  </VRow>
</template>
