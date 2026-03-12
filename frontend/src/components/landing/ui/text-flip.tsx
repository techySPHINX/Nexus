import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TextFlipProps {
  /** Array of exactly 3 sentences to cycle through */
  sentences?: [string, string];
  /** Colors for the last word of each sentence */
  wordColors?: [string, string];
  /** Time in milliseconds between sentence transitions */
  interval?: number;
  /** Additional CSS classes to apply to the container */
  className?: string;
  /** Duration of the transition animation in milliseconds */
  animationDuration?: number;
}

const DEFAULT_SENTENCES: [string, string] = [
  'Design that is beautiful',
  'Code that is powerful',
];

const DEFAULT_COLORS: [string, string] = ['#f97316', '#8b5cf6'];

export function TextFlip({
  sentences = DEFAULT_SENTENCES,
  wordColors = DEFAULT_COLORS,
  interval = 4000,
  className,
  animationDuration = 1000,
}: TextFlipProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sentences.length);
    }, interval);

    return () => clearInterval(intervalId);
  }, [isInView, sentences.length, interval]);

  const currentSentence = sentences[currentIndex];
  const currentColor = wordColors[currentIndex];

  const words = currentSentence.split(' ');
  const regularWords = words.slice(0, -1);
  const lastWord = words[words.length - 1];
  const letterDelay = 0.03;

  // Compute letter offset for last word stagger
  const lastWordOffset = regularWords.reduce((acc, w) => acc + w.length + 1, 0);

  return (
    <span
      ref={containerRef}
      className={cn('inline-block whitespace-nowrap', className)}
    >
      <AnimatePresence mode="wait">
        <motion.span key={currentIndex} className="inline-block">
          {/* Regular words */}
          {regularWords.map((word, wordIndex) => {
            const wordOffset = regularWords
              .slice(0, wordIndex)
              .reduce((acc, w) => acc + w.length + 1, 0);

            return (
              <span key={wordIndex} className="inline-block">
                {word.split('').map((letter, li) => (
                  <motion.span
                    key={li}
                    className="inline-block"
                    initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
                    transition={{
                      duration: animationDuration / 1000,
                      ease: [0.22, 1, 0.36, 1],
                      delay: (wordOffset + li) * letterDelay,
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
                {/* Space */}
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.1,
                    delay: (wordOffset + word.length) * letterDelay,
                  }}
                >
                  &nbsp;
                </motion.span>
              </span>
            );
          })}

          {/* Last word — accent color */}
          <span className="inline-block">
            {lastWord.split('').map((letter, li) => (
              <motion.span
                key={li}
                className="inline-block underline decoration-emerald-500/50"
                style={{ color: currentColor }}
                initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
                transition={{
                  duration: animationDuration / 1000,
                  ease: [0.22, 1, 0.36, 1],
                  delay: (lastWordOffset + li) * letterDelay,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
