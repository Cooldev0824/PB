/**
 * Text Color Tool for Editor.js
 * Allows to wrap selected text in <span style="color: #color"> tags
 */

export default class TextColorTool {
  static get isInline() {
    return true;
  }

  constructor({ api }) {
    this.api = api;
    this.button = null;
    this.state = false;
    this.tag = 'SPAN';
    this.class = 'colored-text';

    // Define available colors
    this.colors = [
      { name: 'Black', value: '#000000' },
      { name: 'Red', value: '#FF0000' },
      { name: 'Green', value: '#008000' },
      { name: 'Blue', value: '#0000FF' },
      { name: 'Yellow', value: '#FFFF00' },
      { name: 'Purple', value: '#800080' },
      { name: 'Orange', value: '#FFA500' },
      { name: 'Gray', value: '#808080' }
    ];

    // Current selected color
    this.currentColor = this.colors[0].value;

    // Bind methods to ensure 'this' context
    this.showColorPicker = this.showColorPicker.bind(this);
    this.hideColorPicker = this.hideColorPicker.bind(this);
    this.handleColorSelect = this.handleColorSelect.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
  }

  /**
   * Create button element for Toolbar
   * @return {HTMLElement}
   */
  render() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add('ce-inline-tool');
    this.button.classList.add('text-color-button');
    this.button.title = 'Text Color';
    this.button.innerHTML = '<svg width="20" height="18" viewBox="0 0 20 18"><path d="M10.5 1L5.5 15M8 18h5M7 11h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    this.button.style.position = 'relative';

    // Add color indicator
    const colorIndicator = document.createElement('span');
    colorIndicator.classList.add('color-indicator');
    colorIndicator.style.display = 'block';
    colorIndicator.style.width = '10px';
    colorIndicator.style.height = '3px';
    colorIndicator.style.backgroundColor = this.currentColor;
    colorIndicator.style.position = 'absolute';
    colorIndicator.style.bottom = '2px';
    colorIndicator.style.left = '50%';
    colorIndicator.style.transform = 'translateX(-50%)';
    colorIndicator.style.borderRadius = '1px';

    this.button.appendChild(colorIndicator);

    // Create color picker dropdown
    this.colorPicker = document.createElement('div');
    this.colorPicker.classList.add('text-color-picker');
    this.colorPicker.style.display = 'none';
    this.colorPicker.style.position = 'absolute';
    this.colorPicker.style.top = '30px';
    this.colorPicker.style.left = '-60px';
    this.colorPicker.style.zIndex = '9999'; // Very high z-index
    this.colorPicker.style.backgroundColor = '#fff';
    this.colorPicker.style.border = '1px solid #e8e8eb';
    this.colorPicker.style.borderRadius = '4px';
    this.colorPicker.style.boxShadow = '0 3px 15px -3px rgba(13,20,33,.13)';
    this.colorPicker.style.padding = '8px';
    this.colorPicker.style.flexWrap = 'wrap';
    this.colorPicker.style.width = '150px';
    this.colorPicker.style.pointerEvents = 'auto';

    // Add color options
    this.colors.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.classList.add('color-option');
      colorOption.style.width = '30px';
      colorOption.style.height = '30px';
      colorOption.style.backgroundColor = color.value;
      colorOption.style.margin = '4px';
      colorOption.style.cursor = 'pointer';
      colorOption.style.borderRadius = '4px';
      colorOption.style.border = '1px solid #ccc';
      colorOption.style.boxSizing = 'border-box';
      colorOption.title = color.name;
      colorOption.dataset.color = color.value;

      // Store the color value directly on the element
      colorOption.setAttribute('data-color', color.value);

      // Add click event listener
      colorOption.addEventListener('click', (e) => this.handleColorSelect(e, color.value));

      this.colorPicker.appendChild(colorOption);
    });

    // Add color picker to button
    this.button.appendChild(this.colorPicker);

    // Toggle color picker on button click
    this.button.addEventListener('click', this.showColorPicker);

    // Add document click listener to close the picker when clicking outside
    document.addEventListener('click', this.handleDocumentClick);

    return this.button;
  }

  /**
   * Show the color picker
   */
  showColorPicker(event) {
    // Prevent the event from bubbling up
    event.preventDefault();
    event.stopPropagation();

    // Show the color picker
    this.colorPicker.style.display = 'flex';

    // Update the color indicator
    const colorIndicator = this.button.querySelector('.color-indicator');
    if (colorIndicator) {
      colorIndicator.style.backgroundColor = this.currentColor;
    }
  }

  /**
   * Hide the color picker
   */
  hideColorPicker() {
    this.colorPicker.style.display = 'none';
  }

  /**
   * Handle color selection
   */
  handleColorSelect(event, colorValue) {
    // Prevent the event from bubbling up
    event.preventDefault();
    event.stopPropagation();

    // Set the current color
    this.currentColor = colorValue;

    // Hide the color picker
    this.hideColorPicker();

    // Apply the color to the selected text
    this.wrap();
  }

  /**
   * Handle document click to close the color picker when clicking outside
   */
  handleDocumentClick(event) {
    // If the click was inside the color picker or on the button, do nothing
    if (this.colorPicker.contains(event.target) || this.button.contains(event.target)) {
      return;
    }

    // Otherwise, hide the color picker
    this.hideColorPicker();
  }

  /**
   * Check if current selection already has a color
   * @param {Range} range - current selection
   * @return {boolean}
   */
  checkState(selection) {
    const text = selection.anchorNode;

    if (!text) {
      return false;
    }

    const anchorElement = text instanceof Element ? text : text.parentElement;

    return anchorElement.closest(this.tag + '.' + this.class) !== null;
  }

  /**
   * Wrap selected text with color span
   */
  wrap() {
    try {
      // Get selection
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        console.log('No text selected');
        return;
      }

      // Save selection range to restore after wrapping
      const range = selection.getRangeAt(0);
      const selectedText = range.extractContents();

      // Create colored span
      const span = document.createElement(this.tag);
      span.classList.add(this.class);
      span.style.color = this.currentColor;

      // Insert text into span
      span.appendChild(selectedText);

      // Insert span into range
      range.insertNode(span);

      // Restore selection
      selection.removeAllRanges();
      selection.addRange(range);

      // Update the color indicator to show the current color
      const colorIndicator = this.button.querySelector('.color-indicator');
      if (colorIndicator) {
        colorIndicator.style.backgroundColor = this.currentColor;
      }

      // Notify EditorJS about the change
      this.api.inlineToolbar.close();
    } catch (error) {
      console.error('Error applying text color:', error);
    }
  }

  /**
   * Clean up event listeners when the tool is destroyed
   */
  destroy() {
    document.removeEventListener('click', this.handleDocumentClick);
    this.button.removeEventListener('click', this.showColorPicker);
  }

  /**
   * Sanitize HTML to allow only <span> tags with style attribute
   * @param {HTMLElement} element
   * @return {HTMLElement}
   */
  static get sanitize() {
    return {
      span: {
        class: true,
        style: true
      }
    };
  }
}
