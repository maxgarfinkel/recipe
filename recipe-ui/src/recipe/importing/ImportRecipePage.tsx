import { useRef, useState } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useImportRecipe, useImportRecipeFromImage } from '../../apiHooks';
import ImportPreviewForm from './ImportPreviewForm';

type Tab = 'url' | 'photo';

function ImportRecipePage() {
    const [activeTab, setActiveTab] = useState<Tab>('url');

    // URL tab state
    const [url, setUrl] = useState('');

    // Photo tab state
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const { importDraft: urlDraft, error: urlError, loading: urlLoading, importRecipe } = useImportRecipe();
    const { importDraft: imageDraft, error: imageError, loading: imageLoading, importRecipeFromImage } = useImportRecipeFromImage();

    if (urlDraft) return <ImportPreviewForm draft={urlDraft} />;
    if (imageDraft) return <ImportPreviewForm draft={imageDraft} />;

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        importRecipe(url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCapturedImage(URL.createObjectURL(file));
        setCrop(undefined);
        setCompletedCrop(undefined);
    };

    const handleRetake = () => {
        setCapturedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImportImage = () => {
        const image = imgRef.current;
        if (!image || !completedCrop) return;

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0, 0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob(blob => {
            if (blob) importRecipeFromImage(blob);
        }, 'image/jpeg', 0.92);
    };

    const tabClass = (tab: Tab) =>
        `px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === tab
                ? 'border-mid text-mid'
                : 'border-transparent text-gray-400 hover:text-dark'
        }`;

    return (
        <div className="py-8 px-4 md:px-0">
            <h1>Import Recipe</h1>

            <div className="flex border-b border-gray-200 mb-6">
                <button className={tabClass('url')} onClick={() => setActiveTab('url')}>
                    From URL
                </button>
                <button className={tabClass('photo')} onClick={() => setActiveTab('photo')}>
                    From Photo
                </button>
            </div>

            {activeTab === 'url' && (
                <form onSubmit={handleUrlSubmit} className="flex flex-col gap-4 max-w-lg">
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
                            disabled={urlLoading}
                            className="bg-dark text-white px-8 py-3 rounded-lg font-medium hover:bg-mid transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {urlLoading ? 'Importing...' : 'Import Recipe'}
                        </button>
                    </div>
                    {urlError && (
                        <p role="alert" className="text-red-600">
                            Failed to import recipe. Please check the URL and try again.
                        </p>
                    )}
                </form>
            )}

            {activeTab === 'photo' && (
                <div className="flex flex-col gap-4 max-w-lg">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {!capturedImage && (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm text-gray-500">
                                Take a photo of a recipe book page to import it automatically.
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="self-start bg-dark text-white px-8 py-3 rounded-lg font-medium hover:bg-mid transition-colors cursor-pointer"
                            >
                                Take Photo
                            </button>
                        </div>
                    )}

                    {capturedImage && (
                        <>
                            <p className="text-xs font-semibold uppercase tracking-widest text-mid">
                                Drag to crop the recipe
                            </p>
                            <ReactCrop
                                crop={crop}
                                onChange={setCrop}
                                onComplete={setCompletedCrop}
                            >
                                <img
                                    ref={imgRef}
                                    src={capturedImage}
                                    alt="Recipe page"
                                    className="max-w-full rounded-lg"
                                    onLoad={() => setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 })}
                                />
                            </ReactCrop>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleRetake}
                                    className="border border-gray-200 text-dark px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Retake
                                </button>
                                <button
                                    onClick={handleImportImage}
                                    disabled={imageLoading || !completedCrop}
                                    className="bg-dark text-white px-8 py-3 rounded-lg font-medium hover:bg-mid transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {imageLoading ? 'Importing...' : 'Import Recipe'}
                                </button>
                            </div>
                        </>
                    )}

                    {imageError && (
                        <p role="alert" className="text-red-600">
                            Failed to import recipe from photo. Please try again.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default ImportRecipePage;
