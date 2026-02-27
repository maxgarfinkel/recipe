// apiHooks.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {useDeleteRecipe, useFetchIngredients, useFetchRecipe, useFetchRecipes, useFetchUnits, useSaveRecipe, useUpdateRecipe} from './apiHooks';
import {Ingredient, Recipe} from './Types';
import {deferred} from "./testUtils/deferred.ts";
import {Unit} from "./Unit/Unit.ts";
import {Units} from "./Unit/Units.ts";

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    }
}));

import api from './api';
const mockedApi = vi.mocked(api, true);

describe('useSaveRecipe', () => {
    const mockRecipe: Recipe = {
        id: null,
        name: "Test Recipe",
        method: "Test Method",
        servings: 4,
        ingredientQuantities: []
    };

    const mockSavedRecipe: Recipe = {
        ...mockRecipe,
        id: BigInt(1)
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useSaveRecipe());

        expect(result.current.savedRecipe).toBeUndefined();
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
        expect(typeof result.current.saveRecipe).toBe('function');
    });

    it('should successfully save a recipe', async () => {
        mockedApi.post.mockResolvedValueOnce({ data: mockSavedRecipe });

        const { result } = renderHook(() => useSaveRecipe());

        await act(async () => {
            await result.current.saveRecipe(mockRecipe);
        });

        expect(api.post).toHaveBeenCalledWith('recipe/', mockRecipe);
        expect(result.current.savedRecipe).toEqual(mockSavedRecipe);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
    });

    it('should handle save failure', async () => {
        const errorMessage = 'Failed to save recipe';
        mockedApi.post.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useSaveRecipe());

        await act(async () => {
            await result.current.saveRecipe(mockRecipe);
        });

        expect(api.post).toHaveBeenCalledWith('recipe/', mockRecipe);
        expect(result.current.savedRecipe).toBeUndefined();
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBeFalsy();
    });

    it('should set loading state while saving', async () => {
        const deferredPost = deferred<{ data: Recipe }>();

        mockedApi.post.mockImplementationOnce(() => deferredPost.promise);

        const { result } = renderHook(() => useSaveRecipe());

        let promise: Promise<void>;

        await act(async () => {
            promise = result.current.saveRecipe(mockRecipe);
        })

        expect(result.current.loading).toBeTruthy();

        await act(async () => {
            deferredPost.resolve({ data: mockRecipe });
            await promise!;
        });

        expect(result.current.loading).toBeFalsy();
    });

    it('should maintain previous savedRecipe state on error', async () => {
        mockedApi.post.mockResolvedValueOnce({ data: mockSavedRecipe });

        const { result } = renderHook(() => useSaveRecipe());

        await act(async () => {
            await result.current.saveRecipe(mockRecipe);
        });

        mockedApi.post.mockRejectedValueOnce(new Error('Failed'));

        await act(async () => {
            await result.current.saveRecipe({...mockRecipe, name: "New Name"});
        });

        expect(result.current.savedRecipe).toEqual(mockSavedRecipe);
    });
});

