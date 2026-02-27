import {
  FC,
  ReactNode,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
// import * as THREE from 'three';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationIndicator from '@/components/Notification/NotificationIndicator';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

import HeroSection from '@/components/landing/HeroSection';

const FeaturesSection = lazy(
  () => import('@/components/landing/FeaturesSection')
);
const StatsSection = lazy(() => import('@/components/landing/StatsSection'));
const SuccessStoriesSection = lazy(
  () => import('@/components/landing/SuccessStoriesSection')
);
const NewsSection = lazy(() => import('@/components/landing/NewsSection'));
const ContactSection = lazy(
  () => import('@/components/landing/ContactSection')
);
const FAQSection = lazy(() => import('@/components/landing/FAQSection'));
const CTASection = lazy(() => import('@/components/landing/CTASection'));
const Footer = lazy(() => import('@/components/landing/Footer'));

// interface FloatingNetworkProps {
//   darkMode: boolean;
// }

interface DeferredSectionProps {
  children: ReactNode;
  minHeight?: number;
  eager?: boolean;
  rootMargin?: string;
}

const isFirefoxBrowser = () =>
  typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);

// const FloatingNetwork: FC<FloatingNetworkProps> = ({ darkMode }) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const mountRef = useRef(false);

//   useEffect(() => {
//     if (!containerRef.current || mountRef.current) return;
//     mountRef.current = true;

//     const container = containerRef.current;

//     const scene = new THREE.Scene();
//     const camera = new THREE.PerspectiveCamera(
//       75,
//       container.clientWidth / container.clientHeight,
//       0.1,
//       1000
//     );

//     const reduceMotion =
//       typeof window !== 'undefined' &&
//       window.matchMedia('(prefers-reduced-motion: reduce)').matches;
//     const firefox = isFirefoxBrowser();

//     const renderer = new THREE.WebGLRenderer({
//       alpha: true,
//       antialias: !firefox,
//       powerPreference: 'high-performance',
//     });

//     renderer.setSize(container.clientWidth, container.clientHeight);
//     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
//     container.appendChild(renderer.domElement);

//     const nodes: THREE.Mesh[] = [];
//     const nodeCount = firefox ? 8 : 12;
//     const connections: THREE.Line[] = [];

//     for (let i = 0; i < nodeCount; i++) {
//       const geometry = new THREE.SphereGeometry(0.1, 8, 6);
//       const material = new THREE.MeshBasicMaterial({
//         color: darkMode ? 0x10b981 : 0x059669,
//         transparent: true,
//         opacity: darkMode ? 0.7 : 0.6,
//       });
//       const node = new THREE.Mesh(geometry, material);

//       const radius = 4;
//       const theta = Math.random() * Math.PI * 2;
//       const phi = Math.acos(Math.random() * 2 - 1);

//       node.position.x = radius * Math.sin(phi) * Math.cos(theta);
//       node.position.y = radius * Math.sin(phi) * Math.sin(theta);
//       node.position.z = radius * Math.cos(phi);

//       nodes.push(node);
//       scene.add(node);
//     }

//     for (let i = 0; i < nodeCount; i++) {
//       for (let j = i + 1; j < nodeCount; j++) {
//         const distance = nodes[i].position.distanceTo(nodes[j].position);
//         if (distance < 5) {
//           const geometry = new THREE.BufferGeometry().setFromPoints([
//             nodes[i].position,
//             nodes[j].position,
//           ]);
//           const material = new THREE.LineBasicMaterial({
//             color: darkMode ? 0x047857 : 0x10b981,
//             transparent: true,
//             opacity: darkMode ? 0.2 : 0.15,
//             linewidth: 1,
//           });
//           const line = new THREE.Line(geometry, material);
//           connections.push(line);
//           scene.add(line);
//         }
//       }
//     }

//     camera.position.z = 8;

//     let animationFrameId: number;

//     const animate = () => {
//       animationFrameId = requestAnimationFrame(animate);

//       if (!reduceMotion) {
//         scene.rotation.y += 0.0015;
//         scene.rotation.x += 0.0008;
//       }
//       const time = Date.now() * 0.001;
//       nodes.forEach((node, i) => {
//         node.scale.x =
//           node.scale.y =
//           node.scale.z =
//             1 + 0.2 * Math.sin(time * 2 + i);
//       });

//       renderer.render(scene, camera);
//     };
//     const startTimeoutId = window.setTimeout(animate, 60);

//     const handleResize = () => {
//       if (!container) return;
//       camera.aspect = container.clientWidth / container.clientHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(container.clientWidth, container.clientHeight);
//     };

//     window.addEventListener('resize', handleResize);

//     return () => {
//       window.removeEventListener('resize', handleResize);
//       window.clearTimeout(startTimeoutId);
//       cancelAnimationFrame(animationFrameId);

