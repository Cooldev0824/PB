<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

const route = useRoute()
const store = useStore()
const proposalId = route.params.id

const loading = ref(true)
const proposal = ref(null)

onMounted(async () => {
  // Fetch proposal data
  try {
    await store.dispatch('fetchProposal', proposalId)
    proposal.value = store.state.currentProposal
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <v-app>
    <!-- Top Navigation -->
    <v-app-bar flat>
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
      
      <v-toolbar-title>{{ proposal?.name || 'Loading...' }}</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn color="primary" class="mr-2">
        <v-icon left>mdi-eye</v-icon>
        Preview
      </v-btn>
      
      <v-btn color="success">
        <v-icon left>mdi-send</v-icon>
        Send
      </v-btn>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="fill-height">
        <v-row no-gutters>
          <!-- Left Sidebar -->
          <v-col cols="2" class="border-r">
            <v-list>
              <v-list-item prepend-icon="mdi-file-document-outline" title="Pages"></v-list-item>
              <v-list-item prepend-icon="mdi-image-outline" title="Media"></v-list-item>
              <v-list-item prepend-icon="mdi-shape-outline" title="Elements"></v-list-item>
              <v-list-item prepend-icon="mdi-palette-outline" title="Theme"></v-list-item>
            </v-list>
          </v-col>

          <!-- Main Editor Area -->
          <v-col cols="8">
            <v-sheet v-if="loading" class="d-flex align-center justify-center" height="100%">
              <v-progress-circular indeterminate></v-progress-circular>
            </v-sheet>
            
            <template v-else>
              <div class="pa-4">
                <v-sheet class="mx-auto" max-width="800" rounded="lg">
                  <!-- Editable content area -->
                  <div class="pa-6">
                    <h1 contenteditable="true" class="text-h3 mb-6">
                      {{ proposal?.title || 'Untitled Proposal' }}
                    </h1>
                    
                    <div contenteditable="true" class="text-body-1">
                      {{ proposal?.content || 'Start typing your proposal content...' }}
                    </div>
                  </div>
                </v-sheet>
              </div>
            </template>
          </v-col>

          <!-- Right Sidebar -->
          <v-col cols="2" class="border-l">
            <v-list>
              <v-list-item prepend-icon="mdi-cog-outline" title="Settings"></v-list-item>
              <v-list-item prepend-icon="mdi-history" title="History"></v-list-item>
              <v-list-item prepend-icon="mdi-account-outline" title="Team"></v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.border-r {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.border-l {
  border-left: 1px solid rgba(0, 0, 0, 0.12);
}

[contenteditable="true"]:focus {
  outline: none;
  background: rgba(0, 0, 0, 0.04);
  padding: 4px;
  border-radius: 4px;
}
</style>