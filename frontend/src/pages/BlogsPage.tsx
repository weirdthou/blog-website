import BlogCard from '@/components/blog/BlogCard';
import Filters from '@/components/blog/Filters';
import SearchBar from '@/components/blog/SearchBar';
import Sidebar from '@/components/blog/Sidebar';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { articlesApi } from '@/lib/api/articles';
import { categoriesApi } from '@/lib/api/categories';
import { tagsApi } from '@/lib/api/tags';
import { useQuery } from '@tanstack/react-query';
import { Filter } from 'lucide-react';
import { useRef, useState } from 'react';

const BlogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: articlesData, isLoading: loadingArticles } = useQuery({
    queryKey: [
      'articles',
      currentPage,
      selectedCategory,
      selectedDateFilter,
      selectedSort,
      searchTerm,
    ],
    queryFn: () =>
      articlesApi.getAll({
        page: currentPage,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm || undefined,
        ordering:
          selectedSort === 'latest'
            ? '-publish_date'
            : selectedSort === 'oldest'
            ? 'publish_date'
            : selectedSort === 'popularity'
            ? '-views'
            : undefined,
        date_from: getDateFromFilter(selectedDateFilter),
      }),
  });

  const { data: recentArticles } = useQuery({
    queryKey: ['recent-articles'],
    queryFn: () => articlesApi.getLatest(),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
  });

  const getDateFromFilter = (filter: string) => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case 'this-week': {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        return firstDay.toISOString();
      }
      case 'this-month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'this-year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return undefined;
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (filter: string) => {
    setSelectedDateFilter(filter);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
    setCurrentPage(1);
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderArticleSkeleton = () => (
    <div className="flex flex-col md:flex-row gap-6">
      <Skeleton className="md:w-1/4 h-48" />
      <div className="md:w-3/4 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );

  const FilterDrawerContent = () => (
    <div className="p-4 space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Search</h3>
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search articles by title or content..."
          value={searchTerm}
        />
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Filters</h3>
        <Filters
          onCategoryChange={handleCategoryChange}
          onDateFilterChange={handleDateFilterChange}
          onSortChange={handleSortChange}
          selectedCategory={selectedCategory}
          selectedDateFilter={selectedDateFilter}
          selectedSort={selectedSort}
          categories={categories?.results || []}
          tags={tags?.results || []}
        />
      </div>
    </div>
  );

  return (
    <Layout>
      <div ref={contentRef} className="container-newspaper py-12">
        <h1 className="text-4xl font-serif font-bold mb-8 text-center">
          Our Articles
        </h1>

        {!isMobile && (
          <>
            <div className="mb-8">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search articles by title or content..."
                value={searchTerm}
              />
            </div>

            <div className="mb-8">
              <Filters
                onCategoryChange={handleCategoryChange}
                onDateFilterChange={handleDateFilterChange}
                onSortChange={handleSortChange}
                selectedCategory={selectedCategory}
                selectedDateFilter={selectedDateFilter}
                selectedSort={selectedSort}
                categories={categories?.results || []}
                tags={tags?.results || []}
              />
            </div>
          </>
        )}

        {isMobile && (
          <div className="mb-8">
            <Drawer
              open={isFilterDrawerOpen}
              onOpenChange={setIsFilterDrawerOpen}
            >
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Filter size={16} />
                  <span>Filters & Search</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh] overflow-y-auto">
                <DrawerHeader>
                  <DrawerTitle className="text-center">
                    Filters & Search
                  </DrawerTitle>
                </DrawerHeader>
                <FilterDrawerContent />
              </DrawerContent>
            </Drawer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {loadingArticles ? (
              <div className="space-y-8">
                {Array(5)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i}>{renderArticleSkeleton()}</div>
                  ))}
              </div>
            ) : articlesData?.results?.length > 0 ? (
              <>
                <div className="space-y-8">
                  {articlesData.results.map((article) => (
                    <BlogCard
                      key={article.id}
                      id={article.id}
                      slug={article.slug}
                      title={article.title}
                      excerpt={article.excerpt}
                      author={{
                        id: article.author_detail.id,
                        name: article.author_detail.name,
                      }}
                      date={article.publish_date}
                      thumbnail={article.featured_image}
                      category={article.categories_detail[0] || null}
                      views={article.views}
                    />
                  ))}
                </div>

                {articlesData.count > 0 && (
                  <div className="mt-8">
                    <Pagination>
                      <PaginationContent>
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => paginate(currentPage - 1)}
                              className="cursor-pointer"
                            />
                          </PaginationItem>
                        )}

                        {Array.from(
                          { length: Math.ceil(articlesData.count / 10) },
                          (_, i) => i + 1
                        ).map((number) => (
                          <PaginationItem key={number}>
                            <PaginationLink
                              onClick={() => paginate(number)}
                              isActive={currentPage === number}
                              className="cursor-pointer"
                            >
                              {number}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        {currentPage < Math.ceil(articlesData.count / 10) && (
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => paginate(currentPage + 1)}
                              className="cursor-pointer"
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-newspaper-muted text-lg">
                  No articles found matching your criteria.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Sidebar
              recentPosts={
                recentArticles?.results?.map((article) => ({
                  id: article.id,
                  slug: article.slug,
                  title: article.title,
                  date: article.publish_date,
                })) || []
              }
              tags={
                tags?.results?.map((tag) => ({
                  id: tag.id,
                  name: tag.name,
                  count: tag.article_count,
                })) || []
              }
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BlogsPage;
