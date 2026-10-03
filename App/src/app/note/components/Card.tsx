'use client';

import Image from 'next/image';
import { DownloadFile } from '@utils/Functions';
import type { NoteCardProps } from '@Type';

const resolveAssetUrl = (...values: Array<string | undefined>) => {
  return (
    values.find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    )?.trim() ?? ''
  );
};

const Card = ({ item }: NoteCardProps) => {
  const imageUrl = resolveAssetUrl(item.note_image_url, item.imageUrl);
  const pdfUrl = resolveAssetUrl(item.note_pdf_url, item.fileUrl);

  return (
    <div
        className="h-72 lg:w-80 rounded-lg border shadow-md bg-slate-800 border-black flex flex-col items-center p-4 overflow-hidden"
      data-aos="zoom-in"
    >
      {imageUrl ? (
        <div className="relative mb-3 w-24 h-24 shrink-0 overflow-hidden rounded-md">
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      ) : (
        <div className="w-24 h-24 shrink-0" />
      )}

      <h5 className="w-full mb-2 text-base sm:text-lg font-medium text-white text-center leading-tight line-clamp-2">
        {item.title}
      </h5>

      <span className="w-full text-xs sm:text-sm text-gray-400 text-center leading-relaxed line-clamp-3 overflow-hidden">
        {item.description}
      </span>

      <div className="mt-auto w-full flex justify-center pt-3">
        <button
          type="button"
          className="text-white bg-purple-700 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer hover:bg-purple-900 text-center disabled:cursor-not-allowed disabled:opacity-50"
          onClick={(event) => {
            event.stopPropagation();

            if (pdfUrl) {
              DownloadFile(pdfUrl, item.title);
            }
          }}
          disabled={!pdfUrl}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default Card;