describe('useFetchRecipes', () => {
    const mockRecipes: Recipe[] = [
        {id: BigInt(0), name: "Test Recipe 1", method: "Test Method 1", servings: 4, ingredientQuantities: []},
        {id: BigInt(1), name: "Test Recipe 2", method: "Test Method 2", servings: 4, ingredientQuantities: []}
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useFetchRecipes());
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
        expect(result.current.recipes).toStrictEqual([]);
    })

    it('should fetch recipes on mount', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mockRecipes });

        const { result } = renderHook(() => useFetchRecipes());

        await act(async () => {
            result.current.fetchRecipes();
        })

        expect(result.current.loading).toBeFalsy();
        expect(result.current.error).toBeNull();
        expect(result.current.recipes).toBe(mockRecipes);
    })

    it('should handle fetch failure', async () => {
        const errorMessage = 'Failed to fetch recipes';
        mockedApi.get.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useFetchRecipes());

        await act(async () => {
            result.current.fetchRecipes();
        })

        expect(result.current.loading).toBeFalsy();
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.recipes).toStrictEqual([]);
    })

    it('should set loading state when fetching', async () => {
        const deferredGet = deferred<{ data: Recipe[] }>();

        mockedApi.get.mockImplementationOnce(() => deferredGet.promise);

        const { result } = renderHook(() => useFetchRecipes());

        await act(async () => {
            result.current.fetchRecipes();
        })

        expect(result.current.loading).toBeTruthy();
        expect(result.current.error).toBeNull();
        expect(result.current.recipes).toStrictEqual([]);

        await act(async () => {
            deferredGet.resolve({ data: mockRecipes });
        })

        expect(result.current.loading).toBeFalsy();
        expect(result.current.error).toBeNull();
        expect(result.current.recipes).toStrictEqual(mockRecipes);
    });

    it('should maintain previous recipes state on error', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mockRecipes });

        const { result } = renderHook(() => useFetchRecipes());

        await act(async () => {
            result.current.fetchRecipes();
        })

        mockedApi.get.mockRejectedValueOnce(new Error('Failed'));

        await act(async () => {
            result.current.fetchRecipes();
        })

        expect(result.current.error).toBe('Failed');
        expect(result.current.recipes).toBe(mockRecipes);
        expect(result.current.loading).toBeFalsy();
    })
})

describe('useFetchRecipe', () => {
    const mockRecipe: Recipe =
        {id: BigInt(0), name: "Test Recipe 1", method: "Test Method 1", servings: 4, ingredientQuantities: []};

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useFetchRecipe());
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
        expect(result.current.recipe).toBeNull();
    })

    it('should fetch recipe on mount', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mockRecipe });

        const { result } = renderHook(() => useFetchRecipe());

        await act(async () => {
            result.current.fetchRecipe(1);
        })

        expect(result.current.loading).toBeFalsy();
        expect(result.current.error).toBeNull();
        expect(result.current.recipe).toBe(mockRecipe);
    })

    it('should handle fetch failure', async () => {
        const errorMessage = 'Failed to fetch recipe';
        mockedApi.get.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useFetchRecipe());

        await act(async () => {
            result.current.fetchRecipe(1);
        })

        expect(result.current.loading).toBeFalsy();
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.recipe).toBeNull();
    })

    it('should set loading state when fetching', async () => {
        const deferredGet = deferred<{ data: Recipe }>();

        mockedApi.get.mockImplementationOnce(() => deferredGet.promise);

        const { result } = renderHook(() => useFetchRecipe());

        await act(async () => {
            result.current.fetchRecipe(1);
        })

        expect(result.current.loading).toBeTruthy();
        expect(result.current.error).toBeNull();
        expect(result.current.recipe).toBeNull();

        await act(async () => {
            deferredGet.resolve({ data: mockRecipe });
        })

        expect(result.current.loading).toBeFalsy();
        expect(result.current.error).toBeNull();
        expect(result.current.recipe).toStrictEqual(mockRecipe);
    });

    it('should maintain previous recipes state on error', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mockRecipe });

        const { result } = renderHook(() => useFetchRecipe());

        await act(async () => {
            result.current.fetchRecipe(1);
        })

        mockedApi.get.mockRejectedValueOnce(new Error('Failed'));

        await act(async () => {
            result.current.fetchRecipe(1);
        })

        expect(result.current.error).toBe('Failed');
        expect(result.current.recipe).toBe(mockRecipe);
        expect(result.current.loading).toBeFalsy();
    })
})

