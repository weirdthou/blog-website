import { authorsApi } from '@/lib/api/authors';
import { useQuery } from '@tanstack/react-query';

export function useAuthors(page: number = 1) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['authors', page],
    queryFn: () => authorsApi.getAll(page),
  });

  return {
    authors: data?.results || [],
    totalPages: data ? Math.ceil(data.count / 12) : 0,
    isLoading,
    error,
  };
}

export function useAuthorDetail(id: string | undefined) {
  const {
    data: author,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['author', id],
    queryFn: () => (id ? authorsApi.getById(id) : null),
    enabled: !!id,
  });

  return {
    author,
    isLoading,
    error,
  };
}
