import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { Ingredient, IngredientAlias, PageResponse } from '../Types';
import { Units } from '../Unit/Units.ts';
import { Unit } from '../Unit/Unit.ts';

// ---------------------------------------------------------------------------
// Module mocks — registered before any imports of the mocked modules
// ---------------------------------------------------------------------------

vi.mock('../apiHooks', () => ({
    useFetchIngredientPage: vi.fn(),
    useFetchUnits: vi.fn(),
    useUpdateIngredient: vi.fn(),
    useFetchIngredientAliases: vi.fn(),
    useDeleteIngredientAlias: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import ManageIngredientsPage from './ManageIngredientsPage';
import {
    useFetchIngredientPage,
    useFetchUnits,
    useUpdateIngredient,
    useFetchIngredientAliases,
    useDeleteIngredientAlias,
} from '../apiHooks';
import { ToastProvider } from '../context/ToastContext';

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

const mockUnit = new Unit(BigInt(1), 'Gram', 'g', null, 1);
const mockUnits = new Units([mockUnit]);

const basil: Ingredient = {
    id: BigInt(1),
    name: 'basil',
    defaultUnit: mockUnit,
};

const oregano: Ingredient = {
    id: BigInt(2),
    name: 'oregano',
    defaultUnit: mockUnit,
};

const singlePage: PageResponse<Ingredient> = {
    content: [basil, oregano],
    page: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
};

const firstOfTwoPages: PageResponse<Ingredient> = {
    content: [basil],
    page: 0,
    size: 1,
    totalElements: 2,
    totalPages: 2,
};

const secondOfTwoPages: PageResponse<Ingredient> = {
    content: [oregano],
    page: 1,
    size: 1,
    totalElements: 2,
    totalPages: 2,
};

const mockAlias: IngredientAlias = {
    id: BigInt(10),
    aliasText: 'basilico',
    ingredientId: BigInt(1),
    unitId: BigInt(1),
};

// ---------------------------------------------------------------------------
// Hook setup helpers
// ---------------------------------------------------------------------------

const mockFetchIngredientPage = vi.fn();
const mockFetchUnits = vi.fn();
const mockUpdateIngredient = vi.fn();
const mockFetchAliases = vi.fn();
const mockDeleteAlias = vi.fn();

interface SetupOptions {
    page?: PageResponse<Ingredient> | undefined;
    pageLoading?: boolean;
    pageError?: string | null;
    aliases?: IngredientAlias[] | undefined;
    aliasLoading?: boolean;
    aliasError?: string | null;
    updatedIngredient?: Ingredient | undefined;
    updateError?: string | null;
    deleted?: boolean | undefined;
}

function setupHooks({
    page = singlePage,
    pageLoading = false,
    pageError = null,
    aliases = undefined,
    aliasLoading = false,
    aliasError = null,
    updatedIngredient = undefined,
    updateError = null,
    deleted = undefined,
}: SetupOptions = {}) {
    vi.mocked(useFetchIngredientPage).mockReturnValue({
        ingredientPage: page,
        loading: pageLoading,
        error: pageError,
        fetchIngredientPage: mockFetchIngredientPage,
    });
    vi.mocked(useFetchUnits).mockReturnValue({
        units: mockUnits,
        unitError: null,
        unitLoading: false,
        fetchUnits: mockFetchUnits,
    });
    vi.mocked(useUpdateIngredient).mockReturnValue({
        updatedIngredient,
        loading: false,
        error: updateError,
        updateIngredient: mockUpdateIngredient,
    });
    vi.mocked(useFetchIngredientAliases).mockReturnValue({
        aliases,
        aliasLoading,
        aliasError,
        fetchAliases: mockFetchAliases,
    });
    vi.mocked(useDeleteIngredientAlias).mockReturnValue({
        deleted,
        loading: false,
        error: null,
        deleteAlias: mockDeleteAlias,
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ManageIngredientsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupHooks();
    });

    afterEach(() => {
        cleanup();
    });

    // --- Rendering -----------------------------------------------------------

    describe('renders ingredient rows', () => {
        it('shows an ingredient name input for each ingredient', () => {
            render(<ManageIngredientsPage />, { wrapper: Wrapper });

            const inputs = screen.getAllByRole('textbox');
            const values = inputs.map(i => (i as HTMLInputElement).value);
            expect(values).toContain('basil');
            expect(values).toContain('oregano');
        });

        it('shows a Save button for each ingredient', () => {
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            const saveButtons = screen.getAllByRole('button', { name: /save/i });
            expect(saveButtons).toHaveLength(2);
        });

        it('shows loading text while fetching', () => {
            setupHooks({ pageLoading: true, page: undefined });
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            expect(screen.getByText('Loading ingredients...')).toBeInTheDocument();
        });
    });

    // --- Pagination -----------------------------------------------------------

    describe('pagination controls', () => {
        it('Previous is disabled on the first page', () => {
            setupHooks({ page: firstOfTwoPages });
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
        });

        it('Next is disabled on the last page', () => {
            setupHooks({ page: secondOfTwoPages });
            // also need to simulate being on page 1 — the component state starts at 0,
            // but the page fixture already indicates page 1 so Next should be disabled
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            // re-render with page 1 info: click Next first to increment state
            fireEvent.click(screen.getByRole('button', { name: /next/i }));
            // After clicking Next once (currentPage becomes 1) Next should be disabled
            expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
        });

        it('clicking Next calls fetchIngredientPage with the next page number', () => {
            setupHooks({ page: firstOfTwoPages });
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            fireEvent.click(screen.getByRole('button', { name: /next/i }));
            expect(mockFetchIngredientPage).toHaveBeenCalledWith(1, 20);
        });

        it('does not render pagination controls when there is only one page', () => {
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
        });
    });

    // --- Save ----------------------------------------------------------------

    describe('saving an ingredient', () => {
        it('calls updateIngredient when Save is clicked', () => {
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            const saveButtons = screen.getAllByRole('button', { name: /save/i });
            fireEvent.click(saveButtons[0]);
            expect(mockUpdateIngredient).toHaveBeenCalledOnce();
        });
    });

    // --- Aliases -------------------------------------------------------------

    describe('aliases section', () => {
        it('shows aliases when a row is expanded', () => {
            setupHooks({ aliases: [mockAlias] });
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            const expandButtons = screen.getAllByRole('button', { name: /expand aliases/i });
            fireEvent.click(expandButtons[0]);
            expect(screen.getByText('basilico')).toBeInTheDocument();
        });

        it('calls deleteAlias when Delete is clicked on an alias', () => {
            setupHooks({ aliases: [mockAlias] });
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            const expandButtons = screen.getAllByRole('button', { name: /expand aliases/i });
            fireEvent.click(expandButtons[0]);
            const deleteButton = screen.getByRole('button', { name: /delete/i });
            fireEvent.click(deleteButton);
            expect(mockDeleteAlias).toHaveBeenCalledWith(BigInt(10));
        });

        it('shows loading text in the alias section while loading', () => {
            setupHooks({ aliases: undefined, aliasLoading: true });
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            const expandButtons = screen.getAllByRole('button', { name: /expand aliases/i });
            fireEvent.click(expandButtons[0]);
            expect(screen.getByText('Loading aliases...')).toBeInTheDocument();
        });
    });

    // --- Error handling ------------------------------------------------------

    describe('error handling', () => {
        it('shows an error toast when the ingredient page fetch fails', () => {
            setupHooks({ page: undefined, pageError: 'Network Error' });
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            expect(screen.getByText('Could not load ingredients: Network Error')).toBeInTheDocument();
        });
    });

    // --- Data fetching -------------------------------------------------------

    describe('data fetching', () => {
        it('calls fetchIngredientPage on mount', () => {
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            expect(mockFetchIngredientPage).toHaveBeenCalledWith(0, 20);
        });

        it('calls fetchUnits on mount', () => {
            render(<ManageIngredientsPage />, { wrapper: Wrapper });
            expect(mockFetchUnits).toHaveBeenCalledOnce();
        });
    });
});
