import { defineStore } from 'pinia'

export const userStore = defineStore('user', {
  state: () => ({
    name: '',
    isOnline: false,
    isUpdated: false,
  }),
  actions: {
    login(name) {
        this.name = name
        this.isLoggedIn = true
    },
    logout() {
      this.isLoggedIn = false
    },
    update() {
        this.isUpdated = true
    },
    updated() {
        this.isUpdated = false
    }
  },
  getters: {
    welcomeMessage: (state) => `Welcome, ${state.name}`
  }
})
