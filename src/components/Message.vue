<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { mdiSend, mdiRefresh } from '@mdi/js'
import { $crmApi } from '@/api/crmApi'
import { format, isToday, isYesterday, isSameDay, differenceInMinutes } from 'date-fns'

const props = defineProps({
  invoiceId: {
    type: String,
    required: true,
    validator: value => value && value.trim().length > 0,
  },
  allowSend: {
    type: Boolean,
    default: true,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  maxMessageLength: {
    type: Number,
    default: 500,
  },
})

const emit = defineEmits(['message-sent', 'message-error'])

const messages = ref([])
const newMessage = ref('')
const messageLoading = ref(false)
const messageError = ref(null)
const messageSuccess = ref(false)
const successMessage = ref('')
const scrollAreaRef = ref(null)

const userData = ref(useCookie('userData').value || {})
const currentUsername = computed(() => userData.value?.username || '')

const pagination = ref({
  page: 0,
  size: 20,
  totalItems: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
})

const canSendMessage = computed(() => 
  props.allowSend && 
  !props.readOnly && 
  newMessage.value.trim().length > 0 &&
  newMessage.value.length <= props.maxMessageLength &&
  !messageLoading.value
)

const messageRemainingChars = computed(() => 
  props.maxMessageLength - newMessage.value.length
)

const theme = useTheme()
const isDarkMode = computed(() => theme.global.current.value.dark)

const formatMessageDate = dateString => {
  if (!dateString) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  } catch (error) {
    console.error('Date formatting error:', error)
    return dateString
  }
}

const isCurrentUserMessage = message => {
  return message.fromUser === currentUsername.value
}

const scrollToTop = () => {
  nextTick(() => {
    if (scrollAreaRef.value?.$el) {
      scrollAreaRef.value.$el.scrollTop = 0
    }
  })
}

const fetchMessages = async (page = 0) => {
  if (!props.invoiceId || props.invoiceId.trim() === '') {
    messageError.value = 'Invalid Invoice ID'
    return
  }

  messageLoading.value = true
  messageError.value = null

  try {
    const response = await $crmApi(`/messages/${props.invoiceId}?sort=timeStamp,desc&page=${page}&size=20`)
    
    if (!response) {
      throw new Error('Failed to fetch messages')
    }

    const data = response
    const messageItems = data.items || []

    const transformedMessages = messageItems.map(msg => ({
      id: msg.id,
      content: msg.message,
      fromUser: msg.fromUser,
      toUser: msg.toUser,
      createdAt: msg.timeStamp,
      formattedDate: formatMessageDate(msg.timeStamp),
    }))

    if (page === 0) {
      messages.value = transformedMessages
    } else {
      messages.value = [...transformedMessages, ...messages.value]
    }

    pagination.value = {
      page: data.page,
      size: data.size,
      totalItems: data.totalItems,
      totalPages: data.totalPages,
      hasNext: data.hasNext,
      hasPrev: data.hasPrev
    }

    if (page === 0) {
      scrollToTop()
    }
  } catch (error) {
    messageError.value = error.message || 'Failed to fetch messages'
    console.error('Fetch messages error:', error)
    emit('message-error', {
      message: error.message,
      invoiceId: props.invoiceId,
    })
  } finally {
    messageLoading.value = false
  }
}

