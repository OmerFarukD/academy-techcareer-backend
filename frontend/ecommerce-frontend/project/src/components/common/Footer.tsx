import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import { Link as RouterLink } from 'react-router-dom';

const sections = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/products' },
      { label: 'Electronics', to: '/products?category=cat-1' },
      { label: 'Clothing', to: '/products?category=cat-2' },
      { label: 'Books', to: '/products?category=cat-3' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign In', to: '/login' },
      { label: 'Register', to: '/register' },
      { label: 'My Profile', to: '/profile' },
      { label: 'My Cart', to: '/cart' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/' },
      { label: 'Careers', to: '/' },
      { label: 'Contact', to: '/' },
      { label: 'Blog', to: '/' },
    ],
  },
];

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{ bgcolor: 'grey.900', color: 'grey.300', mt: 'auto', pt: 6, pb: 3 }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StorefrontIcon sx={{ color: 'primary.light' }} />
              <Typography variant="h6" fontWeight={700} color="white">
                ShopNow
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.8, maxWidth: 280 }}>
              Your one-stop destination for the best products at unbeatable prices. Quality, convenience, and style — all in one place.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}>
                <TwitterIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}>
                <InstagramIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}>
                <FacebookIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          {sections.map((section) => (
            <Grid key={section.title} size={{ xs: 6, sm: 4, md: 2 }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="white"
                sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}
              >
                {section.title}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    component={RouterLink}
                    to={link.to}
                    underline="hover"
                    variant="body2"
                    sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ borderColor: 'grey.800', my: 4 }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="caption" color="grey.500">
            © {new Date().getFullYear()} ShopNow. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link href="#" underline="hover" variant="caption" sx={{ color: 'grey.500' }}>
              Privacy Policy
            </Link>
            <Link href="#" underline="hover" variant="caption" sx={{ color: 'grey.500' }}>
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
