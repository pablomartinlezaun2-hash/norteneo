import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import neoMockup from '@/assets/neo-mockup.png';

gsap.registerPlugin(ScrollTrigger);

export const HeroCinematic = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLImageElement>(null);
  const secondTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current;
      const title = titleRef.current;
      const mockup = mockupRef.current;
      const secondText = secondTextRef.current;

      if (!section || !title || !mockup || !secondText) return;

      // Entrance animations
      gsap.fromTo(
        title.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          stagger: 0.2,
          delay: 0.3,
        }
      );

      gsap.fromTo(
        mockup,
        { opacity: 0, y: 60, scale: 0.85 },
        {
          opacity: 1,
          y: 0,
          scale: 0.9,
          duration: 1.4,
          ease: 'power3.out',
          delay: 0.6,
        }
      );

      // ScrollTrigger: pin hero and animate on scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=100%',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Mockup scales up
      tl.to(mockup, {
        scale: 1.15,
        y: -20,
        duration: 1,
        ease: 'none',
      });

      // Initial text fades out
      tl.to(
        title,
        {
          opacity: 0,
          y: -30,
          duration: 0.4,
          ease: 'none',
        },
        0
      );

      // Second text fades in
      tl.fromTo(
        secondText,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'none',
        },
        0.5
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Initial text */}
      <div
        ref={titleRef}
        className="absolute top-[15%] md:top-[18%] flex flex-col items-center z-10 pointer-events-none"
      >
        <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-bold text-white tracking-tight leading-none">
          NEO
        </h1>
        <p className="mt-3 text-[clamp(0.9rem,2.5vw,1.25rem)] text-white/50 font-medium tracking-wide">
          El rendimiento, rediseñado.
        </p>
      </div>

      {/* Central mockup */}
      <img
        ref={mockupRef}
        src={neoMockup}
        alt="NEO App"
        className="relative z-20 w-[220px] md:w-[280px] lg:w-[320px] select-none will-change-transform"
        draggable={false}
      />

      {/* Second text (hidden initially, appears on scroll) */}
      <div
        ref={secondTextRef}
        className="absolute bottom-[15%] md:bottom-[18%] flex flex-col items-center z-10 pointer-events-none opacity-0"
      >
        <p className="text-[clamp(1rem,3vw,1.5rem)] text-white font-semibold tracking-tight text-center leading-snug">
          Entrenamiento, nutrición y recuperación.
        </p>
        <p className="mt-2 text-[clamp(0.85rem,2vw,1.1rem)] text-white/40 font-medium text-center">
          Una sola lógica. Más precisión.
        </p>
      </div>

      {/* Subtle gradient overlay at bottom for transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-30 pointer-events-none" />
    </section>
  );
};