const sendMessage = async () => {
  if (!canSendMessage.value) return

  messageLoading.value = true
  messageError.value = null
  messageSuccess.value = false
  successMessage.value = ''

  try {
    const trimmedMessage = newMessage.value.trim()
    
    const response = await $crmApi(`/messages/${props.invoiceId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        srcInvoiceId: props.invoiceId,
        message: trimmedMessage,
      }),
    })

    const data = response

    if (data.resultCode === 1) {
      newMessage.value = ''
      messageSuccess.value = true
      successMessage.value = data.message || 'Message sent successfully'
      
      await fetchMessages(0)
      scrollToTop()

      emit('message-sent', {
        message: data.message,
        detail: data.detail,
      })
    } else {
      throw new Error(data.message || 'Failed to send message')
    }
  } catch (error) {
    messageError.value = error.message || 'Failed to send message'
    emit('message-error', {
      message: error.message,
      invoiceId: props.invoiceId,
    })
  } finally {
    messageLoading.value = false
  }
}

onMounted(() => {
  if (props.invoiceId) {
    fetchMessages()
  }
})

watch(() => props.invoiceId, newId => {
  if (newId) {
    fetchMessages()
  }
})

const groupedMessages = computed(() => {
  if (!messages.value.length) return []

  const groups = []
  let currentGroup = null
  const TIME_THRESHOLD = 5 // minutes between messages to create new group

  messages.value.forEach((message, index) => {
    const messageDate = new Date(message.createdAt)
    const nextMessage = messages.value[index + 1]
    
    // Check if we need to create a new group
    const needsNewGroup = !currentGroup || 
      nextMessage?.fromUser !== message.fromUser ||
      (nextMessage && differenceInMinutes(
        messageDate,
        new Date(nextMessage.createdAt)
      ) > TIME_THRESHOLD)

    if (needsNewGroup) {
      currentGroup = {
        id: `group-${message.id}`,
        fromUser: message.fromUser,
        isCurrentUser: isCurrentUserMessage(message),
        messages: [],
        timestamp: messageDate
      }
      groups.push(currentGroup)
    }

    currentGroup.messages.unshift({
      ...message,
      showTime: needsNewGroup || index === 0
    })
  })

  return groups.reverse()
})

const formatMessageGroup = (date) => {
  if (!date) return ''
  
  const messageDate = new Date(date)
  
  if (isToday(messageDate)) {
    return 'Today'
  } else if (isYesterday(messageDate)) {
    return 'Yesterday'
  } else {
    return format(messageDate, 'MMMM d, yyyy')
  }
}

const formatDetailedTime = (dateString) => {
  if (!dateString) return ''
  try {
    return format(new Date(dateString), 'HH:mm')
  } catch (error) {
    console.error('Time formatting error:', error)
    return ''
  }
}

defineExpose({
  fetchMessages,
  sendMessage,
})
</script>

<template>
  <VCard class="message-card">
    <VCardTitle class="d-flex justify-space-between align-center px-4 py-3">
      <span class="text-subtitle-1">Messages</span>
      <VBtn
        v-if="!messageLoading"
        icon="mdi-refresh"
        variant="text"
        size="small"
        @click="fetchMessages(0)"
      />
    </VCardTitle>

    <VDivider />

    <VCardText class="pa-0">
      <VAlert
        v-if="messageError"
        type="error"
        variant="tonal"
        class="ma-2"
        closable
        density="compact"
      >
        {{ messageError }}
      </VAlert>

      <VSheet
        ref="scrollAreaRef"
        class="message-list"
        :class="{ 'dark-mode': isDarkMode }"
      >
        <div class="message-items px-3 py-4">
          <TransitionGroup name="message">
            <template v-for="(group, groupIndex) in groupedMessages" :key="group.id">
              <!-- Message group -->
              <div 
                class="message-group"
                :class="{ 'message-group-self': group.isCurrentUser }"
              >
                <!-- Sender name for other users -->
                <div 
                  v-if="!group.isCurrentUser"
                  class="sender-name"
                >
                  {{ group.fromUser }}
                </div>

                <!-- Messages in group -->
                <div 
                  v-for="(message, messageIndex) in group.messages"
                  :key="message.id"
                  class="message-wrapper"
                  :class="{ 
                    'message-self': group.isCurrentUser,
                    'mb-1': messageIndex !== group.messages.length - 1
                  }"
                >
                  <div 
                    class="message-bubble"
                    :class="{
                      'message-bubble-self': group.isCurrentUser,
                      'message-bubble-other': !group.isCurrentUser,
                      'message-bubble-first': messageIndex === group.messages.length - 1,
                      'message-bubble-last': messageIndex === 0
                    }"
                  >
                    <div class="message-content">
                      {{ message.content }}
                    </div>
                    <div v-if="message.showTime" class="message-time">
                      {{ formatDetailedTime(message.createdAt) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Date separator if last message of the day -->
              <div
                v-if="groupIndex === groupedMessages.length - 1 || !isSameDay(new Date(group.timestamp), new Date(groupedMessages[groupIndex + 1].timestamp))"
                class="date-separator"
              >
                <div class="date-label">
                  {{ formatMessageGroup(group.timestamp) }}
                </div>
              </div>
            </template>
          </TransitionGroup>
        </div>

        <div class="text-center pa-2">
          <VBtn
            v-if="pagination.hasNext"
            variant="outlined"
            size="small"
            :loading="messageLoading"
            @click="fetchMessages(pagination.page + 1)"
          >
            Load More
          </VBtn>
        </div>

        <VAlert
          v-if="!messageLoading && messages.length === 0"
          type="info"
          variant="tonal"
          class="ma-2"
        >
          No messages yet
        </VAlert>

        <div
          v-if="messageLoading && messages.length === 0"
          class="d-flex justify-center align-center pa-4"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>
      </VSheet>
    </VCardText>

    <VDivider />

    <VCardActions class="pa-3">
      <VForm @submit.prevent="sendMessage" class="d-flex w-100 gap-2">
        <VTextField
          v-model="newMessage"
          placeholder="Type your message..."
          :disabled="messageLoading || !allowSend || readOnly"
          :maxlength="maxMessageLength"
          hide-details
          density="comfortable"
          variant="outlined"
          class="flex-grow-1"
          @keyup.enter.prevent="sendMessage"
        >
          <template #append-inner>
            <VBtn
              :disabled="!canSendMessage"
              :loading="messageLoading"
              type="submit"
              icon="mdi-send"
              size="small"
            />
          </template>
        </VTextField>
      </VForm>
    </VCardActions>

    <div v-if="newMessage" class="text-caption text-disabled text-right pe-4 pb-2">
      {{ messageRemainingChars }} characters remaining
    </div>
  </VCard>
</template>

<style scoped>
.message-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-list {
  height: calc(100vh - 400px);
  min-height: 300px;
  overflow-y: auto;
  background-color: rgb(var(--v-theme-background));
  display: flex;
  flex-direction: column-reverse;
}

.message-items {
  display: flex;
  flex-direction: column-reverse;
}

.date-separator {
  text-align: center;
  margin: 16px 0;
  position: relative;
}

.date-label {
  background-color: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.75rem;
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-block;
}

.message-group {
  margin-bottom: 16px;
}

.message-group-self {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.sender-name {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 4px;
  font-weight: 500;
  padding-left: 12px;
}

.message-wrapper {
  display: flex;
  margin-bottom: 8px;
}

.message-self {
  justify-content: flex-end;
}

.message-bubble {
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 80%;
  position: relative;
}

.message-bubble-self {
  background-color: white;
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgb(var(--v-theme-outline));
}

.message-bubble-other {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.message-bubble-first {
  margin-top: 2px;
}

.message-bubble-last {
  margin-bottom: 2px;
}

.message-bubble-self.message-bubble-last {
  border-bottom-right-radius: 4px;
}

.message-bubble-other.message-bubble-last {
  border-bottom-left-radius: 4px;
}

.message-content {
  word-break: break-word;
  line-height: 1.4;
  font-size: 0.875rem;
}

.message-time {
  font-size: 0.75rem;
  margin-top: 4px;
  opacity: 0.8;
}

.message-bubble-self .message-time {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.message-bubble-other .message-time {
  color: rgba(var(--v-theme-on-primary), 0.9);
}

.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.dark-mode .message-bubble-self {
  background-color: rgb(var(--v-theme-surface-variant));
  border-color: transparent;
}

.dark-mode .date-label {
  background-color: rgba(var(--v-theme-on-surface), 0.1);
}
</style>
