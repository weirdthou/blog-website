import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  featured_image?: string | null;
  parent?: number | null;
  article_count?: number;
  children?: any;
}

interface BlogCardProps {
  id: string | number;
  slug: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    id: string | number;
    avatar?: string;
  };
  date: string | null;
  thumbnail?: string | null;
  category: Category | null;
  views?: number;
}

const BlogCard = ({
  slug,
  title,
  excerpt,
  author,
  date,
  thumbnail,
  category,
  views = 0,
}: BlogCardProps) => {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Draft';

  return (
    <article className="article-card">
      <div className="flex flex-col md:flex-row gap-4">
        {thumbnail && (
          <div className="md:w-1/4">
            <Link to={`/blog/${slug}`}>
              <img
                src={thumbnail}
                alt={title}
                className="w-full h-32 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.jpg';
                }}
              />
            </Link>
          </div>
        )}
        <div className={thumbnail ? 'md:w-3/4' : 'w-full'}>
          {category && (
            <Link to={`/category/${category.slug}`}>
              <span className="category-badge inline-block mb-2">
                {category.name}
              </span>
            </Link>
          )}
          <Link to={`/blog/${slug}`}>
            <h2 className="article-title">{title}</h2>
          </Link>
          <div className="article-meta">
            By{' '}
            <Link
              to={`/author/${author.id}`}
              className="font-medium hover:text-newspaper-accent"
            >
              {author.name}
            </Link>{' '}
            • {formattedDate}
            {views > 0 && (
              <>
                {' • '}
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {views} views
                </span>
              </>
            )}
          </div>
          <p className="article-excerpt">{excerpt}</p>
          <Link
            to={`/blog/${slug}`}
            className="text-newspaper-accent font-medium hover:underline"
          >
            Read More
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
