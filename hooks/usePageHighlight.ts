"use client";

import { useEffect, useCallback, useState } from 'react';

// Function to highlight text on the page
const highlightTextInDOM = (query: string) => {
  if (!query.trim()) return;

  // Remove existing highlights first
  removeHighlights();

  // Create a regex to find the text (case insensitive)
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

  // Function to recursively walk through text nodes
  const walkTextNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || '';
      if (regex.test(textContent)) {
        const parent = node.parentNode;
        if (parent && parent.nodeType === Node.ELEMENT_NODE && !(parent as Element).closest('.search-highlight-ignore')) {
          // Create a wrapper element
          const wrapper = document.createElement('span');
          wrapper.innerHTML = textContent.replace(regex, '<mark class="search-page-highlight bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-0.5 rounded transition-colors duration-200">$1</mark>');
          
          // Replace the text node with the highlighted version
          parent.replaceChild(wrapper, node);
          
          // Move all child nodes from wrapper to parent
          while (wrapper.firstChild) {
            parent.insertBefore(wrapper.firstChild, wrapper);
          }
          parent.removeChild(wrapper);
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip script, style, and other non-content elements
      const element = node as Element;
      if (!['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'].includes(element.tagName)) {
        // Walk through child nodes
        const children = Array.from(node.childNodes);
        children.forEach(child => walkTextNodes(child));
      }
    }
  };

  // Start from the main content area or body
  const mainContent = document.querySelector('main') || document.body;
  walkTextNodes(mainContent);

  // Scroll to the first highlight
  const firstHighlight = document.querySelector('.search-page-highlight');
  if (firstHighlight) {
    firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

// Function to remove existing highlights
const removeHighlights = () => {
  const highlights = document.querySelectorAll('.search-page-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
      parent.normalize(); // Merge adjacent text nodes
    }
  });
};

export function usePageHighlight() {
  const [mounted, setMounted] = useState(false);
  const [highlightQuery, setHighlightQuery] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Get highlight query from URL params on client side only
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const highlight = urlParams.get('highlight');
      setHighlightQuery(highlight);
    }
  }, []);

  const highlightText = useCallback((query?: string) => {
    if (!mounted) return;
    
    const searchQuery = query || highlightQuery;
    if (searchQuery) {
      // Use setTimeout to ensure the DOM is fully rendered
      setTimeout(() => {
        highlightTextInDOM(searchQuery);
      }, 100);
    }
  }, [highlightQuery, mounted]);

  const clearHighlights = useCallback(() => {
    if (!mounted) return;
    removeHighlights();
  }, [mounted]);

  useEffect(() => {
    if (mounted && highlightQuery) {
      highlightText();
    }

    // Cleanup function to remove highlights when component unmounts or query changes
    return () => {
      if (mounted) {
        removeHighlights();
      }
    };
  }, [highlightQuery, highlightText, mounted]);

  return {
    highlightText,
    clearHighlights,
    highlightQuery,
  };
}
