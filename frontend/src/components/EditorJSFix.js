/**
 * EditorJS Fix for inline toolbar issues
 * This script fixes issues with the inline toolbar disappearing when clicking on buttons
 */

export function applyEditorJSFixes() {
  // Wait for EditorJS to initialize
  setTimeout(() => {
    // Fix for inline toolbar disappearing
    fixInlineToolbar();

    // Fix specifically for the color picker
    fixColorPicker();

    // Fix specifically for Bold and Italic buttons
    fixBoldItalicButtons();

    // Apply the fix again every time a new editor is created
    // This ensures the fix works for dynamically created editors
    setInterval(() => {
      fixInlineToolbar();
      fixColorPicker();
      fixBoldItalicButtons();
    }, 2000);
  }, 1000);
}

/**
 * Fix specifically for Bold and Italic buttons
 */
function fixBoldItalicButtons() {
  // Find all Bold and Italic buttons
  const formattingButtons = document.querySelectorAll('.ce-inline-tool[data-tool="bold"], .ce-inline-tool[data-tool="italic"], .ce-inline-tool[data-tool="Bold"], .ce-inline-tool[data-tool="Italic"]');

  formattingButtons.forEach(button => {
    // Skip if we've already fixed this button
    if (button.hasAttribute('data-format-fixed')) {
      return;
    }

    // Mark this button as fixed
    button.setAttribute('data-format-fixed', 'true');

    // Add a click handler
    button.addEventListener('mousedown', (event) => {
      // Don't prevent default or stop propagation here
      // We want the button to work, but we need to make sure the toolbar stays visible

      // Force the toolbar to be visible after a short delay
      setTimeout(() => {
        forceToolbarVisibility();
      }, 10);

      // And again after a longer delay
      setTimeout(() => {
        forceToolbarVisibility();
      }, 100);
    }, true);

    // Also add a direct click handler that uses document.execCommand
    button.addEventListener('click', (event) => {
      // Get the tool name
      const tool = button.dataset.tool.toLowerCase();

      // Execute the command
      if (tool === 'bold' || tool === 'b') {
        document.execCommand('bold', false, null);
      } else if (tool === 'italic' || tool === 'i') {
        document.execCommand('italic', false, null);
      }

      // Force the toolbar to be visible
      setTimeout(() => {
        forceToolbarVisibility();
      }, 10);
    }, true);
  });
}

/**
 * Fix specifically for the color picker
 */
function fixColorPicker() {
  // Find all color plugin buttons
  const colorButtons = document.querySelectorAll('.ce-inline-tool[data-tool="Color"], .ce-inline-tool[data-tool="Marker"], .ce-inline-tool[data-tool="TextColor"]');

  colorButtons.forEach(button => {
    // Skip if we've already fixed this button
    if (button.hasAttribute('data-color-fixed')) {
      return;
    }

    // Mark this button as fixed
    button.setAttribute('data-color-fixed', 'true');

    // Add a click handler
    button.addEventListener('click', (event) => {
      // Prevent the default behavior
      event.preventDefault();
      event.stopPropagation();

      // Force the color picker to be visible after a short delay
      setTimeout(() => {
        // Find all color pickers
        const colorPickers = document.querySelectorAll('.color-picker, .text-color-picker, .ce-inline-tool-dropdown, .ce-inline-toolbar__dropdown');

        colorPickers.forEach(picker => {
          // Make the picker visible
          picker.style.display = 'flex';
          picker.style.opacity = '1';
          picker.style.visibility = 'visible';
          picker.style.pointerEvents = 'auto';
          picker.style.zIndex = '10000';

          // Add click handlers to all color options
          const colorOptions = picker.querySelectorAll('.color-option, .ce-inline-tool-dropdown__item');
          colorOptions.forEach(option => {
            // Skip if we've already fixed this option
            if (option.hasAttribute('data-option-fixed')) {
              return;
            }

            // Mark this option as fixed
            option.setAttribute('data-option-fixed', 'true');

            // Add a click handler
            option.addEventListener('click', (e) => {
              // Prevent the event from bubbling up
              e.stopPropagation();

              // Keep the picker visible for a moment
              setTimeout(() => {
                picker.style.display = 'none';
              }, 100);
            }, true);
          });
        });
      }, 10);
    }, true);
  });
}

/**
 * Fix for inline toolbar disappearing when clicking on buttons
 */
