import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
<<<<<<< HEAD
import type { LazyLoadImageProps } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

declare global {
  interface GlobalThis {
    __optimizedImageCounter?: number;
  }
}

=======
import 'react-lazy-load-image-component/src/effects/blur.css';

>>>>>>> a2802a3 (Performance upgrade- lazy Loading)
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

<<<<<<< HEAD
  // const instanceNoRef = React.useRef<number | null>(null);
  // if (instanceNoRef.current === null) {
  //   const g = globalThis as any;
  //   if (g.__optimizedImageCounter == null) {
  //     g.__optimizedImageCounter = 0;
  //   }
  //   instanceNoRef.current = ++g.__optimizedImageCounter;
  // }
=======
  const instanceNoRef = React.useRef<number | null>(null);
  if (instanceNoRef.current === null) {
    if (!(globalThis as any).__optimizedImageCounter) {
      (globalThis as any).__optimizedImageCounter = 0;
    }
    instanceNoRef.current = ++(globalThis as any).__optimizedImageCounter;
  }
>>>>>>> a2802a3 (Performance upgrade- lazy Loading)

  React.useEffect(() => {
    console.log(
      'optimized source:',
      optimizedSrc,
<<<<<<< HEAD
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
=======
      'for no',
      instanceNoRef.current
    );
  }, [optimizedSrc]);

  return (
    <LazyLoadImage
      loading="lazy"
      decoding="async"
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      effect="blur"
      placeholderSrc="/image-placeholder.webp"
      threshold={1} // Load when 100px from viewport
    />
>>>>>>> a2802a3 (Performance upgrade- lazy Loading)
  );
};
