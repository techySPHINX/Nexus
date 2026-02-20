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
    { icon: <LinkedIn sx={{ fontSize: 22 }} />, label: 'LinkedIn', url: '#' },
    { icon: <Twitter sx={{ fontSize: 22 }} />, label: 'Twitter', url: '#' },
    { icon: <GitHub sx={{ fontSize: 22 }} />, label: 'GitHub', url: '#' },
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
  };

  return (
    <footer
      className={`rounded-t-[5rem] border border-t relative backdrop-blur-xl ${
        darkMode
          ? 'border-slate-700/70 bg-slate-950/55'
          : 'bg-[radial-gradient(1200px_circle_at_15%_-5%,rgba(16,185,129,0.22),transparent_100%),radial-gradient(1000px_circle_at_88%_8%,rgba(34,197,94,0.16),transparent_100%),radial-gradient(900px_circle_at_50%_105%,rgba(45,212,191,0.14),transparent_100%),linear-gradient(180deg,#f6fffb_0%,#ecfff6_45%,#effffb_100%)]'
      }`}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className={'px-7 pt-7 md:px-10 md:pt-10'}>
          <div className="grid lg:grid-cols-[1.1fr_2fr_1.7fr] gap-8">
            <div>
              <h3 className="text-3xl font-black mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Nexus
              </h3>
              <p
                className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} mb-5`}
              >
                Connecting KIIT students and alumni through purposeful
                networking, mentorship, and collaborative growth.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    aria-label={social.label}
                    className={`p-2.5 rounded-xl transition-colors ${
                      darkMode
                        ? 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-cyan-700 hover:bg-slate-200'
                    }`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:mx-10 grid sm:grid-cols-[1fr_1fr] gap-2">
              {/* Company Links */}
              <div>
                <h4
                  className={`font-bold mb-4 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Product
                </h4>
                <ul className="space-y-2.5">
                  {footerLinks.product.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => navigate(link.path)}
                        className={`text-sm ${
                          darkMode
                            ? 'text-slate-400 hover:text-emerald-300'
                            : 'text-slate-600 hover:text-emerald-700'
                        }`}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources Links */}
              <div>
                <h4
                  className={`font-bold mb-4 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Company
                </h4>
                <ul className="space-y-2.5">
                  {footerLinks.company.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => navigate(link.path)}
                        className={`text-sm ${
                          darkMode
                            ? 'text-slate-400 hover:text-emerald-300'
                            : 'text-slate-600 hover:text-emerald-700'
                        }`}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className={`rounded-2xl p-5 border ${
                darkMode
                  ? 'border-cyan-300/20 bg-cyan-500/5'
                  : 'border-cyan-200 bg-cyan-50/70'
              }`}
            >
              <p
                className={`${darkMode ? 'text-cyan-200' : 'text-cyan-700'} font-semibold mb-2`}
              >
                Stay in the loop
              </p>
              <p
                className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-sm mb-4`}
              >
                Get monthly updates on mentorship drives, community events, and
                product improvements.
              </p>
              <div
                className={`rounded-lg px-3 py-2.5 text-sm mb-3 ${
                  darkMode
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                Enter email address
              </div>
              <button className="w-full rounded-lg py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                Subscribe
              </button>
            </motion.div>
          </div>
        </div>
      </div>
      <footer
        className={`mt-16 border-t ${
          darkMode
            ? 'border-slate-800 bg-slate-900'
            : 'border-slate-200 bg-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          {/* Left Section */}
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            © {new Date().getFullYear()}{' '}
            <span
              className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}
            >
              Nexus
            </span>
            . Built for KIIT University.
          </p>

          {/* Right Section */}
          <nav className="flex items-center gap-6">
            {[
              { path: '/privacy', label: 'Privacy Policy' },
              { path: '/terms', label: 'Terms of Service' },
              { path: '/cookies', label: 'Cookie Policy' },
            ].map(({ path, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`transition-colors duration-200 ${
                  darkMode
                    ? 'text-slate-400 hover:text-emerald-400'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </footer>
    </footer>
  );
};

export default Footer;
