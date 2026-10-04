'use client';

import type { ProjectCardProps } from '@Type';
import Image from 'next/image';

type ProjectCardExtraProps = ProjectCardProps & {
    routerPush: (href: string) => void;
};

const Card = ({ item, routerPush }: ProjectCardExtraProps) => {
    const RedirectToProject = (_id: string) => {
        routerPush(`/project/${_id}`);
    };

    return (
        <div
            data-aos="fade-up"
            className="w-full max-w-105 mx-auto h-106.25 rounded-lg border  shadow-md bg-slate-800 border-black overflow-hidden"
        >
            <div className="flex flex-col items-center p-6 h-full">
                <div className="relative w-full h-44 mb-4 rounded-lg overflow-hidden">
                    <Image
                        src={item.image || item.images}
                        alt={item.title}
                        layout="fill"
                        loading="eager"
                        style={{ objectFit: 'cover' }}
                    />
                </div>


                <h5 className="mb-2 text-xl font-medium text-gray-900 dark:text-white text-center">
                    {item.title}
                </h5>

                {item.techStack?.length ? (
                    <div className="mb-3 flex flex-wrap justify-center gap-2">
                        {item.techStack.map((tech) => (
                            <span
                                key={tech}
                                className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200 shadow-sm"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                ) : null}

                <span className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {item.description.length > 70 ? `${item.description.slice(0, 70)}...` : item.description}
                </span>

                <div className="flex flex-row mt-4 flex-wrap justify-center gap-2">
                    {item.liveDemoLink && (
                        <a
                            className="inline-block text-white bg-purple-700 rounded-full px-3 py-2 text-sm font-semibold cursor-pointer hover:bg-purple-900 text-center"
                            href={item.liveDemoLink}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Demo
                        </a>
                    )}
                    <button
                        type="button"
                        className="inline-block text-white bg-purple-700 rounded-full px-3 py-2 text-sm font-semibold cursor-pointer hover:bg-purple-900 text-center"
                        onClick={() => RedirectToProject(item._id)}
                    >
                        Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Card;