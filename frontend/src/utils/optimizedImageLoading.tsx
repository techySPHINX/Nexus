import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import type { LazyLoadImageProps } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

declare global {
  interface GlobalThis {
    __optimizedImageCounter?: number;
  }
}

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  style,
}) => {
  const optimizedSrc = src
    ? src.replace(/(\.jpg|\.png)(?=[?&]|$)/gi, '.webp')
    : '/default-project.webp';

  // const instanceNoRef = React.useRef<number | null>(null);
  // if (instanceNoRef.current === null) {
  //   const g = globalThis as any;
  //   if (g.__optimizedImageCounter == null) {
  //     g.__optimizedImageCounter = 0;
  //   }
  //   instanceNoRef.current = ++g.__optimizedImageCounter;
  // }

  React.useEffect(() => {
    console.log(
      'optimized source:',
      optimizedSrc,
      'for no'
      // instanceNoRef.current
    );
  }, [optimizedSrc]);

  return React.createElement(
    LazyLoadImage as React.ComponentType<LazyLoadImageProps>,
    {
      loading: 'lazy',
      decoding: 'async',
      src: optimizedSrc,
      alt,
      width,
      height,
      className,
      style,
      effect: 'blur',
      placeholderSrc: '/image-placeholder.webp',
      threshold: 1,
    }
  );
};
