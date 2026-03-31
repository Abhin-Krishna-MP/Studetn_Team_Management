import { useRef, useCallback } from 'react';

/**
 * Custom hook to track text changes and calculate line differences
 * Compares current text with previous text to determine lines added/deleted
 */
const useTextDiff = () => {
  const previousTextRef = useRef('');

  /**
   * Calculate line differences between previous and current text
   * @param {string} currentText - The current text content
   * @returns {Object} Object containing lines_added and lines_deleted
   */
  const calculateDiff = useCallback((currentText) => {
    const previousLines = previousTextRef.current.split('\n');
    const currentLines = currentText.split('\n');

    const previousCount = previousLines.length;
    const currentCount = currentLines.length;

    // Calculate basic line difference
    const lineDiff = currentCount - previousCount;

    let lines_added = 0;
    let lines_deleted = 0;

    if (lineDiff > 0) {
      // More lines now - lines were added
      lines_added = lineDiff;
      
      // Check for modifications (lines that changed)
      const minLength = Math.min(previousCount, currentCount);
      for (let i = 0; i < minLength; i++) {
        if (previousLines[i] !== currentLines[i]) {
          // Line was modified - count as both add and delete
          if (previousLines[i].trim() !== '' && currentLines[i].trim() !== '') {
            lines_added++;
            lines_deleted++;
          }
        }
      }
    } else if (lineDiff < 0) {
      // Fewer lines now - lines were deleted
      lines_deleted = Math.abs(lineDiff);
      
      // Check for modifications
      const minLength = Math.min(previousCount, currentCount);
      for (let i = 0; i < minLength; i++) {
        if (previousLines[i] !== currentLines[i]) {
          if (previousLines[i].trim() !== '' && currentLines[i].trim() !== '') {
            lines_added++;
            lines_deleted++;
          }
        }
      }
    } else {
      // Same number of lines - check for modifications
      for (let i = 0; i < currentCount; i++) {
        if (previousLines[i] !== currentLines[i]) {
          // Count non-empty line changes
          const prevEmpty = previousLines[i].trim() === '';
          const currEmpty = currentLines[i].trim() === '';
          
          if (!prevEmpty && currEmpty) {
            lines_deleted++;
          } else if (prevEmpty && !currEmpty) {
            lines_added++;
          } else if (!prevEmpty && !currEmpty) {
            lines_added++;
            lines_deleted++;
          }
        }
      }
    }

    return {
      lines_added: Math.max(0, lines_added),
      lines_deleted: Math.max(0, lines_deleted)
    };
  }, []);

  /**
   * Update the reference text (call after saving)
   * @param {string} newText - The text to set as the new baseline
   */
  const updateBaseline = useCallback((newText) => {
    previousTextRef.current = newText;
  }, []);

  /**
   * Reset the baseline to empty
   */
  const resetBaseline = useCallback(() => {
    previousTextRef.current = '';
  }, []);

  /**
   * Get current baseline text
   */
  const getBaseline = useCallback(() => {
    return previousTextRef.current;
  }, []);

  return {
    calculateDiff,
    updateBaseline,
    resetBaseline,
    getBaseline
  };
};

export default useTextDiff;
