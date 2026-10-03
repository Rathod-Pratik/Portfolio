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
        {(project.image || project.images) && (
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
                src={project.image || project.images}
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

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Description</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {project.description}
          </p>
        </div>

        {project.techStack && project.techStack.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Tech Stack</h2>
            <div className="flex gap-2 flex-wrap">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-4 py-2 rounded-lg"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {project.features && project.features.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              {project.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        {project.liveDemoLink && (
          <div className="mb-8">
            <a
              href={project.liveDemoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View Live Demo
            </a>
          </div>
        )}
      </motion.div>
    </main>
  );
}
