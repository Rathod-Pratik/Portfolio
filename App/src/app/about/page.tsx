'use client';

import { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { GET_ABOUT } from '@/utils/constants';
import ReactMarkdown from 'react-markdown';
import Loading from '@/components/Loading';
import { motion } from 'framer-motion';
import MarkDown from './components/MarkDown';

type AboutResponse = {
  data: {
    content: string;
  };
  source: 'cache' | 'database';
};

export default function About() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<AboutResponse>(GET_ABOUT);
        setContent(response.data.data.content || '');
      } catch (error) {
        const apiError = error as AxiosError;

        if (apiError.response?.status === 404) {
          setContent('');
          return;
        }

        console.error('Error fetching about data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto px-4 py-12"
      >
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-4xl font-bold mb-8 text-gray-900 dark:text-white"
        >
          About Me
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="prose dark:prose-invert max-w-none"
        >
          <ReactMarkdown components={MarkDown}>{content}</ReactMarkdown>
        </motion.div>
      </motion.div>
    </main>
  );
}
