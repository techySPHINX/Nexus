import { FC, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import {
  School,
  People,
  Work,
  RocketLaunch,
  TrendingUp,
  ArrowForward,
  LinkedIn,
  Twitter,
  GitHub,
  Star,
  ConnectWithoutContact,
  Groups,
  EmojiEvents,
  TrendingFlat,
} from '@mui/icons-material';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationIndicator from '@/components/Notification/NotificationIndicator';
import { useAuth } from '@/contexts/AuthContext';

// Professional feature list with green theme
const featureList = [
  {
    icon: <ConnectWithoutContact sx={{ fontSize: 28 }} />,
    title: 'Smart Connections',
    desc: 'AI-powered matching to connect students with relevant alumni mentors and career opportunities.',
  },
  {
    icon: <Work sx={{ fontSize: 28 }} />,
    title: 'Career Guidance',
    desc: 'Get career advice, internship opportunities, and industry insights from experienced alumni.',
  },
  {
    icon: <School sx={{ fontSize: 28 }} />,
    title: 'Mentorship Programs',
    desc: 'Structured mentorship with alumni across various industries and experience levels.',
  },
  {
    icon: <Groups sx={{ fontSize: 28 }} />,
    title: 'Community Groups',
    desc: 'Join specialized groups by major, interests, and career paths with verified members.',
  },
  {
    icon: <RocketLaunch sx={{ fontSize: 28 }} />,
    title: 'Project Collaboration',
    desc: 'Find project partners, research collaborators, and startup co-founders within our trusted network.',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 28 }} />,
    title: 'Skill Development',
    desc: 'Access workshops, webinars, and learning resources curated by successful alumni.',
  },
];

// Success stories with green theme
const successStories = [
  {
    name: 'Priya Sharma',
    role: 'Computer Science, 2023',
    achievement: 'Landed internship at Google',
    story:
      'Nexus connected me with an alum working at Google who referred me for an internship.',
  },
  {
    name: 'Rahul Kumar',
    role: 'Mechanical Engineering, 2022',
    achievement: 'Founded startup with alumni',
    story:
      'Found my technical co-founder through Nexus. Our startup now has 10+ employees.',
  },
  {
    name: 'Anjali Patel',
    role: 'Biotechnology, 2024',
    achievement: 'Published research with mentor',
    story:
      'My alumni mentor guided me through my research paper and helped me get published.',
  },
];

// Stats with icons
const stats = [
  { number: '15K+', label: 'Active Members', icon: <People /> },
  { number: '2K+', label: 'Mentorship Sessions', icon: <School /> },
  {
    number: '500+',
    label: 'Partner Companies',
    icon: <Work />,
    sub: 'Top Tier Companies',
  },
  {
    number: '98%',
    label: 'Satisfaction Rate',
    icon: <EmojiEvents />,
    sub: 'User Feedback',
  },
];

// 3D Floating Network Component
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

    // Quick initialization with minimal particles
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

    // Create 3D network nodes with connections
    const nodes: THREE.Mesh[] = [];
    const nodeCount = 15; // Reduced for performance
    const connections: THREE.Line[] = [];

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 6);
      const material = new THREE.MeshBasicMaterial({
        color: darkMode ? 0x10b981 : 0x22c55e,
        transparent: true,
        opacity: 0.7,
      });
      const node = new THREE.Mesh(geometry, material);

      // Position in a sphere
      const radius = 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      node.position.x = radius * Math.sin(phi) * Math.cos(theta);
      node.position.y = radius * Math.sin(phi) * Math.sin(theta);
      node.position.z = radius * Math.cos(phi);

      nodes.push(node);
      scene.add(node);
    }

    // Create connections between nearby nodes
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const distance = nodes[i].position.distanceTo(nodes[j].position);
        if (distance < 5) {
          // Connect nodes that are close
          const geometry = new THREE.BufferGeometry().setFromPoints([
            nodes[i].position,
            nodes[j].position,
          ]);
          const material = new THREE.LineBasicMaterial({
            color: darkMode ? 0x047857 : 0x16a34a,
            transparent: true,
            opacity: 0.2,
            linewidth: 1,
          });
          const line = new THREE.Line(geometry, material);
          connections.push(line);
          scene.add(line);
        }
      }
    }

    camera.position.z = 8;

    // Store animation frame ID for cleanup
    let animationFrameId: number;

    // Animation function - optimized
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth rotation
      scene.rotation.y += 0.002;
      scene.rotation.x += 0.001;

      // Subtle node pulsing
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

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose geometries and materials
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
      style={{ opacity: darkMode ? 0.08 : 0.05 }}
    />
  );
};

