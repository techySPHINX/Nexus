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

/**
 * Feature interface: structure for each feature card
 */
interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

/**
 * Props for FeaturesSection component
 */
interface FeaturesProps {
  sectionBackground: string;
}

/**
 * Features data array
 * Contains 6 core features of the Nexus platform
 * Each feature has an icon, title, and description
 */
const FEATURES: Feature[] = [
  {
    icon: <ConnectWithoutContact sx={{ fontSize: 28 }} />,
    title: 'Smart Connections',
    desc: 'AI-powered matching that introduces students to alumni mentors based on goals and domain.',
  },
  {
    icon: <Work sx={{ fontSize: 28 }} />,
    title: 'Career Guidance',
    desc: 'Actionable guidance from industry professionals for resumes, internships, and interview prep.',
  },
  {
    icon: <School sx={{ fontSize: 28 }} />,
    title: 'Mentorship Programs',
    desc: 'Structured mentorship journeys with milestones to keep progress transparent and motivating.',
  },
  {
    icon: <Groups sx={{ fontSize: 28 }} />,
    title: 'Community Groups',
    desc: 'Topic-specific communities where students and alumni collaborate on meaningful conversations.',
  },
  {
    icon: <RocketLaunch sx={{ fontSize: 28 }} />,
    title: 'Project Collaboration',
    desc: 'Build side projects, startups, and research teams with trusted contributors from campus network.',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 28 }} />,
    title: 'Skill Development',
    desc: 'Learn through expert sessions, curated paths, and peer-backed progress checkpoints.',
  },
];

const FeaturesSection: React.FC<FeaturesProps> = ({ sectionBackground }) => {
  const { isDark } = useTheme();
  const darkMode = isDark;

  return (
    <section className={`relative py-20 md:py-28 ${sectionBackground}`}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header with title and description */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-end mb-14"
        >
          <div>
            <p
              className={`text-sm uppercase tracking-[0.25em] mb-3 ${
                darkMode ? 'text-cyan-300/80' : 'text-cyan-700'
              }`}
            >
              Features built for growth
            </p>
            <h2
              className={`text-4xl md:text-5xl font-black leading-tight ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Diverse tools, one smooth mentorship journey.
            </h2>
          </div>
        </motion.div>

        {/* Features grid: 2 cols on tablet, 3 on desktop, equal heights */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6 auto-rows-fr">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              whileHover={{
                y: -6,
                transition: { duration: 0.25, ease: 'easeOut' },
              }}
              className={`group relative flex flex-col h-full overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 md:p-8 backdrop-blur-xl transition-all duration-300 cursor-pointer ${
                darkMode
                  ? 'border-cyan-400/20 bg-slate-900/40 hover:bg-slate-900/70 hover:border-cyan-400/40 hover:shadow-[0_20px_40px_rgba(8,145,178,0.15)]'
                  : 'border-cyan-200 bg-white/70 hover:bg-white/95 hover:border-cyan-300 hover:shadow-[0_20px_40px_rgba(14,165,233,0.15)]'
              }`}
            >
              {/* Animated gradient background on hover */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  darkMode
                    ? 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent'
                    : 'bg-gradient-to-br from-cyan-100/70 via-blue-100/30 to-transparent'
                }`}
              />

              {/* Subtle border glow on hover */}
              <div
                className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  darkMode
                    ? 'shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]'
                    : 'shadow-[inset_0_0_20px_rgba(14,165,233,0.1)]'
                }`}
              />

              {/* Icon container with scale and rotation on hover */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
                className={`relative z-10 inline-flex items-center justify-center rounded-xl sm:rounded-2xl p-2.5 sm:p-3 mb-3 sm:mb-5 transition-all duration-300 w-fit group-hover:rotate-12 ${
                  darkMode
                    ? 'bg-cyan-400/15 text-cyan-300 group-hover:bg-cyan-400/25'
                    : 'bg-cyan-100 text-cyan-700 group-hover:bg-cyan-200'
                }`}
              >
                {feature.icon}
              </motion.div>

              {/* Feature title */}
              <h3
                className={`relative z-10 text-base sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 transition-colors duration-300 ${
                  darkMode
                    ? 'text-white group-hover:text-cyan-100'
                    : 'text-slate-900 group-hover:text-cyan-900'
                }`}
              >
                {feature.title}
              </h3>
              {/* Feature description - uses flex-grow to push bottom accent line down */}
              <p
                className={`relative z-10 flex-grow leading-snug hidden md:block text-xs md:text-base transition-colors duration-300 ${
                  darkMode
                    ? 'text-slate-300 group-hover:text-slate-200'
                    : 'text-slate-600 group-hover:text-slate-700'
                }`}
              >
                {feature.desc}
              </p>

              {/* Bottom accent line that expands on hover */}
              <div
                className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ${
                  darkMode
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                }`}
              />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
