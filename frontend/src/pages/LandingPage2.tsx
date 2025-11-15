import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  School,
  People,
  Event,
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

// More professional, focused feature list with harmonious greens
const featureList = [
  {
    icon: <ConnectWithoutContact className="text-white text-2xl" />,
    title: 'Smart Connections',
    desc: 'Algorithmic matching to connect you with alumni and mentors relevant to your goals.',
    gradient: 'from-emerald-600 to-emerald-700',
    hoverGradient: 'from-emerald-700 to-emerald-800',
  },
  {
    icon: <Work className="text-white text-2xl" />,
    title: 'Career & Referrals',
    desc: 'Job postings, referral pipelines, and recruiter access tailored for KIIT alumni.',
    gradient: 'from-emerald-500 to-emerald-600',
    hoverGradient: 'from-emerald-600 to-emerald-700',
  },
  {
    icon: <School className="text-white text-2xl" />,
    title: 'Mentorship',
    desc: 'Structured mentorship sessions and office hours with experienced alumni.',
    gradient: 'from-teal-500 to-emerald-500',
    hoverGradient: 'from-teal-600 to-emerald-600',
  },
  {
    icon: <Groups className="text-white text-2xl" />,
    title: 'Verified Communities',
    desc: 'Curated groups by batch, industry, and interest with verified members.',
    gradient: 'from-emerald-500 to-teal-500',
    hoverGradient: 'from-emerald-600 to-teal-600',
  },
  {
    icon: <RocketLaunch className="text-white text-2xl" />,
    title: 'Project Collaboration',
    desc: 'Find collaborators, co-founders, and project teams within a trusted community.',
    gradient: 'from-emerald-400 to-emerald-600',
    hoverGradient: 'from-emerald-500 to-emerald-700',
  },
  {
    icon: <TrendingUp className="text-white text-2xl" />,
    title: 'Skills & Growth',
    desc: 'Workshops, curated learning paths, and peer learning groups.',
    gradient: 'from-lime-400 to-emerald-500',
    hoverGradient: 'from-lime-500 to-emerald-600',
  },
];

const alumniSpotlights = [
  {
    name: 'Dr. Arjun Mishra',
    title: 'AI Researcher, Google',
    quote:
      'Nexus helped me reconnect with my batchmates and find collaborators for groundbreaking research projects.',
    achievement: 'Published 5 research papers with KIIT alumni collaborators',
    avatarColor: 'bg-gradient-to-br from-emerald-500 to-green-500',
  },
  {
    name: 'Sahana R.',
    title: 'Founder, GreenLeaf',
    quote:
      "I found my technical co-founder through Nexus' project collaboration group. Our startup just secured Series A funding.",
    achievement: '$2M funding raised with Nexus connections',
    avatarColor: 'bg-gradient-to-br from-green-500 to-teal-500',
  },
  {
    name: 'Rohit K.',
    title: 'Senior PM, Fintech Co',
    quote:
      'Re-engaging with students and hiring exceptional interns has been seamless through the platform.',
    achievement: 'Hired 15+ interns from KIIT via Nexus',
    avatarColor: 'bg-gradient-to-br from-teal-500 to-cyan-500',
  },
];

const stats = [
  { number: '15K+', label: 'Active Alumni', icon: <People /> },
  { number: '2K+', label: 'Mentorship Sessions', icon: <School /> },
  { number: '500+', label: 'Partner Companies', icon: <Work /> },
  { number: '98%', label: 'Satisfaction Rate', icon: <EmojiEvents /> },
];

