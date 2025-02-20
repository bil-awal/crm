import { ref } from 'vue'

// Logic for handling dialog interactions
export function useDialog() {
  const isReviseDialogOpen = ref(false)
  const revisionNote = ref('')

  function openReviseDialog(id) {
    isReviseDialogOpen.value = true
  }

  function reviseInvoice() {
    // Logic to revise the invoice
    console.log('Revising invoice with note:', revisionNote.value)
    isReviseDialogOpen.value = false
  }

  return {
    isReviseDialogOpen,
    revisionNote,
    openReviseDialog,
    reviseInvoice,
  }
}

// Logic for handling table and actions
export function useTable(props) {
  const itemsPerPage = ref(10)
  const page = ref(1)

  function handleAction(item) {
    // Passing the action to the parent via props
    props.actionHandler(item)
  }

  return {
    itemsPerPage,
    page,
    handleAction,
  }
}
