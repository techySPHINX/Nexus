import React from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  School,
  Work,
  People,
  Event,
  RocketLaunch,
  TrendingUp,
  Lightbulb,
  Handshake
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Landing: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <School sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Mentorship',
      description: 'Get guidance from experienced alumni who have walked your path.',
      color: '#e8f5e8'
    },
    {
      icon: <People sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Networking',
      description: 'Build lasting professional relationships with industry leaders.',
      color: '#f0f8f0'
    },
    {
      icon: <Event sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Events',
      description: 'Participate in reunions, workshops, and career development sessions.',
      color: '#e8f5e8'
    },
    {
      icon: <Work sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Opportunities',
      description: 'Access exclusive job postings, internships, and career opportunities.',
      color: '#f0f8f0'
    },
    {
      icon: <RocketLaunch sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Innovation',
      description: 'Collaborate on cutting-edge projects and research initiatives.',
      color: '#e8f5e8'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Growth',
      description: 'Accelerate your career with continuous learning and development.',
      color: '#f0f8f0'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Alumni Connected' },
    { number: '500+', label: 'Companies Partnered' },
    { number: '100+', label: 'Events Hosted' },
    { number: '95%', label: 'Success Rate' }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 2px, transparent 2px)',
            backgroundSize: '50px 50px'
          }}
        />
        
        <Container maxWidth="xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <Typography
                variant={isMobile ? 'h3' : 'h1'}
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                  letterSpacing: '-0.02em'
                }}
              >
                Nexus: KIIT Alumni Connect
              </Typography>
              
              <Typography
                variant={isMobile ? 'h6' : 'h4'}
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontWeight: 300,
                  maxWidth: '800px',
                  mx: 'auto',
                  lineHeight: 1.4
                }}
              >
                Bridging Generations, Building Futures
              </Typography>
              
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
                sx={{ mb: 6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      textTransform: 'none',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      '&:hover': {
                        bgcolor: 'grey.100',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 35px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    Join Now
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      textTransform: 'none',
                      borderWidth: 2,
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Learn More
                  </Button>
                </motion.div>
              </Stack>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* About Section */}
      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 10 } }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: 'primary.main',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 80,
                  height: 4,
                  bgcolor: 'primary.light',
                  borderRadius: 2
                }
              }}
            >
              About Nexus
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400
              }}
            >
              Nexus is KIIT's official alumni network, designed to connect past and present students 
              for mentorship, collaboration, and career growth. We believe in the power of 
              community and the strength of shared experiences.
            </Typography>
          </Box>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Grid container spacing={3} sx={{ mb: 8 }}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'primary.light',
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: 'primary.main',
                      mb: 1
                    }}
                  >
                    {stat.number}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'primary.dark',
                      fontWeight: 600
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: 'primary.main'
              }}
            >
              Why Join Nexus?
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      bgcolor: feature.color,
                      borderRadius: 4,
                      border: '2px solid',
                      borderColor: 'primary.light',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Box sx={{ mb: 3 }}>
                        {feature.icon}
                      </Box>
                      
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: 'primary.main'
                        }}
                      >
                        {feature.title}
                      </Typography>
                      
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.6
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              mt: 8,
              textAlign: 'center',
              bgcolor: 'primary.light',
              borderRadius: 4,
              border: '2px solid',
              borderColor: 'primary.main'
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: 'primary.main'
              }}
            >
              Ready to Connect?
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                color: 'primary.dark',
                mb: 4,
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              Join thousands of KIIT alumni who are already building their future together
            </Typography>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  px: 6,
                  py: 2,
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  textTransform: 'none',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.2)'
                  }
                }}
              >
                Get Started Today
              </Button>
            </motion.div>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Landing;
