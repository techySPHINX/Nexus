import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

interface DeferredSectionProps {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
  disabled?: boolean;
}

const DeferredSection: FC<DeferredSectionProps> = ({
  children,
  minHeight = 180,
  rootMargin = '220px 0px',
  threshold = 0,
  once = true,
  disabled = false,
}) => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(disabled);

  useEffect(() => {
    if (disabled) {
      setIsVisible(true);
      return;
    }

    if (isVisible && once) return;

    const element = sectionRef.current;
    if (!element) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [disabled, isVisible, once, rootMargin, threshold]);

  return (
    <Box ref={sectionRef} sx={{ minHeight: isVisible ? undefined : minHeight }}>
      {isVisible ? children : null}
    </Box>
  );
};

export default DeferredSection;
