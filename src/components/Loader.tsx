import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function Loader({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800); // Wait for fade out
    }, 2400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 bg-[#030304] z-[9000] flex flex-col items-center justify-center pointer-events-none"
        >
          <div className="font-display text-5xl md:text-8xl tracking-[0.3em] text-[#F0ECE4] overflow-hidden flex">
            {["L", "A", "K", "O"].map((letter, i) => (
              <motion.span
                key={i}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
          </div>

          <div className="w-[200px] h-px bg-white/10 mt-8 overflow-hidden relative">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-0 left-0 h-full bg-[#FF2B45]"
            />
          </div>
          
          <div className="mt-4 text-[10px] tracking-[0.4em] text-[#F0ECE4]/30 uppercase font-mono">
            Loading the future
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
