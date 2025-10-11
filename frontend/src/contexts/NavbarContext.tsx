import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

type NavbarPosition = 'top' | 'left';

interface NavbarContextType {
  position: NavbarPosition;
  togglePosition: () => void;
  setPosition: (position: NavbarPosition) => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export const useNavbar = () => {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
};

interface NavbarProviderProps {
  children: ReactNode;
}

export const NavbarProvider: React.FC<NavbarProviderProps> = ({ children }) => {
  const [position, setPosition] = useState<NavbarPosition>('top');
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    // Load navbar position from localStorage
    const savedPosition = localStorage.getItem(
      'navbarPosition'
    ) as NavbarPosition;
    if (
      savedPosition &&
      (savedPosition === 'top' || savedPosition === 'left')
    ) {
      setPosition(savedPosition);
    }
  }, []);

  // Auto-switch based on breakpoint: top on mobile/tablet, left on desktop
  useEffect(() => {
    const desired: NavbarPosition = isDesktop ? 'left' : 'top';
    if (position !== desired) {
      setPosition(desired);
    }
    // Intentionally do not persist this auto-change to avoid flipping stored prefs across devices
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  const togglePosition = () => {
    const newPosition = position === 'top' ? 'left' : 'top';
    setPosition(newPosition);
    localStorage.setItem('navbarPosition', newPosition);
  };

  const handleSetPosition = (newPosition: NavbarPosition) => {
    setPosition(newPosition);
    localStorage.setItem('navbarPosition', newPosition);
  };

  return (
    <NavbarContext.Provider
      value={{
        position,
        togglePosition,
        setPosition: handleSetPosition,
      }}
    >
      {children}
    </NavbarContext.Provider>
  );
};
