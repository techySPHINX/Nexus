import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ExpandMore } from '@mui/icons-material';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  sectionBackground: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'Is Nexus free for students?',
    answer:
      'Yes, students can join and access mentorship, jobs, and events for free.',
  },
  {
    question: 'How do referrals work?',
    answer:
      'Verified alumni can submit referrals directly; students receive guidance to prepare.',
  },
  {
    question: 'Can I become a mentor?',
    answer:
      'Alumni can apply to mentor; we verify profiles before matching with students.',
  },
];

const FAQSection: React.FC<FAQSectionProps> = ({ sectionBackground }) => {
  const { isDark } = useTheme();
  const darkMode = isDark;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const flipStyle = `
    @keyframes flip-in {
      0% { transform: rotateX(-90deg); opacity: 0; }
      100% { transform: rotateX(0deg); opacity: 1; }
    }
    .flip-card {
      transform-origin: top;
      animation: flip-in 0.45s ease;
    }
  `;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
  };

  return (
    <>
      <style>{flipStyle}</style>
      <section
        className={`relative py-20 md:py-32 bg-gradient-to-br ${sectionBackground}`}
      >
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-3">
              <span
                className="inline-block"
                style={{
                  background: 'linear-gradient(120deg, #22c55e, #0ea5e9)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                FAQs
              </span>
            </h2>
            <p
              className={`text-lg md:text-xl ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Quick answers to help you get started
            </p>
          </motion.div>

          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {FAQS.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div
                  key={item.question}
                  variants={containerVariants}
                  className={`rounded-2xl border overflow-hidden backdrop-blur-xl transition-all duration-300 ${
                    darkMode
                      ? 'border-emerald-500/20 bg-emerald-900/10'
                      : 'border-emerald-200 bg-emerald-50/50'
                  }`}
                >
                  <button
                    type="button"
                    className="w-full px-5 md:px-6 py-4 flex items-center justify-between text-left"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-base md:text-lg font-semibold ${
                          darkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {item.question}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={`rounded-full p-1 ${
                        darkMode ? 'text-emerald-300' : 'text-emerald-600'
                      }`}
                    >
                      <ExpandMore />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-5 md:px-6 pb-5 flip-card">
                          <p
                            className={`text-sm md:text-base leading-relaxed ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                          >
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default FAQSection;
