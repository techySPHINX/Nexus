import { FC } from 'react';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Grid,
  Typography,
} from '@mui/material';
import { Celebration, Star } from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';

type SkillItem = {
  name: string;
};

type HeroUser = {
  name?: string;
  profile?: {
    avatarUrl?: string;
  };
};

interface HeroWelcomeCardProps {
  user?: HeroUser;
  progress: number;
  displayedSkills: SkillItem[];
}

const HeroWelcomeCard: FC<HeroWelcomeCardProps> = ({
  user,
  progress,
  displayedSkills,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            theme.palette.mode === 'dark'
              ? `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 50%),
           radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 50%)`
              : `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.light, 0.06)} 0%, transparent 50%),
           radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.light, 0.06)} 0%, transparent 50%)`,
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            theme.palette.mode === 'dark'
              ? `linear-gradient(90deg, ${alpha(theme.palette.divider, 0.05)} 1px, transparent 1px),
           linear-gradient(${alpha(theme.palette.divider, 0.05)} 1px, transparent 1px)`
              : `linear-gradient(90deg, ${alpha(theme.palette.divider, 0.03)} 1px, transparent 1px),
           linear-gradient(${alpha(theme.palette.divider, 0.03)} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          zIndex: 0,
        }}
      />

      <CardContent
        sx={{ position: 'relative', zIndex: 2, p: { xs: 3, md: 4 } }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={user?.profile?.avatarUrl || undefined}
                  alt={user?.name}
                  sx={{
                    width: { xs: 80, md: 100 },
                    height: { xs: 80, md: 100 },
                    border:
                      theme.palette.mode === 'dark'
                        ? `3px solid ${alpha(theme.palette.primary.main, 0.4)}`
                        : `3px solid ${alpha(theme.palette.primary.light, 0.6)}`,
                    boxShadow:
                      theme.palette.mode === 'dark'
                        ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
                        : `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.9)
                        : alpha(theme.palette.background.paper, 0.95),
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background:
                      theme.palette.mode === 'dark' ? '#059669' : '#10b981',
                    border: `2px solid ${theme.palette.background.paper}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' },
                    },
                  }}
                >
                  <Star sx={{ fontSize: 12, color: 'white' }} />
                </Box>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2,
                    justifyContent: { xs: 'center', md: 'flex-start' },
                  }}
                >
                  <Celebration
                    sx={{
                      color:
                        theme.palette.mode === 'dark' ? '#10b981' : '#059669',
                      fontSize: '1.8rem',
                    }}
                  />
                  <Typography
                    variant="overline"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Welcome Back!
                  </Typography>
                </Box>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    mb: 2,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1.6rem', md: '2rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Hello, {user?.name?.split(' ')[0] || 'Friend'}
                  <Box
                    component="span"
                    sx={{
                      display: 'block',
                      color:
                        theme.palette.mode === 'dark' ? '#a7f3d0' : '#059669',
                      fontWeight: 800,
                      fontSize: { xs: '1.4rem', md: '1.8rem' },
                    }}
                  >
                    Momentum: {progress}%
                  </Box>
                </Typography>

                <Box sx={{ maxWidth: 320, mt: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 600,
                      }}
                    >
                      Weekly Progress
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color:
                          theme.palette.mode === 'dark' ? '#a7f3d0' : '#059669',
                      }}
                    >
                      {progress}% Complete
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 8,
                      bgcolor:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.divider, 0.4)
                          : alpha(theme.palette.divider, 0.2),
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${progress}%`,
                        borderRadius: 4,
                        transition:
                          'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        background:
                          theme.palette.mode === 'dark'
                            ? `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                            : `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                        boxShadow:
                          theme.palette.mode === 'dark'
                            ? `0 0 16px ${alpha(theme.palette.primary.main, 0.5)}`
                            : `0 0 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                position: 'relative',
                height: { xs: 280, md: 280 },
                width: '100%',
                borderRadius: '16px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden',
                padding: 2,
                background: 'transparent',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 'calc(100% - 50px)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.4,
                    backgroundImage:
                      theme.palette.mode === 'dark'
                        ? `radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
               radial-gradient(circle at 80% 70%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`
                        : `radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.light, 0.08)} 0%, transparent 50%),
               radial-gradient(circle at 80% 70%, ${alpha(theme.palette.secondary.light, 0.08)} 0%, transparent 50%)`,
                    zIndex: 0,
                  }}
                />

                {displayedSkills.map((skill, index) => {
                  const modernColors = [
                    { bg: '#3B82F6', glow: '#60A5FA' },
                    { bg: '#10B981', glow: '#34D399' },
                    { bg: '#8B5CF6', glow: '#A78BFA' },
                    { bg: '#EC4899', glow: '#F472B6' },
                    { bg: '#F59E0B', glow: '#FBBF24' },
                    { bg: '#06B6D4', glow: '#22D3EE' },
                    { bg: '#D946EF', glow: '#E879F9' },
                    { bg: '#84CC16', glow: '#A3E635' },
                    { bg: '#4F46E5', glow: '#818CF8' },
                    { bg: '#0EA5E9', glow: '#38BDF8' },
                  ];

                  const colorPair = modernColors[index % modernColors.length];
                  const totalSkills = displayedSkills.length;

                  const angle = (index * 2 * Math.PI) / totalSkills;
                  const distance = 0.75;

                  const x = Math.cos(angle) * distance * 100;
                  const y = Math.sin(angle) * distance * 100;

                  const randomOffset = (Math.random() - 0.5) * 12;
                  const xPos = x + randomOffset;
                  const yPos = y + randomOffset;

                  const delay = index * 100;

                  return (
                    <Box
                      key={`${skill.name}-${index}`}
                      sx={{
                        position: 'absolute',
                        top: `calc(50% + ${yPos}px)`,
                        left: `calc(50% + ${xPos}px)`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                        opacity: 0,
                        animation: `skillFloatIn 700ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms forwards`,
                        '@keyframes skillFloatIn': {
                          '0%': {
                            opacity: 0,
                            transform:
                              'translate(-50%, -50%) scale(0) rotate(-45deg)',
                            filter: 'blur(8px)',
                          },
                          '60%': {
                            opacity: 1,
                            transform:
                              'translate(-50%, -50%) scale(1.1) rotate(10deg)',
                            filter: 'blur(2px)',
                          },
                          '100%': {
                            opacity: 1,
                            transform:
                              'translate(-50%, -50%) scale(1) rotate(0deg)',
                            filter: 'blur(0px)',
                          },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 52, md: 60 },
                          height: { xs: 52, md: 60 },
                          borderRadius: '14px',
                          backgroundColor: colorPair.bg,
                          color: 'white',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontWeight: 700,
                          boxShadow:
                            theme.palette.mode === 'dark'
                              ? `0 6px 20px ${alpha(colorPair.glow, 0.4)},
                     inset 0 1px 0 ${alpha('#ffffff', 0.2)},
                     inset 0 -1px 0 ${alpha('#000000', 0.2)}`
                              : `0 6px 20px ${alpha(colorPair.glow, 0.3)},
                     inset 0 1px 0 ${alpha('#ffffff', 0.3)},
                     inset 0 -1px 0 ${alpha('#000000', 0.1)}`,
                          fontSize: { xs: '0.75rem', md: '0.85rem' },
                          padding: 1,
                          cursor: 'default',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          border:
                            theme.palette.mode === 'dark'
                              ? `1.5px solid ${alpha('#ffffff', 0.15)}`
                              : `1.5px solid ${alpha('#ffffff', 0.25)}`,
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              theme.palette.mode === 'dark'
                                ? `linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.1))`
                                : `linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.05))`,
                            opacity: 0.3,
                            transition: 'opacity 0.3s ease',
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: `conic-gradient(transparent, ${alpha(colorPair.glow, 0.3)}, transparent 30%)`,
                            animation: 'rotateBorder 4s linear infinite paused',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                          },
                          '@keyframes rotateBorder': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                          '&:hover': {
                            transform: 'scale(1.2) translateY(-3px)',
                            boxShadow:
                              theme.palette.mode === 'dark'
                                ? `0 12px 28px ${alpha(colorPair.glow, 0.6)},
                       inset 0 1px 0 ${alpha('#ffffff', 0.25)},
                       inset 0 -1px 0 ${alpha('#000000', 0.15)}`
                                : `0 12px 28px ${alpha(colorPair.glow, 0.5)},
                       inset 0 1px 0 ${alpha('#ffffff', 0.35)},
                       inset 0 -1px 0 ${alpha('#000000', 0.1)}`,
                            '&::before': {
                              opacity: 0.4,
                            },
                            '&::after': {
                              opacity: 0.6,
                              animationPlayState: 'running',
                            },
                          },
                        }}
                        title={skill.name}
                      >
                        <Box
                          sx={{
                            position: 'relative',
                            zIndex: 2,
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            fontSize: { xs: '0.8rem', md: '0.9rem' },
                            fontWeight: 700,
                          }}
                        >
                          {(() => {
                            const words = skill.name.split(/[\s-_]+/);
                            if (words.length >= 2) {
                              return `${words[0].charAt(0)}${words[1].charAt(0)}`;
                            }
                            return skill.name.slice(0, 2).toUpperCase();
                          })()}
                        </Box>

                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '60%',
                            height: '2px',
                            background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.7)}, transparent)`,
                            borderRadius: '1px',
                          }}
                        />

                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 6,
                            right: 6,
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: alpha('#ffffff', 0.8),
                            boxShadow: `0 0 4px ${alpha(colorPair.glow, 0.6)}`,
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: { xs: 70, md: 80 },
                          height: { xs: 70, md: 80 },
                          borderRadius: '18px',
                          background: colorPair.glow,
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          filter: 'blur(12px)',
                          zIndex: -1,
                          pointerEvents: 'none',
                        }}
                        className="skill-glow"
                      />
                    </Box>
                  );
                })}

                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 70,
                    height: 70,
                    borderRadius: '18px',
                    background:
                      theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, 
                ${alpha(theme.palette.primary.main, 0.15)} 0%, 
                ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                        : `linear-gradient(135deg, 
                ${alpha(theme.palette.primary.light, 0.2)} 0%, 
                ${alpha(theme.palette.secondary.light, 0.15)} 100%)`,
                    border:
                      theme.palette.mode === 'dark'
                        ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
                        : `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    animation: 'pulseSlow 4s ease-in-out infinite',
                    '@keyframes pulseSlow': {
                      '0%, 100%': {
                        transform: 'translate(-50%, -50%) scale(1)',
                        opacity: 0.7,
                      },
                      '50%': {
                        transform: 'translate(-50%, -50%) scale(1.05)',
                        opacity: 0.9,
                      },
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '90%',
                      height: '90%',
                      borderRadius: '14px',
                      border:
                        theme.palette.mode === 'dark'
                          ? `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                          : `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
                      animation: 'rotateSlow 30s linear infinite',
                      '@keyframes rotateSlow': {
                        '0%': {
                          transform: 'translate(-50%, -50%) rotate(0deg)',
                        },
                        '100%': {
                          transform: 'translate(-50%, -50%) rotate(360deg)',
                        },
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 2,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      background:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.7)
                          : alpha('#ffffff', 0.9),
                      borderRadius: '14px',
                      padding: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color:
                          theme.palette.mode === 'dark'
                            ? theme.palette.primary.light
                            : theme.palette.primary.main,
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        lineHeight: 1.2,
                        letterSpacing: '0.5px',
                      }}
                    >
                      Tech
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color:
                          theme.palette.mode === 'dark'
                            ? theme.palette.secondary.light
                            : theme.palette.secondary.main,
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        lineHeight: 1.2,
                        letterSpacing: '0.5px',
                      }}
                    >
                      Stack
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.main, 0.6)
                        : theme.palette.primary.main,
                    animation: 'pulseDot 1.5s ease-in-out infinite',
                    '@keyframes pulseDot': {
                      '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
                      '50%': { opacity: 1, transform: 'scale(1.2)' },
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.7rem',
                    opacity: 0.7,
                    fontWeight: 500,
                  }}
                >
                  Hover skills
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default HeroWelcomeCard;
