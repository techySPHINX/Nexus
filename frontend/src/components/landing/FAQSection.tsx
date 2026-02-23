import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ExpandMore } from '@mui/icons-material';

interface FAQ {
  q: string;
  a: string;
}

interface FAQSectionProps {
  sectionBackground: string;
}

const FAQS: FAQ[] = [
  {
    q: 'Who can join Nexus?',
    a: 'Current students, alumni, and verified mentors associated with the KIIT community can join Nexus.',
  },
  {
    q: 'How does mentor matching work?',
    a: 'Nexus uses profile interests, goals, and activity signals to recommend relevant mentors and peers.',
  },
  {
    q: 'Is Nexus free for students?',
    a: 'Yes, core community features for students are free, including networking, discussions, and mentorship discovery.',
  },
  {
    q: 'Can I ask for referral guidance?',
    a: 'Absolutely. Nexus includes referral-oriented communities where alumni share role-specific preparation tips.',
  },
];

const FAQSection: React.FC<FAQSectionProps> = ({ sectionBackground }) => {
  const { isDark } = useTheme();
  const darkMode = isDark;
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      className={`relative py-8 md:py-10 rounded-[8rem] ${sectionBackground}`}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-[0.95fr_1.2fr] gap-8 items-start">
          <div className="p-7">
            <motion.div className="mb-6 hidden md:block">
              <svg
                viewBox="0 0 300 120"
                className="w-full h-auto max-w-md"
                style={{
                  filter: darkMode
                    ? 'drop-shadow(0 0 30px rgba(34, 197, 94, 0.4)) drop-shadow(0 0 15px rgba(14, 165, 233, 0.3))'
                    : 'drop-shadow(0 0 30px rgba(22, 163, 74, 0.3)) drop-shadow(0 0 15px rgba(2, 132, 199, 0.2))',
                }}
              >
                <defs>
                  <linearGradient
                    id="faqGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop
                      offset="0%"
                      stopColor={darkMode ? '#22c55e' : '#16a34a'}
                    />
                    <stop
                      offset="50%"
                      stopColor={darkMode ? '#0ea5e9' : '#0284c7'}
                    />
                    <stop
                      offset="100%"
                      stopColor={darkMode ? '#a855f7' : '#9333ea'}
                    />
                  </linearGradient>
                </defs>
                <text
                  x="50%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  className="font-black"
                  style={{
                    fontSize: '90px',
                    fill: 'none',
                    stroke: 'url(#faqGradient)',
                    strokeWidth: '3px',
                    letterSpacing: '0.05em',
                  }}
                >
                  FAQs
                </text>
              </svg>
            </motion.div>
            <div className="grid grid-cols-[1fr_auto] gap-1 items-center">
              <h3
                className={`text-2xl md:text-3xl font-bold leading-tight ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Frequently Asked Questions before you join
              </h3>
              <motion.div
                animate={{
                  rotateY: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  transformStyle: 'revert-layer',
                }}
                className={`text-9xl font-black ${
                  darkMode ? 'text-cyan-400' : 'text-cyan-600'
                }`}
              >
                ?
              </motion.div>
            </div>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const open = openIndex === index;
              return (
                <motion.button
                  key={faq.q}
                  type="button"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  onClick={() => setOpenIndex(open ? -1 : index)}
                  className={`w-full text-left rounded-2xl border px-5 py-4 backdrop-blur-xl ${
                    darkMode
                      ? 'border-fuchsia-300/20 bg-slate-900/50'
                      : 'border-fuchsia-200 bg-white/85'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {faq.q}
                    </span>
                    <ExpandMore
                      sx={{
                        fontSize: 24,
                        color: darkMode ? '#f0abfc' : '#a21caf',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 220ms ease',
                      }}
                    />
                  </div>
                  <AnimatePresence>
                    {open && (
                      <motion.p
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
                      >
                        {faq.a}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
    // </>
  );
};

export default FAQSection;
