import { articlesApi } from '@/lib/api/articles';
import { useQuery } from '@tanstack/react-query';

export const useArticleDetail = (slug: string | undefined) => {
  const {
    data: article,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => (slug ? articlesApi.getBySlug(slug) : null),
    enabled: !!slug,
  });

  const { data: relatedArticles, isLoading: isLoadingRelated } = useQuery({
    queryKey: ['relatedArticles', article?.id],
    queryFn: () => (article ? articlesApi.getRelated(article.id) : []),
    enabled: !!article?.id,
  });

  return {
    article,
    isLoading,
    error,
    relatedArticles,
    isLoadingRelated,
  };
};
