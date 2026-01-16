import { useState } from 'react';
import { useAppStore } from '../../store';
import style from './style.module.css';

interface ShareModalProps {
    isOpen: boolean;
    tabId: number;
    onClose: () => void;
}

const ShareModal = ({ isOpen, tabId, onClose }: ShareModalProps) => {
    const [successMessage, setSuccessMessage] = useState('');
    const { tabs } = useAppStore();

    const currentTab = tabs.find(tab => tab.id === tabId);

    const handleExport = () => {
        if (!currentTab) return;
        
        const exportData = JSON.stringify({
            title: currentTab.title,
            elements: currentTab.elements,
            appState: currentTab.appState,
        }, null, 2);

        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentTab.title || 'tab'}.excalidraw`;
        a.click();
        URL.revokeObjectURL(url);

        setSuccessMessage('Tab exported successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const copyToClipboard = () => {
        if (!currentTab) return;
        
        const exportData = JSON.stringify({
            title: currentTab.title,
            elements: currentTab.elements,
            appState: currentTab.appState,
        });

        navigator.clipboard.writeText(exportData);
        setSuccessMessage('Tab data copied to clipboard!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    if (!isOpen) return null;

    return (
        <div className={style.overlay} onClick={onClose}>
            <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                <div className={style.header}>
                    <h2 className={style.title}>Export Tab</h2>
                    <button className={style.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                {successMessage && <div className={style.success}>{successMessage}</div>}

                <div className={style.section}>
                    <h3 className={style.sectionTitle}>Export Options</h3>
                    <p className={style.sectionDesc}>
                        Save your tab data locally or copy to share with others
                    </p>
                    
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                        <button onClick={handleExport} className={style.addButton}>
                            Download as File
                        </button>
                        <button onClick={copyToClipboard} className={style.addButton}>
                            Copy to Clipboard
                        </button>
                    </div>
                </div>

                <div className={style.section}>
                    <h3 className={style.sectionTitle}>Note</h3>
                    <p className={style.sectionDesc}>
                        All your tabs are automatically saved in your browser's local storage.
                        Export to keep a backup or share with others.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
