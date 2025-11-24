import { ArticleActions } from '@/components/articles/ArticleActions';
import Layout from '@/components/layout/Layout';
import CommentsEnhanced from '@/components/SingleBlog/CommentsEnhanced';
import RelatedArticles from '@/components/SingleBlog/RelatedArticles';
import SocialShare from '@/components/SingleBlog/SocialShare';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useArticleDetail } from '@/hooks/use-article-detail';
import { articlesApi } from '@/lib/api/articles';
import { getAvatarUrl } from '@/lib/utils/avatar';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ArticleSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="w-full h-96 rounded-lg" />
    <Skeleton className="w-3/4 h-12" />
    <div className="flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="w-32 h-6" />
      <Skeleton className="w-48 h-6" />
    </div>
    <div className="space-y-4">
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-full h-4" />
    </div>
  </div>
);

const SingleBlogPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [displayViews, setDisplayViews] = useState(0);
  const queryClient = useQueryClient();

  const { article, isLoading, error, relatedArticles, isLoadingRelated } =
    useArticleDetail(slug);

  const handleCommentsUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['article', slug] });
  };

  // Update display views when article is loaded
  useEffect(() => {
    if (article?.views !== undefined) {
      setDisplayViews(article.views + 1);
    }
  }, [article?.views]);

  // Increment view count when article is loaded
  useEffect(() => {
    if (article?.id) {
      articlesApi.incrementViews(article.id).catch(console.error);
    }
  }, [article?.id]);

  useEffect(() => {
    if (error) {
      navigate('/not-found');
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container-newspaper py-12">
          <article className="max-w-4xl mx-auto">
            <ArticleSkeleton />
          </article>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return null;
  }

  const shareUrl = window.location.href;

  return (
    <Layout>
      <div className="container-newspaper py-12">
        <article className="max-w-4xl mx-auto">
          {article.featured_image && (
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-96 object-cover rounded-lg mb-8"
            />
          )}

          <h1 className="text-4xl font-serif font-bold mb-4 text-gray-900 dark:text-gray-100">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 mb-8 text-newspaper-muted dark:text-gray-400">
            {article.author && (
              <div className="flex items-center gap-2">
                <img
                  src={getAvatarUrl(article.author.avatar, article.author.name)}
                  alt={article.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {article.author.name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-gray-600 dark:text-gray-400">
                {new Date(article.publish_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-gray-600 dark:text-gray-400">
                {displayViews} views
              </span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              {article.reading_time} min read
            </span>
          </div>

          <div
            className="article-content mb-8"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Article Actions - Like, Dislike, Bookmark */}
          <ArticleActions article={article} />

          <div className="flex flex-wrap gap-2 mb-8">
            {article.categories?.map((category) => (
              <span key={category.id} className="category-badge">
                {category.name}
              </span>
            ))}
          </div>

          <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-xl font-serif font-bold mb-4 text-gray-900 dark:text-gray-100">
                Share This Article
              </h3>
              <SocialShare title={article.title} url={shareUrl} />
            </CardContent>
          </Card>

          {!isLoadingRelated && relatedArticles && (
            <Card className="mb-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <RelatedArticles articles={relatedArticles} />
              </CardContent>
            </Card>
          )}

          <CommentsEnhanced
            articleId={article.id}
            comments={article.comments || []}
            onCommentsUpdate={handleCommentsUpdate}
          />
        </article>
      </div>
    </Layout>
  );
};

export default SingleBlogPage;
