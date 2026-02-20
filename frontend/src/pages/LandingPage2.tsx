import { FC, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationIndicator from '@/components/Notification/NotificationIndicator';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StatsSection from '@/components/landing/StatsSection';
import SuccessStoriesSection from '@/components/landing/SuccessStoriesSection';
import NewsSection from '@/components/landing/NewsSection';
import ContactSection from '@/components/landing/ContactSection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

interface FloatingNetworkProps {
  darkMode: boolean;
}

const FloatingNetwork: FC<FloatingNetworkProps> = ({ darkMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mountRef.current) return;
    mountRef.current = true;

    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const nodes: THREE.Mesh[] = [];
    const nodeCount = 15;
    const connections: THREE.Line[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 6);
      const material = new THREE.MeshBasicMaterial({
        color: darkMode ? 0x10b981 : 0x059669,
        transparent: true,
        opacity: darkMode ? 0.7 : 0.6,
      });
      const node = new THREE.Mesh(geometry, material);

      const radius = 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      node.position.x = radius * Math.sin(phi) * Math.cos(theta);
      node.position.y = radius * Math.sin(phi) * Math.sin(theta);
      node.position.z = radius * Math.cos(phi);

      nodes.push(node);
      scene.add(node);
    }

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const distance = nodes[i].position.distanceTo(nodes[j].position);
        if (distance < 5) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            nodes[i].position,
            nodes[j].position,
          ]);
          const material = new THREE.LineBasicMaterial({
            color: darkMode ? 0x047857 : 0x10b981,
            transparent: true,
            opacity: darkMode ? 0.2 : 0.15,
            linewidth: 1,
          });
          const line = new THREE.Line(geometry, material);
          connections.push(line);
          scene.add(line);
        }
      }
    }

    camera.position.z = 8;

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      scene.rotation.y += 0.002;
      scene.rotation.x += 0.001;

      const time = Date.now() * 0.001;
      nodes.forEach((node, i) => {
        node.scale.x =
          node.scale.y =
          node.scale.z =
            1 + 0.2 * Math.sin(time * 2 + i);
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      nodes.forEach((node) => {
        node.geometry.dispose();
        if (node.material instanceof THREE.Material) {
          node.material.dispose();
        }
      });

      connections.forEach((connection) => {
        connection.geometry.dispose();
        if (connection.material instanceof THREE.Material) {
          connection.material.dispose();
        }
      });

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [darkMode]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ opacity: darkMode ? 0.08 : 0.12 }}
    />
  );
};

const Landing: FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const darkMode = isDark;

  const [cursorGlow, setCursorGlow] = useState({ x: 50, y: 20 });

  const [travelingGlow, setTravelingGlow] = useState({ x: 30, y: 50 });
  const targetPositionRef = useRef({ x: 30, y: 50 });

  useEffect(() => {
    let animationFrameId: number;

    const updateTravelingGlow = () => {
      setTravelingGlow((prev) => {
        const target = targetPositionRef.current;
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 2) {
          targetPositionRef.current = {
            x: Math.random() * 100,
            y: Math.random() * 100,
          };
        }

        const speed = 0.3;
        return {
          x: prev.x + dx * speed * 0.02,
          y: prev.y + dy * speed * 0.02,
        };
      });

      animationFrameId = requestAnimationFrame(updateTravelingGlow);
    };

    animationFrameId = requestAnimationFrame(updateTravelingGlow);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = event;
    const rect = currentTarget.getBoundingClientRect();
    setCursorGlow({
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    });
  };

  const sectionBackgrounds = darkMode
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
      ];

  return (
    <div
      className="relative w-full overflow-x-hidden"
      onMouseMove={handleMouseMove}
    >
      <div
        className={`fixed inset-0 -z-20 transition-colors duration-500 ${
          darkMode
            ? 'bg-[radial-gradient(1200px_circle_at_15%_-5%,rgba(16,185,129,0.28),transparent_55%),radial-gradient(1000px_circle_at_88%_8%,rgba(34,197,94,0.2),transparent_52%),radial-gradient(900px_circle_at_50%_105%,rgba(20,184,166,0.18),transparent_50%),linear-gradient(180deg,#010b08_0%,#021313_45%,#041b14_100%)]'
            : 'bg-white'
        }`}
      />

      <div
        className={`fixed inset-0 -z-10 pointer-events-none ${
          darkMode
            ? 'bg-[linear-gradient(rgba(16,185,129,0.06)_1px,transparent_100px),linear-gradient(90deg,rgba(16,185,129,0.06)_1px,transparent_100px)]'
            : 'bg-[linear-gradient(rgba(236, 90, 28, 0.05)_1px,transparent_100px),linear-gradient(90deg,rgba(233, 97, 47, 0.05)_1px,transparent_100px)]'
        } bg-[size:72px_72px] opacity-35`}
      />

      <div
        className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(420px circle at ${cursorGlow.x}% ${cursorGlow.y}%, ${
            darkMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(34, 197, 94, 0.6)'
          } 0%, transparent 62%)`,
        }}
      />

      <div
        className="fixed inset-0 pointer-events-none -z-10 transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(600px circle at ${travelingGlow.x}% ${travelingGlow.y}%, ${
            darkMode ? 'rgba(52, 211, 153, 0.25)' : 'rgba(16, 185, 129, 0.35)'
          } 0%, transparent 70%)`,
        }}
      />

      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.06), transparent 35%), radial-gradient(circle at 75% 55%, rgba(255,255,255,0.04), transparent 38%)',
          mixBlendMode: darkMode ? 'screen' : 'multiply',
          opacity: darkMode ? 0.6 : 0.35,
        }}
      />

      <FloatingNetwork darkMode={darkMode} />

      <div className="fixed right-6 z-50 flex items-center gap-3">
        {user && <ThemeToggle />}
        {user && <NotificationIndicator />}
      </div>

      <HeroSection sectionBackground={sectionBackgrounds[0]} />
      <FeaturesSection sectionBackground={sectionBackgrounds[1]} />
      <StatsSection sectionBackground={sectionBackgrounds[2]} />
      <SuccessStoriesSection sectionBackground={sectionBackgrounds[3]} />
      <NewsSection sectionBackground={sectionBackgrounds[4]} />
      <CTASection sectionBackground={sectionBackgrounds[5]} />
      <FAQSection sectionBackground={sectionBackgrounds[6]} />
      <ContactSection sectionBackground={sectionBackgrounds[7]} />
      <Footer />
    </div>
  );
};

export default Landing;
