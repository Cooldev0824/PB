<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import ToolEditor from "../components/tool_editor.vue";

const store = useStore();
const router = useRouter();
const route = useRoute();
const toolEditors = ref(new Map()); // Store multiple editor instances
const zoom = ref(100);
const activeTool = ref(null);
const content = ref([]);
const proposalId = route.params.id;
const isPreviewMode = ref(false);
const loading = ref(true);
const proposal = ref(null);
const documentBackground = ref("");
const pageSize = ref("A4"); // Default page size
const showGrid = ref(true); // Set to true by default to show the ruler
const sections = ref([
  {
    id: "cover-1",
    name: "Cover 1",
    icon: "mdi-file-document-outline",
    content: [],
  },
]);
const activeSection = ref("cover-1");
const renameDialog = ref(false);
const editingSection = ref(null);
const newSectionName = ref("");
const previewPages = ref([]);
const showShapeMenu = ref(false);

const shapeTools = [
  {
    icon: "mdi-square-outline",
    label: "Square",
    type: "square",
    color: "#9C27B0",
  },
  {
    icon: "mdi-circle-outline",
    label: "Circle",
    type: "circle",
    color: "#9C27B0",
  },
  {
    icon: "mdi-triangle-outline",
    label: "Triangle",
    type: "triangle",
    color: "#9C27B0",
  },
];

const tools = [
  {
    icon: "mdi-format-text",
    label: "Text",
    color: "#2196F3",
    action: "addText",
  },
  // { icon: 'mdi-image-outline', label: 'Image', color: '#4CAF50', action: 'addImage' },
  {
    icon: "mdi-image-filter-hdr",
    label: "Background",
    color: "#4CAF50",
    action: "addBackground",
  },
  //{ icon: "mdi-table", label: "Table", color: "#FF9800", action: "addTable" },
  {
    icon: "mdi-shape-outline",
    label: "Shape",
    color: "#9C27B0",
    action: "addShape",
  },
  {
    icon: "mdi-vector-line",
    label: "Line",
    color: "#795548",
    action: "addLine",
  },
  {
    icon: "mdi-view-grid-outline",
    label: "Grid",
    color: "#607D8B",
    action: "addGrid",
  },
  //{ icon: 'mdi-currency-usd', label: 'Pricing', color: '#FF5722', action: 'addPricing' },
  //{ icon: 'mdi-signature-freehand', label: 'Signature', color: '#3F51B5', action: 'addSignature' },
  //{ icon: 'mdi-pencil', label: 'Draw', color: '#E91E63', action: 'addDraw' },
];

const handleToolClick = (tool) => {
  if (tool.action === "addShape") {
    showShapeMenu.value = !showShapeMenu.value;
  } else if (tool.action === "addBackground") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          documentBackground.value = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  } else {
    activeTool.value = tool.action;
    showShapeMenu.value = false;
  }
};

const increaseZoom = () => {
  if (zoom.value < 200) zoom.value += 25;
};

const decreaseZoom = () => {
  if (zoom.value > 25) zoom.value -= 25;
};

const toggleGrid = () => {
  showGrid.value = !showGrid.value;
};

const togglePreview = async () => {
  if (!isPreviewMode.value) {
    // Entering preview mode - collect all content
    previewPages.value = [];
    for (const section of sections.value) {
      const editor = toolEditors.value.get(section.id);
      if (editor) {
        const content = await editor.getAllBlocksContent();
        previewPages.value.push({
          id: section.id,
          name: section.name,
          content: content,
        });
      }
    }
  }
  isPreviewMode.value = !isPreviewMode.value;
};

const addNewSection = () => {
  const newSectionNumber = sections.value.length + 1;
  const newSection = {
    id: `cover-${newSectionNumber}`,
    name: `Cover ${newSectionNumber}`,
    icon: "mdi-file-document-outline",
    content: [],
  };
  sections.value.push(newSection);
  activeSection.value = newSection.id;
  content.value = newSection.content;
};

