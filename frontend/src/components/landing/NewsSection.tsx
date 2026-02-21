import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowOutward } from '@mui/icons-material';
import { TextFlip } from '../ui/text-flip';

interface NewsItem {
  title: string;
  summary: string;
  category: string;
  date: string;
}

interface NewsSectionProps {
  sectionBackground: string;
}

const NEWS: NewsItem[] = [
  {
    title: 'Nexus mentorship week opens with 200+ alumni volunteers',
    summary:
      'Students joined live office hours and portfolio clinics hosted by domain experts across industries.',
    category: 'Community',
    date: 'Sep 14, 2026',
  },
  {
    title: 'New startup collaboration channel launched for final-year teams',
    summary:
      'Founders can now discover technical, design, and growth collaborators with verified profiles.',
    category: 'Product',
    date: 'Sep 10, 2026',
  },
  {
    title: 'Referral tracker now supports custom prep checklists',
    summary:
      'Applicants can monitor readiness with role-based checklists shared by alumni from target companies.',
    category: 'Career',
    date: 'Sep 2, 2026',
  },
];

const NewsSection: React.FC<NewsSectionProps> = ({ sectionBackground }) => {
  const { isDark } = useTheme();
  const darkMode = isDark;
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section
      className={`relative py-10 md:py-14 rounded-[8rem] ${sectionBackground}`}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-5 mb-12"
        >
          <div>
            <p
              className={`text-sm uppercase tracking-[0.2em] mb-2 ${
                darkMode ? 'text-violet-300/90' : 'text-violet-700'
              }`}
            >
              Latest from Nexus
            </p>
            <h2
              className={`text-4xl md:text-5xl font-black ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              <TextFlip sentences={['Campus pulse.', 'Platform updates.']} />
            </h2>
          </div>
          {user && (
            <button
              onClick={() => navigate('/news')}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 border font-semibold ${
                darkMode
                  ? 'border-violet-300/30 text-violet-200 hover:bg-violet-400/10'
                  : 'border-violet-200 text-violet-700 hover:bg-violet-50'
              }`}
            >
              {/* > */}
              View all updates
              <ArrowOutward sx={{ fontSize: 18 }} />
            </button>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {NEWS.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className={`rounded-3xl border p-6 md:p-7 backdrop-blur-xl ${
                darkMode
                  ? 'border-violet-300/20 bg-slate-900/45'
                  : 'border-violet-200 bg-white/80'
              } ${index === 0 ? 'lg:col-span-2 lg:min-h-[250px]' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full font-bold ${
                    darkMode
                      ? 'bg-violet-400/20 text-violet-200'
                      : 'bg-violet-100 text-violet-700'
                  }`}
                >
                  {item.category}
                </span>
                <span
                  className={`text-xs ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {item.date}
                </span>
              </div>
              <h3
                className={`text-2xl font-bold mb-3 leading-tight ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {item.title}
              </h3>
              <p
                className={`${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
              >
                {item.summary}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
