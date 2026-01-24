import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LinkedIn, Twitter, GitHub } from '@mui/icons-material';

const Footer: React.FC = () => {
  const { isDark } = useTheme();
  const darkMode = isDark;
  const navigate = useNavigate();

  const socialLinks = [
    { icon: <LinkedIn sx={{ fontSize: 24 }} />, label: 'LinkedIn', url: '#' },
    { icon: <Twitter sx={{ fontSize: 24 }} />, label: 'Twitter', url: '#' },
    { icon: <GitHub sx={{ fontSize: 24 }} />, label: 'GitHub', url: '#' },
  ];

  const footerLinks = {
    product: [
      { label: 'Features', path: '/features' },
      { label: 'Mentorship', path: '/mentorship' },
      { label: 'Communities', path: '/communities' },
      { label: 'Referrals', path: '/referrals' },
    ],
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'Careers', path: '/careers' },
      { label: 'Contact', path: '/contact' },
      { label: 'Blog', path: '/blog' },
    ],
    resources: [
      { label: 'Help Center', path: '/help' },
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Guidelines', path: '/guidelines' },
    ],
  };

  return (
    <footer
      className={`relative overflow-hidden py-12 md:py-16 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}
    >
      {/* Decorative background accents; nudge up in light mode to avoid sitting too low on scroll */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute right-[-60px] ${
            darkMode ? 'top-[-40px]' : 'top-[-120px]'
          } w-72 h-72 rounded-full blur-3xl transition-all duration-300 ${
            darkMode
              ? 'bg-gradient-to-br from-emerald-500/15 to-green-400/10'
              : 'bg-gradient-to-br from-emerald-300/30 to-green-500/20'
          }`}
        />
        <div
          className={`absolute left-[-80px] ${
            darkMode ? 'bottom-[-80px]' : 'bottom-[-140px]'
          } w-60 h-60 rounded-full blur-3xl transition-all duration-300 ${
            darkMode
              ? 'bg-gradient-to-br from-blue-500/15 to-cyan-400/10'
              : 'bg-gradient-to-br from-sky-300/30 to-cyan-400/20'
          }`}
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3
                className={`text-3xl font-black mb-4 bg-gradient-to-r ${
                  darkMode
                    ? 'from-green-400 to-emerald-500'
                    : 'from-green-600 to-emerald-600'
                } bg-clip-text text-transparent`}
              >
                Nexus
              </h3>
              <p
                className={`text-base mb-6 max-w-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Connecting KIIT students with alumni worldwide through
                intelligent networking and mentorship.
              </p>
              {/* Social Links */}
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.url}
                    aria-label={social.label}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-gray-800 text-green-400 hover:bg-gray-700'
                        : 'bg-gray-100 text-green-600 hover:bg-gray-200'
                    }`}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4
              className={`font-bold text-lg mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Product
            </h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.path)}
                    className={`text-sm transition-colors ${
                      darkMode
                        ? 'text-gray-400 hover:text-green-400'
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4
              className={`font-bold text-lg mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Company
            </h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.path)}
                    className={`text-sm transition-colors ${
                      darkMode
                        ? 'text-gray-400 hover:text-green-400'
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4
              className={`font-bold text-lg mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Resources
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.path)}
                    className={`text-sm transition-colors ${
                      darkMode
                        ? 'text-gray-400 hover:text-green-400'
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`pt-8 border-t ${
            darkMode ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p
              className={`text-sm ${
                darkMode ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              © {new Date().getFullYear()} Nexus. All rights reserved. Made
              with ❤️ for KIIT University
            </p>
            <div className="flex gap-6">
              <button
                onClick={() => navigate('/privacy')}
                className={`text-sm transition-colors ${
                  darkMode
                    ? 'text-gray-500 hover:text-green-400'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                Privacy
              </button>
              <button
                onClick={() => navigate('/terms')}
                className={`text-sm transition-colors ${
                  darkMode
                    ? 'text-gray-500 hover:text-green-400'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                Terms
              </button>
              <button
                onClick={() => navigate('/cookies')}
                className={`text-sm transition-colors ${
                  darkMode
                    ? 'text-gray-500 hover:text-green-400'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                Cookies
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
