import { FC } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
  Divider,
  IconButton,
} from '@mui/material';
import {
  School,
  People,
  Event,
  Work,
  RocketLaunch,
  TrendingUp,
  ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const featureList = [
  {
    icon: <School fontSize="large" color="primary" />,
    title: 'Mentorship',
    desc: '1:1 guidance from experienced KIIT alumni to accelerate your career.',
  },
  {
    icon: <People fontSize="large" color="primary" />,
    title: 'Community',
    desc: 'Join focused groups by interests, batches and industries.',
  },
  {
    icon: <Event fontSize="large" color="primary" />,
    title: 'Events & Workshops',
    desc: 'Exclusive alumni meetups, webinars and career workshops.',
  },
  {
    icon: <Work fontSize="large" color="primary" />,
    title: 'Career Opportunities',
    desc: 'Companies and startups hiring directly from the KIIT network.',
  },
  {
    icon: <RocketLaunch fontSize="large" color="primary" />,
    title: 'Collaborations',
    desc: 'Project partnerships, research and startup mentoring.',
  },
  {
    icon: <TrendingUp fontSize="large" color="primary" />,
    title: 'Learning & Growth',
    desc: 'Upskill with curated resources and peer-led learning circles.',
  },
];

const alumniSpotlights = [
  {
    name: 'Dr. Arjun Mishra',
    title: 'AI Researcher, Google',
    quote:
      'Nexus helped me reconnect with my batchmates and find collaborators for research.',
  },
  {
    name: 'Sahana R.',
    title: 'Founder, GreenLeaf',
    quote: "I found my co-founder through Nexus' project collaboration group.",
  },
  {
    name: 'Rohit K.',
    title: 'Senior PM, Fintech Co',
    quote: 'Re-engaging with students and hiring interns has been seamless.',
  },
];

const Landing: FC = () => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
      {/* HERO */}
      <Box
        component={motion.section}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        sx={{
          py: { xs: 6, md: 12 },
          background: `linear-gradient(180deg, ${theme.palette.primary.light} 0%, ${theme.palette.background.paper} 100%)`,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.7 }}
              >
                <Typography
                  variant={isSm ? 'h4' : 'h2'}
                  sx={{ fontWeight: 800, mb: 2 }}
                >
                  Nexus — KIIT Alumni Network
                </Typography>

                <Typography
                  variant="h6"
                  sx={{ color: 'text.secondary', mb: 3, maxWidth: 560 }}
                >
                  A professional, trusted network for KIIT alumni — find
                  mentors, hire talent, and collaborate on meaningful projects.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/register')}
                    endIcon={<ArrowForward />}
                    sx={{
                      borderRadius: 3,
                      textTransform: 'none',
                      px: 4,
                    }}
                  >
                    Get Started
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{ textTransform: 'none', px: 4 }}
                  >
                    Sign In
                  </Button>
                </Stack>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.7 }}
              >
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: 3,
                    p: 3,
                    bgcolor: 'background.paper',
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Trusted by thousands of KIIT alumni
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Connect · Grow · Give Back
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            10k+
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary' }}
                          >
                            Alumni
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            500+
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary' }}
                          >
                            Companies
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            95%
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary' }}
                          >
                            Satisfaction
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FEATURES */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            What you can do on Nexus
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Powerful tools for mentorship, recruitment, events and
            collaboration.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {featureList.map((f, i) => (
            <Grid key={i} item xs={12} sm={6} md={4}>
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                viewport={{ once: true }}
              >
                <Card
                  elevation={0}
                  sx={{ p: 3, borderRadius: 3, height: '100%' }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}
                    >
                      {f.icon}
                    </Avatar>

                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>
                        {f.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary' }}
                      >
                        {f.desc}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ALUMNI SPOTLIGHT */}
      <Box sx={{ bgcolor: 'background.paper', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Alumni Spotlights
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Success stories and collaboration highlights from the KIIT
              network.
            </Typography>
          </Box>

          <Grid container spacing={3} justifyContent="center">
            {alumniSpotlights.map((a, idx) => (
              <Grid key={idx} item xs={12} sm={6} md={4}>
                <motion.div
                  initial={{ scale: 0.98, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{ p: 3, borderRadius: 3, height: '100%' }}
                    elevation={2}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {a.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>
                          {a.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary' }}
                        >
                          {a.title}
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{ mt: 2, color: 'text.secondary' }}
                    >
                      “{a.quote}”
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA + FOOTER */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Ready to build lasting connections with KIIT alumni?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Create your profile, join communities, and start collaborating
              today.
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            md={4}
            sx={{ textAlign: { xs: 'left', md: 'right' } }}
          >
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{ textTransform: 'none' }}
            >
              Create Profile
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, pt: 4, borderTop: 1, borderColor: 'divider' }}>
          <Grid container alignItems="center">
            <Grid item xs>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                © {new Date().getFullYear()} KIIT Alumni — Nexus
              </Typography>
            </Grid>

            <Grid item>
              <Stack direction="row" spacing={1}>
                <IconButton size="small" aria-label="linkedin">
                  <People />
                </IconButton>
                <IconButton size="small" aria-label="events">
                  <Event />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Landing;
