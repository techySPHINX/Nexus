import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  School,
  People,
  Work,
  RocketLaunch,
  TrendingUp,
  ArrowForward,
  LinkedIn,
  Twitter,
  GitHub,
  Star,
  ConnectWithoutContact,
  Groups,
  EmojiEvents,
  Security,
  Diversity3,
  CorporateFare,
  MenuBook,
} from '@mui/icons-material';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationIndicator from '@/components/Notification/NotificationIndicator';
import { useAuth } from '@/contexts/AuthContext';

// Optimized feature list with reduced animations
const featureList = [
  {
    icon: <ConnectWithoutContact sx={{ fontSize: 24 }} />,
    title: 'Smart Connections',
    desc: 'AI-powered matching to connect students with relevant alumni mentors and career opportunities.',
    gradient: 'from-emerald-600 to-emerald-700',
  },
  {
    icon: <Work sx={{ fontSize: 24 }} />,
    title: 'Career Guidance',
    desc: 'Get career advice, internship opportunities, and industry insights from experienced alumni.',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: <School sx={{ fontSize: 24 }} />,
    title: 'Mentorship Programs',
    desc: 'Structured mentorship with alumni across various industries and experience levels.',
    gradient: 'from-teal-500 to-emerald-500',
  },
  {
    icon: <Groups sx={{ fontSize: 24 }} />,
    title: 'Community Groups',
    desc: 'Join specialized groups by major, interests, and career paths with verified members.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: <RocketLaunch sx={{ fontSize: 24 }} />,
    title: 'Project Collaboration',
    desc: 'Find project partners, research collaborators, and startup co-founders within our trusted network.',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 24 }} />,
    title: 'Skill Development',
    desc: 'Access workshops, webinars, and learning resources curated by successful alumni.',
    gradient: 'from-lime-400 to-emerald-500',
  },
];

const successStories = [
  {
    name: 'Priya Sharma',
    role: 'Computer Science, 2023',
    achievement: 'Landed internship at Google through alumni referral',
    story:
      'Nexus connected me with an alum working at Google who referred me for an internship. The mentorship I received was invaluable!',
    avatarColor: 'bg-gradient-to-br from-emerald-500 to-green-500',
  },
  {
    name: 'Rahul Kumar',
    role: 'Mechanical Engineering, 2022',
    achievement: 'Founded startup with alumni co-founder',
    story:
      'Found my technical co-founder through Nexus. Our startup now has 10+ employees and we regularly hire from KIIT.',
    avatarColor: 'bg-gradient-to-br from-green-500 to-teal-500',
  },
  {
    name: 'Anjali Patel',
    role: 'Biotechnology, 2024',
    achievement: 'Published research with alumni mentor',
    story:
      'My alumni mentor guided me through my research paper and helped me connect with journals. Got published in my final year!',
    avatarColor: 'bg-gradient-to-br from-teal-500 to-cyan-500',
  },
];

const stats = [
  { number: '15K+', label: 'Active Members', icon: <People /> },
  { number: '2K+', label: 'Mentorship Sessions', icon: <School /> },
  { number: '500+', label: 'Partner Companies', icon: <Work /> },
  { number: '98%', label: 'Satisfaction Rate', icon: <EmojiEvents /> },
];

