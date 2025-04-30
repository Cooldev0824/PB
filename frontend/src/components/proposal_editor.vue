<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import ToolEditor from './tool_editor.vue';
import { v4 as uuidv4 } from 'uuid';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  zoom: {
    type: Number,
    default: 100
  },
  action: {
    type: String,
    default: null
  },
  readonly: {
    type: Boolean,
    default: false
  },
  proposalData: {
    type: Object,
    default: () => ({
      title: 'Untitled Proposal',
      clientName: '',
      sections: []
    })
  }
});

const emit = defineEmits(['update:modelValue', 'update:proposalData']);
const toolEditor = ref(null);
const activeSection = ref('cover');
const sections = ref([
  { id: 'cover', name: 'Cover Page', icon: 'mdi-file-document-outline' },
  { id: 'overview', name: 'Project Overview', icon: 'mdi-information-outline' },
  { id: 'scope', name: 'Scope of Work', icon: 'mdi-clipboard-list-outline' },
  { id: 'timeline', name: 'Timeline', icon: 'mdi-calendar-clock' },
  { id: 'pricing', name: 'Pricing', icon: 'mdi-currency-usd' },
  { id: 'terms', name: 'Terms & Conditions', icon: 'mdi-file-certificate-outline' }
]);

// Track content for each section
const sectionContent = ref({});

// Initialize section content
onMounted(() => {
  // Initialize empty content for each section if not already present
  sections.value.forEach(section => {
    if (!sectionContent.value[section.id]) {
      sectionContent.value[section.id] = [];
    }
  });

  // If we have existing content from props, parse and distribute to sections
  if (props.modelValue && props.modelValue.length > 0) {
    try {
      // Assuming modelValue might contain section information
      // This would need to be adjusted based on your actual data structure
      props.modelValue.forEach(block => {
        if (block.sectionId && sectionContent.value[block.sectionId]) {
          if (!sectionContent.value[block.sectionId]) {
            sectionContent.value[block.sectionId] = [];
          }
          sectionContent.value[block.sectionId].push(block);
        } else {
          // Default to active section if no section ID is specified
          if (!sectionContent.value[activeSection.value]) {
            sectionContent.value[activeSection.value] = [];
          }
          sectionContent.value[activeSection.value].push(block);
        }
      });
    } catch (error) {
      console.error('Error parsing proposal content:', error);
    }
  }
});

// Watch for changes in the active section to update the editor content
watch(activeSection, (newSection) => {
  // Save current content before switching
  if (toolEditor.value) {
    saveCurrentSectionContent();
  }
  
  // Load content for the new section
  loadSectionContent(newSection);
});

// Save the content of the current section
const saveCurrentSectionContent = async () => {
  if (!toolEditor.value) return;
  
  try {
    const currentContent = await toolEditor.value.getAllBlocksContent();
    sectionContent.value[activeSection.value] = currentContent.map(block => ({
      ...block,
      sectionId: activeSection.value
    }));
    
    // Update the overall model value with all sections combined
    updateModelValue();
  } catch (error) {
    console.error('Error saving section content:', error);
  }
};

// Load content for a specific section
const loadSectionContent = (sectionId) => {
  const content = sectionContent.value[sectionId] || [];
  emit('update:modelValue', content);
};

// Update the overall model value with all sections combined
const updateModelValue = () => {
  const allContent = [];
  Object.values(sectionContent.value).forEach(sectionBlocks => {
    allContent.push(...sectionBlocks);
  });
  emit('update:modelValue', allContent);
};

// Add a new section
const addSection = () => {
  const newSectionId = uuidv4();
  const newSection = {
    id: newSectionId,
    name: 'New Section',
    icon: 'mdi-file-outline'
  };
  
  sections.value.push(newSection);
  sectionContent.value[newSectionId] = [];
  activeSection.value = newSectionId;
};

// Remove a section
const removeSection = (sectionId) => {
  // Don't allow removing the last section
  if (sections.value.length <= 1) return;
  
  // Remove the section from the list
  sections.value = sections.value.filter(section => section.id !== sectionId);
  
  // Remove the section's content
  delete sectionContent.value[sectionId];
  
  // If the active section was removed, switch to the first available section
  if (activeSection.value === sectionId) {
    activeSection.value = sections.value[0].id;
  }
  
  // Update the model value
  updateModelValue();
};

// Rename a section
const renameSection = (sectionId, newName) => {
  const section = sections.value.find(s => s.id === sectionId);
  if (section) {
    section.name = newName;
  }
};

// Get all content from all sections
const getAllContent = async () => {
  // First save the current section
  await saveCurrentSectionContent();
  
  // Then return all content
  const allContent = [];
  Object.values(sectionContent.value).forEach(sectionBlocks => {
    allContent.push(...sectionBlocks);
  });
  return allContent;
};

// Export to PDF
const exportToPDF = async (proposalTitle = 'proposal') => {
  if (!toolEditor.value) return;
  
  // First save the current section
  await saveCurrentSectionContent();
  
  // Then export all content
  return await toolEditor.value.exportToPDF(proposalTitle);
};

// Expose methods to parent component
defineExpose({
  getAllContent,
  exportToPDF,
  saveCurrentSectionContent,
  addSection,
  removeSection,
  renameSection
});
</script>

<template>
  <div class="proposal-editor">
    <div class="sections-sidebar" v-if="!readonly">
      <div class="sections-header">
        <h3>Sections</h3>
        <v-btn icon size="small" @click="addSection">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </div>
      
      <div class="sections-list">
        <div 
          v-for="section in sections" 
          :key="section.id"
          class="section-item"
          :class="{ 'active': activeSection === section.id }"
          @click="activeSection = section.id"
        >
          <v-icon size="small" class="mr-2">{{ section.icon }}</v-icon>
          <span>{{ section.name }}</span>
          <v-btn 
            v-if="sections.length > 1" 
            icon 
            size="x-small" 
            class="section-remove-btn"
            @click.stop="removeSection(section.id)"
          >
            <v-icon size="x-small">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
    </div>
    
    <div class="editor-content" :class="{ 'full-width': readonly }">
      <ToolEditor
        ref="toolEditor"
        :modelValue="modelValue"
        :zoom="zoom"
        :action="action"
        :readonly="readonly"
        @update:modelValue="$emit('update:modelValue', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.proposal-editor {
  display: flex;
  width: 100%;
  height: 100%;
}

.sections-sidebar {
  width: 250px;
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.sections-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sections-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.sections-list {
  flex: 1;
  overflow-y: auto;
}

.section-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
}

.section-item:hover {
  background-color: #e0e0e0;
}

.section-item.active {
  background-color: #e3f2fd;
  color: #1976d2;
}

.section-remove-btn {
  position: absolute;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.section-item:hover .section-remove-btn {
  opacity: 1;
}

.editor-content {
  flex: 1;
  overflow: auto;
}

.full-width {
  width: 100%;
}
</style>
