import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, stagger, useAnimate } from 'motion/react';
import { cn } from '@/lib/utils';

export const TextGenerateEffect = ({
  sentences,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.2,
  pauseBetween = 1500,
}: {
  sentences: string[];
  className?: string;
  filter?: boolean;
  duration?: number;
  staggerDelay?: number;
  pauseBetween?: number;
}) => {
  const [scope, animate] = useAnimate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [key, setKey] = useState(0); // force re-mount to reset animation
  const containerRef = useRef<HTMLDivElement>(null);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRunningRef = useRef(false);

  const currentSentence = sentences[currentIndex];
  const wordsArray = currentSentence?.split(' ') ?? [];

  // Intersection observer to detect viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const runAnimation = useCallback(async () => {
    if (!scope.current) return;

    // Animate words in
    await animate(
      'span',
      { opacity: 1, filter: filter ? 'blur(0px)' : 'none' },
      { duration, delay: stagger(staggerDelay) }
    );

    // Pause while fully visible
    await new Promise((res) => setTimeout(res, pauseBetween));

    // Fade out all words together
    await animate(
      'span',
      { opacity: 0, filter: filter ? 'blur(10px)' : 'none' },
      { duration: 0.4 }
    );
  }, [animate, duration, filter, staggerDelay, pauseBetween, scope]);

  // Cycle through sentences when visible
  useEffect(() => {
    if (!isVisible) {
      if (cycleRef.current) clearTimeout(cycleRef.current);
      isRunningRef.current = false;
      return;
    }

    let cancelled = false;

    const cycle = async () => {
      if (cancelled) return;
      isRunningRef.current = true;

      await runAnimation();

      if (cancelled) return;

      setCurrentIndex((prev) => (prev + 1) % sentences.length);
      setKey((k) => k + 1);
    };

    cycle();

    return () => {
      cancelled = true;
      isRunningRef.current = false;
    };
  }, [isVisible, currentIndex, key, sentences.length, runAnimation]);

  const renderWords = () => (
    <motion.div ref={scope} className="inline">
      {wordsArray.map((word, idx) => {
        const isLast = idx === wordsArray.length - 1;
        return (
          <motion.span
            key={word + idx}
            className={cn(
              'opacity-0',
              isLast
                ? 'dark:text-green-400 text-green-500 underline decoration-green-400/50'
                : 'dark:text-white text-black'
            )}
            style={{
              filter: filter ? 'blur(10px)' : 'none',
              display: 'inline-block',
              marginRight: '0.25em',
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.div>
  );

  return (
    <div ref={containerRef} className={cn('font-bold', className)}>
      <div className="mt-4">
        <div className={cn('leading-snug tracking-wide', className)}>
          {renderWords()}
        </div>
      </div>
    </div>
  );
};
