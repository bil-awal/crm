<!-- SendMessageDialog.vue -->
<script setup>
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { StarterKit } from '@tiptap/starter-kit';
import {
  EditorContent,
  useEditor,
} from '@tiptap/vue-3';

const props = defineProps({
  title: {
    type: String,
    required: false
  },
  itemProps: {
    type: Object,
    required: false,
  },
})

const emit = defineEmits(['close'])
const content = ref('')
const to = ref('')
const title = ref(props.title)
const subject = ref(`${title.value ? title.value + ' - ' + props.itemProps.docNo : props.itemProps.docNo}`)
const message = ref('')
const cc = ref('')
const bcc = ref('')
const isEmailCc = ref(false)
const isEmailBcc = ref(false)
const isDialogVisible = ref(false)
const isSnackbarVisible = ref(false)
const snackbarMessage = ref('')

const editor = useEditor({
  content: '',
  extensions: [
    StarterKit,
    Image,
    Placeholder.configure({ placeholder: 'Message' }),
    Underline,
    Link.configure({ openOnClick: false }),
  ],
})

const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href

  const url = window.prompt('URL', previousUrl)

  if (url === null)
    return

  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const addImage = () => {
  const url = window.prompt('URL')
  if (url)
    editor.value?.chain().focus().setImage({ src: url }).run()
}

const reset = () => {
  content.value =
  to.value = 
  subject.value =
  message.value =
  cc.value = 
  bcc.value = ''
  isEmailCc.value =
  isEmailBcc.value = false
}

const closeButton = () => {
  reset()
  isDialogVisible.value = false
}

const submitMessage = async () => {
  try {
    const userData = useCookie('userData').value
    const payload = {
      sender: userData.id,
      docNo: props.itemProps.docNo,
      subject: subject.value,
      body: editor.value.getHTML(),
      status: 'sent',
    }

    const result = await $crmApi('/invoice-messages', {
      method: 'POST',
      body: payload,
    })

    if (result.resultCode === 1) {
      snackbarMessage.value = result.message || 'Message sent successfully'
      isSnackbarVisible.value = true
      closeButton() // Reset and close the dialog
    } else {
      snackbarMessage.value = result.message || 'Error sending message'
      isSnackbarVisible.value = true
      console.error('Error sending message:', result)
    }
  } catch (error) {
    snackbarMessage.value = 'An error occurred while sending the message'
    isSnackbarVisible.value = true
    console.error('An error occurred while sending the message:', error)
  }
}
</script>

<template>
  <VDialog v-model="isDialogVisible">
    <template #activator="{ props }">
      <VListItem
        v-bind="props"
        value="sendMessage"
        prepend-icon="ri-mail-send-line"
      >
        Send Message
      </VListItem>
    </template>
    <VCard
      class="email-compose-dialog"
      elevation="24"
      max-width="30vw"
    >
      <VCardItem class="py-3">
        <VCardTitle class="text-medium-emphasis">
          Compose Message
        </VCardTitle>

        <template #append>
          <IconBtn @click="closeButton">
            <VIcon icon="ri-subtract-line" />
          </IconBtn>

          <IconBtn @click="closeButton">
            <VIcon icon="ri-close-line" />
          </IconBtn>
        </template>
      </VCardItem>

      <VTextField
        v-model="subject"
        density="compact"
      >
        <template #prepend-inner>
          <div class="text-disabled font-weight-medium">
            Subject:
          </div>
        </template>
      </VTextField>

      <VDivider />

      <div class="tiptap-editor-wrapper">
        <div
          v-if="editor"
          class="d-flex flex-wrap gap-x-1 px-4 py-2"
        >
          <IconBtn
            rounded
            :color="editor.isActive('bold') ? 'primary' : ''"
            :variant="editor.isActive('bold') ? 'tonal' : 'text'"
            @click="editor.chain().focus().toggleBold().run()"
          >
            <VIcon icon="ri-bold" />
          </IconBtn>

          <IconBtn
            rounded
            :color="editor.isActive('underline') ? 'primary' : ''"
            :variant="editor.isActive('underline') ? 'tonal' : 'text'"
            @click="editor.commands.toggleUnderline()"
          >
            <VIcon icon="ri-underline" />
          </IconBtn>

          <IconBtn
            rounded
            :color="editor.isActive('italic') ? 'primary' : ''"
            :variant="editor.isActive('italic') ? 'tonal' : 'text'"
            @click="editor.chain().focus().toggleItalic().run()"
          >
            <VIcon icon="ri-italic" />
          </IconBtn>

          <IconBtn
            rounded
            :color="editor.isActive('bulletList') ? 'primary' : ''"
            :variant="editor.isActive('bulletList') ? 'tonal' : 'text'"
            @click="editor.chain().focus().toggleBulletList().run()"
          >
            <VIcon icon="ri-list-check" />
          </IconBtn>

          <IconBtn
            rounded
            :color="editor.isActive('orderedList') ? 'primary' : ''"
            :variant="editor.isActive('orderedList') ? 'tonal' : 'text'"
            @click="editor.chain().focus().toggleOrderedList().run()"
          >
            <VIcon icon="ri-list-ordered-2" />
          </IconBtn>
        </div>

        <VDivider />

        <div class="mx-5">
          <EditorContent :editor="editor" />
        </div>
      </div>

      <div class="d-flex align-center px-5 py-4 gap-4">
        <VBtn
          append-icon="ri-send-plane-line"
          :disabled="body === '' ? true : false"
          @click="submitMessage"
        >
          Send
        </VBtn>

        <IconBtn>
          <VIcon icon="ri-attachment-2" />
        </IconBtn>

        <VSpacer />

        <IconBtn>
          <VIcon icon="ri-more-2-line" />
        </IconBtn>

        <IconBtn @click="reset">
          <VIcon icon="ri-delete-bin-7-line" />
        </IconBtn>
      </div>
    </VCard>
  </VDialog>

  <VSnackbar
    v-model="isSnackbarVisible"
    location="top"
  >
    {{ snackbarMessage }}
    <template #actions>
      <VBtn
        color="error"
        @click="isSnackbarVisible = false"
      >
        Close
      </VBtn>
    </template>
  </VSnackbar>
</template>

<style lang="scss">
.v-card.email-compose-dialog {
  z-index: 910 !important;

  .v-field--prepended {
    padding-inline-start: 20px;
  }

  .v-field__prepend-inner {
    align-items: center;
    padding: 0;
  }

  .v-card-item {
    background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
  }

  .v-textarea .v-field {
    --v-field-padding-start: 20px;
  }

  .v-field__outline {
    display: none;
  }

  .ProseMirror {
    block-size: 150px;
    overflow-y: auto;
    padding-block: 0.5rem;

    &:focus-visible {
      outline: none;
    }

    p {
      margin-block-end: 0;
    }

    p.is-editor-empty:first-child::before {
      block-size: 0;
      color: #adb5bd;
      content: attr(data-placeholder);
      float: inline-start;
      pointer-events: none;
    }

    ul,
    ol {
      padding-inline: 1.125rem;
    }
  }
}
</style>
