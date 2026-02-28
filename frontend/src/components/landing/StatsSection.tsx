import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, useTheme as Theme, Typography } from '@mui/material';
import { People, School, Work, EmojiEvents } from '@mui/icons-material';
import { DottedGlowBackground } from './ui/dotted-glow-background';
import Box from '@mui/material/Box/Box';

interface Stat {
  number: string;
  label: string;
  icon: React.ReactNode;
  sub?: string;
}

interface StatsProps {
  sectionBackground: string;
  lowPerformanceMode?: boolean;
}

const STATS: Stat[] = [
  { number: '1K+', label: 'Active Members', icon: <People /> },
  { number: '2K+', label: 'Alumni', icon: <School /> },
  {
    number: '10+',
    label: 'Mentors',
    icon: <Work />,
    // sub: 'Top Tier Companies',
  },
  {
    number: '98%',
    label: 'Satisfaction Rate',
    icon: <EmojiEvents />,
    sub: 'User Feedback',
  },
];

const StatsSection: React.FC<StatsProps> = ({
  sectionBackground,
  lowPerformanceMode = false,
}) => {
  const { isDark } = useTheme();
  const darkMode = isDark;
  const theme = Theme();
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const words = ['Momentum', 'Growth', 'Impact'];
    const handleTyping = () => {
      const i = loopNum % words.length;
      const fullText = words[i];

      setText(
        isDeleting
          ? fullText.substring(0, text.length - 1)
          : fullText.substring(0, text.length + 1)
      );

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, isDeleting ? 80 : 130);
    const cursorTimer = window.setInterval(
      () => setShowCursor((c) => !c),
      lowPerformanceMode ? 800 : 500
    );

    return () => {
      clearTimeout(timer);
      clearInterval(cursorTimer);
    };
  }, [isDeleting, loopNum, lowPerformanceMode, text]);

  return (
    <section
      className={`relative py-10 md:py-14 rounded-[8rem] ${sectionBackground}`}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-stretch">
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p
              className={`text-sm uppercase tracking-[0.2em] mb-3 ${
                darkMode ? 'text-indigo-300' : 'text-indigo-700'
              }`}
            >
              Impact Snapshot
            </p>
            <h2
              className={`text-4xl md:text-5xl font-black leading-tight mb-4 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Numbers that prove
            </h2>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* Cheetah print background */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `
            repeating-linear-gradient(45deg, 
              ${alpha(theme.palette.warning.main, 0.05)} 0px,
              ${alpha(theme.palette.warning.main, 0.05)} 10px,
              transparent 10px,
              transparent 20px
            )
          `,
                  borderRadius: '8px',
                  zIndex: -1,
                }}
              />

              <Typography
                variant="h4"
                component="span"
                className="text-4xl md:text-5xl"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, 
            ${theme.palette.warning.dark} 0%,
            ${theme.palette.warning.main} 50%,
            ${theme.palette.warning.light} 100%
          )`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '3px',
                    background: `linear-gradient(90deg, 
              ${theme.palette.warning.main} 0%,
              transparent 100%
            )`,
                    animation: lowPerformanceMode
                      ? 'none'
                      : 'cheetahStripe 1.5s ease-in-out infinite',
                    '@keyframes cheetahStripe': {
                      '0%': { left: '-100%' },
                      '100%': { left: '100%' },
                    },
                  },
                }}
              >
                {text}
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: '4px',
                    height: '1.2em',
                    ml: '2px',
                    background: theme.palette.warning.main,
                    opacity: showCursor ? 1 : 0,
                    transform: 'translateY(2px)',
                    boxShadow: `0 0 8px ${theme.palette.warning.main}`,
                  }}
                />
              </Typography>

              {/* Speed indicator dots */}
              <Box sx={{ display: 'flex', gap: '2px', ml: 1 }}>
                {[1, 2, 3].map((dot) => (
                  <Box
                    key={dot}
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: theme.palette.warning.main,
                      opacity: 0.3,
                      animation: lowPerformanceMode
                        ? 'none'
                        : `dotPulse 0.8s ease-in-out ${dot * 0.2}s infinite`,
                      '@keyframes dotPulse': {
                        '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
                        '50%': { opacity: 0.8, transform: 'scale(1.5)' },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </motion.aside>

          <div className="grid grid-cols-2 gap-3 sm:gap-7">
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                className="group relative rounded-2xl sm:rounded-[32px] p-[1.5px] sm:p-[2px] overflow-hidden"
              >
                {/* Animated Gradient Border */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl
          ${
            darkMode
              ? 'from-blue-400 via-purple-400 to-pink-400'
              : 'from-blue-400 via-indigo-400 to-purple-400'
          }`}
                />

                {/* Inner Content */}
                <div
                  className={`relative h-full rounded-[20px] sm:rounded-[30px] p-4 sm:p-7 backdrop-blur-xl border
          ${
            darkMode
              ? 'bg-gray-900/90 border-gray-800/50'
              : 'bg-white/90 border-gray-200/50'
          }`}
                >
                  {/* Icon with Ring */}
                  <div className="mb-3 sm:mb-5 flex items-center gap-2 sm:gap-3">
                    <div className="relative inline-block">
                      {!lowPerformanceMode && (
                        <div
                          className={`absolute inset-0 rounded-2xl animate-ping opacity-20 ${
                            darkMode ? 'bg-blue-400' : 'bg-blue-500'
                          }`}
                        />
                      )}
                      <div
                        className={`relative p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transform transition-all duration-500 group-hover:scale-140 group-hover:-rotate-6
              ${
                darkMode
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-300'
                  : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700'
              }`}
                      >
                        {React.cloneElement(stat.icon as React.ReactElement, {
                          sx: { fontSize: 20 },
                        })}
                      </div>
                    </div>
                    <div
                      className={`text-lg sm:text-2xl md:text-3xl font-black tracking-tight
                                ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {stat.number}
                    </div>
                  </div>

                  {/* Stats Content */}
                  <div className="space-y-2">
                    <div>
                      <h3
                        className={`text-sm sm:text-lg font-bold
                ${darkMode ? 'text-gray-200' : 'text-gray-800'}
              `}
                      >
                        {stat.label}
                      </h3>

                      {stat.sub && (
                        <p
                          className={`text-[11px] sm:text-sm leading-tight mt-1 flex items-center gap-1.5 sm:gap-2
                  ${darkMode ? 'text-gray-400' : 'text-gray-600'}
                `}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              darkMode ? 'bg-blue-400' : 'bg-blue-500'
                            }`}
                          />
                          {stat.sub}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Floating Glow Effect */}
                  <div
                    className={`absolute -inset-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl -z-10
            ${
              darkMode
                ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30'
                : 'bg-gradient-to-r from-blue-400/30 to-indigo-400/30'
            }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      {!lowPerformanceMode && (
        <DottedGlowBackground
          className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
          opacity={1}
          gap={20}
          radius={0.9}
          colorLightVar="black"
          glowColorLightVar="--color-green-100"
          colorDarkVar="--color-sky-900"
          glowColorDarkVar="--color-sky-100"
          backgroundOpacity={0}
          speedMin={0.3}
          speedMax={1.6}
          speedScale={1}
        />
      )}
    </section>
  );
};

export default StatsSection;
