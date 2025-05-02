/**
 * Italic Tool for Editor.js
 * Allows to wrap selected text in <i> tags
 */

export default class ItalicTool {
  static get isInline() {
    return true;
  }

  constructor({ api }) {
    this.api = api;
    this.button = null;
    this.tag = 'I';
    
    // Bind methods to ensure 'this' context
    this.handleClick = this.handleClick.bind(this);
  }

  /**
   * Create button element for Toolbar
   * @return {HTMLElement}
   */
  render() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add('ce-inline-tool');
    this.button.classList.add('italic-tool-button');
    this.button.title = 'Italic';
    this.button.innerHTML = '<i>I</i>';
    
    // Add click event listener
    this.button.addEventListener('click', this.handleClick);

    return this.button;
  }
  
  /**
   * Handle button click
   */
  handleClick(event) {
    // Prevent the event from bubbling up
    event.preventDefault();
    event.stopPropagation();
    
    // Apply italic to the selected text
    this.wrap();
  }

  /**
   * Check if current selection already has italic formatting
   * @param {Range} range - current selection
   * @return {boolean}
   */
  checkState(selection) {
    const text = selection.anchorNode;

    if (!text) {
      return false;
    }

    const anchorElement = text instanceof Element ? text : text.parentElement;

    return anchorElement.closest(this.tag) !== null;
  }

  /**
   * Surround selected text with <i> tags
   */
  wrap() {
    try {
      // Get selection
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        console.log('No text selected');
        return;
      }

      // Execute italic command
      document.execCommand('italic');
      
      // Notify EditorJS about the change
      this.api.inlineToolbar.close();
    } catch (error) {
      console.error('Error applying italic:', error);
    }
  }
  
  /**
   * Clean up event listeners when the tool is destroyed
   */
  destroy() {
    this.button.removeEventListener('click', this.handleClick);
  }

  /**
   * Sanitize HTML to allow <i> tags
   */
  static get sanitize() {
    return {
      i: {}
    };
  }
}
