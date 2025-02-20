<script setup>
import { useTheme } from 'vuetify'
import UserInvoiceTable from './UserInvoiceTable.vue'
import pdf from '@images/icons/project-icons/pdf.png'
import avatar2 from '@images/avatars/avatar-2.png'
import avatar3 from '@images/avatars/avatar-3.png'
import avatar4 from '@images/avatars/avatar-4.png'
import avatar5 from '@images/avatars/avatar-5.png'
import figma from '@images/icons/project-icons/figma.png'
import html5 from '@images/icons/project-icons/html5.png'
import python from '@images/icons/project-icons/python.png'
import react from '@images/icons/project-icons/react.png'
import sketch from '@images/icons/project-icons/sketch.png'
import vue from '@images/icons/project-icons/vue.png'
import xamarin from '@images/icons/project-icons/xamarin.png'

const projectTableHeaders = [
  {
    title: 'PROJECT',
    key: 'name',
  },
  {
    title: 'TOTAL TASK',
    key: 'totalTask',
  },
  {
    title: 'PROGRESS',
    key: 'progress',
  },
  {
    title: 'HOURS',
    key: 'hours',
  },
]

const { name } = useTheme()

const projects = [
  {
    logo: react,
    name: 'BGC eCommerce App',
    project: 'React Project',
    totalTask: '122/240',
    progress: 78,
    hours: '18:42',
  },
  {
    logo: figma,
    name: 'Falcon Logo Design',
    project: 'Figma Project',
    totalTask: '09/56',
    progress: 18,
    hours: '20:42',
  },
  {
    logo: vue,
    name: 'Dashboard Design',
    project: 'Vuejs Project',
    totalTask: '290/320',
    progress: 62,
    hours: '120:87',
  },
  {
    logo: xamarin,
    name: 'Foodista mobile app',
    project: 'Xamarin Project',
    totalTask: '290/320',
    progress: 8,
    hours: '120:87',
  },
  {
    logo: python,
    name: 'Dojo Email App',
    project: 'Python Project',
    totalTask: '120/186',
    progress: 49,
    hours: '230:10',
  },
  {
    logo: sketch,
    name: 'Blockchain Website',
    project: 'Sketch Project',
    totalTask: '99/109',
    progress: 92,
    hours: '342:41',
  },
  {
    logo: html5,
    name: 'Hoffman Website',
    project: 'HTML Project',
    totalTask: '98/110',
    progress: 88,
    hours: '12:45',
  },
]

const resolveUserProgressVariant = progress => {
  if (progress <= 25)
    return 'error'
  if (progress > 25 && progress <= 50)
    return 'warning'
  if (progress > 50 && progress <= 75)
    return 'primary'
  if (progress > 75 && progress <= 100)
    return 'success'
  
  return 'secondary'
}

const search = ref('')
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- 👉 Invoice Activity Timeline -->
      <VCard title="Invoice Activity Timeline">
        <VCardText>
          <VTimeline
            density="compact"
            align="start"
            truncate-line="both"
            :line-inset="8"
            class="v-timeline-density-compact"
          >
            <VTimelineItem
              dot-color="warning"
              size="x-small"
            >
              <div class="d-flex justify-space-between align-center flex-wrap gap-2 mb-3">
                <span class="app-timeline-title">
                  Need Confirmation
                </span>
                <span class="app-timeline-meta">5 min ago</span>
              </div>
  
              <p class="app-timeline-text mb-2">
                Invoice ARF.SI.1023180 requires confirmation
              </p>
              <div class="d-inline-flex align-center timeline-chip">
                <img
                  :src="pdf"
                  height="20"
                  class="me-2"
                  alt="img"
                >
                <span class="app-timeline-text font-weight-medium">
                  ARF.SI.1023180.pdf
                </span>
              </div>
            </VTimelineItem>
  
            <VTimelineItem
              dot-color="success"
              size="x-small"
            >
              <div class="d-flex justify-space-between align-center flex-wrap gap-2 mb-3">
                <span class="app-timeline-title">
                  Confirmed
                </span>
                <span class="app-timeline-meta">30 min ago</span>
              </div>
  
              <p class="app-timeline-text mb-2">
                Invoice ARF.SI.1023180 has been confirmed
              </p>
              <div class="d-inline-flex align-center timeline-chip">
                <img
                  :src="pdf"
                  height="20"
                  class="me-2"
                  alt="img"
                >
                <span class="app-timeline-text font-weight-medium">
                  ARF.SI.1023180.pdf
                </span>
              </div>
            </VTimelineItem>
  
            <VTimelineItem
              dot-color="info"
              size="x-small"
            >
              <div class="d-flex justify-space-between align-center flex-wrap gap-2 mb-3">
                <span class="app-timeline-title">
                  Under Revision
                </span>
                <span class="app-timeline-meta">1 hour ago</span>
              </div>
  
              <p class="app-timeline-text mb-2">
                Invoice ARF.SI.1023180 is under revision
              </p>
              <div class="d-inline-flex align-center timeline-chip">
                <img
                  :src="pdf"
                  height="20"
                  class="me-2"
                  alt="img"
                >
                <span class="app-timeline-text font-weight-medium">
                  ARF.SI.1023180.pdf
                </span>
              </div>
            </VTimelineItem>
  
            <VTimelineItem
              dot-color="primary"
              size="x-small"
            >
              <div class="d-flex justify-space-between align-center flex-wrap gap-2 mb-3">
                <span class="app-timeline-title">
                  On-Schedule
                </span>
                <span class="app-timeline-meta">1 day ago</span>
              </div>
  
              <p class="app-timeline-text mb-2">
                Invoice ARF.SI.1023180 is on-schedule
              </p>
              <div class="d-inline-flex align-center timeline-chip">
                <img
                  :src="pdf"
                  height="20"
                  class="me-2"
                  alt="img"
                >
                <span class="app-timeline-text font-weight-medium">
                  ARF.SI.1023180.pdf
                </span>
              </div>
            </VTimelineItem>
  
            <VTimelineItem
              dot-color="error"
              size="x-small"
            >
              <div class="d-flex justify-space-between align-center flex-wrap gap-2 mb-3">
                <span class="app-timeline-title">
                  Overdue
                </span>
                <span class="app-timeline-meta">3 days ago</span>
              </div>
  
              <p class="app-timeline-text mb-2">
                Invoice ARF.SI.1023180 is overdue
              </p>
              <div class="d-inline-flex align-center timeline-chip">
                <img
                  :src="pdf"
                  height="20"
                  class="me-2"
                  alt="img"
                >
                <span class="app-timeline-text font-weight-medium">
                  ARF.SI.1023180.pdf
                </span>
              </div>
            </VTimelineItem>
          </VTimeline>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  
  
</template>
