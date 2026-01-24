import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Star } from '@mui/icons-material';

interface Story {
  name: string;
  role: string;
  achievement: string;
  story: string;
}

interface SuccessStoriesProps {
  sectionBackground: string;
}

const STORIES: Story[] = [
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

const SuccessStoriesSection: React.FC<SuccessStoriesProps> = ({
  sectionBackground,
}) => {
  const { isDark } = useTheme();
  const darkMode = isDark;

  const pulseStyle = `
    @keyframes pulse-glow {
      0%, 100% { 
        text-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
      }
      50% { 
        text-shadow: 0 0 20px rgba(16, 185, 129, 1), 0 0 10px rgba(20, 184, 166, 0.8);
      }
    }
    .pulse-text {
      animation: pulse-glow 2s ease-in-out infinite;
      font-weight: bold;
    }
  `;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <>
      <style>{pulseStyle}</style>
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
              <span className="pulse-text">Success Stories</span>
            </h2>
            <p
              className={`text-lg md:text-xl ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Real impact from real community members
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {STORIES.map((story, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                className={`group relative p-8 rounded-2xl border backdrop-blur-xl transition-all duration-300 overflow-hidden ${
                  darkMode
                    ? 'border-teal-500/20 bg-teal-900/10 hover:bg-teal-900/20'
                    : 'border-cyan-200 bg-cyan-50/30 hover:bg-cyan-50/60'
                }`}
                whileHover={{
                  y: -8,
                  boxShadow: darkMode
                    ? '0 20px 25px rgba(20, 184, 166, 0.15)'
                    : '0 20px 25px rgba(6, 182, 212, 0.15)',
                }}
              >
                {/* Gradient background */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    darkMode
                      ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/10'
                      : 'bg-gradient-to-br from-green-400/10 to-emerald-400/10'
                  }`}
                />

                {/* Achievement title */}
                <div
                  className={`relative z-10 font-bold text-lg mb-3 ${
                    darkMode ? 'text-green-400' : 'text-green-700'
                  }`}
                >
                  {story.achievement}
                </div>

                {/* Story text */}
                <p
                  className={`relative z-10 mb-4 leading-relaxed ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  "{story.story}"
                </p>

                {/* Stars */}
                <div className="relative z-10 flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Star
                        sx={{
                          fontSize: 16,
                          color: darkMode ? '#fbbf24' : '#f59e0b',
                        }}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Author info */}
                <div className="relative z-10 pt-3 border-t border-current/10">
                  <div className="font-bold">
                    <span className="pulse-text text-sm md:text-base">
                      {story.name}
                    </span>
                  </div>
                  <div
                    className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {story.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default SuccessStoriesSection;
