// services/erpFileService.js
import { $erpFileApi } from '@/api/erpFileApi'

export const ErpFileService = {
  async getFileList(attachments) {
    if (!attachments?.length) return []

    const response = await $erpFileApi('/file/list', {
      method: 'POST',
      body: attachments,
    })

    if (!response?.data) return []

    const files = []

    Object.entries(response.data).forEach(([tableName, tableData]) => {
      if (!tableData) return

      Object.entries(tableData).forEach(([recordId, recordFiles]) => {
        files.push(...recordFiles.map(file => ({
          ...file,
          tableName,
          recordId,
          downloadUrl: this.getDownloadUrl(file.path),
        })))
      })
    })

    return files
  },

  getDownloadUrl(path) {
    if (!path) return null
    const encodedPath = encodeURIComponent(path)
    
    return `/file/download?path=${encodedPath}`
  },

  async downloadFile(url, isDirectUrl = false) {
    try {
      if (isDirectUrl) {
        // Untuk file invoice (direct URL), buka di tab baru
        window.open(url, '_blank')
        
        return
      }

      // Untuk attachment, gunakan API internal
      const response = await $erpFileApi(url)
      
      if (!response?.data) {
        throw new Error('Invalid response format')
      }

      const { fileName, content, mimeType } = response.data

      // Decode base64
      const binaryString = atob(content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Buat blob
      const blob = new Blob([bytes], { type: mimeType })
      
      // Buat link download
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = downloadUrl
      link.download = fileName || 'download'
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      window.URL.revokeObjectURL(downloadUrl)
      
    } catch (error) {
      console.error('File download error:', error)
      throw error
    }
  },
}
