'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { GET_BLOG_DETAILS } from '@/utils/constants';
import type { BlogDetail } from '@/types';
import ReactMarkdown, { type Components } from 'react-markdown';
import Loading from '@/components/Loading';
import { motion } from 'framer-motion';

export default function BlogDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ data: BlogDetail; source: 'cache' | 'database' }>(
          `${GET_BLOG_DETAILS}/${id}`
        );
        setBlog(response.data.data);
      } catch (error) {
        console.error('Error fetching blog details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!copiedCode) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopiedCode('');
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [copiedCode]);

  const markdownComponents: Components = {
    h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-8 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold text-white mt-6 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold text-white mt-5 mb-2">{children}</h3>,
    p: ({ children }) => <p className="text-gray-300 leading-7 mb-4">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 text-gray-300">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 text-gray-300">{children}</ol>,
    li: ({ children }) => <li className="mb-1">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 my-4">
        {children}
      </blockquote>
    ),
    code: ({ className, children }) => {
      const isBlock = Boolean(className);
      const codeString = String(children).replace(/\n$/, '');

      if (isBlock) {
        return (
          <div className="my-6 rounded overflow-hidden relative">
            <div className="absolute top-2 right-2 z-10">
              <button
                type="button"
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText(codeString);
                    setCopiedCode(codeString);
                  } catch (error) {
                    console.error('Copy failed', error);
                  }
                }}
                className={`cursor-pointer px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  copiedCode === codeString
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-800/80 hover:bg-gray-700 text-gray-200'
                }`}
                aria-label="Copy code"
              >
                {copiedCode === codeString ? 'Copied' : 'Copy'}
              </button>
            </div>

            <code className="block bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-gray-700">
              {children}
            </code>
          </div>
        );
      }

      return (
        <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-pink-400 font-mono">
          {children}
        </code>
      );
    },
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 underline">
        {children}
      </a>
    ),
    hr: () => <hr className="border-gray-700 my-8" />,
  };

  if (loading) {
    return <Loading />;
  }

  if (!blog) {
    return <div className="flex items-center justify-center min-h-screen">Blog not found</div>;
  }

  return (
    <main className="min-h-screen py-6 sm:py-10 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto"
      >
        {(blog.image ?? blog.coverImage) && (
          <div className="mb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-3 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              aria-label="Go back"
            >
              <span className="text-xl leading-none">←</span>
            </button>
            <div className="relative w-full overflow-hidden rounded-md aspect-video">
              <Image
                src={blog.image ?? blog.coverImage ?? ''}
                alt={blog.title}
                fill
                unoptimized
                loading="eager"
                sizes="(max-width: 768px) 100vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        )}
        
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 text-center">
          {blog.title}
        </h1>
        
        {blog.author && (
          <p className="text-sm text-gray-400 mb-4 text-center">By {blog.author}</p>
        )}
        
        {blog.createdAt && (
          <p className="text-sm text-gray-400 mb-8 text-center">
            {new Date(blog.createdAt).toLocaleDateString()}
          </p>
        )}

        {blog.excerpt && (
          <p className="text-gray-300 text-base leading-7 mb-6 text-center">
            {blog.excerpt}
          </p>
        )}

        {blog.tags && blog.tags.length > 0 && (
          <div className="flex justify-center flex-wrap gap-2 mb-6">
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {blog.content && (
          <article className="markdown-body">
            <ReactMarkdown components={markdownComponents}>
              {blog.content}
            </ReactMarkdown>
          </article>
        )}
      </motion.div>
    </main>
  );
}
