import React, { useEffect } from 'react';
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Area klik di luar untuk menutup (opsional) */}
            <div className="absolute inset-0" onClick={() => !isDeleting && onClose()}></div>

            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle size={20} className="text-red-600" />
                        </div>
                        <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
                        title="Tutup"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-slate-600 leading-relaxed text-sm">
                        {message}
                    </p>
                    {itemName && (
                        <div className="mt-3 font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 break-words text-sm">
                            {itemName}
                        </div>
                    )}
                    <div className="mt-5 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg flex gap-2 items-start">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <p>Perhatian: Tindakan ini permanen dan tidak dapat dibatalkan setelah dikonfirmasi.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
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