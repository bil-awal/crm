<script setup>
const items = [
  'PANCARAN DARAT TRANSPORT',
  'PANCARAN SAMUDERA TRANSPORT',
  'PANCARAN LOGISTIK INDONESIA',
  'PANCARAN SAMUDERA SHIPYARD',
  'PANCARAN MARITIM TRANSPORTINDO',
]
</script>

<template>
  <VAutocomplete
    label="Client / Partner"
    :items="items"
    placeholder="Select Client / Partner"
  />
</template>
