import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ConnectWithoutContact,
  Work,
  School,
  Groups,
  RocketLaunch,
  TrendingUp,
} from '@mui/icons-material';

interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

interface FeaturesProps {
  sectionBackground: string;
}

const FEATURES: Feature[] = [
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
    desc: 'Access workshops, resources, and learning paths curated by industry professionals.',
  },
];

const FeaturesSection: React.FC<FeaturesProps> = ({ sectionBackground }) => {
  const { isDark } = useTheme();
  const darkMode = isDark;

  const shimmerStyle = `
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    .shimmer-text {
      background: linear-gradient(
        90deg,
        #090909ff 25%,
        #686885ff 50%,
        #070707ff 75%
      );
      background-size: 1000px 100%;
      animation: shimmer 2s infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .shimmer-text-dark {
      background: linear-gradient(
        90deg,
        #f7f7f7ff 25%,
        #aaabacff 50%,
        #f8f8f9ff 75%
      );
      background-size: 1000px 100%;
      animation: shimmer 2s infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  `;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <>
      <style>{shimmerStyle}</style>
      <section
        className={`relative py-20 md:py-32 bg-gradient-to-br ${sectionBackground}`}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className={darkMode ? 'shimmer-text-dark' : 'shimmer-text'}>
                Powerful Features
              </span>
            </h2>
            <p
              className={`text-lg md:text-xl ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Everything you need to build meaningful connections
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {FEATURES.map((feature, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                className={`group relative p-8 rounded-2xl border backdrop-blur-xl transition-all duration-300 overflow-hidden ${
                  darkMode
                    ? 'border-emerald-500/20 bg-emerald-900/10 hover:bg-emerald-900/20'
                    : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
                }`}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    darkMode
                      ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10'
                      : 'bg-gradient-to-br from-emerald-400/10 to-cyan-400/10'
                  }`}
                />

                <div
                  className={`relative z-10 text-3xl mb-4 inline-block p-3 rounded-xl transition-all duration-300 group-hover:rotate-[10deg] group-hover:scale-110 ${
                    darkMode
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-emerald-200/50 text-emerald-700'
                  }`}
                >
                  <div className="transition-all duration-600 group-hover:rotate-[20deg] group-hover:scale-110">
                    {feature.icon}
                  </div>
                </div>

                <h3 className="relative z-10 text-xl font-bold mb-3">
                  <span
                    className={`inline-block ${
                      darkMode ? 'shimmer-text-dark' : 'shimmer-text'
                    }`}
                  >
                    {feature.title}
                  </span>
                </h3>
                <p
                  className={`relative z-10 text-sm md:text-base ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSection;
