'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { AdminBlogItem } from '@/types';

interface CardProps {
  item: AdminBlogItem;
}

const Card: React.FC<CardProps> = ({ item }) => {
  const coverImage = (item.image)?.trim() ?? '';

  return (
    <article className="group relative flex w-full max-w-105 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-xl">
      <Link href={`/blog/${item._id}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-black/20">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-900 to-slate-700 text-sm text-white/60">
              No image available
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-black/0 to-transparent" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {/* {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase opacity-90"
                title={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        )} */}

        <h3 className="text-lg font-semibold leading-snug">
          <Link
            href={`/blog/${item._id}`}
            className="outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-indigo-400/60"
          >
            {item.title}
          </Link>
        </h3>

        <p className="text-sm/6 text-white/80">
          {item.excerpt && item.excerpt.length > 120
            ? item.excerpt.substring(0, 120) + '...'
            : item.excerpt}
        </p>

        {item.createdAt && (
          <time
            dateTime={item.createdAt}
            className="text-xs text-white/50"
          >
            {new Date(item.createdAt).toLocaleDateString()}
          </time>
        )}

        <div className="mt-auto" />

        <div className="flex items-center justify-between pt-2">
          <Link
            href={`/blog/${item._id}`}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-3 py-1.5 text-sm font-medium opacity-90 transition hover:opacity-100"
          >
            Read more
          </Link>
        </div>
      </div>
    </article>
  );
};

export default Card;