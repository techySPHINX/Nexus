import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNews } from '@/contexts/NewsContext';
import { Container, Typography, Box, Skeleton } from '@mui/material';
import { NewsItem } from '@/services/newsService';
import { useTheme } from '@/contexts/ThemeContext';

export default function NewsDetail() {
  const { slug } = useParams();
  const { isDark } = useTheme();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  const { getBySlug } = useNews();

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    getBySlug(slug).then((data) => {
      setItem(data);
      setLoading(false);
    });
  }, [slug, getBySlug]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Skeleton
          variant="rectangular"
          height={400}
          sx={{ mb: 4, borderRadius: 2 }}
        />
        <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={30} width="40%" sx={{ mb: 4 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      </Container>
    );
  }

  if (!item) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Article not found
        </Typography>
      </Container>
    );
  }
  const bannerSrc = item.imageUrl || '/nexus.png';
  const hasCustomImage = Boolean(item.imageUrl);

  return (
    <Box sx={{ py: 3, position: 'relative', bgcolor: 'background.default' }}>
      {/* Top Banner Image (fallback to public/nexus.png) */}
      <Box
        component="img"
        src={bannerSrc}
        alt={item.title}
        sx={{
          width: '90%',
          marginX: 'auto',
          height: {
            xs: hasCustomImage ? 260 : 200,
            md: hasCustomImage ? 360 : 260,
          },
          objectFit: hasCustomImage ? 'cover' : 'contain',
          backgroundColor: hasCustomImage
            ? 'transparent'
            : isDark
              ? 'grey.800'
              : 'grey.200',
          borderRadius: 2,
          display: 'block',
          filter: hasCustomImage ? 'brightness(0.78)' : 'none',
        }}
      />

      {/* Floating Card */}
      <Container
        maxWidth="md"
        sx={{
          position: 'relative',
          mt: { xs: -8, md: -12 },
          px: { xs: 2, md: 0 },
        }}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: '0 8px 40px rgba(2,6,23,0.12)',
            p: { xs: 3, md: 5 },
            position: 'relative',
          }}
        >
          {/* Title */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.6rem', md: '2.2rem' },
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            {item.title}
          </Typography>

          {/*Share */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'end',
              alignItems: 'center',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box
              onClick={() => {
                const url = `${window.location.origin}/news/${item.slug}`;
                if (navigator.clipboard?.writeText)
                  navigator.clipboard.writeText(url);
              }}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 2,
                py: 0.6,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              <span>🔗</span>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Copy link
              </Typography>
            </Box>
          </Box>

          {/* Article Content */}
          <Box
            sx={{
              '& p': {
                mb: 3,
                lineHeight: 1.8,
                fontSize: '1.05rem',
              },
              '& h2, & h3': {
                fontWeight: 700,
                mt: 4,
                mb: 2,
              },
              '& img': {
                maxWidth: '100%',
                borderRadius: 6,
                my: 3,
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto',
              },
              '& ul, & ol': {
                pl: 3,
                mb: 2,
              },
            }}
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </Box>
      </Container>
    </Box>
  );
}
