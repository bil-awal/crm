<!-- Components / Attachment Dialog -->
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

const rules = [fileList => !fileList || !fileList.length || fileList[0].size < 1000000000 || 'File size should be less than 1 GB!']

const processButton = () => {
  uploadProcess()
  closeButton()
}

const uploadProcess = () => {
  
  isSnackbarVisible.value = true
  snackbarMessage.value = 'Uploading ...'

  try {
    snackbarMessage.value = 'Upload Complete ' + props.itemProps.docNo
  } catch (e) {
    snackbarMessage.value = 'Upload Failed'
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
        value="upload"
        prepend-icon="ri-attachment-line"
      >
        Attachment
      </VListItem>
    </template>

    <!-- Dialog Content -->
    <VCard title="Single Document Upload">
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="isDialogVisible = false"
      />

      <VCardText>
        <VFileInput
          :rules="rules"
          label="Document"
          accept="application/pdf"
          placeholder="Pick a Document"
          prepend-icon="ri-file-pdf-2-line"
        />
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn @click="processButton">
          Upload
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
