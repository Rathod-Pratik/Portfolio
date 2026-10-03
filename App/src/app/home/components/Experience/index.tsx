import type { ExperienceProps } from "@Type";

const Experience = ({ data }: ExperienceProps) => {
  if (data.length === 0) return null;

  return (
    <div className="p-4 md:p-8 lg:px-20 lg:py-16  mx-auto">
      <h2
        className="text-4xl font-serif md:font-sans font-bold text-white mb-12 sm:mb-16 ml-4 sm:ml-44"
        data-aos="fade-down"
      >
        Experience
      </h2>

      <div className="flex flex-col">
        {data.map((exp, index) => (
          <div key={index} className="flex relative">
            <div className="hidden sm:flex w-44 justify-end pr-8 pt-1 relative">
              <div
                className="bg-gray-600 text-gray-200 px-4 py-1.5 text-sm font-bold h-fit relative z-10"
                style={{
                  clipPath:
                    "polygon(0% 0%, 80% 0%, 100% 50%, 80% 100%, 0% 100%)",
                  paddingRight: "24px",
                }}
                data-aos="fade-right"
              >
                {exp.year}
              </div>
            </div>

            <div className="flex flex-col items-center mr-6 sm:mr-8 relative mt-1 sm:mt-0">
              <div className="w-5 h-5 rounded-full bg-[#fca61f] shadow-[0_0_15px_rgba(252,166,31,0.8)] mt-1.5 z-10"></div>
              {index !== data.length - 1 && (
                <div className="absolute top-8 -bottom-10 w-0.5 bg-gray-400"></div>
              )}
            </div>

            <div className="flex-1 pb-16" data-aos="fade-left">
              <h3 className="text-2xl font-bold text-white mb-1">
                {exp.title}
              </h3>
              {exp.duration && (
                <p className="text-sm text-blue-400 mb-2 font-medium">
                  {exp.duration}
                </p>
              )}
              <p className="text-[17px] text-gray-300 mb-4">{exp.company}</p>
              <p className="text-gray-400 text-sm md:text-[15px] leading-relaxed max-w-3xl">
                {exp.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Experience;
