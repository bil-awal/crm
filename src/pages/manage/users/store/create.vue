<!-- src\pages\manage\users\store\create.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { $userStoreApi } from '@/utils/userStoreApi'

definePage({
  meta: {
    subject: 'USER_MANAGEMENT_CREATE',
  },
})

// Constants
const DEFAULT_FORM_DATA = {
  name: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  passwordConfirm: '',
}

// Validation utility
const createValidator = rules => {
  return (value, additionalContext = {}) => {
    for (const [rule, validate] of Object.entries(rules)) {
      const result = validate(value, additionalContext)
      if (result !== true) return result
    }
    
    return true
  }
}

// Validation rules
const VALIDATION_RULES = {
  name: createValidator({
    required: value => !!value?.trim() || 'Name is required',
    minLength: value => value.trim().length >= 2 || 'Name must be at least 2 characters',
  }),
  email: createValidator({
    required: value => !!value?.trim() || 'Email is required',
    format: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email format',
  }),
  phone: createValidator({
    format: value => !value || /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(value) || 'Invalid phone number format',
  }),
  username: createValidator({
    required: value => !!value?.trim() || 'Username is required',
    minLength: value => value.length >= 4 || 'Username must be at least 4 characters',
  }),
  password: createValidator({
    required: value => !!value || 'Password is required',
    minLength: value => value.length >= 6 || 'Password must be at least 6 characters',
    complexity: value => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(value) || 'Password must include letters and numbers',
  }),
  passwordConfirm: createValidator({
    required: value => !!value || 'Password confirmation is required',
    match: (value, { password }) => value === password || 'Passwords do not match',
  }),
}

// Composables
const router = useRouter()

// Reactive state
const formData = ref({ ...DEFAULT_FORM_DATA })
const isSubmitting = ref(false)

const passwordVisibility = ref({
  password: false,
  passwordConfirm: false,
})

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  timeout: 3000,
})

// Computed validation
const formErrors = computed(() => {
  const errors = []
  const validationContext = { password: formData.value.password }

  // Validate each field
  const fieldsToValidate = ['name', 'email', 'username', 'password', 'passwordConfirm']

  fieldsToValidate.forEach(field => {
    const validator = VALIDATION_RULES[field]

    const validationResult = validator(
      formData.value[field], 
      validationContext,
    )
    
    if (validationResult !== true) {
      errors.push(validationResult)
    }
  })

  // Optional phone validation
  if (formData.value.phone) {
    const phoneValidation = VALIDATION_RULES.phone(formData.value.phone)
    if (phoneValidation !== true) {
      errors.push(phoneValidation)
    }
  }

  return errors
})

// Methods
const showSnackbar = (text, color = 'success') => {
  snackbar.value = { 
    show: true, 
    text, 
    color, 
    timeout: 3000, 
  }
}

const handleSubmit = async () => {
  // Validate form before submission
  if (formErrors.value.length > 0) {
    showSnackbar(formErrors.value[0], 'error')
    
    return
  }

  try {
    isSubmitting.value = true

    // Remove passwordConfirm from API payload
    const { passwordConfirm, ...apiPayload } = formData.value

    const response = await $userStoreApi('/users', {
      method: 'POST',
      body: apiPayload,
    })

    if (response.resultCode == 1) {
      showSnackbar('User created successfully')
      router.push({ name: 'manage-users' })
    } else {
      showSnackbar(response?.message || 'Failed to create user', 'error')
    }
  } catch (error) {
    console.error('User creation error:', error)
    showSnackbar(
      error.message || 'An unexpected error occurred', 
      'error',
    )
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  formData.value = { ...DEFAULT_FORM_DATA }
  passwordVisibility.value = {
    password: false,
    passwordConfirm: false,
  }
}

const togglePasswordVisibility = field => {
  passwordVisibility.value[field] = !passwordVisibility.value[field]
}
</script>

<template>
  <VCard>
    <VCardTitle class="text-h5 pa-4">
      Create User External Account
    </VCardTitle>

    <VCardText>
      <VForm @submit.prevent="handleSubmit">
        <VRow>
          <!-- Form Errors Alert -->
          <VCol
            v-if="formErrors.length"
            cols="12"
          >
            <VAlert
              color="error"
              variant="tonal"
              class="mb-4"
            >
              <ul class="mb-0">
                <li
                  v-for="error in formErrors"
                  :key="error"
                >
                  {{ error }}
                </li>
              </ul>
            </VAlert>
          </VCol>

          <!-- Name Input -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.name"
              label="Full Name"
              placeholder="Enter full name"
              required
            />
          </VCol>

          <!-- Email Input -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.email"
              label="Email"
              placeholder="Enter email address"
              required
            />
          </VCol>

          <!-- Phone Input -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.phone"
              label="Phone"
              placeholder="Enter phone number"
            />
          </VCol>

          <!-- Username Input -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.username"
              label="Username"
              placeholder="Choose a username"
              required
              autocomplete="off"
            />
          </VCol>

          <!-- Password Inputs -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.password"
              label="Password"
              :type="passwordVisibility.password ? 'text' : 'password'"
              :append-inner-icon="passwordVisibility.password ? 'mdi-eye-off' : 'mdi-eye'"
              required
              autocomplete="new-password"
              @click:append-inner="togglePasswordVisibility('password')"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.passwordConfirm"
              label="Confirm Password"
              :type="passwordVisibility.passwordConfirm ? 'text' : 'password'"
              :append-inner-icon="passwordVisibility.passwordConfirm ? 'mdi-eye- off' : 'mdi-eye'"
              required
              autocomplete="new-password"
              @click:append-inner="togglePasswordVisibility('passwordConfirm')"
            />
          </VCol>

          <!-- Form Actions -->
          <VCol
            cols="12"
            class="d-flex justify-start gap-4"
          >
            <VBtn
              color="primary"
              type="submit"
              :loading="isSubmitting"
              :disabled="isSubmitting || formErrors.length > 0"
            >
              {{ isSubmitting ? 'Creating User...' : 'Create User' }}
            </VBtn>
            <VBtn
              color="secondary"
              variant="outlined"
              :disabled="isSubmitting"
              @click="resetForm"
            >
              Reset
            </VBtn>
            <VBtn
              color="secondary"
              variant="outlined"
              :disabled="isSubmitting"
              @click="router.push({ name: 'manage-users' })"
            >
              Cancel
            </VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>

  <!-- Snackbar for notifications -->
  <VSnackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    location="top"
  >
    {{ snackbar.text }}
    <template #actions>
      <VBtn
        color="white"
        variant="text"
        @click="snackbar.show = false"
      >
        Close
      </VBtn>
    </template>
  </VSnackbar>
</template>

<style scoped>
.v-btn {
  text-transform: none;
}
</style>
