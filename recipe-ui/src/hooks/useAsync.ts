import { useCallback, useState } from 'react';

interface AsyncState<T> {
    data: T | undefined;
    error: string | null;
    loading: boolean;
}

export function useAsync<T>() {
    const [state, setState] = useState<AsyncState<T>>({
        data: undefined,
        error: null,
        loading: false,
    });

    const execute = useCallback(async (fn: () => Promise<T>): Promise<void> => {
        setState(s => ({ ...s, loading: true, error: null }));
        try {
            const data = await fn();
            setState(s => ({ ...s, data, loading: false }));
        } catch (err) {
            setState(s => ({ ...s, error: (err as Error).message, loading: false }));
        }
    }, []);

    return { ...state, execute };
}
