import Image from 'next/image';
import type { ServicesProps } from "@Type";

const Services = ({ data }: ServicesProps) => {
  if (data.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-6 lg:px-10 py-16">
      {/* Heading */}
      <div className="text-center max-w-3xl mx-auto">
        <h1
          data-aos="fade-down"
          className="text-purple-500 text-lg sm:text-xl font-semibold tracking-wide uppercase"
        >
          My Expertise
        </h1>

        <h2
          data-aos="fade-down"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 leading-tight"
        >
          Provide Wide Range of
          <span className="block text-purple-400">Digital Services</span>
        </h2>
      </div>

      {/* Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 mt-14"
        data-aos="fade-up"
      >
        {data.map((exp, index) => (
          <div
            key={exp._id || index}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#111827] to-[#1f2937] p-6 sm:p-8 shadow-lg transition-all duration-500 hover:-translate-y-2 hover:border-purple-500/40 hover:shadow-purple-500/20"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-purple-500/10 blur-3xl" />

            {/* Image */}
            <div className="relative z-10 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 rounded-full" />

                {exp.image ? (
                  <Image
                    className="relative w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-white/10"
                    src={exp.image}
                    alt={exp.title}
                    width={112}
                    height={112}
                    unoptimized
                    loading="eager"
                  />
                ) : (
                  <div className="relative h-24 w-24 rounded-2xl border border-white/10 bg-slate-800 sm:h-28 sm:w-28" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center mt-6">
              <h3 className="text-white text-xl sm:text-2xl font-bold">
                {exp.title}
              </h3>

              <p className="text-gray-400 text-sm sm:text-base leading-7 mt-4 line-clamp-4">
                {exp.description}
              </p>
            </div>

            {/* Bottom Accent */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-purple-500 transition-all duration-500 group-hover:w-full" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;