<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  zoom: {
    type: Number,
    default: 100
  },
  showGrid: {
    type: Boolean,
    default: false
  },
  gridSize: {
    type: Number,
    default: 20
  },
  containerWidth: {
    type: Number,
    default: 0
  },
  containerHeight: {
    type: Number,
    default: 0
  },
  blocks: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:showGrid', 'alignBlocks']);

// Ruler dimensions - these are also used in CSS
// If you change these values, update the corresponding CSS values as well
const tickInterval = 10; // Interval between small ticks in pixels
const largeTickInterval = 50; // Interval between large ticks in pixels
const labelInterval = 100; // Interval between labels in pixels

// Mouse position for guides
const mouseX = ref(0);
const mouseY = ref(0);
const showHorizontalGuide = ref(false);
const showVerticalGuide = ref(false);
const isDraggingBlock = ref(false);

// Alignment guides
const horizontalGuides = ref([]);
const verticalGuides = ref([]);

// Computed properties for scaled measurements based on zoom
const scaledTickInterval = computed(() => tickInterval * props.zoom / 100);
const scaledLargeTickInterval = computed(() => largeTickInterval * props.zoom / 100);
const scaledLabelInterval = computed(() => labelInterval * props.zoom / 100);
const scaledGridSize = computed(() => props.gridSize * props.zoom / 100);

// Generate horizontal ruler ticks
const horizontalTicks = computed(() => {
  const ticks = [];
  if (!props.containerWidth) return ticks;

  const width = props.containerWidth;
  const interval = scaledTickInterval.value;
  const largeInterval = scaledLargeTickInterval.value;
  const labelInt = scaledLabelInterval.value;

  for (let i = 0; i < width; i += interval) {
    const isLarge = i % largeInterval < 0.1;
    const hasLabel = i % labelInt < 0.1;

    ticks.push({
      position: i,
      isLarge,
      hasLabel,
      label: hasLabel ? Math.round(i * 100 / props.zoom) : ''
    });
  }

  return ticks;
});

// Generate vertical ruler ticks
const verticalTicks = computed(() => {
  const ticks = [];
  if (!props.containerHeight) return ticks;

  const height = props.containerHeight;
  const interval = scaledTickInterval.value;
  const largeInterval = scaledLargeTickInterval.value;
  const labelInt = scaledLabelInterval.value;

  for (let i = 0; i < height; i += interval) {
    const isLarge = i % largeInterval < 0.1;
    const hasLabel = i % labelInt < 0.1;

    ticks.push({
      position: i,
      isLarge,
      hasLabel,
      label: hasLabel ? Math.round(i * 100 / props.zoom) : ''
    });
  }

  return ticks;
});

// Generate grid lines
const gridLines = computed(() => {
  if (!props.showGrid) return { horizontal: [], vertical: [] };

  const horizontal = [];
  const vertical = [];
  const gridInterval = scaledGridSize.value;

  if (props.containerWidth && props.containerHeight) {
    // Horizontal grid lines
    for (let i = 0; i < props.containerHeight; i += gridInterval) {
      horizontal.push(i);
    }

    // Vertical grid lines
    for (let i = 0; i < props.containerWidth; i += gridInterval) {
      vertical.push(i);
    }
  }

  return { horizontal, vertical };
});

// Toggle grid visibility
const toggleGrid = () => {
  emit('update:showGrid', !props.showGrid);
};

// Handle mouse movement for guides
const handleMouseMove = (e) => {
  const rulerContainer = e.currentTarget;
  const rect = rulerContainer.getBoundingClientRect();

  mouseX.value = e.clientX - rect.left;
  mouseY.value = e.clientY - rect.top;

  // Only show guides when dragging a block
  if (isDraggingBlock.value) {
    showHorizontalGuide.value = true;
    showVerticalGuide.value = true;
  }
};

// Handle mouse leave
const handleMouseLeave = () => {
  showHorizontalGuide.value = false;
  showVerticalGuide.value = false;
};