describe('useFetchUnits', () => {

    const mockUnitJson: Unit[] =
        [{id: BigInt(0), name: "gram", abbreviation: "g", base: null, baseFactor: 0}]
    const mockUnits: Units = new Units(mockUnitJson);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useFetchUnits());
        expect(result.current.unitError).toBeNull();
        expect(result.current.unitLoading).toBeFalsy();
        expect(result.current.units).toBeUndefined();
    })

    it('should fetch recipes on mount', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mockUnitJson });

        const { result } = renderHook(() => useFetchUnits());

        await act(async () => {
            result.current.fetchUnits();
        })

        expect(result.current.unitLoading).toBeFalsy();
        expect(result.current.unitError).toBeNull();
        expect(result.current.units).toEqual(mockUnits);
    })

    it('should handle fetch failure', async () => {
        const errorMessage = 'Failed to fetch units';
        mockedApi.get.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useFetchUnits());

        await act(async () => {
            result.current.fetchUnits();
        })

        expect(result.current.unitLoading).toBeFalsy();
        expect(result.current.unitError).toBe(errorMessage);
        expect(result.current.units).toBeUndefined();
    })

    it('should set loading state when fetching', async () => {
        const deferredGet = deferred<{ data: Unit[] }>();

        mockedApi.get.mockImplementationOnce(() => deferredGet.promise);

        const { result } = renderHook(() => useFetchUnits());

        await act(async () => {
            result.current.fetchUnits();
        })

        expect(result.current.unitLoading).toBeTruthy();
        expect(result.current.unitError).toBeNull();
        expect(result.current.units).toBeUndefined();

        await act(async () => {
            deferredGet.resolve({ data: mockUnitJson });
        })

        expect(result.current.unitLoading).toBeFalsy();
        expect(result.current.unitError).toBeNull();
        expect(result.current.units).toEqual(mockUnits);
    });

    it('should maintain previous units state on error', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mockUnitJson });

        const { result } = renderHook(() => useFetchUnits());

        await act(async () => {
            result.current.fetchUnits();
        })

        mockedApi.get.mockRejectedValueOnce(new Error('Failed'));

        await act(async () => {
            result.current.fetchUnits();
        })

        expect(result.current.unitError).toBe('Failed');
        expect(result.current.units).toEqual(mockUnits);
        expect(result.current.unitLoading).toBeFalsy();
    })
})

describe('useUpdateRecipe', () => {
    const mockRecipe: Recipe = {
        id: BigInt(1),
        name: "Test Recipe",
        method: "Test Method",
        servings: 4,
        ingredientQuantities: []
    };

    const mockUpdatedRecipe: Recipe = {
        ...mockRecipe,
        name: "Updated Recipe",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useUpdateRecipe());

        expect(result.current.updatedRecipe).toBeUndefined();
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
        expect(typeof result.current.updateRecipe).toBe('function');
    });

    it('should successfully update a recipe', async () => {
        mockedApi.put.mockResolvedValueOnce({ data: mockUpdatedRecipe });

        const { result } = renderHook(() => useUpdateRecipe());

        await act(async () => {
            await result.current.updateRecipe(mockRecipe);
        });

        expect(api.put).toHaveBeenCalledWith(`recipe/${mockRecipe.id}`, mockRecipe);
        expect(result.current.updatedRecipe).toEqual(mockUpdatedRecipe);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
    });

    it('should handle update failure', async () => {
        const errorMessage = 'Failed to update recipe';
        mockedApi.put.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useUpdateRecipe());

        await act(async () => {
            await result.current.updateRecipe(mockRecipe);
        });

        expect(api.put).toHaveBeenCalledWith(`recipe/${mockRecipe.id}`, mockRecipe);
        expect(result.current.updatedRecipe).toBeUndefined();
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBeFalsy();
    });

    it('should set loading state while updating', async () => {
        const deferredPut = deferred<{ data: Recipe }>();

        mockedApi.put.mockImplementationOnce(() => deferredPut.promise);

        const { result } = renderHook(() => useUpdateRecipe());

        let promise: Promise<void>;

        await act(async () => {
            promise = result.current.updateRecipe(mockRecipe);
        });

        expect(result.current.loading).toBeTruthy();

        await act(async () => {
            deferredPut.resolve({ data: mockUpdatedRecipe });
            await promise!;
        });

        expect(result.current.loading).toBeFalsy();
    });
});

