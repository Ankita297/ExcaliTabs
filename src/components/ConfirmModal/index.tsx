import style from './style.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonVariant?: 'primary' | 'danger';
}

const ConfirmModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonVariant = 'primary',
}: ConfirmModalProps) => {
    if (!isOpen) return null;

    return (
        <div className={style.overlay} onClick={onCancel}>
            <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={style.title}>{title}</h2>
                <p className={style.message}>{message}</p>
                <div className={style.actions}>
                    <button className={style.cancelButton} onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`${style.confirmButton} ${style[confirmButtonVariant]}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