// Handle block drag start
const handleBlockDragStart = () => {
  isDraggingBlock.value = true;
  updateAlignmentGuides();
};

// Handle block drag end
const handleBlockDragEnd = () => {
  isDraggingBlock.value = false;
  showHorizontalGuide.value = false;
  showVerticalGuide.value = false;
};

// Update alignment guides based on block positions
const updateAlignmentGuides = () => {
  // Clear existing guides
  horizontalGuides.value = [];
  verticalGuides.value = [];

  // Add guides at edges and centers of blocks
  if (props.blocks && props.blocks.length > 0) {
    props.blocks.forEach(block => {
      // Add horizontal guides (top, middle, bottom)
      horizontalGuides.value.push(block.y);
      horizontalGuides.value.push(block.y + block.height / 2);
      horizontalGuides.value.push(block.y + block.height);

      // Add vertical guides (left, center, right)
      verticalGuides.value.push(block.x);
      verticalGuides.value.push(block.x + block.width / 2);
      verticalGuides.value.push(block.x + block.width);
    });
  }
};

// Add ruler click handler to create guides
const handleRulerClick = (e, orientation) => {
  const rulerContainer = e.currentTarget;
  const rect = rulerContainer.getBoundingClientRect();

  if (orientation === 'horizontal') {
    const position = e.clientX - rect.left;
    horizontalGuides.value.push(position);
  } else {
    const position = e.clientY - rect.top;
    verticalGuides.value.push(position);
  }
};

// Watch for block changes to update guides
watch(() => props.blocks, () => {
  if (isDraggingBlock.value) {
    updateAlignmentGuides();
  }
}, { deep: true });

// Initialize event listeners
onMounted(() => {
  // Add global event listeners for block dragging
  document.addEventListener('mousedown', (e) => {
    const isDraggableHandle = e.target.closest('.handle');
    if (isDraggableHandle) {
      handleBlockDragStart();
    }
  });

  document.addEventListener('mouseup', () => {
    handleBlockDragEnd();
  });
});
</script>

<template>
  <div class="ruler-container" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
    <!-- Corner square where rulers meet -->
    <div class="ruler-corner" @click="toggleGrid">
      <v-icon size="small" :color="showGrid ? 'primary' : 'grey'">
        {{ showGrid ? 'mdi-grid' : 'mdi-grid-off' }}
      </v-icon>
    </div>

    <!-- Horizontal ruler -->
    <div class="horizontal-ruler" @click="(e) => handleRulerClick(e, 'horizontal')">
      <div v-for="tick in horizontalTicks" :key="tick.position" class="tick"
           :class="{ 'large-tick': tick.isLarge }"
           :style="{ left: `${tick.position}px` }">
        <span v-if="tick.hasLabel" class="tick-label">{{ tick.label }}</span>
      </div>
    </div>

    <!-- Vertical ruler -->
    <div class="vertical-ruler" @click="(e) => handleRulerClick(e, 'vertical')">
      <div v-for="tick in verticalTicks" :key="tick.position" class="tick"
           :class="{ 'large-tick': tick.isLarge }"
           :style="{ top: `${tick.position}px` }">
        <span v-if="tick.hasLabel" class="tick-label">{{ tick.label }}</span>
      </div>
    </div>

    <!-- Grid lines -->
    <div class="grid-container" v-if="showGrid">
      <div v-for="position in gridLines.horizontal" :key="`h-${position}`"
           class="grid-line horizontal"
           :style="{ top: `${position}px`, width: `${containerWidth}px` }">
      </div>
      <div v-for="position in gridLines.vertical" :key="`v-${position}`"
           class="grid-line vertical"
           :style="{ left: `${position}px`, height: `${containerHeight}px` }">
      </div>
    </div>

    <!-- Dynamic guides that follow mouse when dragging -->
    <div v-if="showHorizontalGuide" class="guide horizontal"
         :style="{ top: `${mouseY}px`, width: `${containerWidth}px` }"></div>
    <div v-if="showVerticalGuide" class="guide vertical"
         :style="{ left: `${mouseX}px`, height: `${containerHeight}px` }"></div>

    <!-- Alignment guides based on block positions -->
    <div v-for="(position, index) in horizontalGuides" :key="`hg-${index}`"
         class="alignment-guide horizontal"
         :style="{ top: `${position}px`, width: `${containerWidth}px` }"></div>
    <div v-for="(position, index) in verticalGuides" :key="`vg-${index}`"
         class="alignment-guide vertical"
         :style="{ left: `${position}px`, height: `${containerHeight}px` }"></div>
  </div>
