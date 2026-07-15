
const brandWords = "CCA".split("");

const Bottom = () => {
  return (
    <footer className="relative min-h-[50vh] md:min-h-[92vh] w-full overflow-x-visible overflow-y-hidden px-[clamp(14px,4vw,58px)] bg-transparent flex items-end mt-20">
      <div
        className="flex items-end justify-center gap-[clamp(0.55rem,1.2vw,1rem)] w-full max-w-[1660px] mx-auto px-[clamp(34px,6vw,130px)] translate-y-[25%]"
        aria-label="CCA word mark"
      >
        {brandWords.map((word, index) => (
          <button
            key={`${word}-${index}`}
            className="border-none bg-transparent text-white hover:text-neon p-0 m-0 cursor-pointer leading-[0.9] text-[clamp(8rem,30vw,35rem)] font-display font-bold tracking-[0.05em] whitespace-nowrap origin-bottom transition-all duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2.9rem] hover:scale-x-[0.88] hover:scale-y-[1.18]"
            type="button"
          >
            {word}
          </button>
        ))}
      </div>
    </footer>
  );
};

export default Bottom;