const deleteSection = (event, sectionId) => {
  console.log(sectionId);
  // Prevent event bubbling
  event.stopPropagation();
  event.preventDefault();

  // Don't allow deleting the last section
  if (sections.value.length <= 1) return;

  // Clean up the editor instance
  const editor = toolEditors.value.get(sectionId);
  if (editor) {
    editor.destroy?.();
    toolEditors.value.delete(sectionId);
  }

  // Remove the specific section
  const index = sections.value.findIndex((s) => s.id === sectionId);
  if (index !== -1) {
    sections.value.splice(index, 1);
  }

  // If we deleted the active section, switch to the first available section
  if (activeSection.value === sectionId) {
    activeSection.value = sections.value[0].id;
  }
};

const renameSection = (section) => {
  editingSection.value = section;
  newSectionName.value = section.name;
  renameDialog.value = true;
};

const saveRename = () => {
  if (editingSection.value && newSectionName.value.trim()) {
    editingSection.value.name = newSectionName.value.trim();
    renameDialog.value = false;
  }
};

const saveContent = async () => {
  try {
    if (!proposalId) {
      console.error("Proposal ID is missing");
      return;
    }

    // Collect content from all editors
    const allContent = [];
    for (const [sectionId, editor] of toolEditors.value.entries()) {
      const blocksContent = await editor.getAllBlocksContent();
      const section = sections.value.find((s) => s.id === sectionId);
      if (section) {
        allContent.push(
          ...blocksContent.map((block) => ({
            ...block,
            sectionId,
            sectionName: section.name, // Add section name to each block
          }))
        );
      }
    }

    // Call the updateProposal API with all content
    await store.dispatch("updateProposal", {
      id: proposalId,
      content: JSON.stringify({
        sections: sections.value.map((section) => ({
          id: section.id,
          name: section.name,
          content: section.content,
        })),
        blocks: allContent,
      }),
      background: documentBackground.value,
      pageSize: pageSize.value,
    });

    console.log("Saved proposal with content");
    router.push("/");
  } catch (error) {
    console.error("Error saving content:", error);
  }
};

onMounted(async () => {
  if (proposalId) {
    try {
      loading.value = true;
      const fetchedProposal = await store.dispatch("getProposal", proposalId);
      proposal.value = fetchedProposal;

      // Load background if it exists
      if (fetchedProposal.background) {
        documentBackground.value = fetchedProposal.background;
      }

      // Load page size if it exists
      if (fetchedProposal.pageSize) {
        pageSize.value = fetchedProposal.pageSize;
      }

      // If there's content, parse it
      if (fetchedProposal.content) {
        try {
          const parsedContent = JSON.parse(fetchedProposal.content);

          // If the content has sections structure
          if (parsedContent.sections && parsedContent.blocks) {
            sections.value = parsedContent.sections;
            if (sections.value.length > 0) {
              activeSection.value = sections.value[0].id;
            }

            // Distribute blocks to their respective sections
            sections.value.forEach((section) => {
              const sectionBlocks = parsedContent.blocks.filter(
                (block) => block.sectionId === section.id
              );
              // Set the content directly on the section
              section.content = sectionBlocks;

              if (sectionBlocks.length > 0) {
                // Create editor for this section if it doesn't exist
                if (!toolEditors.value.has(section.id)) {
                  toolEditors.value.set(section.id, null);
                }
                // Set the content for this section
                nextTick(() => {
                  const editor = toolEditors.value.get(section.id);
                  if (editor) {
                    editor.blocks = sectionBlocks;
                  }
                });
              }
            });
          } else {
            // Handle old format (backward compatibility)
            const contentBySection = {};
            parsedContent.forEach((block) => {
              const sectionId = block.sectionId || "cover-1";
              if (!contentBySection[sectionId]) {
                contentBySection[sectionId] = {
                  id: sectionId,
                  name: `Cover ${Object.keys(contentBySection).length + 1}`,
                  content: [],
                };
              }
              contentBySection[sectionId].content.push(block);
            });

            sections.value = Object.values(contentBySection);
            if (sections.value.length > 0) {
              activeSection.value = sections.value[0].id;
            }
          }
        } catch (error) {
          console.error("Error parsing proposal content:", error);
        }
      }
    } catch (error) {
      console.error("Error loading proposal:", error);
    } finally {
      loading.value = false;
    }
  }
});
</script>

