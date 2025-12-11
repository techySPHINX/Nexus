import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Email, Chat, SupportAgent } from '@mui/icons-material';

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
    title: 'Live Chat',
    desc: 'Chat with support during business hours.',
  },
  {
    icon: <SupportAgent sx={{ fontSize: 24 }} />,
    title: 'Mentor Helpdesk',
    desc: 'Get matched with a mentor for guidance.',
  },
];

const ContactSection: React.FC<ContactSectionProps> = ({
  sectionBackground,
}) => {
  const { isDark } = useTheme();
  const darkMode = isDark;

  const neonStyle = `
    @keyframes underline-glow {
      0% { width: 0; opacity: 0; }
      50% { width: 100%; opacity: 1; }
      100% { width: 0; opacity: 0; }
    }
    .neon-underline {
      position: relative;
    }
    .neon-underline::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -6px;
      height: 3px;
      background: linear-gradient(90deg, #10b981, #06b6d4);
      animation: underline-glow 2.5s ease-in-out infinite;
      border-radius: 9999px;
    }
  `;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: 'easeOut' },
    },
  };

  return (
    <>
      <style>{neonStyle}</style>
      <section
        className={`relative py-20 md:py-32 bg-gradient-to-br ${sectionBackground}`}
      >
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-3 neon-underline inline-block">
              Contact & Support
            </h2>
            <p
              className={`text-lg md:text-xl ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Reach out anytime; we are here to help your journey
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {CONTACT_OPTIONS.map((option) => (
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
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default ContactSection;
