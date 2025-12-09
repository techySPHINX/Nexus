import {
  Frame,
  Settings2,
  SquareTerminal,
  Lightbulb,
  Users,
  MessageSquare,
  Briefcase,
  Calendar,
  Newspaper,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { NavMainNexus } from '@/components/nav-main-nexus';
import { NavUser } from '@/components/nav-user-nexus';

export function AppSidebarNexus() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Main navigation items
  const navMain = user
    ? [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: SquareTerminal,
          isActive: location.pathname === '/dashboard',
        },
        {
          title: 'Connections',
          url: '/connections',
          icon: Users,
          isActive: location.pathname === '/connections',
        },
        {
          title: 'Messages',
          url: '/messages',
          icon: MessageSquare,
          isActive: location.pathname === '/messages',
        },
        {
          title: 'Referrals',
          url: '/referrals',
          icon: Briefcase,
          isActive: location.pathname === '/referrals',
        },
        {
          title: 'Community',
          url: '/subcommunities',
          icon: Users,
          isActive: location.pathname.startsWith('/subcommunities'),
          items: [
            {
              title: 'Explore SubCommunities',
              url: '/subcommunities',
            },
            {
              title: 'My SubCommunities',
              url: '/subcommunities/my?myPage=1',
            },
            {
              title: 'Moderated SubCommunities',
              url: '/subcommunities/my/moderated?moderatedPage=1',
            },
            {
              title: 'Member SubCommunities',
              url: '/subcommunities/my/members?memberPage=1',
            },
          ],
        },
        {
          title: 'Projects',
          url: '/projects',
          icon: Frame,
          isActive: location.pathname.startsWith('/projects'),
          items: [
            {
              title: 'All Projects',
              url: '/projects',
            },
            {
              title: 'My Projects',
              url: '/projects/user',
            },
          ],
        },
        {
          title: 'Startups',
          url: '/startups',
          icon: Lightbulb,
          isActive: location.pathname.startsWith('/startups'),
          items: [
            {
              title: 'All Startups',
              url: '/startups',
            },
            {
              title: 'My Startups',
              url: '/startups?tab=1',
            },
          ],
        },
        {
          title: 'Events',
          url: '/events',
          icon: Calendar,
          isActive: location.pathname === '/events',
        },
        {
          title: 'News',
          url: '/news',
          icon: Newspaper,
          isActive: location.pathname === '/news',
        },
        ...(user?.role === 'ADMIN'
          ? [
              {
                title: 'Admin',
                url: '#',
                icon: Settings2,
                isActive: location.pathname.startsWith('/admin'),
                items: [
                  {
                    title: 'Moderation',
                    url: '/admin/moderation',
                  },
                  {
                    title: 'Verification',
                    url: '/admin/document-verification',
                  },
                  {
                    title: 'SubCommunities',
                    url: '/admin/moderation/subcommunities',
                  },
                  {
                    title: 'Create Events',
                    url: '/admin/events/create',
                  },
                  {
                    title: 'News Admin',
                    url: '/admin/news',
                  },
                ],
              },
            ]
          : []),
      ]
    : [];

  const userData = user
    ? {
        name: user.name || 'User',
        email: user.email || 'no-email@example.com',
        avatar: user.profile?.avatarUrl || undefined,
      }
    : { name: 'Guest', email: 'guest@example.com', avatar: undefined };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between py-2">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg transition-colors flex-1 group-data-[collapsible=icon]:pl-0"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-white shadow-sm"
            >
              <img
                src="/nexus.png"
                alt="Nexus"
                className="size-7 object-contain"
              />
            </motion.div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <motion.span
                whileHover={{ letterSpacing: '0.05em' }}
                className="truncate font-semibold bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 bg-clip-text text-transparent"
              >
                Nexus
              </motion.span>
            </div>
          </Link>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {user && navMain.length > 0 && <NavMainNexus items={navMain} />}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} onLogout={handleLogout} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