<template>
  <v-app>
    <v-app-bar color="white" elevation="1" height="48">
      <v-btn
        icon
        class="mr-2"
        size="small"
        @click="$router.back()"
        color="grey-darken-1"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <!-- Add proposal title -->
      <v-toolbar-title class="text-subtitle-1">
        {{ proposal?.title || "Loading..." }}
      </v-toolbar-title>

      <v-spacer></v-spacer>
      <v-btn-group divided class="mr-2">
        <v-btn icon size="small" @click="decreaseZoom">
          <v-icon size="small" color="grey-darken-1"
            >mdi-magnify-minus-outline</v-icon
          >
        </v-btn>
        <v-btn variant="text" size="small" class="px-3" color="grey-darken-1">
          {{ zoom }}%
        </v-btn>
        <v-btn icon size="small" @click="increaseZoom">
          <v-icon size="small" color="grey-darken-1"
            >mdi-magnify-plus-outline</v-icon
          >
        </v-btn>
      </v-btn-group>
      <v-btn
        icon
        size="small"
        :color="showGrid ? 'primary' : 'grey-darken-1'"
        class="mr-2"
        @click="toggleGrid"
      >
        <v-icon size="small">mdi-view-grid-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">{{
          showGrid ? "Hide Grid" : "Show Grid"
        }}</v-tooltip>
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
        <v-icon start size="small">{{
          isPreviewMode ? "mdi-pencil" : "mdi-eye"
        }}</v-icon>
        {{ isPreviewMode ? "Edit" : "Preview" }}
      </v-btn>

      <v-btn
        color="success"
        class="text-none mr-2"
        size="small"
        @click="saveContent"
      >
        <v-icon start size="small">mdi-content-save</v-icon>
        Save
      </v-btn>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <!-- Show loading state -->
      <v-container
        v-if="loading"
        class="d-flex align-center justify-center"
        style="height: 100%"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </v-container>

      <!-- Show editor when data is loaded -->
      <v-container v-else fluid class="pa-0 fill-height">
        <v-row no-gutters class="fill-height">
          <v-col
            v-if="!isPreviewMode"
            cols="2"
            class="bg-white section-sidebar"
          >
            <v-list density="compact" class="pa-0">
              <v-list-subheader
                class="text-grey-darken-1 font-weight-bold d-flex align-center justify-space-between"
              >
                SECTIONS
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  color="primary"
                  class="ml-2"
                  @click="addNewSection"
                >
                  <v-icon size="small">mdi-plus</v-icon>
                </v-btn>
              </v-list-subheader>
              <v-list-item
                v-for="section in sections"
                :key="section.id"
                :prepend-icon="section.icon"
                :title="section.name"
                :value="section.id"
                :active="activeSection === section.id"
                class="rounded-0 section-item"
                active-color="primary"
                @click="activeSection = section.id"
              >
                <template v-slot:append>
                  <div class="d-flex align-center">
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      color="primary"
                      class="edit-btn mr-1"
                      @click.stop="renameSection(section)"
                    >
                      <v-icon size="small">mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      color="error"
                      class="delete-btn"
                      @click="(e) => deleteSection(e, section.id)"
                    >
                      <v-icon size="small">mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col
            :cols="isPreviewMode ? 12 : 10"
            class="pa-4 d-flex editor-container"
          >
            <div class="editor-outer-wrapper">
              <!-- Edit Mode -->
              <div v-if="!isPreviewMode">
                <div
                  v-for="section in sections"
                  :key="section.id"
                  v-show="activeSection === section.id"
                >
                  <ToolEditor
                    :ref="
                      (el) => {
                        if (el) {
                          toolEditors.set(section.id, el);
                        } else {
                          toolEditors.delete(section.id);
                        }
                      }
                    "
                    v-model="section.content"
                    :zoom="zoom"
                    :action="activeTool"
                    :readonly="isPreviewMode"
                    :background="documentBackground"
                    :showGrid="showGrid"
                    :pageSize="pageSize"
                    @update:pageSize="pageSize = $event"
                  />
                </div>
              </div>

              <!-- Preview Mode -->
              <div v-else class="preview-container">
                <div
                  v-for="page in previewPages"
                  :key="page.id"
                  class="preview-page"
                >
                  <div class="preview-page-header">
                    <h3>{{ page.name }}</h3>
                  </div>
                  <ToolEditor
                    v-model="page.content"
                    :zoom="zoom"
                    :readonly="true"
                    :background="documentBackground"
                    :showGrid="false"
                    :pageSize="pageSize"
                  />
                </div>
              </div>
            </div>
          </v-col>
          <div class="vertical-toolbar" v-if="!isPreviewMode">
            <v-tooltip
              v-for="tool in tools"
              :key="tool.label"
              :text="tool.label"
              location="left"
            >
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
                <!-- Shape Menu Tooltip: Only for the Shape tool -->
                <div
                  v-if="tool.action === 'addShape' && showShapeMenu"
                  class="shape-menu"
                >
                  <template v-for="shape in shapeTools" :key="shape.type">
                    <v-tooltip :text="shape.label" location="left">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon
                          variant="text"
                          :color="shape.color"
                          class="shape-button"
                          @click="
                            activeTool = `addShape_${shape.type}`;
                            showShapeMenu = false;
                          "
                        >
                          <v-icon>{{ shape.icon }}</v-icon>
                        </v-btn>
                      </template>
                    </v-tooltip>
                  </template>
                </div>
              </template>
            </v-tooltip>
          </div>
        </v-row>
      </v-container>
    </v-main>

    <!-- Rename Dialog -->
    <v-dialog v-model="renameDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5"> Rename Cover </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newSectionName"
            label="Cover Name"
            autofocus
            @keyup.enter="saveRename"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="renameDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            @click="saveRename"
            :disabled="!newSectionName.trim()"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style scoped>
