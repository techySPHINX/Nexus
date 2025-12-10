import { FC, useEffect, useRef } from 'react';
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

  const sectionBackgrounds = [
    darkMode
      ? 'from-gray-900 via-emerald-900 to-green-900'
      : 'from-emerald-100 via-green-100 to-cyan-200',
    darkMode
      ? 'from-emerald-900/50 via-green-900/30 to-gray-900'
      : 'from-cyan-100 via-teal-100 to-emerald-200',
    darkMode
      ? 'from-gray-900 via-emerald-900/30 to-green-900/50'
      : 'from-teal-100 via-cyan-100 to-blue-200',
    darkMode
      ? 'from-emerald-900/30 via-green-900/20 to-gray-900'
      : 'from-green-100 via-emerald-100 to-cyan-100',
    darkMode
      ? 'from-gray-900 via-emerald-900/40 to-green-900/40'
      : 'from-emerald-100 via-white to-cyan-100',
    darkMode
      ? 'from-emerald-900/40 via-gray-900 to-green-900/30'
      : 'from-emerald-100 via-emerald-200 to-white',
    darkMode
      ? 'from-gray-900 via-emerald-900 to-gray-900'
      : 'from-white via-cyan-100 to-emerald-100',
    darkMode
      ? 'from-emerald-900 via-green-900 to-gray-900'
      : 'from-emerald-100 via-green-100 to-cyan-100',
  ];

  return (
    <div className="relative w-full">
      <FloatingNetwork darkMode={darkMode} />

      {!darkMode && (
        <>
          <div
            className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(5, 150, 105, 0.45) 0%, rgba(5, 150, 105, 0.25) 40%, transparent 70%)',
              filter: 'blur(70px)',
            }}
          />
          <div
            className="absolute -bottom-1/4 right-1/3 w-[700px] h-[700px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(6, 182, 212, 0.22) 40%, transparent 70%)',
              filter: 'blur(90px)',
            }}
          />
          <div
            className="absolute top-1/3 right-1/4 w-[550px] h-[550px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(34, 197, 94, 0.38) 0%, rgba(34, 197, 94, 0.22) 40%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(20, 184, 166, 0.35) 0%, rgba(20, 184, 166, 0.18) 40%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            className="absolute top-1/4 right-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.16) 40%, transparent 70%)',
              filter: 'blur(75px)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
            }}
          />
        </>
      )}

      <div className="fixed right-6 z-50 flex items-center gap-3">
        {user && <ThemeToggle />}
        {user && <NotificationIndicator />}
      </div>

      <HeroSection sectionBackground={sectionBackgrounds[0]} />
      <FeaturesSection sectionBackground={sectionBackgrounds[1]} />
      <StatsSection sectionBackground={sectionBackgrounds[2]} />
      <SuccessStoriesSection sectionBackground={sectionBackgrounds[3]} />
      <NewsSection sectionBackground={sectionBackgrounds[4]} />
      <ContactSection sectionBackground={sectionBackgrounds[5]} />
      <FAQSection sectionBackground={sectionBackgrounds[6]} />
      <CTASection sectionBackground={sectionBackgrounds[7]} />
      <Footer />
    </div>
  );
};

export default Landing;
