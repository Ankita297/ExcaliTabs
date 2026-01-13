import { useState, useEffect } from 'react';
import api from '../../api';
import style from './style.module.css';

interface ShareModalProps {
    isOpen: boolean;
    tabId: number;
    onClose: () => void;
}

interface Collaborator {
    ID: number;
    user: {
        username: string;
    };
}

const ShareModal = ({ isOpen, tabId, onClose }: ShareModalProps) => {
    const [isPublic, setIsPublic] = useState(false);
    const [shareToken, setShareToken] = useState('');
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [newUsername, setNewUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (isOpen && tabId) {
            loadCollaborators();
        }
    }, [isOpen, tabId]);

    const loadCollaborators = async () => {
        try {
            const response = await api.get(`/tabs/${tabId}/collaborators`);
            setCollaborators(response.data || []);
        } catch (err) {
            console.error('Failed to load collaborators:', err);
        }
    };

    const handleTogglePublic = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.put(`/tabs/${tabId}/share`, {
                isPublic: !isPublic,
            });
            setIsPublic(response.data.isPublic);
            setShareToken(response.data.shareToken);
            setSuccessMessage(response.data.isPublic ? 'Tab is now public' : 'Tab is now private');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update sharing settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCollaborator = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim()) return;

        setIsLoading(true);
        setError('');
        try {
            await api.post(`/tabs/${tabId}/collaborators`, {
                username: newUsername.trim(),
            });
            setNewUsername('');
            setSuccessMessage(`Shared with ${newUsername}`);
            setTimeout(() => setSuccessMessage(''), 3000);
            loadCollaborators();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add collaborator');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveCollaborator = async (shareId: number) => {
        setIsLoading(true);
        setError('');
        try {
            await api.delete(`/tabs/${tabId}/collaborators/${shareId}`);
            setSuccessMessage('Access revoked');
            setTimeout(() => setSuccessMessage(''), 3000);
            loadCollaborators();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to remove collaborator');
        } finally {
            setIsLoading(false);
        }
    };

    const copyShareLink = () => {
        if (shareToken) {
            const link = `${window.location.origin}/shared/${shareToken}`;
            navigator.clipboard.writeText(link);
            setSuccessMessage('Link copied to clipboard!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={style.overlay} onClick={onClose}>
            <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                <div className={style.header}>
                    <h2 className={style.title}>Share Tab</h2>
                    <button className={style.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                {error && <div className={style.error}>{error}</div>}
                {successMessage && <div className={style.success}>{successMessage}</div>}

                <div className={style.section}>
                    <div className={style.publicToggle}>
                        <div>
                            <h3 className={style.sectionTitle}>Public Access</h3>
                            <p className={style.sectionDesc}>
                                Anyone with the link can view this tab
                            </p>
                        </div>
                        <label className={style.switch}>
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={handleTogglePublic}
                                disabled={isLoading}
                            />
                            <span className={style.slider}></span>
                        </label>
                    </div>

                    {shareToken && (
                        <div className={style.linkContainer}>
                            <input
                                type="text"
                                value={`${window.location.origin}/shared/${shareToken}`}
                                readOnly
                                className={style.linkInput}
                            />
                            <button onClick={copyShareLink} className={style.copyButton}>
                                Copy
                            </button>
                        </div>
                    )}
                </div>

                <div className={style.section}>
                    <h3 className={style.sectionTitle}>Share with Specific Users</h3>
                    <form onSubmit={handleAddCollaborator} className={style.addForm}>
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className={style.input}
                            disabled={isLoading}
                        />
                        <button type="submit" className={style.addButton} disabled={isLoading}>
                            Add
                        </button>
                    </form>

                    {collaborators.length > 0 && (
                        <div className={style.collaboratorList}>
                            {collaborators.map((collab) => (
                                <div key={collab.ID} className={style.collaboratorItem}>
                                    <span className={style.username}>{collab.user.username}</span>
                                    <button
                                        onClick={() => handleRemoveCollaborator(collab.ID)}
                                        className={style.removeButton}
                                        disabled={isLoading}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
