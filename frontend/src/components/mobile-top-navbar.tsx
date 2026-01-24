import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import NotificationIndicator from '@/components/Notification/NotificationIndicator';
import ThemeToggle from '@/components/ThemeToggle';

const MobileTopNavbar: FC = () => {
  const { user } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar();

  // Only show on mobile when user is logged in
  if (!user || !isMobile) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-sidebar-border bg-sidebar backdrop-blur-sm supports-[backdrop-filter]:bg-sidebar/95">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Hamburger menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Center: Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-white shadow-sm">
            <img
              src="/nexus.png"
              alt="Nexus"
              className="size-7 object-contain"
            />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground">
            Nexus
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationIndicator />
        </div>
      </div>
    </nav>
  );
};

export default MobileTopNavbar;
