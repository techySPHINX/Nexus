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

// Enhanced feature list with green color scheme
const featureList = [
  {
    icon: <ConnectWithoutContact className="text-white text-2xl" />,
    title: 'Smart Connections',
    desc: 'AI-powered matching with alumni who share your interests and career goals.',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    icon: <Groups className="text-white text-2xl" />,
    title: 'Vibrant Communities',
    desc: 'Join specialized groups by industry, batch year, skills, and interests.',
    gradient: 'from-green-500 to-teal-500',
  },
  {
    icon: <Event className="text-white text-2xl" />,
    title: 'Exclusive Events',
    desc: 'Virtual and in-person events, workshops, and networking sessions.',
    gradient: 'from-teal-500 to-cyan-500',
  },
  {
    icon: <Work className="text-white text-2xl" />,
    title: 'Career Growth',
    desc: 'Access hidden job opportunities and get referrals from trusted alumni.',
    gradient: 'from-emerald-600 to-green-600',
  },
  {
    icon: <RocketLaunch className="text-white text-2xl" />,
    title: 'Project Collaboration',
    desc: 'Find co-founders, team members, and collaborators for your next big idea.',
    gradient: 'from-lime-500 to-green-500',
  },
  {
    icon: <TrendingUp className="text-white text-2xl" />,
    title: 'Skill Development',
    desc: 'Learn from industry experts through mentorship and knowledge sharing.',
    gradient: 'from-green-400 to-emerald-400',
  },
];

const alumniSpotlights = [
  {
    name: 'Dr. Arjun Mishra',
    title: 'AI Researcher, Google',
    quote:
      'Nexus helped me reconnect with my batchmates and find collaborators for groundbreaking research projects.',
    achievement: 'Published 5 research papers with KIIT alumni collaborators',
    avatarColor: 'bg-emerald-500',
  },
  {
    name: 'Sahana R.',
    title: 'Founder, GreenLeaf',
    quote:
      "I found my technical co-founder through Nexus' project collaboration group. Our startup just secured Series A funding.",
    achievement: '$2M funding raised with Nexus connections',
    avatarColor: 'bg-green-500',
  },
  {
    name: 'Rohit K.',
    title: 'Senior PM, Fintech Co',
    quote:
      'Re-engaging with students and hiring exceptional interns has been seamless through the platform.',
    achievement: 'Hired 15+ interns from KIIT via Nexus',
    avatarColor: 'bg-teal-500',
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
  },
  {
    icon: <Diversity3 className="text-3xl" />,
    title: 'Diverse Network',
    description: 'Connect with alumni across 50+ countries worldwide',
    color: 'text-green-600',
  },
  {
    icon: <CorporateFare className="text-3xl" />,
    title: 'Industry Partnerships',
    description: 'Exclusive partnerships with top companies for recruitment',
    color: 'text-teal-600',
  },
  {
    icon: <MenuBook className="text-3xl" />,
    title: 'Knowledge Base',
    description: 'Access to exclusive resources and learning materials',
    color: 'text-lime-600',
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

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-900 dark:to-emerald-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <MotionBox
          className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full opacity-10 blur-xl"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <MotionBox
          className="absolute bottom-40 right-10 w-60 h-60 bg-green-300 rounded-full opacity-10 blur-xl"
          animate={{
            y: [0, 20, 0],
            scale: [1.1, 1, 1.1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      {/* HERO SECTION */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <MotionBox
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                <Star className="text-yellow-300" />
                Trusted by 15,000+ KIIT Alumni
              </div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight">
                <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  KIIT Alumni
                </span>
                <br />
                <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Network
                </span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                Connect with fellow alumni, discover opportunities, and build
                meaningful relationships that last a lifetime.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <MotionButton
                  onClick={() => navigate('/register')}
                  className="group bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Join Now
                  <ArrowForward className="group-hover:translate-x-1 transition-transform" />
                </MotionButton>

                <MotionButton
                  onClick={() => navigate('/login')}
                  className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-400 dark:hover:text-emerald-300 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </MotionButton>
              </div>
            </MotionBox>

            {/* Right Content */}
            <MotionBox
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <MotionCard
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
                whileHover={{ y: -5 }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-green-500 rounded-bl-3xl opacity-10" />

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                    🚀 Your Alumni Network Awaits
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    {stats.map((stat, index) => (
                      <MotionBox
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="text-center"
                      >
                        <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                          {stat.number}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold mt-1">
                          {stat.label}
                        </div>
                      </MotionBox>
                    ))}
                  </div>
                </div>
              </MotionCard>
            </MotionBox>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Why Choose Nexus?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Built exclusively for the KIIT community with features that matter
            </p>
          </MotionBox>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformFeatures.map((feature, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 group hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-2xl transition-all duration-300"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {feature.description}
                </p>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 md:py-24 relative">
        <div className="container mx-auto px-4">
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to connect, collaborate, and grow with the
              KIIT alumni community
            </p>
          </MotionBox>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureList.map((feature, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-transparent transition-all duration-300 hover:shadow-2xl"
                whileHover={{ y: -8 }}
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 text-white`}
                >
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.desc}
                </p>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
        <div className="container mx-auto px-4">
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Upcoming Events
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Don't miss these exclusive alumni events and networking
              opportunities
            </p>
          </MotionBox>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {upcomingEvents.map((event, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-emerald-200 dark:border-emerald-700 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Event className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-2 py-1 rounded-full">
                      {event.type}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                  {event.title}
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p>📅 {event.date}</p>
                  <p>📍 {event.location}</p>
                </div>
                <button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold transition-colors duration-300">
                  Register Now
                </button>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* ALUMNI SPOTLIGHT */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="container mx-auto px-4">
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See how KIIT alumni are achieving remarkable success through our
              network
            </p>
          </MotionBox>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {alumniSpotlights.map((alumni, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-400 rounded-bl-2xl opacity-10" />

                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-16 h-16 ${alumni.avatarColor} rounded-2xl flex items-center justify-center text-white font-bold text-xl`}
                  >
                    {alumni.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                      {alumni.name}
                    </h4>
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                      {alumni.title}
                    </p>
                  </div>
                </div>

                <div className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  {alumni.achievement}
                </div>

                <blockquote className="text-gray-600 dark:text-gray-300 italic border-l-4 border-emerald-400 pl-4">
                  "{alumni.quote}"
                </blockquote>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <MotionCard
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full" />

            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-black mb-4">
                Ready to Join Your Alumni Network?
              </h3>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Connect with 15,000+ KIIT alumni and unlock new opportunities
                today
              </p>

              <MotionButton
                onClick={() => navigate('/register')}
                className="group bg-white text-emerald-600 px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Free
                <ArrowForward className="group-hover:translate-x-1 transition-transform" />
              </MotionButton>
            </div>
          </MotionCard>

          {/* FOOTER */}
          <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  KIIT Alumni — Nexus
                </h4>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Building lasting connections and creating opportunities for
                  the KIIT community worldwide.
                </p>
              </div>

              <div className="flex justify-start md:justify-end gap-4">
                <button className="p-3 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                  <LinkedIn className="text-2xl" />
                </button>
                <button className="p-3 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                  <Twitter className="text-2xl" />
                </button>
                <button className="p-3 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                  <GitHub className="text-2xl" />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} KIIT Alumni Network. All rights
                reserved.
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Made with ❤️ for the KIIT community
              </p>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
};

export default Landing;
