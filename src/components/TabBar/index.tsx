import { useState } from 'react';
import { useAppStore } from '../../store';
import { PlusIcon, ShareIcon } from '../icons';
import ImportModal from '../ImportButton';
import ShareModal from '../ShareModal';
import Tab from '../Tab';
import style from './style.module.css';

const TabBar = () => {
  const { tabs, currentTabId, createTab, saveTab, hasUnsavedChanges } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleCreateTabBtnClick = async () => {
    await createTab();
    // setCurrentTabId is handled in createTab store action
  };

  const handleSave = async () => {
    if (!currentTabId || !hasUnsavedChanges(currentTabId)) return;

    setIsSaving(true);
    try {
      await saveTab(currentTabId);
      // Optional: Show success message
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentHasUnsaved = currentTabId && hasUnsavedChanges(currentTabId);

  return (
    <>
      <div className={style.container}>
        <div className={style.tabBar}>
          {tabs.map((tab, index) => (
            <Tab key={index} tab={tab} />
          ))}
        </div>
        <div className={style.actions}>
          <button
            className={`${style.saveButton} ${currentHasUnsaved ? style.unsaved : ''} `}
            onClick={handleSave}
            disabled={!currentHasUnsaved || isSaving}
            title={currentHasUnsaved ? 'Save changes' : 'No changes to save'}
          >
            {isSaving ? 'Saving...' : currentHasUnsaved ? '● Save' : 'Saved'}
          </button>
          <button
            className={style.shareButton}
            onClick={() => setIsShareModalOpen(true)}
            disabled={!currentTabId}
            title="Share tab"
          >
            <ShareIcon />
          </button>
          <button
            className={style.createTabButton}
            onClick={handleCreateTabBtnClick}
            disabled={tabs.length >= 2}
            title={tabs.length >= 2 ? 'Maximum 2 tabs allowed' : 'Create new tab'}
          >
            <PlusIcon />
          </button>
          <ImportModal />
        </div>
      </div>

      {currentTabId && (
        <ShareModal
          isOpen={isShareModalOpen}
          tabId={currentTabId}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </>
  );
};

export default TabBar;
