'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { GET_BLOG } from '@/utils/constants';
import type { AdminBlogItem } from '@/types';
import Card from './components/Card';
import Loading from '@/components/Loading';
import { motion } from 'framer-motion';

type GetBlogsResponse = {
  blog: AdminBlogItem[];
  source: 'cache' | 'database';
};

export default function Blog() {
  const [blogs, setBlogs] = useState<AdminBlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const limit = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        const response = await apiClient.get<GetBlogsResponse>(
          `${GET_BLOG}?page=${page}&limit=${limit}`
        );
        const nextBlogs = response.data.blog || [];
        setBlogs((currentBlogs) =>
          page === 1 ? nextBlogs : [...currentBlogs, ...nextBlogs],
        );
        setHasMore(nextBlogs.length === limit);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchData();
  }, [page]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (!loadMoreElement || loading || loadingMore || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage((currentPage) => currentPage + 1);
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [blogs.length, hasMore, loading, loadingMore]);

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="min-h-screen flex flex-col py-4">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="text-3xl font-bold text-center my-10 sm:hidden">
        Blogs
      </motion.h2>
      <div className="w-full px-2 sm:px-4">
        {blogs.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-12">No blogs available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(420px,1fr))] gap-4 lg:gap-6 justify-items-center">
            {blogs.map((blog, index) => (
              <motion.div
                key={blog._id || index}
                className="w-full flex justify-center"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card item={blog} />
              </motion.div>
            ))}
          </div>
        )}
        {hasMore && (
          <div ref={loadMoreRef} className="flex min-h-16 items-center justify-center py-6">
            {loadingMore && (
              <span className="text-sm text-gray-400">Loading more blogs...</span>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
