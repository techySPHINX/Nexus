import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface NewsItem {
  title: string;
  summary: string;
  date: string;
  tag: string;
}

interface NewsSectionProps {
  sectionBackground: string;
}

const NEWS: NewsItem[] = [
  {
    title: 'Nexus partners with 50 new companies',
    summary:
      'Expanded referral network now includes top product and AI teams across the globe.',
    date: 'Dec 2025',
    tag: 'Partnerships',
  },
  {
    title: 'Mentor spotlight: KIIT alumni in FAANG',
    summary:
      'Learn from alumni leaders on navigating interviews, portfolios, and promotions.',
    date: 'Nov 2025',
    tag: 'Mentorship',
  },
  {
    title: 'Scholarship fund announced',
    summary:
      'Community-backed fund to support student research and international internships.',
    date: 'Nov 2025',
    tag: 'Opportunities',
  },
];

const NewsSection: React.FC<NewsSectionProps> = ({ sectionBackground }) => {
  const { isDark } = useTheme();
  const darkMode = isDark;

  const revealStyle = `
    @keyframes reveal-swipe {
      0% { transform: translateX(30%); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
    .swipe-mask {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2));
      transform: translateX(-100%);
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
    hidden: { opacity: 0, y: 24, rotateX: 6 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <>
      <style>{revealStyle}</style>
      <section
        className={`relative py-20 md:py-32 bg-gradient-to-br ${sectionBackground}`}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between flex-wrap gap-4 mb-12"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-black">
                <span className="relative inline-block">
                  <span
                    className="relative z-10"
                    style={{
                      background: 'linear-gradient(120deg, #10b981, #06b6d4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Latest News
                  </span>
                  <span
                    className="absolute inset-x-0 bottom-0 h-3 rounded-full opacity-30"
                    style={{
                      background: darkMode
                        ? 'linear-gradient(90deg, rgba(16,185,129,0.35), rgba(6,182,212,0.3))'
                        : 'linear-gradient(90deg, rgba(16,185,129,0.25), rgba(6,182,212,0.2))',
                    }}
                  />
                </span>
              </h2>
              <p
                className={`text-lg md:text-xl ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Stay in the loop with community wins, events, and opportunities
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${darkMode ? 'border-emerald-500/40 text-emerald-300' : 'border-emerald-600/40 text-emerald-700'}`}
            >
              Updated weekly
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {NEWS.map((item) => (
              <motion.div
                key={item.title}
                variants={cardVariants}
                className={`group relative p-6 rounded-2xl border overflow-hidden backdrop-blur-xl transition-all duration-300 ${
                  darkMode
                    ? 'border-emerald-500/20 bg-emerald-900/10 hover:bg-emerald-900/20'
                    : 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
                }`}
                whileHover={{ y: -6, rotate: -1 }}
              >
                <span
                  className={`inline-flex items-center px-3 py-1 text-xs rounded-full mb-3 font-semibold ${
                    darkMode
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {item.tag}
                </span>
                <div className="flex items-center justify-between text-xs mb-2 uppercase tracking-wide">
                  <span
                    className={darkMode ? 'text-gray-400' : 'text-gray-500'}
                  >
                    {item.date}
                  </span>
                  <span className="text-emerald-500 font-semibold">
                    Swipe →
                  </span>
                </div>
                <h3
                  className={`text-xl font-bold mb-3 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {item.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {item.summary}
                </p>

                <motion.div
                  className="swipe-mask"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 0.15, translateX: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default NewsSection;
