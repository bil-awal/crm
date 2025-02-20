<!-- Components / Tabs / InvoiceLogStacked.vue -->
<script setup>
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { StarterKit } from '@tiptap/starter-kit';
import { useEditor } from '@tiptap/vue-3';
import { ref, watch } from 'vue';
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';

// Define props
const props = defineProps({
  itemProps: {
    type: Object,
    required: true,
  },
});

const currentTab = ref('tab-1');
const emailMessages = ref([]);
const showReplyBox = ref(false);
const isLoading = ref(false);
const subject = ref('');
const snackbarMessage = ref('');
const isSnackbarVisible = ref(false);

// Editor setup for replying
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

// Fetch email data based on docNo from props.itemProps.invoice.docNo
const fetchApi = async (docNo) => {
  try {
    isLoading.value = true;
    const response = await $crmApi(`/invoice-messages?filter=docNo,${docNo},equals`);
    if (response.resultCode === 1 && response.data.length > 0) {
      emailMessages.value = response.data;
    } else {
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
      docNo: props.itemProps.invoice.docNo,
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
      editor.value.commands.clearContent(); // Clear the editor content
      fetchApi(props.itemProps.invoice.docNo); // Refresh email list
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

// Watch for changes in itemProps and call fetchApi when docNo is available
watch(
  () => props.itemProps.invoice.docNo,
  (newDocNo) => {
    if (newDocNo) {
      fetchApi(newDocNo);
    }
  },
  { immediate: true }
);

</script>

<template>
  <VTabs v-model="currentTab" grow stacked>
    <VTab value="tab-1">
      <VIcon icon="ri-question-answer-line" class="mb-2" />
      <span>Messages</span>
    </VTab>

    <VTab value="tab-2">
      <VIcon icon="ri-history-line" class="mb-2" />
      <span>Histories</span>
    </VTab>
  </VTabs>

  <VWindow v-model="currentTab" class="mt-5">
    <!-- Message Tab Content -->
    <VWindowItem value="tab-1">
      <PerfectScrollbar tag="div" class="mail-content-container flex-grow-1" :options="{ wheelPropagation: false }" style=" overflow: hidden;block-size: 50vh;">
        <template v-if="emailMessages.length > 0">
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
                <div class="text-base" v-html="message.body" />
              </VCardText>
            </VCard>
          </div>
        </template>

        <!-- Reply Section -->
        <VCard v-show="!showReplyBox">
          <VCardText class="font-weight-medium text-high-emphasis">
            <div class="text-base">
              Click here to <span class="text-primary cursor-pointer" @click="showReplyBox = true">Reply</span>
            </div>
          </VCardText>
        </VCard>

        <VCard v-if="showReplyBox">
          <VCardText>
            <h6 class="text-body-1 text-high-emphasis mb-4">
              Reply to {{ emailMessages[emailMessages.length - 1]?.sender || 'Unknown Sender' }}
            </h6>
            <VTextField v-model="subject" label="Subject" variant="underlined" placeholder="Write your subject..." />
            <TiptapEditor :editor="editor" />
            <div class="d-flex justify-end gap-4 pt-2 flex-wrap">
              <IconBtn icon="ri-delete-bin-7-line" @click="showReplyBox = false; editor.commands.clearContent()" />
              <VBtn append-icon="ri-send-plane-line" @click="submitReply">Send</VBtn>
            </div>
          </VCardText>
        </VCard>

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
      </PerfectScrollbar>
    </VWindowItem>

    <!-- History Tab Content -->
    <VWindowItem value="tab-2">
      <p>Invoice history content goes here.</p>
    </VWindowItem>
  </VWindow>
</template>
