import { create } from 'zustand';

import type { AppData, ITab } from '../types';
import { localDB } from '../utils/localDB';

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
        const tabs = await localDB.getAllTabs();
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
        const newTabTitle = `Tab ${get().tabs.length + 1}`;
        const newTabId = await localDB.createTab({
          title: newTabTitle,
          elements: [],
          appState: {},
        });
        
        const newTab: ITab = {
          id: newTabId,
          title: newTabTitle,
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

        await localDB.updateTab(tabToSave);

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
        await localDB.deleteTab(tabId);
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
