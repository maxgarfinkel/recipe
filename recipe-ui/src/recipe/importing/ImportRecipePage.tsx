import { useState } from 'react';
import { useImportRecipe } from '../../apiHooks';
import ImportPreviewForm from './ImportPreviewForm';

function ImportRecipePage() {
    const [url, setUrl] = useState('');
    const { importDraft, error, loading, importRecipe } = useImportRecipe();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        importRecipe(url);
    };

    if (importDraft) {
        return <ImportPreviewForm draft={importDraft} />;
    }

    return (
        <div className="py-8 px-4 md:px-0">
            <h1>Import Recipe</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
                <div className="flex flex-col gap-2">
                    <label htmlFor="recipe-url" className="text-xs font-semibold uppercase tracking-widest text-mid">
                        Recipe URL
                    </label>
                    <input
                        id="recipe-url"
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="border border-gray-200 rounded-lg px-4 py-3 text-dark focus:outline-none focus:ring-2 focus:ring-mid focus:border-transparent"
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-dark text-white px-8 py-3 rounded-lg font-medium hover:bg-mid transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {loading ? 'Importing...' : 'Import Recipe'}
                    </button>
                </div>
            </form>
            {error && (
                <p role="alert" className="mt-4 text-red-600">
                    Failed to import recipe. Please check the URL and try again.
                </p>
            )}
        </div>
    );
}

export default ImportRecipePage;
