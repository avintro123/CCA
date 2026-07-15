import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import NeonButton from "../components/NeonButton";
import Bottom from "../components/bottom";
import MatchCountdown from "../components/MatchCountdown";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Importing local images
import img0 from "../assets/img0.jpg";
import img1 from "../assets/img1.jpg";
import img2 from "../assets/img2.jpg";
import img3 from "../assets/img3.jpg";
import norm0 from "../assets/norm0.jpeg";
import norm1 from "../assets/norm1.jpg";
import norm2 from "../assets/norm2.jpg";
import norm3 from "../assets/norm3.jpg";
import norm4 from "../assets/norm4.png";
import norm5 from "../assets/norm5.jpg";
import norm6 from "../assets/norm6.jpg";

gsap.registerPlugin(ScrollTrigger);

const SLIDE_IMAGES = [img0, img1, img2, img3];

// We map out the 11 grid items translating the tobacco clone's random grid to our exact unified theme.
const GRID_IMAGES = [
  { src: img0, r: 1, c: 2, z: 2 },
  { src: img1, r: 1, c: 4, z: 5 },
  { src: img2, r: 3, c: 3, z: 1 },
  { src: img3, r: 2, c: 1, z: 6 },
  { src: norm0, r: 5, c: 3, z: 3 },
  { src: norm1, r: 6, c: 2, z: 4 },
  { src: norm2, r: 8, c: 1, z: 2 },
  { src: norm3, r: 11, c: 4, z: 7 },
  { src: norm5, r: 13, c: 1, z: 1 },
  { src: norm6, r: 15, c: 3, z: 5 },
  { src: norm4, r: 17, c: 2, z: 3 },
];