const platformFeatures = [
  {
    icon: <Security className="text-3xl" />,
    title: 'Verified Profiles',
    description: 'All alumni profiles are verified through KIIT credentials',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    icon: <Diversity3 className="text-3xl" />,
    title: 'Diverse Network',
    description: 'Connect with alumni across 50+ countries worldwide',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    icon: <CorporateFare className="text-3xl" />,
    title: 'Industry Partnerships',
    description: 'Exclusive partnerships with top companies for recruitment',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  {
    icon: <MenuBook className="text-3xl" />,
    title: 'Knowledge Base',
    description: 'Access to exclusive resources and learning materials',
    color: 'text-lime-600',
    bgColor: 'bg-lime-100 dark:bg-lime-900/30',
  },
];

const upcomingEvents = [
  {
    title: 'Annual Alumni Meet 2024',
    date: 'March 15, 2024',
    location: 'KIIT Campus, Bhubaneswar',
    type: 'Networking',
  },
  {
    title: 'Tech Career Workshop',
    date: 'March 22, 2024',
    location: 'Virtual Event',
    type: 'Workshop',
  },
  {
    title: 'Startup Pitch Competition',
    date: 'April 5, 2024',
    location: 'Bangalore Hub',
    type: 'Competition',
  },
];

const MotionButton = motion.button;
const MotionCard = motion.div;
const MotionBox = motion.div;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const pulseVariants = {
  animate: {
    scale: [1, 1.03, 1],
    opacity: [0.45, 0.85, 0.45],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-emerald-900 dark:to-green-900 overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <MotionBox
          className="absolute top-24 left-8 w-64 h-64 bg-emerald-300 rounded-full opacity-8 blur-2xl"
          variants={pulseVariants}
          animate="animate"
        />
        <MotionBox
          className="absolute bottom-40 right-10 w-56 h-56 bg-emerald-200 rounded-full opacity-8 blur-2xl"
          animate={{
            y: [0, 28, 0],
            scale: [1, 1.08, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <MotionBox
          className="absolute top-1/2 left-1/3 w-44 h-44 bg-teal-300 rounded-full opacity-6 blur-2xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      {/* HERO SECTION */}
      <section className="relative py-20 md:py-32">
        <div className="container mx-auto px-4 relative z-10">
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
                transition={{ type: 'spring', stiffness: 160, damping: 12 }}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-700 to-emerald-500 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-md"
              >
                <Star className="text-yellow-400 animate-pulse" />
                Trusted by 15,000+ KIIT Alumni
              </MotionBox>

              <MotionBox variants={itemVariants}>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-emerald-500">
                    KIIT Alumni
                  </span>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                    Network
                  </span>
                </h1>
              </MotionBox>

              <MotionBox variants={itemVariants}>
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                  Connect with fellow alumni, discover opportunities, and build
                  meaningful relationships that last a lifetime.
                </p>
              </MotionBox>

              <MotionBox
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4"
              >
                <MotionButton
                  onClick={() => navigate('/register')}
                  className="group relative bg-gradient-to-r from-emerald-700 to-emerald-500 text-white px-7 py-3 rounded-2xl font-semibold text-lg shadow-md transition-all duration-350 flex items-center gap-3 overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/12 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  Join Now
                  <ArrowForward className="group-hover:translate-x-2 transition-transform duration-300" />
                </MotionButton>

                <MotionButton
                  onClick={() => navigate('/login')}
                  className="group border-2 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 px-6 py-3 rounded-2xl font-semibold text-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:border-emerald-400 transition-all duration-300 backdrop-blur-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In
                </MotionButton>
              </MotionBox>
            </MotionBox>

            {/* Right Content */}
            <MotionBox variants={itemVariants} className="relative">
              <MotionCard
                className="bg-white/95 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 shadow-md border border-transparent"
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 180, damping: 16 }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-green-500 rounded-bl-3xl opacity-10" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-500 to-cyan-500 rounded-tr-3xl opacity-10" />

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                    🚀 Your Alumni Network Awaits
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    {stats.map((stat, index) => (
                      <MotionBox
                        key={index}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 140,
                          damping: 14,
                          delay: 0.6 + index * 0.08,
                        }}
                        className="text-center group"
                        whileHover={{ scale: 1.1 }}
                      >
                        <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent group-hover:from-green-600 group-hover:to-teal-600 transition-all duration-300">
                          {stat.number}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold mt-2 flex items-center justify-center gap-1">
                          {stat.icon}
                          {stat.label}
                        </div>
                      </MotionBox>
                    ))}
                  </div>
                </div>
              </MotionCard>
            </MotionBox>
          </MotionBox>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <MotionBox
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
              Why Choose{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Nexus
              </span>
              ?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built exclusively for the KIIT community with features that matter
              most to alumni
            </p>
          </MotionBox>

          <MotionBox
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {platformFeatures.map((feature, index) => (
              <MotionCard
                key={index}
                variants={itemVariants}
                className="group text-center p-8 hover:bg-white dark:hover:bg-gray-800 rounded-3xl transition-all duration-500 hover:shadow-2xl border border-transparent hover:border-emerald-200 dark:hover:border-emerald-700"
                whileHover={{
                  y: -8,
                  scale: 1.02,
                }}
              >
                <MotionBox
                  className={`inline-flex items-center justify-center w-20 h-20 ${feature.bgColor} rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300 ${feature.color}`}
                  whileHover={{ rotate: 10 }}
                  transition={{ duration: 0.5 }}
                >
                  {feature.icon}
                </MotionBox>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to connect, collaborate, and grow with the
              KIIT alumni community worldwide
            </p>
          </MotionBox>

          <MotionBox
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featureList.map((feature, index) => (
              <MotionCard
                key={index}
                variants={itemVariants}
                className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 border border-gray-200 dark:border-gray-700 hover:border-transparent transition-all duration-500 overflow-hidden"
                whileHover={{
                  y: -12,
                  scale: 1.02,
                }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-6 transition-opacity duration-400`}
                />
                <div className="relative z-10">
                  <MotionBox
                    className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 text-white shadow-md group-hover:scale-105 transition-all duration-300`}
                    whileHover={{ rotate: 8 }}
                    transition={{ duration: 0.5 }}
                  >
                    {feature.icon}
                  </MotionBox>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                    {feature.desc}
                  </p>
                </div>
              </MotionCard>
            ))}
          </MotionBox>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="py-20 bg-gradient-to-br from-emerald-50/80 via-green-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
              Upcoming Events
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Don't miss these exclusive alumni events and networking
              opportunities
            </p>
          </MotionBox>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {upcomingEvents.map((event, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 border border-emerald-200 dark:border-emerald-700 hover:shadow-2xl transition-all duration-500"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <MotionBox
                    className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotate: 15 }}
                  >
                    <Event className="text-emerald-600 dark:text-emerald-400 text-2xl" />
                  </MotionBox>
                  <div>
                    <span className="inline-block bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-semibold px-3 py-2 rounded-full">
                      {event.type}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-4">
                  {event.title}
                </h3>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <p className="flex items-center gap-2">📅 {event.date}</p>
                  <p className="flex items-center gap-2">📍 {event.location}</p>
                </div>
                <MotionButton
                  className="w-full mt-6 bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-800 hover:to-emerald-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Register Now
                </MotionButton>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* ALUMNI SPOTLIGHT */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-green-50/80 via-emerald-50/80 to-teal-50/80 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See how KIIT alumni are achieving remarkable success through our
              global network
            </p>
          </MotionBox>

          <MotionBox
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {alumniSpotlights.map((alumni, index) => (
              <MotionCard
                key={index}
                variants={itemVariants}
                className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 border border-gray-200 dark:border-gray-700 hover:border-transparent transition-all duration-500 hover:shadow-2xl"
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-400 rounded-bl-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />

                <div className="flex items-start gap-6 mb-6">
                  <MotionBox
                    className={`w-20 h-20 ${alumni.avatarColor} rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md group-hover:scale-105 transition-transform duration-300`}
                    whileHover={{ rotate: 4 }}
                  >
                    {alumni.name.charAt(0)}
                  </MotionBox>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white text-xl">
                      {alumni.name}
                    </h4>
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {alumni.title}
                    </p>
                  </div>
                </div>

                <div className="inline-block bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-emerald-200 dark:border-emerald-700">
                  {alumni.achievement}
                </div>

                <blockquote className="text-gray-600 dark:text-gray-300 text-lg italic border-l-4 border-emerald-400 pl-6 leading-relaxed">
                  "{alumni.quote}"
                </blockquote>
              </MotionCard>
            ))}
          </MotionBox>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: 'spring', stiffness: 160 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 rounded-4xl p-10 md:p-14 text-center text-white overflow-hidden"
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <MotionBox
                className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <MotionBox
                className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/10 rounded-full"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.1, 0.2],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 2,
                }}
              />
            </div>

            <div className="relative z-10">
              <h3 className="text-4xl md:text-6xl font-black mb-6">
                Ready to Join Your Alumni Network?
              </h3>
              <p className="text-xl md:text-2xl opacity-90 mb-12 max-w-3xl mx-auto">
                Connect with 15,000+ KIIT alumni worldwide and unlock new
                opportunities for growth, collaboration, and success
              </p>

              <MotionButton
                onClick={() => navigate('/register')}
                className="group relative bg-white text-emerald-600 px-12 py-5 rounded-2xl font-semibold text-xl shadow-2xl hover:shadow-3xl transition-all duration-500 flex items-center gap-3 mx-auto overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                Get Started Free
                <ArrowForward className="group-hover:translate-x-2 transition-transform duration-300" />
              </MotionButton>
            </div>
          </MotionCard>

          {/* Enhanced Footer */}
          <footer className="mt-20 pt-12 border-t border-emerald-200 dark:border-emerald-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h4 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                  <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    KIIT Alumni — Nexus
                  </span>
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md leading-relaxed">
                  Building lasting connections and creating opportunities for
                  the KIIT community worldwide through innovation and
                  collaboration.
                </p>
              </div>

              <div className="flex justify-start md:justify-end gap-6">
                {[LinkedIn, Twitter, GitHub].map((Icon, index) => (
                  <MotionButton
                    key={index}
                    className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors duration-300"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon className="text-2xl" />
                  </MotionButton>
                ))}
              </div>
            </div>

            <div className="border-t border-emerald-200 dark:border-emerald-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} KIIT Alumni Network. All rights
                reserved.
              </p>
              <MotionBox
                className="text-gray-500 dark:text-gray-400 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                Made with <span className="text-red-500 animate-pulse">❤️</span>{' '}
                for the KIIT community
              </MotionBox>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
};

export default Landing;