</template>

<style scoped>
.ruler-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  margin-top: -25px;  /* Offset for the editor container padding */
  margin-left: -25px; /* Offset for the editor container padding */
}

.ruler-corner {
  position: absolute;
  top: 0;
  left: 0;
  width: 25px;
  height: 25px;
  background-color: #f0f0f0;
  border-right: 1px solid #bbb;
  border-bottom: 1px solid #bbb;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.horizontal-ruler {
  position: absolute;
  top: 0;
  left: 25px; /* Width of the corner */
  height: 25px;
  width: calc(100% - 25px);
  background-color: #f0f0f0;
  border-bottom: 1px solid #bbb;
  z-index: 6;
  pointer-events: auto;
  cursor: crosshair;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.vertical-ruler {
  position: absolute;
  top: 25px; /* Height of the corner */
  left: 0;
  width: 25px;
  height: calc(100% - 25px);
  background-color: #f0f0f0;
  border-right: 1px solid #bbb;
  z-index: 6;
  pointer-events: auto;
  cursor: crosshair;
  box-shadow: 1px 0 2px rgba(0,0,0,0.1);
}

.tick {
  position: absolute;
  background-color: #666;
}

.horizontal-ruler .tick {
  width: 1px;
  height: 6px;
  bottom: 0;
}

.horizontal-ruler .large-tick {
  height: 12px;
  width: 1.5px;
  background-color: #333;
}

.vertical-ruler .tick {
  height: 1px;
  width: 6px;
  right: 0;
}

.vertical-ruler .large-tick {
  width: 12px;
  height: 1.5px;
  background-color: #333;
}

.tick-label {
  position: absolute;
  font-size: 9px;
  color: #333;
  white-space: nowrap;
  font-weight: 500;
}

.horizontal-ruler .tick-label {
  top: 2px;
  left: 2px;
  transform: translateX(-50%);
}

.vertical-ruler .tick-label {
  left: 2px;
  top: -10px;
  transform: rotate(-90deg);
  transform-origin: left bottom;
}

.grid-container {
  position: absolute;
  top: 25px; /* Height of the horizontal ruler */
  left: 25px; /* Width of the vertical ruler */
  width: calc(100% - 25px);
  height: calc(100% - 25px);
  z-index: 1;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background-color: rgba(25, 118, 210, 0.1);
}

.grid-line.horizontal {
  height: 1px;
}

.grid-line.vertical {
  width: 1px;
}

/* Guides that follow mouse during dragging */
.guide {
  position: absolute;
  z-index: 5;
  pointer-events: none;
}

.guide.horizontal {
  height: 1px;
  background-color: rgba(255, 0, 0, 0.7);
  box-shadow: 0 0 2px rgba(255, 0, 0, 0.5);
}

.guide.vertical {
  width: 1px;
  background-color: rgba(255, 0, 0, 0.7);
  box-shadow: 0 0 2px rgba(255, 0, 0, 0.5);
}

/* Alignment guides based on block positions */
.alignment-guide {
  position: absolute;
  z-index: 4;
  pointer-events: none;
}

.alignment-guide.horizontal {
  height: 1px;
  background-color: rgba(0, 100, 255, 0.7);
  box-shadow: 0 0 2px rgba(0, 100, 255, 0.5);
}

.alignment-guide.vertical {
  width: 1px;
  background-color: rgba(0, 100, 255, 0.7);
  box-shadow: 0 0 2px rgba(0, 100, 255, 0.5);
}
</style>
