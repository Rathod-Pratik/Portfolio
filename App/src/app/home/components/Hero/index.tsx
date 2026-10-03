'use client';

import { Button } from "@components";
import Typewriter from "typewriter-effect";
import type { HeroProps } from "@Type";
import Image from "next/image";
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const leftItemVariants = {
  hidden: { opacity: 0, x: -60 },
  show: { opacity: 1, x: 0 },
};

const rightItemVariants = {
  hidden: { opacity: 0, x: 60 },
  show: { opacity: 1, x: 0 },
};

const Hero = ({ data }: HeroProps) => {
  return (
    <section className="w-[90vw] m-auto overflow-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="container flex flex-col-reverse justify-center p-6 mx-auto sm:py-12 lg:py-24 lg:flex-row lg:justify-between"
      >
        <motion.div
          variants={leftItemVariants}
          className="flex flex-col justify-center p-6 text-center rounded-sm lg:max-w-md xl:max-w-lg lg:text-left"
        >
          <span className="text-5xl block">{data.greeting}</span>
          <span className="mt-2 block text-3xl font-semibold text-white">
            {data.name}
          </span>
          <span className="text-purple-500 text-5xl mt-2 block min-h-15 whitespace-normal sm:whitespace-nowrap">
            <Typewriter
              options={{
                delay: 75,
                strings: data.roles,
                autoStart: true,
                loop: true,
              }}
            />
          </span>
          <span className="mt-6 mb-8 text-lg sm:mb-12">
            {data.description}
          </span>
          <div className="flex flex-col space-y-4 sm:items-center sm:justify-center sm:flex-row sm:space-y-0 sm:space-x-4 lg:justify-start pt-2">
            <Button text={"Contact Me"} />
          </div>
        </motion.div>
        <motion.div
          variants={rightItemVariants}
          className="flex items-center justify-center p-6 mt-8 lg:mt-0"
        >
          {data.image ? (
            <div className="relative h-64 w-64 overflow-hidden rounded-full sm:h-72 sm:w-72 lg:h-80 lg:w-80 xl:h-96 xl:w-96">
              <Image
                src={data.image}
                alt="Hero Avatar"
                fill
                unoptimized
                loading="eager"
                sizes="(max-width: 640px) 256px, (max-width: 1024px) 288px, 384px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-64 w-64 rounded-full bg-slate-800 sm:h-72 sm:w-72 lg:h-80 lg:w-80 xl:h-96 xl:w-96" />
          )}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
