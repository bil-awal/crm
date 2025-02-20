<script setup>
import { VuePDF, usePDF } from '@tato30/vue-pdf';
import '@tato30/vue-pdf/style.css';

const { pdf } = usePDF('/files/union.pdf')
</script>

<template>
  <VuePDF :pdf="pdf" scale="1.7"  text-layer annotation-layer />
</template>
