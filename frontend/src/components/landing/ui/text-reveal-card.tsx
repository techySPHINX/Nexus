import { ReactNode, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export const TextRevealCard = ({
  text,
  children,
}: {
  text: string;
  children?: ReactNode;
  className?: string;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={cardRef}>
      {children}

      <div className="h-auto sm:h-24 relative flex items-center overflow-hidden">
        <div className="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,white,transparent)]">
          <p className="sm:text-[3rem] leading-tight sm:leading-[0.8] py-4 sm:py-10 font-bold bg-clip-text text-transparent bg-[#323238] dark:bg-gradient-to-b dark:from-green-300 dark:to-green-600">
            {text}
          </p>
        </div>
        <MemoizedStars />
      </div>
    </div>
  );
};

const Stars = () => {
  const darkMode = useTheme().isDark;
  const randomMove = () => Math.random() * 4 - 2;
  const randomOpacity = () => Math.random();
  const random = () => Math.random();
  return (
    <div className="absolute inset-0">
      {[...Array(80)].map((_, i) => (
        <motion.span
          key={`star-${i}`}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: randomOpacity(),
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: random() * 10 + 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: `2px`,
            height: `2px`,
            backgroundColor: darkMode ? '#e9f0e9' : '#096505',
            borderRadius: '50%',
            zIndex: 1,
          }}
          className="inline-block"
        ></motion.span>
      ))}
    </div>
  );
};

export const MemoizedStars = memo(Stars);
