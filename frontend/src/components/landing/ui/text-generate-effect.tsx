import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cycleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Total animation duration: words in + pause + words out
  const totalDuration = duration + pauseBetween / 1000 + 0.4;

  // Cycle through sentences when visible
  useEffect(() => {
    if (!isVisible) {
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      return;
    }

    cycleTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % sentences.length);
      setAnimationKey((k) => k + 1);
    }, totalDuration * 1000);

    return () => {
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    };
  }, [isVisible, animationKey, sentences.length, totalDuration]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      filter: filter ? 'blur(10px)' : 'none',
    },
    visible: {
      opacity: 1,
      filter: filter ? 'blur(0px)' : 'none',
      transition: {
        duration,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      filter: filter ? 'blur(10px)' : 'none',
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  const renderWords = () => (
    <motion.div
      key={`sentence-${animationKey}`}
      className="inline"
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      exit="exit"
    >
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
              display: 'inline-block',
              marginRight: '0.25em',
            }}
            variants={wordVariants}
            onAnimationComplete={(definition) => {
              // After words fully animate in, pause, then trigger exit
              if (definition === 'visible') {
                setTimeout(() => {
                  // Trigger exit animation via re-rendering
                }, pauseBetween);
              }
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
