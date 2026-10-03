'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { GET_NOTES } from '@/utils/constants';
import type { GetNotesResponse, NoteItem } from '@/types';
import Card from './components/Card';
import Loading from '@/components/Loading';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

export default function Note() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
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
        const response = await apiClient.get<GetNotesResponse>(
          `${GET_NOTES}?page=${page}&limit=${limit}`
        );
        const payload = response.data.data;
        const nextNotes = Array.isArray(payload) ? payload : payload.notes || [];

        setNotes((currentNotes) =>
          page === 1 ? nextNotes : [...currentNotes, ...nextNotes],
        );
        setHasMore(
          Array.isArray(payload)
            ? nextNotes.length === limit
            : payload.page < payload.totalPages,
        );
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast.error('Some error occurred, try again later.');
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
  }, [hasMore, loading, loadingMore, notes.length]);

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="min-h-screen flex flex-col py-4">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="text-3xl font-bold text-center my-6 block sm:hidden">
        Notes
      </motion.h2>
      <div className="w-full px-2 sm:px-4">
        {notes.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-12">No notes available</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 sm:gap-8 lg:gap-10 px-2 sm:px-4">
            {notes.map((note, index) => (
              <motion.div
                key={note._id || index}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                  <Card item={note} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {notes.length > 0 && hasMore && (
        <div ref={loadMoreRef} className="flex min-h-16 items-center justify-center py-6">
          {loadingMore && (
            <span className="text-sm text-gray-400">Loading more notes...</span>
          )}
        </div>
      )}
    </main>
  );
}
