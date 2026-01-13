import { create } from 'zustand';

import api from '../api';
import type { AppData, ITab } from '../types';

interface AppStoreState extends AppData {
  unsavedTabs: Set<number>;
  setCurrentTabId: (id: number) => void;
  createTab: () => Promise<number>;
  updateTabLocal: (id: number, updatedTab: Partial<ITab>) => void;
  saveTab: (id: number) => Promise<void>;
  deleteTab: (tabId: number) => Promise<void>;
  fetchTabs: () => Promise<void>;
  hasUnsavedChanges: (id: number) => boolean;
}

export const useAppStore = create<AppStoreState>()((set, get) => {
  return {
    tabs: [],
    currentTabId: 0,
    unsavedTabs: new Set<number>(),

    fetchTabs: async () => {
      try {
        const response = await api.get('/tabs');
        const tabs = response.data.map((tab: any) => ({
          id: tab.ID,
          title: tab.title,
          elements: tab.elements ? JSON.parse(tab.elements) : [],
          appState: tab.appState ? JSON.parse(tab.appState) : {},
        }));
        set({ tabs, currentTabId: tabs.length > 0 ? tabs[0].id : 0, unsavedTabs: new Set() });
      } catch (error) {
        console.error('Failed to fetch tabs:', error);
      }
    },

    setCurrentTabId: (id: number) => {
      set({ currentTabId: id });
    },

    createTab: async () => {
      try {
        // Restrict to maximum 2 tabs for testing
        if (get().tabs.length >= 2) {
          alert('Maximum 2 tabs allowed for testing purposes');
          return -1;
        }
        
        const newTabTitle = `Tab ${get().tabs.length + 1}`;
        const response = await api.post('/tabs', {
          title: newTabTitle,
          elements: '[]',
          appState: '{}',
        });
        const newTab: ITab = {
          id: response.data.ID,
          title: response.data.title,
          elements: [],
          appState: {},
        };
        
        set((state) => ({
          tabs: [...state.tabs, newTab],
          currentTabId: newTab.id,
        }));
        return newTab.id;
      } catch (error) {
        console.error('Failed to create tab:', error);
        return -1;
      }
    },

    updateTabLocal: (id: number, updatedTab: Partial<ITab>) => {
      // Local update only - mark as unsaved
      set((state) => ({
        tabs: state.tabs.map((tab) =>
          tab.id !== id ? tab : { ...tab, ...updatedTab },
        ),
        unsavedTabs: new Set([...state.unsavedTabs, id]),
      }));
    },

    saveTab: async (id: number) => {
      try {
        const tabToSave = get().tabs.find((t) => t.id === id);
        if (!tabToSave) return;

        await api.put(`/tabs/${id}`, {
          title: tabToSave.title,
          elements: JSON.stringify(tabToSave.elements),
          appState: JSON.stringify(tabToSave.appState),
        });

        // Remove from unsaved set
        set((state) => {
          const newUnsavedTabs = new Set(state.unsavedTabs);
          newUnsavedTabs.delete(id);
          return { unsavedTabs: newUnsavedTabs };
        });
      } catch (error) {
        console.error('Failed to save tab:', error);
        throw error;
      }
    },

    deleteTab: async (tabId: number) => {
      try {
        await api.delete(`/tabs/${tabId}`);
        set((state) => {
          const delTabIndex = state.tabs.findIndex((tab) => tab.id === tabId);
          const newTabs = [...state.tabs];
          newTabs.splice(delTabIndex, 1);

          const newCurrentTabId =
            newTabs.length > 0
              ? delTabIndex > 0
                ? newTabs[delTabIndex - 1].id
                : newTabs[0].id
              : 0;

          const newUnsavedTabs = new Set(state.unsavedTabs);
          newUnsavedTabs.delete(tabId);

          return {
            tabs: newTabs,
            currentTabId: newCurrentTabId,
            unsavedTabs: newUnsavedTabs,
          };
        });
      } catch (error) {
        console.error('Failed to delete tab:', error);
      }
    },

    hasUnsavedChanges: (id: number) => {
      return get().unsavedTabs.has(id);
    },
  };
});
