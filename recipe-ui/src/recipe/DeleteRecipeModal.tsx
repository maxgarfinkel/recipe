interface Props {
    recipeName: string;
    onConfirm: () => void;
    onCancel: () => void;
    deleting: boolean;
}

function DeleteRecipeModal({ recipeName, onConfirm, onCancel, deleting }: Props) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div className="text-xl font-bold text-dark">Delete Recipe</div>
                    <button
                        className="text-gray-400 hover:text-dark transition-colors cursor-pointer leading-none"
                        onClick={onCancel}
                    >
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                {/* Body */}
                <p className="text-dark mb-8">
                    Are you sure you want to delete &ldquo;{recipeName}&rdquo;? This cannot be undone.
                </p>

                {/* Footer */}
                <div className="flex justify-end gap-3">
                    <button
                        className="px-5 py-2.5 border border-gray-200 text-dark rounded-md text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onConfirm}
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeleteRecipeModal;