//       nodes.forEach((node) => {
//         node.geometry.dispose();
//         if (node.material instanceof THREE.Material) {
//           node.material.dispose();
//         }
//       });

//       connections.forEach((connection) => {
//         connection.geometry.dispose();
//         if (connection.material instanceof THREE.Material) {
//           connection.material.dispose();
//         }
//       });

//       if (container && renderer.domElement) {
//         container.removeChild(renderer.domElement);
//       }
//       renderer.dispose();
//     };
//   }, [darkMode]);

//   return (
//     <div
//       ref={containerRef}
//       className="absolute inset-0 pointer-events-none overflow-hidden"
//       style={{ opacity: darkMode ? 0.08 : 0.12 }}
//     />
//   );
// };

const DeferredSection: FC<DeferredSectionProps> = ({
  children,
  minHeight = 480,
  eager = false,
  rootMargin = '400px 0px',
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (visible || eager) return;
    const element = sectionRef.current;
    if (!element) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [eager, rootMargin, visible]);

  return (
    <div ref={sectionRef} style={!visible ? { minHeight } : undefined}>
      {visible ? children : null}
    </div>
  );
};

const Landing: FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const darkMode = isDark;
  const isFirefox = useMemo(() => isFirefoxBrowser(), []);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncValue = () => setPrefersReducedMotion(mediaQuery.matches);
    syncValue();
    mediaQuery.addEventListener('change', syncValue);
    return () => mediaQuery.removeEventListener('change', syncValue);
  }, []);

  const lowPerformanceMode = isFirefox || prefersReducedMotion;
  const deferredRootMargin = lowPerformanceMode ? '120px 0px' : '320px 0px';

  const sectionBackgrounds = useMemo(
    () =>
      darkMode
        ? [
            'bg-transparent',
            'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.15),_transparent_60%)]',
            'bg-transparent',
            'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.15),_transparent_60%)]',
            'bg-transparent',
            'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.15),_transparent_60%)]',
            'bg-transparent',
            'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.15),_transparent_60%)]',
          ]
        : [
            'bg-[radial-gradient(1200px_circle_at_15%_-5%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(1000px_circle_at_88%_8%,rgba(34,197,94,0.16),transparent_52%),radial-gradient(900px_circle_at_50%_105%,rgba(45,212,191,0.14),transparent_50%),linear-gradient(180deg,rgba(246,255,251,0.6)_0%,rgba(236,255,246,0.6)_45%,rgba(239,255,251,0.6)_100%)]',
            'bg-white/40',
            'bg-[radial-gradient(1200px_circle_at_15%_-5%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(1000px_circle_at_88%_8%,rgba(34,197,94,0.16),transparent_52%),radial-gradient(900px_circle_at_50%_105%,rgba(45,212,191,0.14),transparent_50%),linear-gradient(180deg,rgba(246,255,251,0.6)_0%,rgba(236,255,246,0.6)_45%,rgba(239,255,251,0.6)_100%)]',
            'bg-white/40',
            'bg-[radial-gradient(1200px_circle_at_15%_-5%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(1000px_circle_at_88%_8%,rgba(34,197,94,0.16),transparent_52%),radial-gradient(900px_circle_at_50%_105%,rgba(45,212,191,0.14),transparent_50%),linear-gradient(180deg,rgba(246,255,251,0.6)_0%,rgba(236,255,246,0.6)_45%,rgba(239,255,251,0.6)_100%)]',
            'bg-white/40',
            'bg-[radial-gradient(1200px_circle_at_15%_-5%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(1000px_circle_at_88%_8%,rgba(34,197,94,0.16),transparent_52%),radial-gradient(900px_circle_at_50%_105%,rgba(45,212,191,0.14),transparent_50%),linear-gradient(180deg,rgba(246,255,251,0.6)_0%,rgba(236,255,246,0.6)_45%,rgba(239,255,251,0.6)_100%)]',
            'bg-white/40',
          ],
    [darkMode]
  );

  return (
    <div
      className={`relative w-full overflow-x-hidden ${
        lowPerformanceMode ? 'landing-performance-mode' : ''
      }`}
    >
      <div
        className={`fixed inset-0 -z-20 transition-colors duration-500 ${
          darkMode
            ? 'bg-[radial-gradient(1200px_circle_at_15%_-5%,rgba(16,185,129,0.28),transparent_55%),radial-gradient(1000px_circle_at_88%_8%,rgba(34,197,94,0.2),transparent_52%),radial-gradient(900px_circle_at_50%_105%,rgba(20,184,166,0.18),transparent_50%),linear-gradient(180deg,#010b08_0%,#021313_45%,#041b14_100%)]'
            : 'bg-white'
        }`}
      />

      {/* <div
        className={`fixed inset-0 -z-10 pointer-events-none ${
          darkMode
            ? 'bg-[linear-gradient(rgba(16,185,129,0.06)_1px,transparent_100px),linear-gradient(90deg,rgba(16,185,129,0.06)_1px,transparent_100px)]'
            : 'bg-[linear-gradient(rgba(236, 90, 28, 0.05)_1px,transparent_100px),linear-gradient(90deg,rgba(233, 97, 47, 0.05)_1px,transparent_100px)]'
        } bg-[size:72px_72px] opacity-35`}
      /> */}

      {/* <div
        className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(420px circle at ${cursorGlow.x}% ${cursorGlow.y}%, ${
            darkMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(34, 197, 94, 0.6)'
          } 0%, transparent 62%)`,
        }}
      /> */}

      <div
        className="fixed inset-0 pointer-events-none -z-10 "
        // ${
        // !lowPerformanceMode ? 'landing-animated-glow' : ''
        // }
        style={{
          background: `radial-gradient(600px circle at 30% 50%, ${
            darkMode ? 'rgba(52, 211, 153, 0.22)' : 'rgba(16, 185, 129, 0.35)'
          } 0%, transparent 72%)`,
        }}
      />
      {/* {!lowPerformanceMode && (
        <div
          className="landing-animated-glow landing-animated-glow-reverse fixed inset-0 pointer-events-none -z-10"
          style={{
            background: `radial-gradient(600px circle at 70% 30%, ${
              darkMode ? 'rgba(52, 153, 211, 0.25)' : 'rgba(16, 129, 185, 0.4)'
            } 0%, transparent 70%)`,
          }}
        />
      )} */}

      {/* {!lowPerformanceMode && (
        <div
          className="fixed inset-0 -z-10 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.06), transparent 35%), radial-gradient(circle at 75% 55%, rgba(255,255,255,0.04), transparent 38%)',
            mixBlendMode: darkMode ? 'screen' : 'multiply',
            opacity: darkMode ? 0.6 : 0.35,
          }}
        />
      )} */}

      {/* {!lowPerformanceMode && <FloatingNetwork darkMode={darkMode} />} */}

      <div className="fixed right-6 z-50 flex items-center gap-3">
        {user && <ThemeToggle />}
        {user && <NotificationIndicator />}
      </div>

      <HeroSection
        sectionBackground={sectionBackgrounds[0]}
        lowPerformanceMode={lowPerformanceMode}
      />
      <DeferredSection
        eager={!lowPerformanceMode}
        minHeight={700}
        rootMargin={deferredRootMargin}
      >
        <Suspense fallback={null}>
          <FeaturesSection sectionBackground={sectionBackgrounds[1]} />
        </Suspense>
      </DeferredSection>
      <DeferredSection minHeight={620} rootMargin={deferredRootMargin}>
        <Suspense fallback={null}>
          <StatsSection
            sectionBackground={sectionBackgrounds[2]}
            lowPerformanceMode={lowPerformanceMode}
          />
        </Suspense>
      </DeferredSection>
      <DeferredSection minHeight={760} rootMargin={deferredRootMargin}>
        <Suspense fallback={null}>
          <SuccessStoriesSection sectionBackground={sectionBackgrounds[3]} />
        </Suspense>
      </DeferredSection>
<<<<<<< HEAD:frontend/src/pages/LandingPage.tsx
      <DeferredSection minHeight={1700} rootMargin={deferredRootMargin}>
        <NewsSection sectionBackground={sectionBackgrounds[4]} />
      </DeferredSection>
      <DeferredSection minHeight={520} rootMargin={deferredRootMargin}>
        <CTASection
          sectionBackground={sectionBackgrounds[5]}
          // lowPerformanceMode={lowPerformanceMode}
        />
=======
      <DeferredSection minHeight={700} rootMargin={deferredRootMargin}>
        <Suspense fallback={null}>
          <NewsSection sectionBackground={sectionBackgrounds[4]} />
        </Suspense>
      </DeferredSection>
      <DeferredSection minHeight={520} rootMargin={deferredRootMargin}>
        <Suspense fallback={null}>
          <CTASection
            sectionBackground={sectionBackgrounds[5]}
            // lowPerformanceMode={lowPerformanceMode}
          />
        </Suspense>
>>>>>>> a93327a (removed console logs):frontend/src/pages/LandingPage2.tsx
      </DeferredSection>
      <DeferredSection minHeight={560} rootMargin={deferredRootMargin}>
        <Suspense fallback={null}>
          <FAQSection sectionBackground={sectionBackgrounds[6]} />
        </Suspense>
      </DeferredSection>
      <DeferredSection minHeight={700} rootMargin={deferredRootMargin}>
        <Suspense fallback={null}>
          <ContactSection sectionBackground={sectionBackgrounds[7]} />
        </Suspense>
      </DeferredSection>
      <DeferredSection minHeight={200} rootMargin={deferredRootMargin}>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </DeferredSection>
    </div>
  );
};

export default Landing;
