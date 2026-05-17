import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
import { CanvasExperience } from './components/CanvasExperience';
import { Loader } from './components/Loader';
import { StatsStrip } from './components/StatsStrip';

function AnimatedSection({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide default cursor across the document when using custom cursor
    if (!window.matchMedia("(pointer: coarse)").matches) {
       document.documentElement.style.cursor = 'none';
       const style = document.createElement('style');
       style.innerHTML = '* { cursor: none !important; } .cursor-pointer { cursor: none !important; }';
       document.head.appendChild(style);
       return () => {
         document.documentElement.style.cursor = '';
         document.head.removeChild(style);
       };
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Map scroll Y into an artificial scene "progress" index for the canvas (0 to 5)
      // Since it's a long scrolling page, we can estimate sections based on document height
      const totalScroll = document.body.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const rawProgress = (currentScroll / totalScroll) * 5;
      setScrollProgress(rawProgress);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], [0, 150]);
  const glitchShift = useTransform(scrollY, [0, 600], ['2px', '40px']);
  const glitchOffset = useTransform(scrollY, [0, 600], ['2px', '15px']);
  const titleOpacity = useTransform(scrollY, [300, 600], [1, 0]);
  const titleBlur = useTransform(scrollY, [300, 600], ['blur(0px)', 'blur(20px)']);
  const titleScale = useTransform(scrollY, [0, 600], [1, 1.1]);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen bg-transparent text-[#F0ECE4] font-sans">
      {loading && <Loader onComplete={() => setLoading(false)} />}
      
      {/* Background Atmosphere: Radial Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#FF2B45]/10 to-transparent rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#FF2B45]/5 rounded-full blur-[80px]"></div>
      </div>

      {/* Decorative Grid / Data Lines */}
      <div className="fixed bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF2B45]/30 to-transparent z-10 pointer-events-none"></div>
      <div className="fixed top-0 left-12 w-[1px] h-full bg-gradient-to-b from-transparent via-[#F0ECE4]/5 to-transparent z-10 pointer-events-none hidden md:block"></div>
      <div className="fixed top-0 right-12 w-[1px] h-full bg-gradient-to-b from-transparent via-[#F0ECE4]/5 to-transparent z-10 pointer-events-none hidden md:block"></div>

      {/* Background Canvas */}
      <CanvasExperience activeScene={Math.floor(scrollProgress + 0.5)} scrollProgress={scrollProgress} />

      {/* Scrollable Content Layers */}
      <div className="relative z-10 flex flex-col w-full">
        
        {/* SCENE 1: HERO */}
        <section className="min-h-screen flex flex-col items-center justify-center relative px-6 text-center">
          <motion.div 
            style={{ 
              y: heroY, 
              opacity: titleOpacity, 
              filter: titleBlur,
              scale: titleScale,
              '--g-intensity': useTransform(scrollY, [0, 800], [0.1, 1.5]),
              '--g-offset-y': glitchOffset,
              '--g-skew': useTransform(scrollY, [0, 1000], [0, 15])
            } as any} 
            className="flex flex-col items-center text-center"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 40, skewY: 3 }} animate={{ opacity: 1, y: 0, skewY: 0 }} transition={{ delay: 3.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl sm:text-7xl md:text-[min(12vw,14rem)] font-display leading-[0.95] tracking-tight text-[#F0ECE4] glitch-effect animate-glitch"
              data-text="THE FUTURE"
            >
              THE <span className="text-[#FF2B45]">FUTURE</span>
            </motion.h1>
            <motion.h1 
              initial={{ opacity: 0, y: 40, skewY: 3 }} animate={{ opacity: 1, y: 0, skewY: 0 }} transition={{ delay: 3.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl sm:text-7xl md:text-[min(12vw,14rem)] font-display leading-[0.95] tracking-tight text-[#F0ECE4] glitch-effect animate-glitch"
              data-text="WAS BUILT"
            >
              WAS BUILT
            </motion.h1>
            <motion.h1 
              initial={{ opacity: 0, y: 40, skewY: 3 }} animate={{ opacity: 1, y: 0, skewY: 0 }} transition={{ delay: 3.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl sm:text-7xl md:text-[min(12vw,14rem)] font-display leading-[0.95] tracking-tight text-[#FF2B45] glitch-effect animate-glitch"
              data-text="HERE."
            >
              HERE.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4, duration: 1 }}
              className="font-serif italic text-lg md:text-2xl text-[#F0ECE4]/60 mt-8 max-w-2xl px-4 font-light"
            >
               A software studio born from ambition, forged in Tunisia, engineered for the world.
            </motion.p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.5, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] tracking-[0.4em] text-[#F0ECE4]/40 uppercase font-mono">Scroll to explore</span>
            <motion.div 
              animate={{ scaleY: [1, 0.5, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-[1px] h-16 bg-gradient-to-b from-[#FF2B45] to-transparent origin-top"
            />
          </motion.div>
        </section>

        {/* STATS STRIP */}
        <StatsStrip />

        {/* SCENE 2: ORIGIN */}
        <section className="min-h-[150vh] relative">
          <div className="sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden px-4 md:px-6">
            <AnimatedSection className="max-w-[90vw] md:max-w-5xl text-center">
              <p className="text-[10px] md:text-sm tracking-[0.4em] md:tracking-[0.6em] text-[#FF2B45] uppercase mb-6 md:mb-8 font-bold font-mono">◆ Origin</p>
              <h2 className="font-display text-[12vw] sm:text-7xl md:text-[6.5rem] leading-[1.05] tracking-tight text-[#F0ECE4]">
                <span className="block text-[#F0ECE4]/40">They said</span>
                <span className="block text-[#F0ECE4]">Silicon Valley</span>
                <span className="block text-[#F0ECE4]/40">was the only</span>
                <span className="block text-[#FF2B45]">starting point.</span>
              </h2>
              <p className="text-sm sm:text-base md:text-xl text-[#F0ECE4]/60 max-w-full md:max-w-2xl mx-auto mt-8 md:mt-10 font-sans leading-relaxed font-light">
                LAKO was built to prove otherwise. From a small studio in Tunisia, we engineer software, AI systems, and digital experiences that compete on a global stage — on our own terms.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* SCENE 3: MAP / REACH */}
        <section className="min-h-screen py-24 px-4 md:px-6 flex flex-col items-center text-center relative pointer-events-none">
            {/* The SVG background map is primarily handled by the Canvas component. We just provide the text. */}
            <AnimatedSection>
              <p className="text-[10px] md:text-sm tracking-[0.4em] md:tracking-[0.6em] text-[#FF2B45] uppercase mb-6 md:mb-8 font-bold font-mono">◆ Reach</p>
              <h2 className="font-display text-[13vw] sm:text-6xl md:text-[5.5rem] leading-[1] tracking-tight">
                One origin. <br className="block md:hidden" /><span className="text-[#FF2B45] inline-block mt-2 md:mt-0">Infinite reach.</span>
              </h2>
            </AnimatedSection>
            {/* Spacing for canvas graphics */}
            <div className="h-[40vh] md:h-[60vh] w-full"></div>
        </section>

        {/* SCENE 4: PRODUCTS */}
        <section className="min-h-screen py-24 md:py-32 px-4 md:px-6 flex flex-col items-center z-10 bg-gradient-to-b from-transparent via-[#060608]/80 to-[#060608]">
          <AnimatedSection className="text-center mb-12 md:mb-16">
            <p className="text-[10px] tracking-[0.6em] text-[#FF2B45] uppercase mb-6 md:mb-8 font-bold font-mono">◆ Products</p>
            <h2 className="font-display text-[15vw] sm:text-7xl md:text-[6rem] tracking-tight leading-[1]">
              What we <span className="text-[#FF2B45]">build.</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px max-w-5xl w-full bg-[#F0ECE4]/5 border border-[#F0ECE4]/5 p-px">
             {[
               { id: '01', icon: '⬡', name: 'Analytics OS', desc: 'Multi-tenant B2B analytics platform with AI-powered reporting and automated insights.', tag: 'SaaS Platform' },
               { id: '02', icon: '◈', name: 'NeuroLAKO', desc: 'Arabic-first AI medical platform for the MENA region — diagnostics, assistance, research.', tag: 'AI · HealthTech' },
               { id: '03', icon: '◉', name: 'NEXUS', desc: 'AI-powered IT operations platform. Infrastructure intelligence for the modern enterprise.', tag: 'Enterprise · AI Ops' },
               { id: '04', icon: '◇', name: 'LAKO Studio', desc: 'Full-stack product studio. Software, cybersecurity, and digital experiences built to last.', tag: 'Agency · Studio' }
             ].map((prod, i) => (
               <AnimatedSection key={i} className="bg-[#030304]/80 backdrop-blur-md p-6 sm:p-10 relative group hover:bg-[#FF2B45]/5 transition-colors duration-500 overflow-hidden">
                 {/* Top gradient border on hover */}
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF2B45] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                 
                 <div className="absolute top-4 right-4 sm:right-6 font-display text-[5rem] sm:text-[8rem] text-[#F0ECE4]/[0.02] leading-none select-none pointer-events-none mix-blend-screen">{prod.id}</div>
                 <div className="text-xl sm:text-2xl text-[#FF2B45] mb-4 sm:mb-6 drop-shadow-[0_0_10px_rgba(255,43,69,0.5)]">{prod.icon}</div>
                 <h3 className="font-display text-xl sm:text-2xl md:text-3xl tracking-wider mb-2 sm:mb-3 text-[#F0ECE4] relative">{prod.name}</h3>
                 <p className="text-[#F0ECE4]/60 text-xs sm:text-sm md:text-base leading-relaxed mb-6 sm:mb-8 font-sans font-light max-w-sm relative">{prod.desc}</p>
                 <span className="border border-[#FF2B45]/30 text-[#FF2B45] text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase px-2 sm:px-3 py-1 sm:py-1.5 float-left relative font-mono">
                   {prod.tag}
                 </span>
               </AnimatedSection>
             ))}
          </div>
        </section>

        {/* SCENE 5: FINAL CTA */}
        <section className="min-h-[80vh] md:min-h-screen relative flex flex-col items-center justify-center text-center overflow-hidden bg-[#060608] px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(255,43,69,0.06)_0%,transparent_70%)] pointer-events-none"></div>
          
          <AnimatedSection className="z-10 flex flex-col items-center w-full">
            <p className="text-[10px] md:text-sm tracking-[0.4em] md:tracking-[0.6em] text-[#FF2B45] uppercase mb-4 md:mb-6 font-bold font-mono">◆ Join the future</p>
            <h2 className="font-display text-[15vw] sm:text-6xl md:text-[9.5rem] leading-[0.95] tracking-tight mb-8 md:mb-10 text-[#F0ECE4]">
              THE WORLD<br/>
              <span className="text-[#FF2B45]">IS WATCHING.</span>
            </h2>
            <p className="text-sm md:text-xl text-[#F0ECE4]/60 max-w-md mx-auto mb-10 md:mb-14 leading-relaxed font-sans font-light">
              We're building the next generation of software — from Tunisia, for the world. Be part of what comes next.
            </p>
          </AnimatedSection>

          <footer className="px-6 md:px-12 py-8 w-full flex flex-col md:flex-row items-center justify-between border-t border-[#F0ECE4]/5 absolute bottom-0">
             <p className="text-[10px] tracking-[0.2em] md:tracking-[0.4em] uppercase text-[#F0ECE4]/30 font-mono mb-6 md:mb-0 w-full text-center md:text-left">
               ◆ LAKO Digital Studio · Tunisia · 2026
             </p>
             <a href="https://lako.studio" className="group relative inline-flex items-center gap-3 md:gap-4 bg-[#FF2B45] px-6 md:px-10 py-4 overflow-hidden decoration-transparent shrink-0">
               <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
               <span className="relative font-bold font-sans text-xs md:text-sm tracking-[0.2em] text-[#F0ECE4]">ENTER LAKO</span>
               <span className="relative text-[#F0ECE4] transition-transform duration-300 group-hover:translate-x-1">→</span>
             </a>
          </footer>
        </section>

      </div>
    </div>
  );
}
