import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface CTASectionProps {
  sectionBackground: string;
}

const CTASection: React.FC<CTASectionProps> = ({ sectionBackground }) => {
  const { isDark } = useTheme();
  const darkMode = isDark;
  const navigate = useNavigate();

  const bounceStyle = `
    @keyframes bounce-text {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .bounce-letter {
      display: inline-block;
      animation: bounce-text 1s ease-in-out infinite;
    }
  `;

  const journey =
    'Start your journey towards meaningful connections and career growth today';

  return (
    <>
      <style>{bounceStyle}</style>
      <section
        className={`relative py-20 md:py-32 bg-gradient-to-br ${sectionBackground}`}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {'Ready to Join Nexus?'.split('').map((letter, i) => (
              <span
                key={i}
                className="bounce-letter"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  color: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#06b6d4' : '',
                }}
              >
                {letter}
              </span>
            ))}
          </motion.h2>

          <motion.p
            className={`text-lg md:text-2xl mb-10 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            {journey}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
          >
            <motion.button
              onClick={() => navigate('/auth')}
              className={`px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                darkMode
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Now
            </motion.button>

            <motion.button
              onClick={() => navigate('/about')}
              className={`px-10 py-4 rounded-xl font-bold text-lg border-2 transition-all duration-300 ${
                darkMode
                  ? 'border-green-400 text-green-400 hover:bg-green-400/10'
                  : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default CTASection;
