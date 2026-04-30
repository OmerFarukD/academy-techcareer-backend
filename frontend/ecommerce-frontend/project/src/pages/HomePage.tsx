import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import ProductCard from '../components/product/ProductCard';
import Layout from '../components/common/Layout';
import type { Product, Category } from '../types';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const perks = [
  { icon: <LocalShippingOutlinedIcon />, title: 'Free Shipping', desc: 'On orders over $50' },
  { icon: <LockOutlinedIcon />, title: 'Secure Payment', desc: '100% protected' },
  { icon: <HeadsetMicOutlinedIcon />, title: '24/7 Support', desc: 'Dedicated help center' },
  { icon: <AutorenewIcon />, title: 'Easy Returns', desc: '30-day return policy' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productService.getAll(), categoryService.getAll()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  const featured = products.slice(0, 8);

  return (
    <Layout>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 60%, #42a5f5 100%)',
          color: 'white',
          py: { xs: 8, md: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Chip
                label="New Arrivals 2024"
                sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
              <Typography variant="h2" fontWeight={800} sx={{ mb: 2, lineHeight: 1.1 }}>
                Discover the Best Deals Online
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.85, fontWeight: 400, maxWidth: 480 }}>
                Shop thousands of products across electronics, fashion, books, and more.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/products')}
                  sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 700, px: 4, '&:hover': { bgcolor: 'grey.100' } }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Shop Now
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: 8, transform: 'rotate(-2deg)', transition: 'transform 0.3s', '&:hover': { transform: 'rotate(0deg) scale(1.02)' } }}>
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop"
                  alt="Shopping"
                  style={{ width: '100%', display: 'block' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Perks */}
      <Box sx={{ bgcolor: 'grey.50', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={2}>
            {perks.map((perk) => (
              <Grid key={perk.title} size={{ xs: 6, md: 3 }}>
                <Paper elevation={0} sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                  <Box sx={{ color: 'primary.main', flexShrink: 0 }}>{perk.icon}</Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{perk.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{perk.desc}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Categories */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700}>Browse by</Typography>
            <Typography variant="h4" fontWeight={800}>Category</Typography>
          </Box>
          <Button endIcon={<ArrowForwardIcon />} onClick={() => navigate('/products')}>
            All Products
          </Button>
        </Box>

        <Grid container spacing={2}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Grid key={i} size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Skeleton variant="rounded" height={160} />
                </Grid>
              ))
            : categories.map((cat) => (
                <Grid key={cat.id} size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Card
                    elevation={0}
                    onClick={() => navigate(`/products?category=${cat.id}`)}
                    sx={{
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                      overflow: 'hidden',
                      height: '100%',
                      transition: 'box-shadow 0.2s, border-color 0.2s',
                      '&:hover': { boxShadow: 4, borderColor: 'primary.main' },
                    }}
                  >
                    <CardActionArea sx={{ height: '100%' }}>
                      <CardMedia
                        component="img"
                        height={120}
                        image={`https://picsum.photos/seed/cat${cat.id}/600/400`}
                        alt={cat.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700}>{cat.name}</Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
        </Grid>
      </Container>

      {/* Featured Products */}
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700}>Handpicked for you</Typography>
              <Typography variant="h4" fontWeight={800}>Featured Products</Typography>
            </Box>
            <Button endIcon={<ArrowForwardIcon />} onClick={() => navigate('/products')}>View All</Button>
          </Box>

          {loading ? (
            <Grid container spacing={3}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Skeleton variant="rounded" height={320} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={3}>
              {featured.map((product) => (
                <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* CTA Banner */}
      <Box sx={{ background: 'linear-gradient(90deg, #0d47a1 0%, #1976d2 100%)', py: { xs: 6, md: 8 }, textAlign: 'center', color: 'white' }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={800} sx={{ mb: 2 }}>Ready to start shopping?</Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, mb: 4, fontWeight: 400 }}>
            Join thousands of happy customers and find your next favorite product.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/products')}
            sx={{ bgcolor: 'white', color: 'primary.dark', fontWeight: 700, px: 5, '&:hover': { bgcolor: 'grey.100' } }}
          >
            Explore All Products
          </Button>
        </Container>
      </Box>
    </Layout>
  );
}
