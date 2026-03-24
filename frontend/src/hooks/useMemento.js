import { useState } from 'react';

/**
 * useMemento is a custom hook that implements the Memento Pattern.
 * It manages state history natively, allowing Undo and Redo actions without server interaction.
 */
export function useMemento(initialState) {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setMemento = (newState) => {
    // If the user makes a change after undoing, we overwrite the future history tree
    const newHistory = history.slice(0, currentIndex + 1);
    
    // Resolve callback if function is passed, else use plain state
    const resolvedState = typeof newState === 'function' ? newState(state) : newState;
    
    newHistory.push(resolvedState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    setState(resolvedState);
  };

  const undo = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setState(history[prevIndex]);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setState(history[nextIndex]);
    }
  };

  // Used for freshly fetched data to initialize a clean base 
  const reset = (freshState) => {
    setHistory([freshState]);
    setCurrentIndex(0);
    setState(freshState);
  };

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { state, setMemento, undo, redo, canUndo, canRedo, reset };
}
