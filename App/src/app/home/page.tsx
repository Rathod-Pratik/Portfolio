'use client';

import { apiClient } from '@/lib/api-client';
import { GET_CV, GET_HERO, GET_EXPERTISE, GET_EXPERIENCE, GET_SKILL } from '@/utils/constants';
import type { Hero as HeroType, Services, ExperienceItem, SkillItem, ResumeFile } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { INCREMENT_VIEW_URL } from '@/utils/constants';
import { Contact, Experience, Hero, Service, Skills } from './components';
import { Loading } from '@/components';
import { motion } from 'framer-motion';

const Home = () => {
  useEffect(() => {
    const viewTracked = sessionStorage.getItem('portfolio-view-tracked');

    if (viewTracked) {
      return;
    }

    sessionStorage.setItem('portfolio-view-tracked', 'pending');

    const trackView = async () => {
      try {
        await apiClient.put<{ message: string; view: number }>(
          INCREMENT_VIEW_URL,
          undefined,
          { headers: { Accept: 'application/json' } },
        );
        sessionStorage.setItem('portfolio-view-tracked', 'true');
      } catch (error) {
        sessionStorage.removeItem('portfolio-view-tracked');
        console.error('Failed to increment portfolio view', error);
      }
    };

    void trackView();
  }, []);

  const heroQuery = useQuery({
    queryKey: ["home", "hero"],
    queryFn: async () => {
      const response = await apiClient.get(GET_HERO);
      return response.data.data;
    },
  });

  const expertiseQuery = useQuery<Services["data"]>({
    queryKey: ["home", "expertise"],
    queryFn: async () => {
      const response = await apiClient.get(
        `${GET_EXPERTISE}/?page=1&limit=10`
      );
      return response.data.data;
    },
  });

  const experienceQuery = useQuery({
    queryKey: ["home", "experience"],
    queryFn: async () => {
      const response = await apiClient.get(
        `${GET_EXPERIENCE}/?page=1&limit=10`
      );
      return response.data.data;
    },
  });

  const skillsQuery = useQuery({
    queryKey: ["home", "skills"],
    queryFn: async () => {
      const response = await apiClient.get(`${GET_SKILL}?page=1&limit=20`);
      return response.data.data;
    },
  });

  const resumeQuery = useQuery({
    queryKey: ["home", "resume-download-url"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ success: boolean; data: string }>(GET_CV);
        return res.data.data ?? null;
      } catch (err) {
        console.error("Failed to fetch resume URL", err);
        return null;
      }
    },
  });

  const loading =
    heroQuery.isLoading ||
    expertiseQuery.isLoading ||
    experienceQuery.isLoading ||
    skillsQuery.isLoading;

  const heroData: HeroType =
    heroQuery.data ?? {
      greeting: "",
      name: "",
      roles: [],
      description: "",
      image: "",
    };
  const expertiseData: Services["data"] = expertiseQuery.data ?? [];
  const experiences: ExperienceItem[] = experienceQuery.data ?? [];
  const resumeFile: ResumeFile = resumeQuery.data ?? null;
  const skillsData: SkillItem[] = skillsQuery.data ?? [];

  if (loading) {
    return <Loading />;
  }
  

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Hero data={heroData} />
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45 }}>
        <Service data={expertiseData} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45 }}>
        <Experience data={experiences} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45 }}>
        <Skills resumeFile={resumeFile} data={skillsData} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45 }}>
        <Contact />
      </motion.div>
    </motion.div>
  );
};

export default Home;
