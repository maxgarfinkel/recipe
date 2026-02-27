import { useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MDXEditorMethods } from '@mdxeditor/editor';
import { RecipeImportDraft, IngredientQuantity, Recipe } from '../../Types';
import { useFetchIngredients, useFetchUnits, useSaveRecipe } from '../../apiHooks';
import { formReducer, initialState } from '../recipeFormReducer';
import MethodEditor from '../MethodEditor';
import IngredientList from '../IngredientList';
import IngredientsSelector from '../../Ingredient/IngredientsSelector';
import { useToast } from '../../context/ToastContext';

interface Props {
    draft: RecipeImportDraft;
}

function ImportPreviewForm({ draft }: Props) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const ref = useRef<MDXEditorMethods>(null);

    const { allIngredients, fetchIngredients } = useFetchIngredients();
    const { units, fetchUnits } = useFetchUnits();
    const { savedRecipe, error: saveError, loading: saving, saveRecipe } = useSaveRecipe();

    const [state, dispatch] = useReducer(formReducer, {
        ...initialState,
        name: draft.name,
        servings: draft.servings != null ? String(draft.servings) : '',
        method: draft.method ?? '',
        sourceUrl: draft.sourceUrl,
        ingredients: draft.ingredientLines
            .filter(line => line.resolvedIngredient != null && line.resolvedUnit != null)
            .map(line => ({
                id: null,
                quantity: line.quantity ?? 0,
                ingredient: line.resolvedIngredient!,
                unit: line.resolvedUnit!,
            } as IngredientQuantity)),
    });

    const { name, servings, method, ingredients } = state;

    const unresolvedLines = draft.ingredientLines.filter(
        line => line.resolvedIngredient == null
    );

    const [visibleUnresolved, setVisibleUnresolved] = useState<number[]>(
        () => unresolvedLines.map((_, i) => i)
    );

    const dismissUnresolvedLine = (idx: number) =>
        setVisibleUnresolved(prev => prev.filter(i => i !== idx));

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    useEffect(() => {
        if (ref.current && draft.method) {
            ref.current.setMarkdown(draft.method);
        }
    }, [draft.method]);

    useEffect(() => {
        if (!savedRecipe) return;
        showToast('Recipe saved successfully!', 'success');
        navigate(`/recipe/${savedRecipe.id}`);
    }, [savedRecipe, navigate, showToast]);

    useEffect(() => {
        if (!saveError) return;
        showToast(`Could not save recipe: ${saveError}`, 'error');
    }, [saveError, showToast]);

    const handleSave = () => {
        const recipe: Recipe = {
            id: null,
            name,
            method,
            servings: parseInt(servings) || 0,
            ingredientQuantities: ingredients,
            sourceUrl: draft.sourceUrl,
        };
        saveRecipe(recipe);
    };

    return (
        <div className="py-8 px-4 md:px-0">
            <h1>Review Imported Recipe</h1>

            {draft.sourceUrl && (
                <div className="mb-6 text-xs text-mid">
                    Source: <a href={draft.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-dark">{draft.sourceUrl}</a>
                </div>
            )}

            <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-2 max-w-lg">
                    <label htmlFor="name" className="text-xs font-semibold uppercase tracking-widest text-mid">Recipe Name</label>
                    <input
                        id="name"
                        value={name}
                        onChange={(e) => dispatch({ type: 'set_name', value: e.target.value })}
                        className="border border-gray-200 rounded-lg px-4 py-3 text-dark focus:outline-none focus:ring-2 focus:ring-mid focus:border-transparent"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="servings" className="text-xs font-semibold uppercase tracking-widest text-mid">Servings</label>
                    <input
                        id="servings"
                        value={servings}
                        onChange={(e) => dispatch({ type: 'set_servings', value: e.target.value })}
                        className="border border-gray-200 rounded-lg px-4 py-3 text-dark focus:outline-none focus:ring-2 focus:ring-mid focus:border-transparent w-24"
                    />
                </div>

                <div>
                    <h2>Ingredients</h2>
                    <IngredientList
                        ingredients={ingredients}
                        units={units ?? undefined}
                        onRemove={(i) => dispatch({ type: 'remove_ingredient', index: i })}
                        onUpdate={(i, iq) => dispatch({ type: 'update_ingredient', index: i, ingredient: iq })}
                    />

                    {allIngredients && allIngredients.length > 0 && units && visibleUnresolved.length > 0 && (
                        <div className="mt-4 flex flex-col gap-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-mid">
                                Unresolved ingredients — add manually:
                            </p>
                            {visibleUnresolved.map(idx => (
                                <div key={idx} className="border border-gray-100 rounded-lg p-3 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 italic">
                                            "{unresolvedLines[idx].rawText}"
                                        </span>
                                        <button
                                            onClick={() => dismissUnresolvedLine(idx)}
                                            aria-label={`Done with ${unresolvedLines[idx].rawText}`}
                                            className="text-xs font-semibold uppercase tracking-widest text-mid hover:text-dark transition-colors cursor-pointer"
                                        >
                                            Done ✓
                                        </button>
                                    </div>
                                    <IngredientsSelector
                                        ingredients={allIngredients}
                                        units={units}
                                        addIngredient={(iq) => dispatch({ type: 'add_ingredient', ingredient: iq })}
                                        initialSearchTerm={unresolvedLines[idx].ingredientNameHint ?? undefined}
                                        initialQuantity={unresolvedLines[idx].quantity ?? undefined}
                                        initialUnitNameHint={unresolvedLines[idx].unitNameHint ?? undefined}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {allIngredients && allIngredients.length > 0 && units && (
                        <IngredientsSelector
                            ingredients={allIngredients}
                            units={units}
                            addIngredient={(iq) => dispatch({ type: 'add_ingredient', ingredient: iq })}
                        />
                    )}
                </div>

                <div>
                    <h2>Method</h2>
                    <MethodEditor
                        ref={ref}
                        value={method}
                        onChange={(v) => dispatch({ type: 'set_method', value: v })}
                    />
                </div>

                <div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-dark text-white px-8 py-3 rounded-lg font-medium hover:bg-mid transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Recipe'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ImportPreviewForm;
