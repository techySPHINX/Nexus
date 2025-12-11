import { FC } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const TopNavbar: FC = () => {
  const { user } = useAuth();

  if (user) {
    return null; // Hide top nav when user is logged in (use sidebar instead)
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-40 border-b border-transparent bg-gradient-to-r from-background via-background to-background backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-lg"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 group"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/50"
          >
            <img
              src="/nexus.png"
              alt="Nexus Logo"
              className="w-full h-full object-contain"
            />
          </motion.div>
          <motion.span
            whileHover={{ letterSpacing: '0.05em' }}
            className="font-bold text-xl hidden sm:inline bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 bg-clip-text text-transparent"
          >
            Nexus
          </motion.span>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Auth buttons */}
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/30">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2 border-green-500/30 hover:border-green-500/60 hover:bg-green-500/10 transition-all duration-300"
              >
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                asChild
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/50 transition-all duration-300"
              >
                <Link to="/register">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Register</span>
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default TopNavbar;