const platformFeatures = [
  {
    icon: <Security sx={{ fontSize: 32 }} />,
    title: 'Verified Network',
    description:
      'All members verified through KIIT credentials for trusted connections',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    icon: <Diversity3 sx={{ fontSize: 32 }} />,
    title: 'Global Reach',
    description:
      'Connect with alumni across 50+ countries and industries worldwide',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    icon: <CorporateFare sx={{ fontSize: 32 }} />,
    title: 'Industry Partners',
    description: 'Exclusive recruitment partnerships with top companies',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  {
    icon: <MenuBook sx={{ fontSize: 32 }} />,
    title: 'Learning Resources',
    description:
      'Access to exclusive workshops, materials, and career resources',
    color: 'text-lime-600',
    bgColor: 'bg-lime-100 dark:bg-lime-900/30',
  },
];

// const upcomingEvents = [
//   {
//     title: 'Tech Career Workshop',
//     date: 'March 15, 2024',
//     location: 'Campus Innovation Center',
//     type: 'Workshop',
//   },
//   {
//     title: 'Alumni-Student Mixer',
//     date: 'March 22, 2024',
//     location: 'University Auditorium',
//     type: 'Networking',
//   },
//   {
//     title: 'Startup Pitch Competition',
//     date: 'April 5, 2024',
//     location: 'Entrepreneurship Cell',
//     type: 'Competition',
//   },
// ];

// Optimized motion components with reduced animations for Firefox
const MotionButton = motion.button;
const MotionCard = motion.div;
const MotionBox = motion.div;

// Simplified variants for better performance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const Landing: FC = () => {
  const navigate = useNavigate();
  const { isDark: darkMode } = useTheme();
  const { user } = useAuth();

  return (
    <div
      className={`transition-colors duration-300 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-emerald-900 to-green-900'
          : 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50'
      } overflow-hidden`}
    >
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
        {user && <NotificationIndicator />}
      </div>

      {/* HERO SECTION */}
      <section className="relative py-6">
        <div className="container mx-4 px-4 relative z-10">
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            {/* Left Content */}
            <MotionBox variants={itemVariants} className="space-y-8">
              <MotionBox
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 10 }}
                className={`inline-flex items-center gap-3 px-5 py-2 rounded-full text-sm font-semibold shadow-md ${
                  darkMode
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white'
                    : 'bg-gradient-to-r from-emerald-700 to-emerald-500 text-white'
                }`}
              >
                <Star className="text-yellow-400" />
                Trusted by 15,000+ KIIT Students & Alumni
              </MotionBox>

              <MotionBox variants={itemVariants}>
                <h1
                  className={`text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-500">
                    Nexus
                  </span>
                  <br />
                  <span
                    className={`text-3xl md:text-5xl ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Discover, Connect, Collaborate
                  </span>
                </h1>
              </MotionBox>

              <MotionBox variants={itemVariants}>
                <p
                  className={`text-xl md:text-2xl leading-relaxed max-w-lg ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  The premier platform connecting KIIT students with alumni
                  worldwide. Build meaningful relationships, discover
                  opportunities, and accelerate your career.
                </p>
              </MotionBox>

              {!user ? (
                <>
                  <MotionBox
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <MotionButton
                      onClick={() => navigate('/register')}
                      className={`group relative px-7 py-3 rounded-2xl font-semibold text-lg shadow-md transition-all duration-300 flex items-center gap-3 overflow-hidden ${
                        darkMode
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white'
                          : 'bg-gradient-to-r from-emerald-700 to-emerald-500 text-white'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Join Now
                      <ArrowForward className="group-hover:translate-x-1 transition-transform duration-300" />
                    </MotionButton>
                    <MotionButton
                      onClick={() => navigate('/login')}
                      className={`group border-2 px-6 py-3 rounded-2xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm ${
                        darkMode
                          ? 'border-emerald-600 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-900/30'
                          : 'border-emerald-200 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Sign In
                    </MotionButton>
                  </MotionBox>
                </>
              ) : (
                <MotionBox variants={itemVariants}>
                  <MotionButton
                    onClick={() => navigate('/dashboard')}
                    className={`group relative px-7 py-3 rounded-2xl font-semibold text-lg shadow-md transition-all duration-300 flex items-center gap-3 overflow-hidden ${
                      darkMode
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white'
                        : 'bg-gradient-to-r from-emerald-700 to-emerald-500 text-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Go to Dashboard
                  </MotionButton>
                </MotionBox>
              )}
            </MotionBox>

            {/* Right Content - Stats Card */}
            <MotionBox variants={itemVariants} className="relative">
              <MotionCard
                className={`backdrop-blur-lg rounded-3xl p-8 shadow-lg border ${
                  darkMode
                    ? 'bg-gray-800/90 border-gray-700'
                    : 'bg-white/95 border-gray-200'
                }`}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 120 }}
              >
                <h3
                  className={`text-2xl font-bold mb-6 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  🚀 Your Network Awaits
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <MotionBox
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 120,
                        delay: 0.5 + index * 0.1,
                      }}
                      className="text-center group"
                    >
                      <div className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        {stat.number}
                      </div>
                      <div
                        className={`text-sm font-semibold mt-2 flex items-center justify-center gap-1 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {stat.icon}
                        {stat.label}
                      </div>
                    </MotionBox>
                  ))}
                </div>
              </MotionCard>
            </MotionBox>
          </MotionBox>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section
        className={`py-20 backdrop-blur-sm ${
          darkMode ? 'bg-gray-800/50' : 'bg-white/50'
        }`}
      >
        <div className="container mx-auto px-4">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: '-50px' }}
            className="text-center mb-16"
          >
            <h2
              className={`text-4xl md:text-5xl font-black mb-6 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Why Choose{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Nexus
              </span>
              ?
            </h2>
            <p
              className={`text-xl max-w-2xl mx-auto ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Built exclusively for the KIIT community with features designed to
              bridge students and alumni
            </p>
          </MotionBox>

          <MotionBox
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {platformFeatures.map((feature, index) => (
              <MotionCard
                key={index}
                variants={itemVariants}
                className={`group text-center p-6 rounded-3xl transition-all duration-300 border ${
                  darkMode
                    ? 'bg-gray-800/80 border-gray-700 hover:bg-gray-700/80'
                    : 'bg-white/80 border-gray-200 hover:bg-white'
                }`}
                whileHover={{ y: -4 }}
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 ${feature.bgColor} rounded-2xl mb-4 ${feature.color}`}
                >
                  {feature.icon}
                </div>
                <h3
                  className={`text-lg font-bold mb-3 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {feature.description}
                </p>
              </MotionCard>
            ))}
          </MotionBox>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 md:py-32 relative">
        <div className="container mx-auto px-4">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className={`text-4xl md:text-5xl font-black mb-6 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Powerful Features
            </h2>
            <p
              className={`text-xl max-w-3xl mx-auto ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Everything you need to connect with alumni, discover
              opportunities, and build your career
            </p>
          </MotionBox>

          <MotionBox
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {featureList.map((feature, index) => (
              <MotionCard
                key={index}
                variants={itemVariants}
                className={`group relative backdrop-blur-lg rounded-3xl p-6 border transition-all duration-300 overflow-hidden ${
                  darkMode
                    ? 'bg-gray-800/80 border-gray-700'
                    : 'bg-white/80 border-gray-200'
                }`}
                whileHover={{ y: -4 }}
              >
                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 text-white shadow-md`}
                  >
                    {feature.icon}
                  </div>

                  <h3
                    className={`text-xl font-bold mb-3 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`leading-relaxed ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {feature.desc}
                  </p>
                </div>
              </MotionCard>
            ))}
          </MotionBox>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <section
        className={`py-20 backdrop-blur-sm ${
          darkMode ? 'bg-gray-800/50' : 'bg-emerald-50/80'
        }`}
      >
        <div className="container mx-auto px-4">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className={`text-4xl md:text-5xl font-black mb-6 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Success Stories
            </h2>
            <p
              className={`text-xl max-w-2xl mx-auto ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              See how KIIT students are achieving remarkable success through
              alumni connections
            </p>
          </MotionBox>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`group p-6 rounded-3xl border transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-800/80 border-gray-700'
                    : 'bg-white border-emerald-200'
                }`}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-16 h-16 ${story.avatarColor} rounded-2xl flex items-center justify-center text-white font-bold text-xl`}
                  >
                    {story.name.charAt(0)}
                  </div>
                  <div>
                    <h4
                      className={`font-bold text-lg ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {story.name}
                    </h4>
                    <p
                      className={`text-sm ${
                        darkMode ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    >
                      {story.role}
                    </p>
                  </div>
                </div>

                <div
                  className={`inline-block text-sm font-semibold px-3 py-1 rounded-full mb-4 ${
                    darkMode
                      ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {story.achievement}
                </div>

                <blockquote
                  className={`text-sm italic border-l-4 pl-4 leading-relaxed ${
                    darkMode
                      ? 'text-gray-300 border-emerald-500'
                      : 'text-gray-600 border-emerald-400'
                  }`}
                >
                  "{story.story}"
                </blockquote>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={`relative rounded-3xl p-8 md:p-12 text-center overflow-hidden ${
              darkMode
                ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                : 'bg-gradient-to-br from-emerald-700 to-emerald-500'
            } text-white`}
          >
            <div className="relative z-10">
              <h3 className="text-3xl md:text-5xl font-black mb-6">
                Ready to Join Your Network?
              </h3>
              <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
                Connect with KIIT alumni worldwide and unlock opportunities for
                mentorship, career growth, and collaboration.
              </p>

              <MotionButton
                onClick={() => navigate('/register')}
                className="group relative bg-white text-emerald-600 px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started Free
                <ArrowForward className="group-hover:translate-x-1 transition-transform duration-300" />
              </MotionButton>
            </div>
          </MotionCard>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-emerald-200 dark:border-emerald-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h4
                  className={`text-2xl font-black mb-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    Nexus
                  </span>
                </h4>
                <p
                  className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  KIIT Alumni-Student Connection Platform
                </p>
              </div>

              <div className="flex gap-4">
                {[
                  {
                    Icon: LinkedIn,
                    href: '',
                    label: 'LinkedIn',
                  },
                  {
                    Icon: Twitter,
                    href: '',
                    label: 'Twitter',
                  },
                  {
                    Icon: GitHub,
                    href: 'https://github.com/techySPHINX/Nexus',
                    label: 'GitHub',
                  },
                ].map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className={`p-3 rounded-2xl transition-colors duration-300 inline-flex items-center justify-center ${
                      darkMode
                        ? 'bg-gray-800 text-emerald-400 hover:bg-gray-700'
                        : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                    }`}
                  >
                    <item.Icon />
                  </a>
                ))}
              </div>
            </div>

            <div className="border-t border-emerald-200 dark:border-emerald-800 mt-8 pt-6 text-center">
              <p
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                © {new Date().getFullYear()} Nexus - KIIT Alumni Network. Made
                with ❤️ for the KIIT community.
              </p>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
};

export default Landing;