describe('useFetchIngredients', () => {
    const mockIngredients: Ingredient[] =
        [{id: BigInt(0), name: "boiled carp", defaultUnit: {id: BigInt(0), name: "gram", abbreviation: "g", base: null, baseFactor: 0}}];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useFetchIngredients());
        expect(result.current.ingredientError).toBeNull();
        expect(result.current.ingredientLoading).toBeFalsy();
        expect(result.current.allIngredients).toStrictEqual([]);
    })

    it('should fetch ingredients on mount', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mockIngredients });

        const { result } = renderHook(() => useFetchIngredients());

        await act(async () => {
            result.current.fetchIngredients();
        })

        expect(result.current.ingredientLoading).toBeFalsy();
        expect(result.current.ingredientError).toBeNull();
        expect(result.current.allIngredients).toBe(mockIngredients);
    })

    it('should handle fetch failure', async () => {
        const errorMessage = 'Failed to fetch ingredients';
        mockedApi.get.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useFetchIngredients());

        await act(async () => {
            result.current.fetchIngredients();
        })

        expect(result.current.ingredientLoading).toBeFalsy();
        expect(result.current.ingredientError).toBe(errorMessage);
        expect(result.current.allIngredients).toStrictEqual([]);
    })

    it('should set loading state when fetching', async () => {
        const deferredGet = deferred<{ data: Ingredient[] }>();

        mockedApi.get.mockImplementationOnce(() => deferredGet.promise);

        const { result } = renderHook(() => useFetchIngredients());

        await act(async () => {
            result.current.fetchIngredients();
        })

        expect(result.current.ingredientLoading).toBeTruthy();
        expect(result.current.ingredientError).toBeNull();
        expect(result.current.allIngredients).toStrictEqual([]);

        await act(async () => {
            deferredGet.resolve({ data: mockIngredients });
        })

        expect(result.current.ingredientLoading).toBeFalsy();
        expect(result.current.ingredientError).toBeNull();
        expect(result.current.allIngredients).toStrictEqual(mockIngredients);
    });

    it('should maintain previous ingredient state on error', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mockIngredients });

        const { result } = renderHook(() => useFetchIngredients());

        await act(async () => {
            result.current.fetchIngredients();
        })

        mockedApi.get.mockRejectedValueOnce(new Error('Failed'));

        await act(async () => {
            result.current.fetchIngredients();
        })

        expect(result.current.ingredientError).toBe('Failed');
        expect(result.current.allIngredients).toBe(mockIngredients);
        expect(result.current.ingredientLoading).toBeFalsy();
    })
})

describe('useDeleteRecipe', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useDeleteRecipe());

        expect(result.current.deleted).toBeUndefined();
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
        expect(typeof result.current.deleteRecipe).toBe('function');
    });

    it('should successfully delete a recipe', async () => {
        mockedApi.delete.mockResolvedValueOnce({});

        const { result } = renderHook(() => useDeleteRecipe());

        await act(async () => {
            await result.current.deleteRecipe(42);
        });

        expect(api.delete).toHaveBeenCalledWith('recipe/42');
        expect(result.current.deleted).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBeFalsy();
    });

    it('should handle delete failure', async () => {
        const errorMessage = 'Failed to delete recipe';
        mockedApi.delete.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useDeleteRecipe());

        await act(async () => {
            await result.current.deleteRecipe(42);
        });

        expect(result.current.deleted).toBeUndefined();
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBeFalsy();
    });

    it('should set loading state while deleting', async () => {
        const deferredDelete = deferred<unknown>();

        mockedApi.delete.mockImplementationOnce(() => deferredDelete.promise);

        const { result } = renderHook(() => useDeleteRecipe());

        let promise: Promise<void>;

        await act(async () => {
            promise = result.current.deleteRecipe(42);
        });

        expect(result.current.loading).toBeTruthy();

        await act(async () => {
            deferredDelete.resolve({});
            await promise!;
        });

        expect(result.current.loading).toBeFalsy();
    });
})
