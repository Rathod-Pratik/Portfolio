'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { GET_PROJECT } from '@/utils/constants';
import type { GetProjectResponse, ProjectDetail } from '@/types';
import { Loading } from '@/components';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function ProjectDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [project, setProject] = useState<ProjectDetail['data'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<GetProjectResponse>(`${GET_PROJECT}/${id}`);
        setProject(response.data.data);
      } catch (error) {
        console.error('Error fetching project details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!project) {
    return <div className="flex items-center justify-center min-h-screen">Project not found</div>;
  }

  return (
    <main className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto px-4 py-12"
      >
        {(project.image) && (
          <div className="mb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-3 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              aria-label="Go back"
            >
              <span className="text-xl leading-none">←</span>
            </button>
            <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16/8' }}>
              <Image
                src={project.image}
                alt={project.title}
                fill
                unoptimized
                loading="eager"
                sizes="(max-width: 768px) 100vw, 100vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        )}
        
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">{project.title}</h1>
        
        {project.subtitle && (
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">{project.subtitle}</p>
        )}
        
        {project.createdAt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            {new Date(project.createdAt).toLocaleDateString()}
          </p>
        )}
 <ReactMarkdown rehypePlugins={[rehypeRaw]}>
            {project.content}
        </ReactMarkdown>

       
      </motion.div>
    </main>
  );
}
