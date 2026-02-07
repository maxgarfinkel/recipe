// apiHooks.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { useSaveRecipe } from './apiHooks';
import { Recipe } from './Types';

// Mock axios
vi.mock('axios');

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
        expect(result.current.loading).toBe(false);
        expect(typeof result.current.saveRecipe).toBe('function');
    });

    it('should successfully save a recipe', async () => {
        // Mock successful axios post
        (axios.post as any).mockResolvedValueOnce({ 
            data: mockSavedRecipe 
        });

        const { result } = renderHook(() => useSaveRecipe());

        await act(async () => {
            await result.current.saveRecipe(mockRecipe);
        });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/recipe/'), 
            mockRecipe
        );
        expect(result.current.savedRecipe).toEqual(mockSavedRecipe);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('should handle save failure', async () => {
        const errorMessage = 'Failed to save recipe';
        // Mock failed axios post
        (axios.post as any).mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useSaveRecipe());

        await act(async () => {
            await result.current.saveRecipe(mockRecipe);
        });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/recipe/'), 
            mockRecipe
        );
        expect(result.current.savedRecipe).toBeUndefined();
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBe(false);
    });

    it('should set loading state while saving', async () => {
        // Mock delayed axios post
        (axios.post as any).mockImplementationOnce(() => 
            new Promise(resolve => 
                setTimeout(() => 
                    resolve({ data: mockSavedRecipe }), 100
                )
            )
        );

        const { result } = renderHook(() => useSaveRecipe());

        let promise: Promise<void>;

        await act(async () => {
            promise = result.current.saveRecipe(mockRecipe);
        })

        expect(result.current.loading).toBe(true);

        await act(async () => {
            await promise!;
        });

        expect(result.current.loading).toBe(false);
    });

    it('should maintain previous savedRecipe state on error', async () => {
        // First save succeeds
        (axios.post as any).mockResolvedValueOnce({ 
            data: mockSavedRecipe 
        });

        const { result } = renderHook(() => useSaveRecipe());

        await act(async () => {
            await result.current.saveRecipe(mockRecipe);
        });

        // Second save fails
        (axios.post as any).mockRejectedValueOnce(new Error('Failed'));

        await act(async () => {
            await result.current.saveRecipe({...mockRecipe, name: "New Name"});
        });

        expect(result.current.savedRecipe).toEqual(mockSavedRecipe);
    });
});