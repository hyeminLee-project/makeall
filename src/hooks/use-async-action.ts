"use client";

import { useCallback, useState } from "react";

interface AsyncActionState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export function useAsyncAction<TInput, TOutput>(action: (input: TInput) => Promise<TOutput>) {
  const [state, setState] = useState<AsyncActionState<TOutput>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (input: TInput) => {
      setState({ data: null, error: null, isLoading: true });
      try {
        const data = await action(input);
        setState({ data, error: null, isLoading: false });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
        setState({ data: null, error: message, isLoading: false });
        return null;
      }
    },
    [action]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return { ...state, execute, reset };
}