function fixInlineToolbar() {
  console.log('Applying EditorJS inline toolbar fix');

  // Direct DOM manipulation to override EditorJS's inline toolbar behavior
  const style = document.createElement('style');
  style.textContent = `
    .ce-inline-toolbar {
      display: flex !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      z-index: 9999 !important;
      position: fixed !important;
    }

    .ce-inline-toolbar__dropdown,
    .ce-inline-tool-dropdown,
    .text-color-picker {
      display: flex !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      z-index: 10000 !important;
    }

    .ce-inline-tool {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
  `;

  // Remove any existing style element we added before
  const existingStyle = document.getElementById('editorjs-fix-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Add an ID to our style element so we can find it later
  style.id = 'editorjs-fix-style';
  document.head.appendChild(style);

  // Create a global event listener for all clicks
  // Remove any existing listener first to avoid duplicates
  document.removeEventListener('click', handleToolbarClick, true);
  document.addEventListener('click', handleToolbarClick, true);

  // Create a MutationObserver to watch for toolbar changes
  setupMutationObserver();
}

/**
 * Handle clicks on the toolbar
 */
function handleToolbarClick(event) {
  // Check if the click was on an inline toolbar button
  const isInlineToolbarButton = event.target.closest('.ce-inline-tool') ||
                               event.target.closest('.ce-inline-toolbar__dropdown') ||
                               event.target.closest('.ce-inline-tool-dropdown') ||
                               event.target.closest('.text-color-picker');

  // If it's a toolbar button, prevent the default behavior
  if (isInlineToolbarButton) {
    // Don't stop propagation completely as we want the button's click handler to run
    // But we do want to prevent the toolbar from closing

    // Keep the toolbar visible
    setTimeout(() => {
      forceToolbarVisibility();
    }, 10);

    // And again after a longer delay to ensure it stays visible
    setTimeout(() => {
      forceToolbarVisibility();
    }, 100);
  }
}

/**
 * Force all toolbars to be visible
 */
function forceToolbarVisibility() {
  // Make all toolbars visible
  const toolbars = document.querySelectorAll('.ce-inline-toolbar');
  toolbars.forEach(toolbar => {
    toolbar.style.display = 'flex';
    toolbar.style.opacity = '1';
    toolbar.style.visibility = 'visible';
    toolbar.style.pointerEvents = 'auto';
    toolbar.style.zIndex = '9999';
  });

  // Also make all dropdowns visible
  const dropdowns = document.querySelectorAll('.ce-inline-toolbar__dropdown, .ce-inline-tool-dropdown');
  dropdowns.forEach(dropdown => {
    dropdown.style.display = 'flex';
    dropdown.style.opacity = '1';
    dropdown.style.visibility = 'visible';
    dropdown.style.pointerEvents = 'auto';
    dropdown.style.zIndex = '10000';
  });

  // Make all color pickers visible
  const colorPickers = document.querySelectorAll('.text-color-picker');
  colorPickers.forEach(picker => {
    picker.style.display = 'flex';
    picker.style.opacity = '1';
    picker.style.visibility = 'visible';
    picker.style.pointerEvents = 'auto';
    picker.style.zIndex = '10000';
  });
}

/**
 * Set up a MutationObserver to watch for toolbar changes
 */
function setupMutationObserver() {
  // Remove any existing observer
  if (window.editorJSFixObserver) {
    window.editorJSFixObserver.disconnect();
  }

  // Create a new observer
  window.editorJSFixObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        // Check if a toolbar was added or modified
        const toolbars = document.querySelectorAll('.ce-inline-toolbar');
        if (toolbars.length > 0) {
          // Force all toolbars to be visible
          forceToolbarVisibility();

          // Add our custom event handlers to each button
          toolbars.forEach(toolbar => {
            const buttons = toolbar.querySelectorAll('.ce-inline-tool:not([data-fixed])');
            buttons.forEach(button => {
              // Mark this button as fixed so we don't add multiple handlers
              button.setAttribute('data-fixed', 'true');

              // Add our custom click handler
              button.addEventListener('mousedown', (event) => {
                // Prevent the default behavior
                event.stopPropagation();

                // Force toolbar visibility after a short delay
                setTimeout(() => {
                  forceToolbarVisibility();
                }, 10);
              }, true);
            });
          });
        }
      }
    });
  });

  // Start observing the document
  window.editorJSFixObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
}
