import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { Recipe } from '../Types';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../apiHooks', () => ({
    useFetchRecipes: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks are registered
// ---------------------------------------------------------------------------

import RecipeMenu from './RecipeMenu';
import { useFetchRecipes } from '../apiHooks';
import { ToastProvider } from '../context/ToastContext';

// ---------------------------------------------------------------------------
// Wrapper — provides Router and Toast contexts
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

const mockUnit = { id: BigInt(1), name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 };

const appleCrumble: Recipe = {
    id: BigInt(1),
    name: 'Apple Crumble',
    servings: 4,
    method: '',
    ingredientQuantities: [
        { id: BigInt(1), quantity: 200, unit: mockUnit, ingredient: { id: BigInt(1), name: 'apple', defaultUnit: mockUnit } },
        { id: BigInt(2), quantity: 100, unit: mockUnit, ingredient: { id: BigInt(2), name: 'flour', defaultUnit: mockUnit } },
    ],
};

const spaghettiBoloognese: Recipe = {
    id: BigInt(2),
    name: 'Spaghetti Bolognese',
    servings: 2,
    method: '',
    ingredientQuantities: [],
};

const zucchiniSoup: Recipe = {
    id: BigInt(3),
    name: 'Zucchini Soup',
    servings: 1,
    method: '',
    ingredientQuantities: [
        { id: BigInt(3), quantity: 1, unit: mockUnit, ingredient: { id: BigInt(3), name: 'zucchini', defaultUnit: mockUnit } },
    ],
};

// ---------------------------------------------------------------------------
// Hook setup helper
// ---------------------------------------------------------------------------

const mockFetchRecipes = vi.fn();

interface HookOptions {
    recipes?: Recipe[];
    loading?: boolean;
    error?: string | null;
}

function setupHooks({ recipes = [], loading = false, error = null }: HookOptions = {}) {
    vi.mocked(useFetchRecipes).mockReturnValue({
        recipes,
        loading,
        error,
        fetchRecipes: mockFetchRecipes,
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RecipeMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupHooks();
    });

    afterEach(() => {
        cleanup();
    });

    // --- Loading state --------------------------------------------------------

    describe('loading state', () => {
        it('shows a loading indicator while fetching', () => {
            setupHooks({ loading: true });
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.getByText('Loading recipes...')).toBeInTheDocument();
        });

        it('does not show the empty state while loading', () => {
            setupHooks({ loading: true });
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.queryByText('No recipes yet.')).not.toBeInTheDocument();
        });
    });

    // --- Empty state ----------------------------------------------------------

    describe('empty state', () => {
        it('shows a "no recipes" message when not loading and there are no recipes', () => {
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.getByText('No recipes yet.')).toBeInTheDocument();
        });

        it('shows a link to create the first recipe', () => {
            render(<RecipeMenu />, { wrapper: Wrapper });
            const link = screen.getByRole('link', { name: /add your first recipe/i });
            expect(link).toHaveAttribute('href', '/new-recipe');
        });

        it('does not show the empty state when recipes are present', () => {
            setupHooks({ recipes: [appleCrumble] });
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.queryByText('No recipes yet.')).not.toBeInTheDocument();
        });
    });

    // --- Recipe list ----------------------------------------------------------

    describe('recipe list', () => {
        it('renders a link for each recipe', () => {
            setupHooks({ recipes: [appleCrumble, spaghettiBoloognese] });
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.getByRole('link', { name: /apple crumble/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /spaghetti bolognese/i })).toBeInTheDocument();
        });

        it('links each recipe to its detail page', () => {
            setupHooks({ recipes: [appleCrumble] });
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.getByRole('link', { name: /apple crumble/i }))
                .toHaveAttribute('href', '/recipe/1');
        });

        it('shows plural "servings" for a recipe with multiple servings', () => {
            setupHooks({ recipes: [appleCrumble] }); // 4 servings
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.getByText(/4 servings/)).toBeInTheDocument();
        });

        it('shows singular "serving" for a recipe with 1 serving', () => {
            setupHooks({ recipes: [zucchiniSoup] }); // 1 serving
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.getByText(/1 serving\b/)).toBeInTheDocument();
            expect(screen.queryByText(/1 servings/)).not.toBeInTheDocument();
        });

        it('omits the ingredient count when a recipe has no ingredients', () => {
            setupHooks({ recipes: [spaghettiBoloognese] }); // 0 ingredients
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.queryByText(/ingredient/i)).not.toBeInTheDocument();
        });

        it('shows plural "ingredients" for a recipe with multiple ingredients', () => {
            setupHooks({ recipes: [appleCrumble] }); // 2 ingredients
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.getByText(/2 ingredients/)).toBeInTheDocument();
        });

        it('shows singular "ingredient" for a recipe with 1 ingredient', () => {
            setupHooks({ recipes: [zucchiniSoup] }); // 1 ingredient
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.getByText(/1 ingredient\b/)).toBeInTheDocument();
            expect(screen.queryByText(/1 ingredients/)).not.toBeInTheDocument();
        });

        it('sorts recipes alphabetically regardless of the order returned by the hook', () => {
            setupHooks({ recipes: [zucchiniSoup, appleCrumble, spaghettiBoloognese] }); // Z, A, S
            render(<RecipeMenu />, { wrapper: Wrapper });

            const recipeLinks = screen.getAllByRole('link')
                .filter(el => {
                    const href = el.getAttribute('href');
                    return href?.startsWith('/recipe/') && !href?.endsWith('/edit');
                });

            expect(recipeLinks[0]).toHaveTextContent('Apple Crumble');
            expect(recipeLinks[1]).toHaveTextContent('Spaghetti Bolognese');
            expect(recipeLinks[2]).toHaveTextContent('Zucchini Soup');
        });

        it('each recipe row has an edit link pointing to /recipe/{id}/edit', () => {
            setupHooks({ recipes: [appleCrumble, spaghettiBoloognese] });
            render(<RecipeMenu />, { wrapper: Wrapper });

            const editLinks = screen.getAllByRole('link', { name: /^edit$/i });
            expect(editLinks).toHaveLength(2);
            expect(editLinks[0]).toHaveAttribute('href', '/recipe/1/edit');
            expect(editLinks[1]).toHaveAttribute('href', '/recipe/2/edit');
        });
    });

    // --- Error handling -------------------------------------------------------

    describe('error handling', () => {
        it('shows an error toast when the fetch fails', () => {
            setupHooks({ error: 'Network Error' });
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(screen.getByText('Could not load recipes: Network Error')).toBeInTheDocument();
        });
    });

    // --- Data fetching --------------------------------------------------------

    describe('data fetching', () => {
        it('calls fetchRecipes on mount', () => {
            render(<RecipeMenu />, { wrapper: Wrapper });
            expect(mockFetchRecipes).toHaveBeenCalledOnce();
        });
    });
});
