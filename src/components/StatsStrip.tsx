import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

function Counter({ from, to, label }: { from: number, to: number, label: string }) {
  const { scrollYProgress } = useScroll();
  // Using useSpring for smoother increasing numbers based on scroll presence
  const [inView, setInView] = useState(false);
  const [count, setCount] = useState(from);

  useEffect(() => {
    // Simplistic intersection observer for the counter
    const handleScroll = () => {
        if (!inView) {
            setInView(true);
            let current = from;
            const step = to / 40;
            const timer = setInterval(() => {
                current = Math.min(current + step, to);
                setCount(Math.round(current));
                if (current >= to) clearInterval(timer);
            }, 30);
        }
    };
    
    // Quick hack for this specifically, normally we'd ref it
    window.addEventListener('scroll', handleScroll, { once: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [from, to, inView]);

  return (
    <div className="text-center">
      <span className="font-display text-4xl sm:text-5xl md:text-7xl text-[#F0ECE4] block leading-none font-bold">{count}</span>
      <span className="text-[10px] md:text-xs tracking-[0.4em] text-[#F0ECE4]/30 uppercase mt-2 block">{label}</span>
    </div>
  );
}

export function StatsStrip() {
  return (
    <div className="flex flex-wrap justify-center gap-12 md:gap-24 py-16 md:py-24 border-t border-b border-[#F0ECE4]/5 w-full bg-[#060608]/50 backdrop-blur-sm z-20 relative">
      <Counter from={0} to={100} label="% Remote First" />
      <Counter from={0} to={4} label="Core Products" />
      <Counter from={0} to={6} label="Global Markets" />
      <Counter from={0} to={1} label="Vision" />
    </div>
  );
}
