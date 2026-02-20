import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Star } from '@mui/icons-material';
import { TextGenerateEffect } from '../ui/text-generate-effect';

interface Story {
  name: string;
  role: string;
  achievement: string;
  story: string;
  image: string;
  highlight: string;
}

interface SuccessStoriesProps {
  sectionBackground: string;
}

const STORIES: Story[] = [
  {
    name: 'Aarav Singh',
    role: 'Computer Science, 2024',
    achievement: 'Built a live SaaS product with alumni mentor',
    story:
      'Collaborated with an alum working in a startup to build a real client dashboard. Learned production-level coding and deployment.',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
    highlight: 'Deployed to 500+ users',
  },
  {
    name: 'Riya Kapoor',
    role: 'Business Analytics, 2023',
    achievement: 'Worked on real startup growth strategy',
    story:
      'Partnered with an alumni founder to analyze customer data and improve user retention strategies.',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
    highlight: 'Improved retention by 18%',
  },
  {
    name: 'Vikram Joshi',
    role: 'Mechanical Engineering, 2024',
    achievement: 'Designed prototype with industry mentor',
    story:
      'Worked alongside an alumni product engineer to design and simulate a mechanical prototype for a real client.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    highlight: 'Project adopted by startup',
  },
  {
    name: 'Neha Verma',
    role: 'UX Design, 2023',
    achievement: 'Led UI redesign for alumni-led startup',
    story:
      'Collaborated with an alumni CTO to redesign their mobile app experience and conduct real user testing.',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    highlight: '40% boost in engagement',
  },
  {
    name: 'Aditya Rao',
    role: 'Data Science, 2024',
    achievement: 'Built ML model for real business case',
    story:
      'Worked with an alumni data lead to create a predictive model for sales forecasting using live datasets.',
    image:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=500&q=80',
    highlight: 'Model deployed internally',
  },
];

// Inject keyframes once
const KEYFRAMES = `
@keyframes carousel-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`;

if (typeof document !== 'undefined') {
  const id = '__carousel-scroll-style__';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
  }
}

const CARD_WIDTH = 420;
const CARD_GAP = 24;
const DURATION_S = 32; // seconds per full cycle

const StoriesCarousel = () => {
  const { isDark: darkMode } = useTheme();
  const [paused, setPaused] = useState(false);

  // Duplicate for seamless infinite scroll (2x is enough — CSS handles the loop)
  const items = [...STORIES, ...STORIES];

  return (
    <div
      className={`relative overflow-hidden rounded-[32px] border p-4 md:p-6 ${
        darkMode
          ? 'border-emerald-400/20 bg-slate-900/30'
          : 'border-emerald-200 bg-white/70'
      }`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Gradient fade edges */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{
          background: darkMode
            ? 'linear-gradient(to right, rgba(15,23,42,0.95), transparent)'
            : 'linear-gradient(to right, rgba(255,255,255,0.95), transparent)',
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{
          background: darkMode
            ? 'linear-gradient(to left, rgba(15,23,42,0.95), transparent)'
            : 'linear-gradient(to left, rgba(255,255,255,0.95), transparent)',
        }}
      />

      {/* Scrolling track */}
      <div
        style={{
          display: 'flex',
          gap: CARD_GAP,
          width: 'max-content',
          animation: `carousel-scroll ${DURATION_S}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
          willChange: 'transform',
        }}
      >
        {items.map((story, index) => (
          <article
            key={`${story.name}-${index}`}
            style={{ minWidth: CARD_WIDTH, width: CARD_WIDTH }}
            className={`relative flex flex-col gap-5 rounded-3xl border p-6 backdrop-blur-xl transition-shadow duration-300 hover:shadow-2xl ${
              darkMode
                ? 'border-emerald-400/20 bg-slate-900/55 hover:border-emerald-400/40'
                : 'border-emerald-200 bg-white/90 hover:border-emerald-300 hover:shadow-emerald-200/50'
            }`}
          >
            {/* Profile */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <img
                  src={story.image}
                  alt={story.name}
                  loading="lazy"
                  className="w-16 h-16 rounded-2xl object-cover"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 bg-green-500 ${
                    darkMode ? 'border-slate-900' : 'border-white'
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    darkMode ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  {story.name}
                </p>
                <p
                  className={`text-xs ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {story.role}
                </p>
              </div>
            </div>

            {/* Highlight badge */}
            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
                darkMode
                  ? 'bg-cyan-400/15 text-cyan-200'
                  : 'bg-cyan-100 text-cyan-700'
              }`}
            >
              {story.highlight}
            </div>

            {/* Achievement + quote */}
            <div>
              <h3
                className={`text-xl font-bold mb-2 ${
                  darkMode
                    ? 'bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-emerald-700 to-emerald-600 bg-clip-text text-transparent'
                }`}
              >
                {story.achievement}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                "{story.story}"
              </p>
            </div>

            {/* Stars */}
            <div className="flex gap-1 items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  sx={{ fontSize: 18, color: darkMode ? '#facc15' : '#f59e0b' }}
                />
              ))}
              <span
                className={`text-xs ml-2 ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                5.0
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

const SuccessStoriesSection: React.FC<SuccessStoriesProps> = ({
  sectionBackground,
}) => {
  const { isDark } = useTheme();
  const darkMode = isDark;

  const sentences = [
    'Success stories with real outcomes.',
    'Success stories that drive results.',
    'From connection to career success.',
    'Where ambition turns into achievement.',
  ];

  return (
    <section className={`relative py-10 md:py-14 ${sectionBackground}`}>
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-12"
        >
          <div>
            <p
              className={`text-sm uppercase tracking-[0.22em] mb-3 ${
                darkMode ? 'text-emerald-300/90' : 'text-emerald-700'
              }`}
            >
              Student journeys
            </p>

            <TextGenerateEffect
              sentences={sentences}
              className={`text-3xl md:text-4xl font-black ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            />
          </div>
        </motion.div>

        <StoriesCarousel />
      </div>
    </section>
  );
};

export default SuccessStoriesSection;
