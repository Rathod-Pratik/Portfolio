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
            className="w-full max-w-100 mx-auto rounded-lg border  shadow-md bg-slate-800 border-black overflow-hidden"
        >
            <div className="flex flex-col items-center p-4 h-full">
                <div className="relative w-full mb-4 rounded-lg overflow-hidden">
                    <Image
                        src={item.image}
                        alt={item.title}
                        height={250}
                        width={400}
                    
                        loading="eager"
                        style={{ objectFit: 'cover' }}
                    />
                </div>


                <h5 className="mb-2 text-xl font-medium text-gray-900 dark:text-white text-center">
                    {item.title}
                </h5>

               

                <span className="text-sm text-gray-500 dark:text-gray-400 text-justify">
                    {item.subtitle.length > 125 ? `${item.subtitle.slice(0, 105)}...` : item.subtitle}
                </span>

                <div className="flex flex-row mt-4 flex-wrap justify-center gap-2">
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