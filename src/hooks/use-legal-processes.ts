import useSWR from 'swr';
import type { LegalProcess } from '@/types/legal';

interface LegalProcessesResponse {
  processes: LegalProcess[];
  count: number;
}

const fetcher = async (url: string): Promise<LegalProcessesResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return res.json();
};

interface UseLegalProcessesReturn {
  processes: LegalProcess[];
  isLoading: boolean;
  isError: boolean;
  mutate: ReturnType<typeof useSWR<LegalProcessesResponse>>['mutate'];
}

export function useLegalProcesses(): UseLegalProcessesReturn {
  const { data, error, isLoading, mutate } = useSWR<LegalProcessesResponse>(
    '/api/legal/processes',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    processes: data?.processes ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
