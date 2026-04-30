import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { useCartStore } from '../store/cartStore';
import Layout from '../components/common/Layout';
import ProductCard from '../components/product/ProductCard';
import type { Product, Category } from '../types';
import { getImageUrl } from '../lib/apiClient';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [snackOpen, setSnackOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      productService.getById(Number(id)),
      productService.getAll(),
      categoryService.getAll(),
    ])
      .then(([prod, allProds, cats]) => {
        setProduct(prod);
        setSelectedImage(0);
        const cat = cats.find((c) => c.id === prod.category_id) ?? null;
        setCategory(cat);
        setRelated(allProds.filter((p) => p.category_id === prod.category_id && p.id !== prod.id).slice(0, 4));
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    setSnackOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Skeleton variant="rounded" height={420} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Skeleton variant="text" height={60} sx={{ mb: 1 }} />
              <Skeleton variant="text" height={30} width="60%" sx={{ mb: 2 }} />
              <Skeleton variant="text" height={80} />
            </Grid>
          </Grid>
        </Container>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary">Product not found</Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate('/products')} startIcon={<ArrowBackIcon />}>
            Back to Products
          </Button>
        </Container>
      </Layout>
    );
  }

  const currentImage = product.images[selectedImage];
  const imageSrc = currentImage
    ? getImageUrl(currentImage.image_url)
    : 'https://via.placeholder.com/800x600?text=Product';

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" underline="hover" color="inherit">Home</Link>
          <Link component={RouterLink} to="/products" underline="hover" color="inherit">Products</Link>
          {category && (
            <Link component={RouterLink} to={`/products?category=${category.id}`} underline="hover" color="inherit">
              {category.name}
            </Link>
          )}
          <Typography color="text.primary" noWrap sx={{ maxWidth: 200 }}>{product.name}</Typography>
        </Breadcrumbs>

        <Grid container spacing={5}>
          {/* Images */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 1.5, bgcolor: 'grey.50' }}>
              <img
                src={imageSrc}
                alt={product.name}
                style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }}
              />
            </Box>
            {product.images.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {product.images.map((img, idx) => (
                  <Box
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: selectedImage === idx ? 'primary.main' : 'divider',
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: 'primary.light' },
                    }}
                  >
                    <img
                      src={getImageUrl(img.image_url)}
                      alt={`${product.name} ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Grid>

          {/* Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            {category && (
              <Typography variant="overline" color="primary" fontWeight={700}>
                {category.name}
              </Typography>
            )}
            <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>{product.name}</Typography>

            <Typography variant="h3" fontWeight={800} color="primary.main" sx={{ mb: 3 }}>
              ${product.price.toFixed(2)}
            </Typography>

            {product.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                {product.description}
              </Typography>
            )}

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="body2" fontWeight={600}>Quantity:</Typography>
              <TextField
                type="number"
                size="small"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                inputProps={{ min: 1 }}
                sx={{ width: 80 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddShoppingCartIcon />}
                onClick={handleAddToCart}
                sx={{ flex: 1, minWidth: 180 }}
              >
                Add to Cart
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => { handleAddToCart(); navigate('/cart'); }}
                sx={{ flex: 1, minWidth: 140 }}
              >
                Buy Now
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocalShippingIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">Free shipping on orders over $50</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <VerifiedIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">30-day return policy</Typography>
              </Box>
            </Box>

            {product.description && (
              <Box sx={{ mt: 3 }}>
                <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px!important' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Product Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                      {product.description}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Related Products */}
        {related.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Related Products</Typography>
            <Grid container spacing={2.5}>
              {related.map((p) => (
                <Grid key={p.id} size={{ xs: 12, sm: 6, md: 3 }}>
                  <ProductCard product={p} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSnackOpen(false)} variant="filled">
          Added {quantity} item{quantity > 1 ? 's' : ''} to cart!
        </Alert>
      </Snackbar>
    </Layout>
  );
}
