import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/use-categories';
import { Link } from 'react-router-dom';

interface SidebarProps {
  recentPosts: {
    id: string;
    slug: string;
    title: string;
    date: string;
  }[];
  tags: {
    id: string;
    name: string;
    count: number;
  }[];
}

const Sidebar = ({ recentPosts, tags }: SidebarProps) => {
  const { categories, isLoading: loadingCategories } = useCategories();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-serif">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="hover:text-newspaper-accent transition-colors"
                >
                  <h3 className="font-medium font-serif text-xl">
                    {post.title}
                  </h3>
                  <p className="text-sm text-newspaper-muted">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-serif">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCategories ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/category/${category.slug}`}
                    className="hover:text-newspaper-accent transition-colors flex justify-between items-center group"
                  >
                    <span>{category.name}</span>
                    <span className="text-newspaper-muted text-sm group-hover:text-newspaper-accent">
                      ({category.article_count})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-serif">Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tag/${tag.id}`}
                className="category-badge"
              >
                {tag.name} ({tag.count})
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;
