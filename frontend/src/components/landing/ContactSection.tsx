import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Email, Chat } from '@mui/icons-material';
import { TextRevealCard } from '../ui/text-reveal-card';

interface ContactSectionProps {
  sectionBackground: string;
}

const CONTACT_OPTIONS = [
  {
    icon: <Email sx={{ fontSize: 24 }} />,
    title: 'Email Us',
    desc: 'Get answers within 24 hours from our community team.',
  },
  {
    icon: <Chat sx={{ fontSize: 24 }} />,
    title: 'Live AI Chat',
    desc: 'Chat with AI support for help.',
  },
];

const ContactSection: React.FC<ContactSectionProps> = ({
  sectionBackground,
}) => {
  const { isDark } = useTheme();
  const darkMode = isDark;

  return (
    <section
      className={`relative py-10 md:py-14 bg-transparent ${sectionBackground}`}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-[1.1fr_1fr] gap-8"
        >
          <div>
            <p
              className={`text-sm uppercase tracking-[0.2em] mb-3 ${
                darkMode ? 'text-sky-300' : 'text-sky-700'
              }`}
            >
              Contact & support
            </p>
            <h2
              className={`text-4xl md:text-5xl font-black mb-4 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              <TextRevealCard text="Need help? Reach us your way." />
            </h2>
            <p
              className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} mb-8`}
            >
              This section now combines service cards and a quick-contact panel
              to break the repetitive top-to-bottom flow.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {CONTACT_OPTIONS.map((option, index) => (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className={`rounded-2xl border p-5 backdrop-blur-xl ${
                    darkMode
                      ? 'border-sky-300/20 bg-slate-900/45'
                      : 'border-sky-200 bg-white/80'
                  } ${index === 2 ? 'sm:col-span-2' : ''}`}
                >
                  <div
                    className={`inline-flex p-2.5 rounded-xl mb-3 ${
                      darkMode
                        ? 'bg-sky-400/20 text-sky-200'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {option.icon}
                  </div>
                  <h3
                    className={`text-lg font-bold mb-2 ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {option.title}
                  </h3>
                  <p
                    className={`${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
                  >
                    {option.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className={`rounded-3xl border p-6 md:p-7 backdrop-blur-xl ${
              darkMode
                ? 'border-cyan-300/20 bg-slate-900/50'
                : 'border-cyan-200 bg-white/85'
            }`}
          >
            {/* {CONTACT_OPTIONS.map((option) => (
              <motion.div
                key={option.title}
                variants={cardVariants}
                className={`group relative p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 overflow-hidden ${
                  darkMode
                    ? 'border-emerald-500/20 bg-emerald-900/10 hover:bg-emerald-900/20'
                    : 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
                }`}
                whileHover={{ y: -8, rotate: 0.5 }}
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                    darkMode
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {option.icon}
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {option.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {option.desc}
                </p>
              </motion.div>
            ))} */}
            <h3
              className={`text-2xl font-bold mb-2 ${
                darkMode ? 'text-cyan-200' : 'text-cyan-700'
              }`}
            >
              Quick message
            </h3>
            <p
              className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} mb-5`}
            >
              Drop your query and our team will route it to the right mentor or
              support specialist.
            </p>
            <div className="space-y-3">
              {['Your name', 'Email address', 'How can we help?'].map(
                (field) => (
                  <div
                    key={field}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      darkMode
                        ? 'border-slate-700 bg-slate-800/70 text-slate-400'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {field}
                  </div>
                )
              )}
            </div>
            <button
              className={`mt-5 w-full rounded-xl py-3 font-semibold ${
                darkMode
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
              }`}
            >
              Send request
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
