import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { RecipeImportDraft } from '../../Types';

// ---------------------------------------------------------------------------
// Hoisted values
// ---------------------------------------------------------------------------

const mockNavigate = vi.hoisted(() => vi.fn());

const mockSelectorIngredientQty = vi.hoisted(() => ({
    id: null as null,
    quantity: 100,
    unit: { id: BigInt(1) as bigint, name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 },
    ingredient: {
        id: BigInt(2) as bigint,
        name: 'sugar',
        defaultUnit: { id: BigInt(1) as bigint, name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 },
    },
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@mdxeditor/editor', () => ({
    MDXEditor: ({ markdown, onChange }: { markdown: string; onChange: (v: string) => void }) => (
        <textarea
            data-testid="method-editor"
            value={markdown}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
    toolbarPlugin: () => ({}),
    headingsPlugin: () => ({}),
    listsPlugin: () => ({}),
    linkPlugin: () => ({}),
    markdownShortcutPlugin: () => ({}),
    UndoRedo: () => null,
    Separator: () => null,
    BoldItalicUnderlineToggles: () => null,
    BlockTypeSelect: () => null,
    ListsToggle: () => null,
}));

vi.mock('../../Ingredient/IngredientsSelector', () => ({
    default: ({ addIngredient }: { addIngredient: (iq: typeof mockSelectorIngredientQty) => void }) => (
        <button
            data-testid="add-ingredient-btn"
            onClick={() => addIngredient(mockSelectorIngredientQty)}
        >
            Add Test Ingredient
        </button>
    ),
}));

vi.mock('../../apiHooks', () => ({
    useFetchIngredients: vi.fn(),
    useFetchUnits: vi.fn(),
    useSaveRecipe: vi.fn(),
    useSaveIngredientAlias: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import ImportPreviewForm from './ImportPreviewForm';
import { useFetchIngredients, useFetchUnits, useSaveRecipe, useSaveIngredientAlias } from '../../apiHooks';
import { ToastProvider } from '../../context/ToastContext';
import { Unit } from '../../Unit/Unit';
import { Units } from '../../Unit/Units';
import { Ingredient, Recipe } from '../../Types';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: ReactNode }) {
    return (
        <MemoryRouter>
            <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
    );
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUnit: Unit = { id: BigInt(1), name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 };
const mockIngredient: Ingredient = {
    id: BigInt(1),
    name: 'flour',
    defaultUnit: { id: BigInt(1), name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 },
};
const mockUnits = new Units([mockUnit]);
const mockSaveRecipe = vi.fn();

const resolvedIngredient: Ingredient = {
    id: BigInt(1),
    name: 'flour',
    defaultUnit: { id: BigInt(1), name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 },
};

const mockDraft: RecipeImportDraft = {
    name: 'Imported Cake',
    servings: 6,
    method: 'Mix well.',
    sourceUrl: 'https://example.com/cake',
    extractionSource: 'SCHEMA_ORG',
    ingredientLines: [
        {
            rawText: '200g flour',
            quantity: 200,
            ingredientNameHint: 'flour',
            unitNameHint: 'g',
            resolvedIngredient,
            resolvedUnit: { id: BigInt(1), name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 },
        },
        {
            rawText: '2 cups milk', // unresolved
            quantity: 2,
            ingredientNameHint: 'milk',
            unitNameHint: 'cups',
            resolvedIngredient: null,
            resolvedUnit: null,
        },
    ],
};

function setupHooks({
    savedRecipe = undefined,
    saveError = null,
    saving = false,
}: {
    savedRecipe?: Recipe | undefined;
    saveError?: string | null;
    saving?: boolean;
} = {}) {
    vi.mocked(useFetchIngredients).mockReturnValue({
        allIngredients: [mockIngredient],
        ingredientLoading: false,
        ingredientError: null,
        fetchIngredients: vi.fn(),
    });
    vi.mocked(useFetchUnits).mockReturnValue({
        units: mockUnits,
        unitLoading: false,
        unitError: null,
        fetchUnits: vi.fn(),
    });
    vi.mocked(useSaveRecipe).mockReturnValue({
        savedRecipe,
        error: saveError,
        loading: saving,
        saveRecipe: mockSaveRecipe,
    });
    vi.mocked(useSaveIngredientAlias).mockReturnValue({
        saveIngredientAlias: vi.fn(),
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ImportPreviewForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupHooks();
    });

    afterEach(() => {
        cleanup();
    });

    it('pre-populates name from draft', () => {
        render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });
        expect(screen.getByLabelText(/recipe name/i)).toHaveValue('Imported Cake');
    });

    it('pre-populates servings from draft', () => {
        render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });
        expect(screen.getByLabelText(/servings/i)).toHaveValue('6');
    });

    it('pre-populates method from draft', () => {
        render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });
        expect(screen.getByTestId('method-editor')).toHaveValue('Mix well.');
    });

    it('shows resolved ingredients in the list', () => {
        render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });
        expect(screen.getByText(/flour/)).toBeInTheDocument();
    });

    it('shows unresolved ingredient hints', () => {
        render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });
        expect(screen.getByText(/2 cups milk/)).toBeInTheDocument();
    });

    it('renders the source attribution link', () => {
        render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });
        const link = screen.getByRole('link', { name: /example\.com\/cake/ });
        expect(link).toHaveAttribute('href', 'https://example.com/cake');
    });

    it('calls saveRecipe with sourceUrl included', () => {
        render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });
        fireEvent.click(screen.getByRole('button', { name: /save recipe/i }));

        expect(mockSaveRecipe).toHaveBeenCalledWith(
            expect.objectContaining({ sourceUrl: 'https://example.com/cake' })
        );
    });

    it('navigates to recipe page after successful save', async () => {
        setupHooks();
        const { rerender } = render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });

        const savedRecipe: Recipe = {
            id: BigInt(42),
            name: 'Imported Cake',
            method: 'Mix well.',
            servings: 6,
            ingredientQuantities: [],
        };
        setupHooks({ savedRecipe });
        await act(async () => {
            rerender(<ImportPreviewForm draft={mockDraft} />);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/recipe/42');
    });

    it('shows error toast when save fails', async () => {
        setupHooks();
        const { rerender } = render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });

        setupHooks({ saveError: 'Server Error' });
        await act(async () => {
            rerender(<ImportPreviewForm draft={mockDraft} />);
        });

        expect(screen.getByText(/could not save recipe/i)).toBeInTheDocument();
    });

    it('each unresolved line renders its own IngredientsSelector', () => {
        render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });
        // mockDraft has 1 unresolved line → 1 per-hint selector + 1 general = 2
        expect(screen.getAllByTestId('add-ingredient-btn')).toHaveLength(2);
    });

    it('clicking Done removes the unresolved hint and its selector', () => {
        render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });
        fireEvent.click(screen.getByRole('button', { name: /done with 2 cups milk/i }));
        expect(screen.queryByText(/2 cups milk/)).not.toBeInTheDocument();
        // only the general selector remains
        expect(screen.getAllByTestId('add-ingredient-btn')).toHaveLength(1);
    });

    it('can add multiple ingredients from one unresolved line before dismissing', () => {
        render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });
        const [hintBtn] = screen.getAllByTestId('add-ingredient-btn');
        fireEvent.click(hintBtn);
        fireEvent.click(hintBtn);
        // ingredient added twice — "sugar" appears twice in the list
        expect(screen.getAllByText(/sugar/)).toHaveLength(2);
        // hint is still visible
        expect(screen.getByText(/2 cups milk/)).toBeInTheDocument();
        // dismiss
        fireEvent.click(screen.getByRole('button', { name: /done with 2 cups milk/i }));
        expect(screen.queryByText(/2 cups milk/)).not.toBeInTheDocument();
    });

    it('when all unresolved lines are dismissed the unresolved section disappears', () => {
        render(<ImportPreviewForm draft={mockDraft} />, { wrapper: Wrapper });
        fireEvent.click(screen.getByRole('button', { name: /done with 2 cups milk/i }));
        expect(screen.queryByText(/unresolved ingredients/i)).not.toBeInTheDocument();
    });
});
