import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowOutward } from '@mui/icons-material';
import { TextFlip } from './ui/text-flip';

import { useLandingPage } from '@/contexts/LandingPageContext';

interface NewsSectionProps {
  sectionBackground: string;
}

const NewsSection: React.FC<NewsSectionProps> = ({ sectionBackground }) => {
  const { isDark } = useTheme();
  const darkMode = isDark;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { news, loading: newsLoading, loadNews } = useLandingPage();

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const hasNews = Array.isArray(news) && news.length > 0;

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

        <div className="grid lg:grid-cols-3 gap-6" aria-busy={newsLoading}>
          {newsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <article
                key={`news-skeleton-${index}`}
                className={`rounded-3xl border p-6 md:p-7 backdrop-blur-xl animate-pulse ${
                  darkMode
                    ? 'border-violet-300/20 bg-slate-900/45'
                    : 'border-violet-200 bg-white/80'
                } ${index === 0 ? 'lg:col-span-2 lg:min-h-[250px]' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`h-6 w-24 rounded-full ${
                      darkMode ? 'bg-violet-300/20' : 'bg-violet-100'
                    }`}
                  />
                  <div
                    className={`h-4 w-24 rounded ${
                      darkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  />
                </div>
                <div
                  className={`h-8 w-4/5 rounded mb-4 ${
                    darkMode ? 'bg-slate-700' : 'bg-slate-200'
                  }`}
                />
                <div className="space-y-2">
                  <div
                    className={`h-4 w-full rounded ${
                      darkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`h-4 w-11/12 rounded ${
                      darkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`h-4 w-2/3 rounded ${
                      darkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  />
                </div>
              </article>
            ))
          ) : !hasNews ? (
            <div
              className={`lg:col-span-3 rounded-3xl border p-10 text-center ${
                darkMode
                  ? 'border-violet-300/20 bg-slate-900/45 text-slate-300'
                  : 'border-violet-200 bg-white/80 text-slate-700'
              }`}
            >
              <p className="text-xl font-semibold mb-2">No updates found</p>
              <p
                className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
              >
                There are no news posts available right now. Please check back
                later.
              </p>
              <button
                onClick={() => {
                  void loadNews();
                }}
                className={`mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 border font-semibold ${
                  darkMode
                    ? 'border-violet-300/30 text-violet-200 hover:bg-violet-400/10'
                    : 'border-violet-200 text-violet-700 hover:bg-violet-50'
                }`}
              >
                Retry
              </button>
            </div>
          ) : (
            news.map((item, index) => (
              <motion.article
                key={item.id}
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
                    {item.topic}
                  </span>
                  <span
                    className={`text-xs ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'No date'}
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
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
