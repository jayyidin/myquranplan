import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Loader2, Trash2 } from 'lucide-react';

const ConfirmDeleteModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Konfirmasi Hapus",
    message = "Apakah Anda yakin ingin menghapus data ini?",
    itemName = "",
    isDeleting = false
}) => {
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        if (isOpen) setIsRendered(true);
    }, [isOpen]);

    const onAnimationEnd = () => {
        if (!isOpen) setIsRendered(false);
    };

    // Tutup modal jika user menekan tombol Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !isDeleting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, isDeleting]);

    // Mencegah scroll pada body ketika modal terbuka
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isRendered) return null;

    return (
        <div onAnimationEnd={onAnimationEnd} className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in duration-300 ${isOpen ? 'fade-in' : 'fade-out'}`}>
            {/* Area klik di luar untuk menutup (opsional) */}
            <div className="absolute inset-0" onClick={() => !isDeleting && onClose()}></div>

            <div className={`relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-transparent dark:border-slate-800 ${isOpen ? 'animate-in zoom-in-95' : 'animate-out zoom-out-95'}`}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-full">
                            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
                        title="Tutup"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                        {message}
                    </p>
                    {itemName && (
                        <div className="mt-3 font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 break-words text-sm">
                            {itemName}
                        </div>
                    )}
                    <div className="mt-5 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg flex gap-2 items-start">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <p>Perhatian: Tindakan ini permanen dan tidak dapat dibatalkan setelah dikonfirmasi.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 border border-transparent rounded-lg hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Menghapus...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Ya, Hapus
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;