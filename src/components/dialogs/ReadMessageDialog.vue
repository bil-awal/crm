<!-- ReadMessageDialog.vue -->
<script setup>
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { StarterKit } from '@tiptap/starter-kit';
import { useEditor } from '@tiptap/vue-3';
import { onMounted, ref } from 'vue';
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';

// Define props
const props = defineProps({
  itemProps: {
    type: Object,
    required: false,
  },
});

// Define emits
const emit = defineEmits(['refresh', 'navigated', 'close']);

// States
const isDialogVisible = ref(false);
const emailMessages = ref([]);
const emailReply = ref('');
const showReplyBox = ref(false);
const showReplyCard = ref(true);
const isLoading = ref(false);
const snackbarMessage = ref('');
const isSnackbarVisible = ref(false);
const subject = ref('');

// Editor setup
const editor = useEditor({
  content: '',
  extensions: [
    StarterKit,
    Image,
    Placeholder.configure({ placeholder: 'Write your message...' }),
    Underline,
    Link.configure({ openOnClick: false }),
  ],
});

// Fetch email data based on docNo from props.itemProps.docNo
const fetchApi = async () => {
  try {
    isLoading.value = true;
    const response = await $crmApi(`/invoice-messages?filter=docNo,${props.itemProps.docNo},equals`);
    if (response.resultCode === 1 && response.data.length > 0) {
      emailMessages.value = response.data; // Assign the entire array of messages
    } else {
      // Handle no data or invalid response
      console.error('No email messages found for the provided docNo.');
    }
  } catch (error) {
    console.error('Error fetching email messages:', error);
  } finally {
    isLoading.value = false;
  }
};

// Submit reply
const submitReply = async () => {
  try {
    const userData = useCookie('userData').value;
    const payload = {
      sender: userData.id,
      docNo: props.itemProps.docNo,
      subject: `RE: ${subject.value || emailMessages.value[0]?.subject || 'No Subject'}`,
      body: editor.value.getHTML(),
      status: 'sent',
    };

    const result = await $crmApi('/invoice-messages', {
      method: 'POST',
      body: payload,
    });

    if (result.resultCode === 1) {
      snackbarMessage.value = result.message || 'Reply sent successfully';
      isSnackbarVisible.value = true;
      showReplyBox.value = false;
      showReplyCard.value = true;
      editor.value.commands.clearContent(); // Clear the editor content
      fetchApi(); // Refresh email list
    } else {
      snackbarMessage.value = result.message || 'Error sending reply';
      isSnackbarVisible.value = true;
      console.error('Error sending reply:', result);
    }
  } catch (error) {
    snackbarMessage.value = 'An error occurred while sending the reply';
    isSnackbarVisible.value = true;
    console.error('An error occurred while sending the reply:', error);
  }
};

// Lifecycle hook to fetch email data when the component is mounted
onMounted(() => {
  if (props.itemProps?.docNo) {
    fetchApi();
  }
});
</script>

<template>
  <VDialog v-model="isDialogVisible">
    <template #activator="{ props }">
      <VListItem v-bind="props" value="readMessage" prepend-icon="ri-mail-open-line">
        Read Conversation
      </VListItem>
    </template>

    <PerfectScrollbar tag="div" class="mail-content-container flex-grow-1" :options="{ wheelPropagation: false }">
      <template v-if="emailMessages.length > 0">
        <!-- Iterate over email messages -->
        <div v-for="message in emailMessages" :key="message.id" class="mb-4">
          <VCard>
            <VCardText class="mail-header">
              <div class="d-flex align-start">
                <div class="d-flex flex-wrap flex-grow-1 overflow-hidden">
                  <div class="text-truncate">
                    <h6 class="text-h6 font-weight-regular text-truncate">{{ message.sender }}</h6>
                    <p class="text-body-2 mb-0">{{ message.subject }}</p>
                  </div>
                  <VSpacer />
                  <div class="d-flex align-center">
                    <span class="text-disabled me-4">{{ new Date(message.createdAt).toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </VCardText>
            <VDivider />
            <VCardText>
              <!-- Display the email body -->
              <div class="text-base" v-html="message.body" />
            </VCardText>
          </VCard>
        </div>
      </template>

      <!-- Reply or Forward -->
      <VCard v-show="showReplyCard">
        <VCardText class="font-weight-medium text-high-emphasis">
          <div class="text-base">
            Click here to <span class="text-primary cursor-pointer" @click="showReplyBox = !showReplyBox; showReplyCard = !showReplyCard">Reply</span>
          </div>
        </VCardText>
      </VCard>

      <VCard v-if="showReplyBox">
        <VCardText>
          <h6 class="text-body-1 text-high-emphasis mb-4">
            Reply to {{ emailMessages[emailMessages.length - 1]?.sender || 'Unknown Sender' }}
          </h6>          
          <VTextField v-model="subject"
            label="Subject"
            variant="underlined"
            placeholder="Write your subject..."
          />
          <!-- Editor Content -->
          <TiptapEditor
            :editor="editor"
          />

          <!-- Reply Actions -->
          <div class="d-flex justify-end gap-4 pt-2 flex-wrap">
            <IconBtn icon="ri-delete-bin-7-line" @click="showReplyBox = !showReplyBox; showReplyCard = !showReplyCard; editor.commands.clearContent()" />
            <VBtn append-icon="ri-send-plane-line" @click="submitReply">Send</VBtn>
          </div>
        </VCardText>
      </VCard>
    </PerfectScrollbar>

    <!-- Loading State -->
    <VCard v-if="isLoading">
      <VCardText>Loading email messages...</VCardText>
    </VCard>

    <!-- Snackbar for notifications -->
    <VSnackbar v-model="isSnackbarVisible" location="top">
      {{ snackbarMessage }}
      <template #actions>
        <VBtn color="error" @click="isSnackbarVisible = false">Close</VBtn>
      </template>
    </VSnackbar>
  </VDialog>
</template>

<style lang="scss">
.email-view {
  &:not(.v-navigation-drawer--active) {
    transform: translateX(110%) !important;
  }

  inline-size: 100% !important;

  @media only screen and (min-width: 1280px) {
    inline-size: calc(100% - 256px) !important;
  }

  .editor {
    padding-block-start: 0 !important;
    padding-inline: 0 !important;
  }

  .v-navigation-drawer__content {
    display: flex;
    flex-direction: column;
  }

  .ProseMirror {
    block-size: 100px;
    overflow-y: auto;

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

  .is-active {
    border-color: rgba(var(--v-theme-primary), var(--v-border-opacity)) !important;
    background-color: rgba(var(--v-theme-primary), var(--v-activated-opacity));
    color: rgb(var(--v-theme-primary));
  }

  .ProseMirror-focused {
    outline: none !important;
  }
}

.email-view-action-bar {
  min-block-size: 54px;
}

.mail-content-container {
  background-color: rgb(var(--v-theme-on-background), var(--v-hover-opacity));

  .mail-header {
    min-block-size: 84px;
  }

  .v-card {
    border: 1px solid rgba(var(--v-theme-on-surface), var(--v-border-opacity));
  }
}
</style>
