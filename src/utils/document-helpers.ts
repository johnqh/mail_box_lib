/**
 * Simple document helper functions for React Native compatibility
 * These are lightweight wrappers that maintain the same API but add platform safety
 */

/**
 * Safely add event listener to document with cleanup function
 * @param type Event type (e.g., 'mousedown', 'click')
 * @param listener Event listener function
 * @param options Event listener options
 * @returns Cleanup function
 */
function addDocumentEventListener(
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions
): () => void {
  // Only add event listener in web environment
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener(type, listener, options);

    // Return cleanup function
    return () => {
      if (typeof document !== 'undefined' && document.removeEventListener) {
        document.removeEventListener(type, listener, options);
      }
    };
  }

  // Return no-op cleanup for React Native
  return () => {};
}

/**
 * Safely get element by ID
 * @param id Element ID
 * @returns Element or null
 */
function getDocumentElementById(id: string): Element | null {
  if (typeof document !== 'undefined' && document.getElementById) {
    try {
      return document.getElementById(id);
    } catch (error) {
      console.warn('Failed to get element by ID:', error);
    }
  }
  return null;
}

/**
 * Safely create element
 * @param tagName Tag name
 * @returns Element or null
 */
function createDocumentElement(tagName: string): HTMLElement | null {
  if (typeof document !== 'undefined' && document.createElement) {
    try {
      return document.createElement(tagName);
    } catch (error) {
      console.warn('Failed to create element:', error);
    }
  }
  return null;
}

/**
 * Safely get document head
 * @returns Head element or null
 */
function getDocumentHead(): HTMLHeadElement | null {
  if (typeof document !== 'undefined' && document.head) {
    return document.head;
  }
  return null;
}

/**
 * Safely append child to document head
 * @param element Element to append
 * @returns Success boolean
 */
function appendToDocumentHead(element: Node): boolean {
  const head = getDocumentHead();
  if (head && element) {
    try {
      head.appendChild(element);
      return true;
    } catch (error) {
      console.warn('Failed to append to document head:', error);
    }
  }
  return false;
}

/**
 * Safely get document element (html element)
 * @returns Document element or null
 */
function getDocumentElement(): HTMLElement | null {
  if (typeof document !== 'undefined' && document.documentElement) {
    return document.documentElement;
  }
  return null;
}

/**
 * Safely get document title
 * @param fallback Fallback title
 * @returns Document title
 */
function getDocumentTitle(fallback: string = ''): string {
  if (typeof document !== 'undefined' && document.title) {
    return document.title;
  }
  return fallback;
}

/**
 * Safely set document title
 * @param title New title
 */
function setDocumentTitle(title: string): void {
  if (typeof document !== 'undefined') {
    try {
      document.title = title;
    } catch (error) {
      console.warn('Failed to set document title:', error);
    }
  }
}

/**
 * Check if we're in a web environment with document support
 */
function isWebEnvironment(): boolean {
  return typeof document !== 'undefined';
}

/**
 * Check if DOM manipulation is supported
 */
function isDOMSupported(): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function' &&
    typeof document.getElementById === 'function'
  );
}

export {
  addDocumentEventListener,
  getDocumentElementById,
  createDocumentElement,
  getDocumentHead,
  appendToDocumentHead,
  getDocumentElement,
  getDocumentTitle,
  setDocumentTitle,
  isWebEnvironment,
  isDOMSupported,
};
