export const useChatStore = defineStore('chat', {
  // ℹ️ arrow function recommended for full type inference
  state: () => ({
    contacts: [],
    chatsContacts: [],
    profileUser: undefined,
    activeChat: null,
  }),
  actions: {
    async fetchChatsAndContacts(q) {
      const { data, error } = await useApi(createUrl('/apps/chat/chats-and-contacts', {
        query: {
          q,
        },
      }))

      if (error.value) {
        console.error(error.value)
      }
      else {
        const { chatsContacts, contacts, profileUser } = data.value

        this.chatsContacts = chatsContacts
        this.contacts = contacts
        this.profileUser = profileUser
      }
    },
    async getChat(userId) {
      const res = await $api(`/apps/chat/chats/${userId}`)

      this.activeChat = res
    },
    async sendMsg(message) {
      const senderId = this.profileUser?.id

      const response = await $api(`apps/chat/chats/${this.activeChat?.contact.id}`, {
        method: 'POST',
        body: { message, senderId },
      })

      const { msg, chat } = response

      // ? If it's not undefined => New chat is created (Contact is not in list of chats)
      if (chat !== undefined) {
        const activeChat = this.activeChat

        this.chatsContacts.push({
          ...activeChat.contact,
          chat: {
            id: chat.id,
            lastMessage: [],
            unseenMsgs: 0,
            messages: [msg],
          },
        })
        if (this.activeChat) {
          this.activeChat.chat = {
            id: chat.id,
            messages: [msg],
            unseenMsgs: 0,
            userId: this.activeChat?.contact.id,
          }
        }
      }
      else {
        this.activeChat?.chat?.messages.push(msg)
      }

      // Set Last Message for active contact
      const contact = this.chatsContacts.find(c => {
        if (this.activeChat)
          return c.id === this.activeChat.contact.id
        
        return false
      })

      contact.chat.lastMessage = msg
    },
  },
})
