import { Excalidraw } from '@excalidraw/excalidraw';
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState } from '@excalidraw/excalidraw/types';
import { useCallback, useEffect, useState } from 'react';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import TabBar from './components/TabBar';
import { useAppStore } from './store';

function App() {
  const { tabs, currentTabId, updateTabLocal, fetchTabs, hasUnsavedChanges } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTabs();
    }
  }, [isAuthenticated, fetchTabs]);

  // Warn user before closing page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasAnyUnsaved = tabs.some(tab => hasUnsavedChanges(tab.id));
      if (hasAnyUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tabs, hasUnsavedChanges]);

  const currentTab = tabs.find((t) => t.id === currentTabId) || tabs[0];

  const handleOnChange = useCallback(
    (elements: readonly OrderedExcalidrawElement[], state: AppState) => {
      if (!currentTab) return;

      const updatedTab = {
        elements: elements,
        appState: {
          viewBackgroundColor: state.viewBackgroundColor,
          theme: state.theme,
          zoom: state.zoom,
          scrollX: state.scrollX,
          scrollY: state.scrollY,
        },
      };

      // Only update local state, don't save to API
      updateTabLocal(currentTabId, updatedTab);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTabId],
  );

  if (!isAuthenticated) {
    if (isRegistering) {
      return (
        <Register
          onRegisterSuccess={() => setIsRegistering(false)}
          onSwitchToLogin={() => setIsRegistering(false)}
        />
      );
    }
    return (
      <Login
        onLoginSuccess={() => setIsAuthenticated(true)}
        onSwitchToRegister={() => setIsRegistering(true)}
      />
    );
  }

  if (!currentTab) {
    return (
      <>
        <TabBar />
        <div className="flex items-center justify-center h-screen">
          <p>Create a new tab to start drawing!</p>
        </div>
      </>
    );
  }

  return (
    <>
      <TabBar />
      <Excalidraw
        key={currentTabId}
        onChange={handleOnChange}
        initialData={{
          elements: currentTab.elements,
          appState: currentTab.appState,
        }}
      />
    </>
  );
}

export default App;
