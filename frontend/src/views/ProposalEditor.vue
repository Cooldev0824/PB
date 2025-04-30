<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import ProposalEditor from '../components/proposal_editor.vue';
import { getTemplateByName, getTemplateNames } from '../utils/proposal-templates';

const store = useStore();
const router = useRouter();
const route = useRoute();
const proposalEditor = ref(null);
const zoom = ref(100);
const activeTool = ref(null);
const content = ref([]);
const proposalId = route.params.id;
const isPreviewMode = ref(false);
const loading = ref(true);
const proposal = ref(null);
const showTemplateDialog = ref(false);
const templates = ref(getTemplateNames());
const selectedTemplate = ref(null);

const tools = [
  { icon: 'mdi-format-text', label: 'Text', color: '#2196F3', action: 'addText' },
  { icon: 'mdi-image-outline', label: 'Image', color: '#4CAF50', action: 'addImage' },
  { icon: 'mdi-table', label: 'Table', color: '#FF9800', action: 'addTable' },
  { icon: 'mdi-shape-outline', label: 'Shape', color: '#9C27B0', action: 'addShape' },
  { icon: 'mdi-vector-line', label: 'Line', color: '#795548', action: 'addLine' },
  { icon: 'mdi-view-grid-outline', label: 'Grid', color: '#607D8B', action: 'addGrid' },
  { icon: 'mdi-currency-usd', label: 'Pricing', color: '#FF5722', action: 'addPricing' },
  { icon: 'mdi-signature-freehand', label: 'Signature', color: '#3F51B5', action: 'addSignature' },
  { icon: 'mdi-pencil', label: 'Draw', color: '#E91E63', action: 'addDraw' },
];

const handleToolClick = (tool) => {
  activeTool.value = tool.action;
};

const increaseZoom = () => {
  if (zoom.value < 200) zoom.value += 25;
};

const decreaseZoom = () => {
  if (zoom.value > 25) zoom.value -= 25;
};

const togglePreview = () => {
  isPreviewMode.value = !isPreviewMode.value;
};

const saveContent = async () => {
  try {
    if (!proposalId) {
      console.error('Proposal ID is missing');
      return;
    }

    // First, save the current section content
    await proposalEditor.value.saveCurrentSectionContent();
    
    // Get all content from all sections
    const allContent = await proposalEditor.value.getAllContent();
    
    // Call the updateProposal API with the content
    await store.dispatch('updateProposal', {
      id: proposalId,
      content: JSON.stringify(allContent)  // Convert content array to string for storage
    });

    console.log('Saved proposal content:', allContent);
    router.push('/');
  } catch (error) {
    console.error('Error saving content:', error);
  }
};

const exportProposal = async () => {
  try {
    if (!proposalEditor.value) {
      console.error('Proposal editor not available');
      return;
    }
    
    await proposalEditor.value.exportToPDF(proposal.value?.title || 'proposal');
  } catch (error) {
    console.error('Error exporting proposal:', error);
  }
};

const applyTemplate = () => {
  if (!selectedTemplate.value) return;
  
  const template = getTemplateByName(selectedTemplate.value);
  
  // Flatten all section content into a single array for the editor
  const allContent = [];
  Object.entries(template.content).forEach(([sectionId, sectionContent]) => {
    allContent.push(...sectionContent);
  });
  
  content.value = allContent;
  showTemplateDialog.value = false;
};

onMounted(async () => {
  if (proposalId) {
    try {
      loading.value = true;
      const fetchedProposal = await store.dispatch('getProposal', proposalId);
      proposal.value = fetchedProposal;
      
      // If there's content, parse it
      if (fetchedProposal.content) {
        try {
          // Parse the stringified JSON content
          const parsedContent = JSON.parse(fetchedProposal.content);
          // Set the content for the ProposalEditor
          content.value = parsedContent;
          console.log('Parsed content:', parsedContent); // For debugging
        } catch (e) {
          console.error('Error parsing proposal content:', e);
          content.value = [];
          // Show template dialog if no content
          showTemplateDialog.value = true;
        }
      } else {
        // Show template dialog if no content
        showTemplateDialog.value = true;
      }
    } catch (error) {
      console.error('Error loading proposal:', error);
    } finally {
      loading.value = false;
    }
  }
});
</script>

