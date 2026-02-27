import { useEffect, useState } from 'react';
import { Units } from '../Unit/Units.ts';
import { Ingredient, IngredientAlias } from '../Types.ts';
import {
    useFetchIngredientPage,
    useFetchUnits,
    useUpdateIngredient,
    useFetchIngredientAliases,
    useDeleteIngredientAlias,
} from '../apiHooks.ts';
import { useToast } from '../context/ToastContext.tsx';

// ---------------------------------------------------------------------------
// AliasSection
// ---------------------------------------------------------------------------

interface AliasSectionProps {
    ingredientId: bigint;
}

function AliasSection({ ingredientId }: AliasSectionProps) {
    const { aliases, aliasLoading, aliasError, fetchAliases } = useFetchIngredientAliases();
    const { deleted, error: deleteError, deleteAlias } = useDeleteIngredientAlias();
    const { showToast } = useToast();

    useEffect(() => {
        fetchAliases(ingredientId);
    }, [fetchAliases, ingredientId]);

    useEffect(() => {
        if (deleted === undefined) return;
        fetchAliases(ingredientId);
        showToast('Alias deleted', 'success');
    }, [deleted, fetchAliases, ingredientId, showToast]);

    useEffect(() => {
        if (!deleteError) return;
        showToast(`Could not delete alias: ${deleteError}`, 'error');
    }, [deleteError, showToast]);

    if (aliasLoading) return <p className="px-6 py-2 text-sm text-gray-400">Loading aliases...</p>;
    if (aliasError) return <p className="px-6 py-2 text-sm text-red-500">Error: {aliasError}</p>;
    if (!aliases || aliases.length === 0)
        return <p className="px-6 py-2 text-sm text-gray-400">No aliases.</p>;

    return (
        <div className="px-6 py-2 space-y-1">
            {aliases.map((alias: IngredientAlias) => (
                <div key={alias.id.toString()} className="flex items-center gap-4">
                    <span className="flex-1 text-sm font-mono text-gray-700">{alias.aliasText}</span>
                    <button
                        onClick={() => deleteAlias(alias.id)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                    >
                        Delete
                    </button>
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// IngredientRow
// ---------------------------------------------------------------------------

interface IngredientRowProps {
    ingredient: Ingredient;
    units: Units;
    onSaved: () => void;
}

function IngredientRow({ ingredient, units, onSaved }: IngredientRowProps) {
    const [name, setName] = useState(ingredient.name);
    const [unitId, setUnitId] = useState(ingredient.defaultUnit?.id?.toString() ?? '');
    const [expanded, setExpanded] = useState(false);
    const { updatedIngredient, error, updateIngredient } = useUpdateIngredient();
    const { showToast } = useToast();

    useEffect(() => {
        if (!updatedIngredient) return;
        showToast('Ingredient saved', 'success');
        onSaved();
    }, [updatedIngredient, showToast, onSaved]);

    useEffect(() => {
        if (!error) return;
        showToast(`Could not save ingredient: ${error}`, 'error');
    }, [error, showToast]);

    const handleSave = () => {
        const defaultUnit = unitId ? units.getUnit(unitId) : ingredient.defaultUnit;
        updateIngredient({ ...ingredient, name, defaultUnit });
    };

    return (
        <>
            <div className="flex items-center gap-3 py-3 px-4 border-b border-gray-100">
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-mid"
                />
                <select
                    value={unitId}
                    onChange={e => setUnitId(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-mid bg-white"
                >
                    <option value="">No default unit</option>
                    {units.units.map(u => (
                        <option key={u.id.toString()} value={u.id.toString()}>
                            {u.name}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-mid text-white rounded-lg text-sm font-medium hover:bg-dark transition-colors cursor-pointer"
                >
                    Save
                </button>
                <button
                    onClick={() => setExpanded(e => !e)}
                    aria-label={expanded ? 'Collapse aliases' : 'Expand aliases'}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    {expanded ? '▼' : '▶'} Aliases
                </button>
            </div>
            {expanded && <AliasSection ingredientId={ingredient.id!} />}
        </>
    );
}

// ---------------------------------------------------------------------------
// ManageIngredientsPage
// ---------------------------------------------------------------------------

export default function ManageIngredientsPage() {
    const { ingredientPage, loading, error, fetchIngredientPage } = useFetchIngredientPage();
    const { units, unitError, fetchUnits } = useFetchUnits();
    const { showToast } = useToast();
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    useEffect(() => {
        fetchIngredientPage(currentPage, 20);
    }, [fetchIngredientPage, currentPage]);

    useEffect(() => {
        if (!error) return;
        showToast(`Could not load ingredients: ${error}`, 'error');
    }, [error, showToast]);

    useEffect(() => {
        if (!unitError) return;
        showToast(`Could not load units: ${unitError}`, 'error');
    }, [unitError, showToast]);

    const totalPages = ingredientPage?.totalPages ?? 1;

    return (
        <div className="py-8 px-4 md:px-0">
            <h1>Manage Ingredients</h1>

            {loading && <p className="text-gray-400">Loading ingredients...</p>}

            {!loading && units && ingredientPage && ingredientPage.content.length === 0 && (
                <p className="text-gray-400 py-10 text-center">No ingredients yet.</p>
            )}

            {units && ingredientPage && ingredientPage.content.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {ingredientPage.content.map(ingredient => (
                        <IngredientRow
                            key={ingredient.id!.toString()}
                            ingredient={ingredient}
                            units={units}
                            onSaved={() => fetchIngredientPage(currentPage, 20)}
                        />
                    ))}
                </div>
            )}

            {ingredientPage && totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 0}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-default"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-default"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
