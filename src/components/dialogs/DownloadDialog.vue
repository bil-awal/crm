<!-- Components / Download Dialog -->
<script setup>
import { ref } from 'vue'

const props = defineProps({
  itemProps: {
    type: Object,
    required: false,
  },
})

const isDialogVisible = ref(false)
const isSnackbarVisible = ref(false)
const radioGroup = ref()
const snackbarMessage = ref('')

const downloadOptions = [
  { title: 'CSV', value: 'csv', prependIcon: 'ri-table-view' },
  { title: 'PDF', value: 'pdf', prependIcon: 'ri-file-pdf-2-line' },
  { title: 'Excel', value: 'excel', prependIcon: 'ri-file-excel-2-line' },
  { title: 'XML', value: 'xml', prependIcon: 'ri-file-code-line' },
]

const downloadButton = () => {
  downloadProcess()
  closeButton()
}

const downloadProcess = () => {
  
  isSnackbarVisible.value = true
  snackbarMessage.value = 'Downloading ...'

  try {
    snackbarMessage.value = 'Download Complete ' + props.itemProps.docNo
  } catch (e) {
    snackbarMessage.value = 'Download Failed'
  }
  
}

const closeButton = () => {
  isDialogVisible.value = false
  radioGroup.value = null
}
</script>

<template>
  <VDialog
    v-model="isDialogVisible"
    width="500"
  >
    <!-- Activator -->
    <template #activator="{ props }">
      <VListItem
        v-bind="props"
        value="download"
        prepend-icon="ri-download-2-line"
      >
        Download
      </VListItem>
    </template>

    <!-- Dialog Content -->
    <VCard title="Single Document Download">
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="isDialogVisible = false"
      />

      <VCardText>
        <VRadioGroup
          v-model="radioGroup"
          inline
        >
          <VRadio
            v-for="option in downloadOptions"
            :key="option.value"
            :label="option.title"
            :value="option.value"
          >
            <template #prepend>
              <VIcon :icon="option.prependIcon" />
            </template>
          </VRadio>
        </VRadioGroup>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn @click="downloadButton">
          Download
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- SnackBar -->
  <VSnackbar
    v-model="isSnackbarVisible"
    transition="scroll-y-reverse-transition"
    location="center"
    color="primary"
  >
    {{ snackbarMessage }}
  </VSnackbar>
</template>
