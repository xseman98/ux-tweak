<template>
  <q-layout view="lHh Lpr lFf">
    <q-header bordered class="bg-white text-dark">
      <q-toolbar>
        <q-toolbar-title class="text-weight-medium">UXTweak Chat</q-toolbar-title>
        <ConnectionStatus v-if="sessionStore.state.isJoined" :status="connectionStore.state.status" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import ConnectionStatus from '../components/ConnectionStatus.vue'
import { connectionStore } from '../stores/connectionStore'
import { sessionStore } from '../stores/sessionStore'
</script>