export default function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Refs
  const contRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Hero Text Wave Animation
    gsap.fromTo(
      ".wave-char",
      { y: 60, opacity: 0, rotateX: -90 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: "back.out(1.7)",
        delay: 0.2,
      },
    );
    // Paragraph Cascade
    gsap.fromTo(
      ".hero-p",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, delay: 1, ease: "power2.out" },
    );
    // Button Pop
    gsap.fromTo(
      ".hero-btn",
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        delay: 1.5,
        ease: "elastic.out(1, 0.5)",
      },
    );
  }, []);

  // Auto-play Slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // GSAP ScrollTrigger 1: Middle Image Expand Animation
  useEffect(() => {
    if (!imgRef.current || !contRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgRef.current,
        {
          filter: "brightness(0.3)",
          scale: 1.6,
          transformOrigin: "center center",
        },
        {
          filter: "brightness(0.85)",
          scale: 1.1,
          scrollTrigger: {
            trigger: contRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        },
      );

      gsap.fromTo(
        ".wave-char-about",
        { y: 60, opacity: 0, rotateX: -90 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.05,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: contRef.current,
            start: "top center",
          },
        },
      );

      gsap.fromTo(
        ".about-p",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: contRef.current,
            start: "top center-=150",
          },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  // GSAP ScrollTrigger 2: Grid Scatter/Gather Animation
  useEffect(() => {
    if (!gridContainerRef.current) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".grid-img-item");

      items.forEach((item) => {
        const random = gsap.utils.random(-1, 1);
        const itemrect = item.getBoundingClientRect();
        const parent = item.parentElement?.getBoundingClientRect();

        let xoffset = 0;
        let yoffset = 0;
        if (parent) {
          xoffset =
            parent.width / 2 -
            (itemrect.left - parent.left + itemrect.width / 2);
          yoffset = parent.top - itemrect.top + 1200;
        }

        let firstdone = false;

        gsap.set(item, {
          transformOrigin: `${random < 0 ? "left" : "right"}`,
          x: xoffset,
          y: yoffset,
          rotation: gsap.utils.random(-15, 15),
        });

        ScrollTrigger.refresh();

        gsap.to(item, {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 1.3,
          scrollTrigger: {
            trigger: ".images-grid-container",
            start: "top+=800 center",
            end: "top+=1300 center",
            onLeave: () => {
              firstdone = true;
              ScrollTrigger.refresh();
            },
          },
        });

        gsap.to(item, {
          scale: 0,
          scrollTrigger: {
            trigger: item,
            start: "top top",
            end: "bottom top",
            scrub: true,
            onRefresh: () => {
              if (!firstdone) return false;
            },
          },
        });
      });
    }, gridContainerRef); // Scoped to exactly just this container!

    return () => ctx.revert();
  }, []);

  return (
    <div className="gradient-mesh-hero -mx-6 px-6">
      <div className="max-w-7xl mx-auto pt-6 px-6">
        <MatchCountdown />
      </div>
      {/* 1. Hero Slideshow Section */}
      <div className="relative w-full h-[80vh] rounded-3xl overflow-hidden shadow-2xl border border-dark-border mt-4">
        {SLIDE_IMAGES.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={img}
              alt={`Town Ground Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent"></div>
          </div>
        ))}

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-16 px-6 text-center perspective-[1000px] overflow-hidden">
          <NeonButton
            onClick={() => navigate("/live")}
            variant="secondary"
            className="hero-btn text-2xl py-4 px-10 mb-6 animate-pulse backdrop-blur-md bg-white/10 text-white border border-white/20 hover:bg-white/20 shadow-xl"
          >
            Live Matches
          </NeonButton>
          <h1 className="text-6xl md:text-8xl font-bold font-display text-white mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex flex-wrap justify-center overflow-hidden py-2 gap-[1px]">
            {"Welcome to ".split("").map((char, i) => (
              <span
                key={`w-${i}`}
                className="inline-block wave-char origin-bottom will-change-transform"
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
            <span className="text-glow text-neon inline-block wave-char origin-bottom will-change-transform ml-2 md:ml-4">
              C
            </span>
            <span className="text-glow text-neon inline-block wave-char origin-bottom will-change-transform">
              C
            </span>
            <span className="text-glow text-neon inline-block wave-char origin-bottom will-change-transform">
              A
            </span>
          </h1>
          <p className="hero-p text-2xl md:text-3xl text-gray-200 mb-10 max-w-3xl font-sans drop-shadow-md leading-relaxed">
            The ultimate local cricket tournament experience. Follow the action,
            track team standings, and experience every ball live.
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {SLIDE_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-neon w-8 shadow-[0_0_10px_rgba(178,255,5,0.8)]"
                  : "bg-white/50 hover:bg-white/80"
              }`}
            ></button>
          ))}
        </div>
      </div>

      {/* 2. Middle GSAP Expand Section */}
      <div
        ref={contRef}
        className="relative w-[100vw] left-1/2 -translate-x-1/2 bg-[#11001a] flex justify-center mt-40 pb-40 overflow-hidden border-y border-dark-border"
      >
        <div className="w-full h-[120vh] flex justify-center overflow-hidden">
          <img
            ref={imgRef}
            src={norm4}
            alt="Ground detailed view"
            className="w-full h-full object-cover block will-change-transform"
          />
        </div>

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="sticky top-[25vh] ml-8 md:ml-[120px] flex flex-col w-[90vw] pointer-events-auto mt-[9rem]">
            <h1 className="font-display text-neon text-glow text-[clamp(80px,9.5vw,160px)] leading-[0.85] uppercase font-bold tracking-wide mb-8 flex flex-wrap pt-4">
              {"ABOUT OUR".split("").map((char, i) => (
                <span
                  key={`a-${i}`}
                  className="inline-block wave-char-about origin-bottom will-change-transform"
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
              <div className="basis-full h-0"></div>
              {"TOWN GROUND".split("").map((char, i) => (
                <span
                  key={`t-${i}`}
                  className="inline-block wave-char-about origin-bottom will-change-transform"
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </h1>
            <p className="about-p text-white font-sans text-2xl md:text-[22px] leading-[1.6] mt-4 font-medium tracking-[0.3px] max-w-2xl">
              Our professional programming is open to surprising, emerging
              <br />
              sports initiatives. Get in touch with the most atmospheric
              <br />
              tournament in town. We're more than happy to brainstorm
              <br />
              with you!
            </p>

            <div className="mt-12 md:mt-24 self-start md:self-end md:mr-32">
              <NeonButton
                onClick={() => navigate("/standings")}
                variant="secondary"
                className="px-12 py-5 text-xl rounded-[50px] font-heading tracking-[1.5px] uppercase bg-red-40 text-black hover:bg-gray-200 shadow-xl"
              >
                SEE STANDINGS
              </NeonButton>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Immersive GSAP Scattering Grid (Translated Middle2) */}
      <div
        ref={gridContainerRef}
        className="relative w-full flex flex-col items-center pt-[25rem] overflow-visible"
      >
        {/* Sticky Background Tagline */}
        <span className="sticky top-[50vh] -translate-y-1/2 z-[4] w-[80%] md:w-[60%] flex flex-wrap justify-center items-center text-[26px] md:text-[42px] italic text-center drop-shadow-2xl">
          An&nbsp;
          <span className="font-display font-bold text-neon text-glow text-[36px] md:text-[64px] not-italic drop-shadow-none">
            UNFORGETTABLE
          </span>
          &nbsp;tournament in the heart of our&nbsp;
          <span className="font-display font-bold text-neon text-glow text-[36px] md:text-[64px] not-italic drop-shadow-none">
            TOWN.
          </span>{" "}
          &nbsp;Fierce competition and a love for the&nbsp;
          <span className="font-display font-bold text-white text-[36px] md:text-[64px] not-italic drop-shadow-none">
            GAME
          </span>
          &nbsp;
          <br />
          oozes from the pitch!
        </span>

        {/* The Grid Canvas */}
        <div className="images-grid-container relative w-full grid grid-cols-5 auto-cols-[minmax(0,1fr)] grid-rows-[repeat(20,1fr)] gap-[2rem] p-[3rem] pt-[60vh] pb-[80vh] items-start z-0">
          {GRID_IMAGES.map((imgDef, idx) => (
            <div
              key={idx}
              className="grid-img-item will-change-transform"
              style={{
                gridRow: imgDef.r,
                gridColumn: imgDef.c,
                zIndex: imgDef.z,
                transform: `translateY(${imgDef.z * 70}px)`,
              }}
            >
              <img
                src={imgDef.src}
                alt="grid memory"
                className="w-full h-full object-contain rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] scale-[1.8] md:scale-[2.3] transition-transform duration-500 hover:scale-[2.5]"
              />
            </div>
          ))}
        </div>
      </div>
      {/* 4. Elastic Text Footer */}
      <Bottom />
    </div>
  );
}
