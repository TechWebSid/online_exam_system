'use client';

export function ConfirmationModal({ 
    isOpen,
    title, 
    message, 
    onConfirm, 
    onClose,
    confirmText = 'Confirm',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700'
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

                <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {message}
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white ${confirmButtonClass}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 