// Text transformation animations
const textVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

const wordVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    rotateX: 90,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.6,
      ease: 'backOut',
    },
  },
};

const Landing: FC = () => {
  const navigate = useNavigate();
  const { isDark: darkMode } = useTheme();
  const { user } = useAuth();
  const [textIndex, setTextIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Faster typewriter effect with text transformation
  useEffect(() => {
    setIsLoaded(true);

    const words = [
      '🤝 Networking',
      '👥 Mentorship',
      '🚀 Collaboration',
      '⭐ Success',
    ];
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % words.length);
    }, 1500); // Faster rotation
    return () => clearInterval(interval);
  }, []);

  // Original background color scheme
  const sectionBackgrounds = [
    darkMode
      ? 'from-gray-900 via-emerald-900 to-green-900'
      : 'from-emerald-50 via-white to-green-50',
    darkMode
      ? 'from-emerald-900/50 via-green-900/30 to-gray-900'
      : 'from-white via-emerald-50/50 to-green-50/30',
    darkMode
      ? 'from-gray-900 via-emerald-900/30 to-green-900/50'
      : 'from-green-50/30 via-white to-emerald-50',
    darkMode
      ? 'from-emerald-900/30 via-green-900/20 to-gray-900'
      : 'from-emerald-50/50 via-green-50 to-white',
  ];

  // Fast animations
  const fastFadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const slideUpFast = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Enhanced 3D Network Background */}
      <FloatingNetwork darkMode={darkMode} />

      {/* Animated Grid Pattern - Lightweight */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${darkMode ? '#10b981' : '#86efac'} 1px, transparent 1px),
                           linear-gradient(90deg, ${darkMode ? '#10b981' : '#86efac'} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Right Controls */}
      <div className="fixed top-3 right-6 z-50 flex items-center gap-3">
        {user && <ThemeToggle />}
        {user && <NotificationIndicator />}
      </div>

      {/* HERO SECTION */}
      <motion.section
        className={`relative py-16 md:py-20 bg-gradient-to-br ${sectionBackgrounds[0]}`}
        initial="hidden"
        animate={isLoaded ? 'visible' : 'hidden'}
        variants={fastFadeIn}
      >
        <div className="w-full px-6 md:px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content - Enhanced Hero Text */}
            <motion.div variants={textVariants} className="space-y-8">
              {/* Animated Badge */}
              <motion.div
                className="inline-flex items-center gap-3 px-5 py-3 rounded-full backdrop-blur-md border"
                style={{
                  background: darkMode
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))'
                    : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(21, 128, 61, 0.1))',
                  borderColor: darkMode
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(34, 197, 94, 0.3)',
                }}
                whileHover={{ scale: 1.08, y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Star className="text-yellow-500" sx={{ fontSize: 20 }} />
                <span
                  className={`font-semibold text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}
                >
                  ✨ Trusted by 15,000+ KIIT Community
                </span>
              </motion.div>

              {/* Enhanced Hero Heading with Text Transformation */}
              <div className="space-y-6">
                <motion.h1
                  className={`text-6xl md:text-7xl lg:text-8xl font-black leading-tight ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                  style={{ perspective: '1000px' }}
                >
                  <motion.span
                    variants={wordVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative inline-block"
                  >
                    <span className="relative bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent">
                      Nexus
                    </span>
                  </motion.span>
                  <br />
                  <motion.span
                    className="text-3xl md:text-5xl lg:text-6xl block mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={textIndex}
                        initial={{
                          opacity: 0,
                          y: 40,
                          rotateX: 90,
                          filter: 'blur(10px)',
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          rotateX: 0,
                          filter: 'blur(0px)',
                        }}
                        exit={{
                          opacity: 0,
                          y: -40,
                          rotateX: -90,
                          filter: 'blur(10px)',
                        }}
                        transition={{
                          duration: 0.6,
                          ease: 'easeOut',
                        }}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent inline-block"
                      >
                        {
                          [
                            '🤝 Networking',
                            '👥 Mentorship',
                            '🚀 Collaboration',
                            '⭐ Success',
                          ][textIndex]
                        }
                      </motion.span>
                    </AnimatePresence>{' '}
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                      Redefined
                    </span>
                  </motion.span>
                </motion.h1>

                {/* Description */}
                <motion.p
                  variants={slideUpFast}
                  transition={{ delay: 0.4 }}
                  className={`text-xl md:text-2xl max-w-2xl leading-relaxed ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Connecting KIIT students with alumni worldwide through{' '}
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    intelligent networking, mentorship, and career opportunities
                  </span>
                </motion.p>
              </div>

              {/* CTA Buttons */}
              <motion.div
                variants={slideUpFast}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                {!user ? (
                  <>
                    <motion.button
                      onClick={() => navigate('/register')}
                      className="group relative px-8 py-4 rounded-xl font-bold text-lg overflow-hidden"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        background:
                          'linear-gradient(135deg, #10b981, #059669, #047857)',
                        color: 'white',
                        boxShadow: darkMode
                          ? '0 20px 50px rgba(16, 185, 129, 0.3)'
                          : '0 15px 40px rgba(16, 185, 129, 0.2)',
                      }}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Join Free Today
                        <ArrowForward />
                      </span>
                    </motion.button>

                    <motion.button
                      onClick={() => navigate('/login')}
                      className={`group px-8 py-4 rounded-xl font-bold text-lg border-2 transition-all duration-300 ${
                        darkMode
                          ? 'border-emerald-700 text-emerald-400 hover:border-emerald-500 hover:bg-emerald-900/30'
                          : 'border-green-400 text-green-700 hover:border-green-500 hover:bg-green-100/50'
                      }`}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="flex items-center gap-2">
                        Sign In
                        <TrendingFlat />
                      </span>
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    onClick={() => navigate('/dashboard')}
                    className="group relative px-8 py-4 rounded-xl font-bold text-lg overflow-hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background:
                        'linear-gradient(135deg, #10b981, #059669, #047857)',
                      color: 'white',
                      boxShadow: darkMode
                        ? '0 20px 50px rgba(16, 185, 129, 0.3)'
                        : '0 15px 40px rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Go to Dashboard
                      <ArrowForward />
                    </span>
                  </motion.button>
                )}
              </motion.div>
            </motion.div>

            {/* Right Content - Stats Card */}
            <motion.div
              variants={slideUpFast}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <motion.div
                className="backdrop-blur-xl rounded-3xl p-8 border shadow-2xl"
                style={{
                  background: darkMode
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.6))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.8))',
                  borderColor: darkMode
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'rgba(34, 197, 94, 0.3)',
                }}
                whileHover={{ y: -5 }}
              >
                <motion.h3
                  className={`text-3xl font-black mb-8 flex items-center gap-3 ${
                    darkMode ? 'text-green-300' : 'text-green-700'
                  }`}
                  variants={slideUpFast}
                >
                  <RocketLaunch sx={{ fontSize: 32 }} />
                  Your Network Awaits
                </motion.h3>

                <motion.div
                  className="grid grid-cols-2 gap-6"
                  variants={fastFadeIn}
                  transition={{ delay: 0.4 }}
                >
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      variants={slideUpFast}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="text-center group"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div
                        className="text-4xl font-black mb-3"
                        style={{
                          background:
                            'linear-gradient(135deg, #10b981, #059669)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {stat.number}
                      </div>
                      <p
                        className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        {stat.label}
                      </p>
                      {stat.sub && (
                        <p
                          className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          {stat.sub}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* FEATURES SECTION */}
      <motion.section
        className={`relative py-20 md:py-32 bg-gradient-to-br ${sectionBackgrounds[1]}`}
        initial="hidden"
        whileInView="visible"
        variants={fastFadeIn}
        viewport={{ once: true, margin: '-50px' }}
      >
        <div className="w-full px-6 md:px-4 max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            variants={slideUpFast}
            viewport={{ once: true }}
          >
            <h2
              className={`text-5xl md:text-6xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Why Choose{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                Nexus
              </span>
            </h2>
            <p
              className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Everything you need to grow your network and career
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={fastFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {featureList.map((feature, index) => (
              <motion.div
                key={index}
                variants={slideUpFast}
                transition={{ delay: index * 0.1 }}
                className={`group p-8 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
                  darkMode
                    ? 'border-emerald-700/30 bg-gradient-to-br from-emerald-900/20 to-green-900/10 hover:border-emerald-600/50'
                    : 'border-green-200/50 bg-gradient-to-br from-green-50/80 to-emerald-50/80 hover:border-green-300/80 hover:bg-green-50/95'
                }`}
                whileHover={{ y: -5 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div
                  className="text-4xl mb-4 flex items-center justify-center w-14 h-14 rounded-xl"
                  style={{
                    background: darkMode
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))'
                      : 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(21, 128, 61, 0.1))',
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  className={`text-xl font-bold mb-3 ${darkMode ? 'text-green-300' : 'text-green-700'}`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}
                >
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* SUCCESS STORIES SECTION */}
      <motion.section
        className={`relative py-20 md:py-32 bg-gradient-to-br ${sectionBackgrounds[2]}`}
        initial="hidden"
        whileInView="visible"
        variants={fastFadeIn}
        viewport={{ once: true, margin: '-50px' }}
      >
        <div className="w-full px-6 md:px-4 max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            variants={slideUpFast}
            viewport={{ once: true }}
          >
            <h2
              className={`text-5xl md:text-6xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Success Stories
            </h2>
            <p
              className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Real impact from real community members
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={fastFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {successStories.map((story, index) => (
              <motion.div
                key={index}
                variants={slideUpFast}
                transition={{ delay: index * 0.1 }}
                className={`p-8 rounded-2xl border backdrop-blur-xl group transition-all duration-300 ${
                  darkMode
                    ? 'border-emerald-700/30 bg-gradient-to-br from-emerald-900/20 to-green-900/10 hover:border-emerald-600/50'
                    : 'border-green-200/50 bg-gradient-to-br from-green-50/80 to-emerald-50/80 hover:border-green-300/80'
                }`}
                whileHover={{ y: -5 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div
                  className={`font-bold text-lg mb-3 ${darkMode ? 'text-green-400' : 'text-green-700'}`}
                >
                  {story.achievement}
                </div>
                <p
                  className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}
                >
                  "{story.story}"
                </p>
                <div>
                  <p
                    className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-700'}`}
                  >
                    {story.name}
                  </p>
                  <p
                    className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {story.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA SECTION */}
      <motion.section
        className={`relative py-20 md:py-32 bg-gradient-to-br ${sectionBackgrounds[3]}`}
        initial="hidden"
        whileInView="visible"
        variants={fastFadeIn}
        viewport={{ once: true, margin: '-50px' }}
      >
        <div className="w-full px-6 md:px-4 max-w-4xl mx-auto relative z-10 text-center">
          <motion.h2
            className={`text-5xl md:text-6xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            variants={slideUpFast}
            viewport={{ once: true }}
          >
            Ready to{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
              Transform Your Future?
            </span>
          </motion.h2>

          <motion.p
            className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            variants={slideUpFast}
            viewport={{ once: true }}
          >
            Join thousands of KIIT students and alumni building meaningful
            connections.
          </motion.p>

          {!user && (
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={slideUpFast}
              viewport={{ once: true }}
            >
              <motion.button
                onClick={() => navigate('/register')}
                className="group relative px-10 py-4 rounded-xl font-bold text-lg overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background:
                    'linear-gradient(135deg, #10b981, #059669, #047857)',
                  color: 'white',
                  boxShadow: darkMode
                    ? '0 20px 50px rgba(16, 185, 129, 0.3)'
                    : '0 15px 40px rgba(16, 185, 129, 0.2)',
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <ArrowForward />
                </span>
              </motion.button>

              <motion.button
                onClick={() => navigate('/login')}
                className={`px-10 py-4 rounded-xl font-bold text-lg border-2 transition-all ${
                  darkMode
                    ? 'border-emerald-600 text-emerald-400 hover:bg-emerald-900/30'
                    : 'border-green-400 text-green-700 hover:bg-green-100/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Footer */}
      <footer
        className={`${darkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t border-gray-200'} py-12`}
      >
        <div className="w-full px-6 md:px-4 max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3
                className={`font-bold text-lg mb-4 ${darkMode ? 'text-green-400' : 'text-green-700'}`}
              >
                Nexus
              </h3>
              <p
                className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Building connections, creating opportunities.
              </p>
            </div>
            <div>
              <h4
                className={`font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}
              >
                Product
              </h4>
              <ul
                className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                <li>Features</li>
                <li>Pricing</li>
                <li>Security</li>
              </ul>
            </div>
            <div>
              <h4
                className={`font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}
              >
                Company
              </h4>
              <ul
                className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
              </ul>
            </div>
            <div className="flex gap-4">
              <LinkedIn
                className={darkMode ? 'text-gray-400' : 'text-gray-600'}
              />
              <Twitter
                className={darkMode ? 'text-gray-400' : 'text-gray-600'}
              />
              <GitHub
                className={darkMode ? 'text-gray-400' : 'text-gray-600'}
              />
            </div>
          </div>
          <div
            className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}
          >
            © 2025 Nexus. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