:root {
  --v-theme-primary: #1976d2;
  --v-theme-success: #4caf50;
}

.v-btn-group .v-btn {
  background-color: white !important;
}

.v-list-item--active {
  background-color: #e3f2fd !important;
}

.v-btn {
  text-transform: none !important;
  letter-spacing: normal !important;
}

.section-sidebar {
  position: sticky;
  top: 48px; /* Height of the app bar */
  height: calc(100vh - 48px); /* Full height minus app bar */
  z-index: 3;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.editor-container {
  position: relative;
  overflow: auto;
  z-index: 1;
  flex: 1;
}

.editor-outer-wrapper {
  flex: 1;
  position: relative;
  min-height: 100%;
  overflow: hidden;
}

.editor-content-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100%;
  background-color: rgba(
    255,
    255,
    255,
    0.9
  ); /* Add slight transparency to see background */
  padding: 20px;
}

/* If you want to add a semi-transparent overlay to ensure text readability */
.editor-wrapper::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7); /* Adjust opacity as needed */
  pointer-events: none; /* Allows clicking through to the editor */
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
  position: sticky;
  top: 48px; /* Height of the app bar */
  margin-left: 16px;
  z-index: 3;
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

.v-list-subheader {
  padding: 8px 16px !important;
  min-height: 40px !important;
}

.v-list-item {
  cursor: pointer;
}

.v-list-item--active {
  background-color: #e3f2fd !important;
}

.section-item {
  position: relative;
}

.edit-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.section-item:hover .edit-btn,
.section-item:hover .delete-btn {
  opacity: 1;
}

.v-list-item {
  cursor: pointer;
  padding-right: 8px !important;
}

.v-list-item--active {
  background-color: #e3f2fd !important;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  overflow: visible;
  height: auto;
  width: 100%;
}

.preview-page {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  position: relative;
  page-break-after: always; /* Ensure page breaks in print */
}

.preview-page:last-child {
  margin-bottom: 0;
  page-break-after: avoid;
}

.preview-page-header {
  padding: 10px 20px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.preview-page-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1em;
}

.shape-menu {
  position: absolute;
  right: 100%;
  top: 24%;
  background: white;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-right: 12px;
  z-index: 1000;
}

.shape-button {
  width: 40px;
  height: 40px;
}

.shape-button:hover {
  background-color: #f5f5f5;
}

/* Ensure the shape menu doesn't close when clicking shape buttons */
.shape-menu {
  pointer-events: auto;
}
</style>
