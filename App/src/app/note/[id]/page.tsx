'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { apiClient } from '@/lib/api-client';
import { GET_NOTES } from '@/utils/constants';
import type { GetNoteResponse, NoteItem } from '@/types';
import Loading from '@/components/Loading';

export default function NoteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<NoteItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await apiClient.get<GetNoteResponse>(`${GET_NOTES}/${id}`);
        setNote(response.data.data);
      } catch (error) {
        console.error('Error fetching note:', error);
        toast.error('Unable to load this note.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchNote();
  }, [id]);

  if (loading) return <Loading />;
  if (!note) {
    return <div className="flex min-h-screen items-center justify-center text-white">Note not found</div>;
  }

  const imageUrl = note.note_image_url || note.imageUrl;
  const pdfUrl = note.note_pdf_url || note.pdfUrl || note.fileUrl;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 text-white">
      <button type="button" onClick={() => router.back()} className="mb-6 rounded bg-gray-700 px-4 py-2">
        Back
      </button>
      <h1 className="mb-3 text-3xl font-bold">{note.title}</h1>
      <p className="mb-6 text-gray-300">{note.description}</p>
      {imageUrl && (
        <div className="relative mb-8 h-64 w-full overflow-hidden rounded-lg">
          <Image src={imageUrl} alt={note.title} fill unoptimized className="object-contain" />
        </div>
      )}
      {pdfUrl ? (
        <iframe title={`${note.title} PDF`} src={pdfUrl} className="h-[75vh] w-full rounded-lg border border-gray-700" />
      ) : (
        <p className="text-gray-400">PDF unavailable.</p>
      )}
    </main>
  );
}
