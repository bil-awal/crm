<script setup>
const props = defineProps({
  data: {
    type: null,
    required: true,
  },
})

const emit = defineEmits([
  'push',
  'remove',
])

const invoice = ref(props.data.invoice)
const salesperson = ref(props.data.salesperson)
const thanksNote = ref(props.data.thanksNote)
const note = ref(props.data.note)

// 👉 Clients
const clients = ref([])

// 👉 fetchClients
const fetchClients = async () => {
  const { data, error } = await useApi('/apps/invoice/clients')
  if (error.value)
    console.error(error.value)
  else
    clients.value = data.value
}

fetchClients()

// 👉 Add item function
const addItem = () => {
  emit('push', {
    title: 'App Design',
    cost: 24,
    hours: 1,
    description: 'Designed UI kit & app pages.',
  })
}

const removeProduct = id => {
  emit('remove', id)
}
</script>

<template>
  <VCard class="pa-12" />
</template>
