<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import ToolEditor from "../components/tool_editor.vue";
import html2pdf from "html2pdf.js";

const route = useRoute();
const router = useRouter();
const store = useStore();
const toolEditors = ref(new Map()); // Store multiple editor instances
const content = ref(null);
const loading = ref(true);
const proposal = ref(null);
const error = ref(null);
const exportStatus = ref("loading"); // 'loading', 'success', 'error'
const sections = ref([]);

// Function to wait for editors to initialize
const waitForEditors = async () => {
  // Wait for a longer time to ensure all editors are initialized
  console.log("Waiting for editors to initialize...");
  return new Promise((resolve) => setTimeout(resolve, 5000));
};

// Function to ensure content is properly loaded
const ensureContentLoaded = async () => {
  if (!content.value || content.value.length === 0) {
    console.warn("Content is empty, creating a sample block");
    // Create a sample block if content is empty
    content.value = [
      {
        id: Date.now(),
        x: 50,
        y: 50,
        width: 400,
        height: 200,
        content: {
          blocks: [
            {
              type: "header",
              data: {
                text: proposal.value?.title || "Sample Proposal",
                level: 2,
              },
            },
            {
              type: "paragraph",
              data: {
                text: "This is a sample proposal content. The actual content could not be loaded.",
              },
            },
          ],
        },
        backgroundColor: "transparent",
        zIndex: 10,
      },
    ];
  }
};

// Function to export PDF
const generatePDF = async () => {
  try {
    if (toolEditors.value.size === 0) {
      throw new Error("No editor instances available");
    }

    console.log("Starting PDF export...");

    // Create a container for all pages
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "auto";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.backgroundColor = "white";
    container.style.margin = "0";
    container.style.padding = "0";
    container.style.overflow = "hidden";
    container.style.position = "relative";

    // Add each section's content to the container
    for (const [sectionId, editor] of toolEditors.value.entries()) {
      const section = sections.value.find((s) => s.id === sectionId);
      if (section) {
        const sectionDiv = document.createElement("div");
        sectionDiv.style.width = "100%";
        sectionDiv.style.height = "auto";
        sectionDiv.style.backgroundColor = "white";

        // Add section content
        const contentDiv = document.createElement("div");
        contentDiv.style.width = "100%";
        contentDiv.style.height = "auto";

        const editorElement = editor.$el;
        const editorContainer =
          editorElement.querySelector(".editor-container");
        if (editorContainer) {
          contentDiv.appendChild(editorContainer);
        } else {
          contentDiv.appendChild(editorElement);
        }
        sectionDiv.appendChild(contentDiv);

        // Remove page break from the last section
        if (sectionId === sections.value[sections.value.length - 1].id) {
          sectionDiv.style.pageBreakAfter = "avoid";
        }

        container.appendChild(sectionDiv);
      }
    }

    // Get the page size
    const pageSize = proposal.value?.pageSize?.toUpperCase() || "A4";

    // Generate PDF
    const opt = {
      margin: 0,
      filename: `${proposal.value?.title || "proposal"}.pdf`,
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: true,
        allowTaint: true,
        backgroundColor: "white",
        letterRendering: true,
        removeContainer: true,
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: 1123, // A4 height in pixels at 96 DPI
      },
      jsPDF: {
        unit: "mm",
        format: pageSize,
        orientation: "portrait",
        compress: true,
      },
    };

    // Clean up any potential extra space
    const lastSection = container.lastChild;
    if (lastSection) {
      lastSection.style.marginBottom = "0";
      lastSection.style.paddingBottom = "0";
      lastSection.style.height = "auto";
      lastSection.style.minHeight = "0";
    }

    // Remove any empty elements that might cause extra space
    const emptyElements = container.querySelectorAll("div:empty");
    emptyElements.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });

    await html2pdf().from(container).set(opt).save();

    exportStatus.value = "success";
    console.log("PDF export completed successfully");

    // Wait a bit before redirecting
    setTimeout(() => {
      router.push("/");
    }, 2000);

    return true;
  } catch (err) {
    console.error("PDF generation failed:", err);
    error.value = err.message || "Failed to generate PDF";
    exportStatus.value = "error";

    // Wait a bit before redirecting on error
    setTimeout(() => {
      router.push("/");
    }, 3000);

    return false;
  }
};

onMounted(async () => {
  const proposalId = route.params.id;

  try {
    // Fetch proposal data
    const fetchedProposal = await store.dispatch("getProposal", proposalId);
    proposal.value = fetchedProposal;

    if (!fetchedProposal) {
      throw new Error("Proposal not found");
    }

    // Parse the content if it exists
    if (fetchedProposal.content) {
      try {
        const parsedContent = JSON.parse(fetchedProposal.content);

        // If the content has sections structure
        if (parsedContent.sections) {
          sections.value = parsedContent.sections;
          content.value = parsedContent.blocks || [];
        } else {
          // Handle old format (backward compatibility)
          sections.value = [{ id: "cover-1", name: "Cover 1", content: [] }];
          content.value = parsedContent;
        }
      } catch (e) {
        console.error("Error parsing content:", e);
        content.value = [];
      }
    } else {
      console.warn("No content found in proposal");
      content.value = [];
    }

    // Ensure we have some content to render
    await ensureContentLoaded();

    // Wait for DOM to update
    await nextTick();

    // Wait for editors to initialize
    await waitForEditors();

    // Force another DOM update to ensure content is rendered
    await nextTick();

    // Generate PDF
    await generatePDF();
  } catch (err) {
    console.error("Export failed:", err);
    error.value = err.message || "Export failed";
    exportStatus.value = "error";

    // Wait a bit before redirecting on error
    setTimeout(() => {
      router.push("/");
    }, 2000);
  }
});
</script>

<template>
  <v-app>
    <v-main>
      <v-container
        class="d-flex align-center justify-center"
        style="height: 100vh"
      >
        <div class="text-center">
          <!-- Loading state -->
          <div v-if="exportStatus === 'loading'">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            ></v-progress-circular>
            <div class="mt-4 text-h6">Generating PDF...</div>
            <div class="text-subtitle-1 text-grey">
              Please wait, this may take a moment
            </div>
          </div>

          <!-- Success state -->
          <div v-else-if="exportStatus === 'success'">
            <v-icon size="64" color="success">mdi-check-circle</v-icon>
            <div class="mt-4 text-h6">PDF Generated Successfully</div>
            <div class="text-subtitle-1">
              Your download should begin automatically
            </div>
          </div>

          <!-- Error state -->
          <div v-else-if="exportStatus === 'error'">
            <v-icon size="64" color="error">mdi-alert-circle</v-icon>
            <div class="mt-4 text-h6">Export Failed</div>
            <div class="text-subtitle-1 text-grey">
              {{ error || "An error occurred during PDF generation" }}
            </div>
            <v-btn color="primary" class="mt-4" @click="router.push('/')">
              Return to Dashboard
            </v-btn>
          </div>
        </div>
      </v-container>

      <!-- ToolEditors for PDF generation -->
      <div class="tool-editor-container">
        <div
          v-for="section in sections"
          :key="section.id"
          class="section-container"
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
            v-if="content"
            :modelValue="
              content.filter((block) => block.sectionId === section.id)
            "
            :readonly="true"
            :zoom="100"
            :background="proposal?.background"
            :pageSize="proposal?.pageSize || 'A4'"
          />
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.v-main {
  background: white;
}

.tool-editor-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  opacity: 0;
  pointer-events: none;
  background-color: white;
  display: flex;
  flex-direction: column;
}

.section-container {
  width: 100%;
  height: auto;
  background: white;
}
</style>