<template>
  <v-app>
    <v-app-bar color="white" elevation="1" height="48">
      <v-btn icon class="mr-2" size="small" @click="$router.back()" color="grey-darken-1">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <!-- Proposal title -->
      <v-toolbar-title class="text-subtitle-1">
        {{ proposal?.title || 'Loading...' }}
      </v-toolbar-title>

      <v-spacer></v-spacer>
      <v-btn-group divided class="mr-2">
        <v-btn icon size="small" @click="decreaseZoom">
          <v-icon size="small" color="grey-darken-1">mdi-magnify-minus-outline</v-icon>
        </v-btn>
        <v-btn variant="text" size="small" class="px-3" color="grey-darken-1">
          {{ zoom }}%
        </v-btn>
        <v-btn icon size="small" @click="increaseZoom">
          <v-icon size="small" color="grey-darken-1">mdi-magnify-plus-outline</v-icon>
        </v-btn>
      </v-btn-group>
      
      <v-btn icon size="small" color="grey-darken-1" class="mr-2" @click="showTemplateDialog = true">
        <v-icon size="small">mdi-file-document-plus-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">Apply Template</v-tooltip>
      </v-btn>
      
      <v-btn icon size="small" color="grey-darken-1">
        <v-icon size="small">mdi-fullscreen</v-icon>
      </v-btn>
      
      <v-spacer></v-spacer>

      <!-- Toggle between Preview and Edit modes -->
      <v-btn 
        :color="isPreviewMode ? 'primary' : 'grey'" 
        class="text-none mr-2" 
        size="small"
        @click="togglePreview"
      >
        <v-icon start size="small">{{ isPreviewMode ? 'mdi-pencil' : 'mdi-eye' }}</v-icon>
        {{ isPreviewMode ? 'Edit' : 'Preview' }}
      </v-btn>

      <v-btn color="primary" class="text-none mr-2" size="small" @click="exportProposal">
        <v-icon start size="small">mdi-file-pdf-box</v-icon>
        Export PDF
      </v-btn>

      <v-btn color="success" class="text-none mr-2" size="small" @click="saveContent">
        <v-icon start size="small">mdi-content-save</v-icon>
        Save
      </v-btn>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <!-- Show loading state -->
      <v-container v-if="loading" class="d-flex align-center justify-center" style="height: 100%">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-container>

      <!-- Show editor when data is loaded -->
      <v-container v-else fluid class="pa-0 fill-height">
        <div class="editor-container">
          <ProposalEditor 
            ref="proposalEditor" 
            v-model="content" 
            :zoom="zoom" 
            :action="activeTool"
            :readonly="isPreviewMode"
          />
          
          <div v-if="!isPreviewMode" class="vertical-toolbar">
            <v-tooltip v-for="tool in tools" :key="tool.label" :text="tool.label" location="left">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  variant="text"
                  :color="tool.color"
                  class="tool-button"
                  :class="{ active: activeTool === tool.action }"
                  @click="handleToolClick(tool)"
                >
                  <v-icon>{{ tool.icon }}</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </div>
      </v-container>
    </v-main>
    
    <!-- Template Selection Dialog -->
    <v-dialog v-model="showTemplateDialog" max-width="500">
      <v-card>
        <v-card-title>Choose a Template</v-card-title>
        <v-card-text>
          <v-radio-group v-model="selectedTemplate">
            <v-radio
              v-for="template in templates"
              :key="template.title"
              :label="template.title"
              :value="template.title"
            >
              <template v-slot:label>
                <div>
                  <strong>{{ template.title }}</strong>
                  <div class="text-caption">{{ template.description }}</div>
                </div>
              </template>
            </v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showTemplateDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="applyTemplate" :disabled="!selectedTemplate">Apply Template</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style scoped>
:root {
  --v-theme-primary: #1976D2;
  --v-theme-success: #4CAF50;
}

.v-btn-group .v-btn {
  background-color: white !important;
}

.v-btn {
  text-transform: none !important;
  letter-spacing: normal !important;
}

.editor-container {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
}

.vertical-toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: white;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
}

.tool-button {
  width: 40px;
  height: 40px;
}

.tool-button:hover {
  background-color: #f5f5f5;
}

.vertical-toolbar .tool-button.active {
  background-color: var(--v-theme-primary);
  color: white;
}
</style>
