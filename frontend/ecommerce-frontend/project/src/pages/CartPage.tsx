import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { orderService } from '../services/orderService';
import Layout from '../components/common/Layout';
import { getImageUrl } from '../lib/apiClient';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false, msg: '', severity: 'success',
  });

  const subtotal = totalPrice();
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setPlacingOrder(true);
    try {
      await orderService.createOrder();
      clearCart();
      setSnack({ open: true, msg: 'Order placed successfully!', severity: 'success' });
      setTimeout(() => navigate('/profile'), 1500);
    } catch {
      setSnack({ open: true, msg: 'Failed to place order. Make sure your cart is synced.', severity: 'error' });
    } finally {
      setPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
          <ShoppingBagOutlinedIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Your cart is empty</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Looks like you haven't added anything yet.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/products')} startIcon={<ArrowBackIcon />}>
            Start Shopping
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ bgcolor: 'grey.50', py: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link component={RouterLink} to="/" underline="hover" color="inherit">Home</Link>
            <Typography color="text.primary">Cart</Typography>
          </Breadcrumbs>
          <Typography variant="h4" fontWeight={800}>Shopping Cart</Typography>
          <Typography variant="body2" color="text.secondary">
            {items.length} item{items.length !== 1 ? 's' : ''} in your cart
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Cart Items */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              {items.map((item, idx) => {
                const firstImage = item.product.images[0];
                const imgSrc = firstImage
                  ? getImageUrl(firstImage.image_url)
                  : 'https://via.placeholder.com/100?text=Product';
                return (
                  <Box key={item.productId}>
                    <Box sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box
                        onClick={() => navigate(`/products/${item.productId}`)}
                        sx={{ width: 100, height: 100, borderRadius: 2, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', border: '1px solid', borderColor: 'divider' }}
                      >
                        <img src={imgSrc} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            onClick={() => navigate(`/products/${item.productId}`)}
                            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' }, pr: 1 }}
                          >
                            {item.product.name}
                          </Typography>
                          <IconButton size="small" color="error" onClick={() => removeItem(item.productId)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <IconButton size="small" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                              inputProps={{ min: 1, style: { textAlign: 'center', width: 36, padding: '4px 0' } }}
                              variant="standard"
                              InputProps={{ disableUnderline: true }}
                            />
                            <IconButton size="small" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography variant="h6" fontWeight={700} color="primary.main">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    {idx < items.length - 1 && <Divider />}
                  </Box>
                );
              })}

              <Divider />
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="small" color="error" onClick={clearCart} startIcon={<DeleteOutlineIcon />}>
                  Clear Cart
                </Button>
              </Box>
            </Paper>

            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/products')} sx={{ mt: 2 }}>
              Continue Shopping
            </Button>
          </Grid>

          {/* Order Summary */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, position: 'sticky', top: 80 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>Order Summary</Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography fontWeight={600}>${subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary">Shipping</Typography>
                  {shipping === 0
                    ? <Chip label="FREE" color="success" size="small" sx={{ fontWeight: 700, height: 20 }} />
                    : <Typography fontWeight={600}>${shipping.toFixed(2)}</Typography>}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Tax (8%)</Typography>
                  <Typography fontWeight={600}>${tax.toFixed(2)}</Typography>
                </Box>
              </Box>

              {shipping > 0 && (
                <Box sx={{ p: 1.5, mb: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200', display: 'flex', gap: 1, alignItems: 'center' }}>
                  <LocalShippingIcon fontSize="small" color="info" />
                  <Typography variant="caption" color="info.dark">
                    Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                  </Typography>
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>Total</Typography>
                <Typography variant="h6" fontWeight={800} color="primary.main">${total.toFixed(2)}</Typography>
              </Box>

              {!isAuthenticated && (
                <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
                  Sign in to place your order
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={placingOrder ? <CircularProgress size={16} color="inherit" /> : <LockIcon />}
                onClick={handleCheckout}
                disabled={placingOrder}
                sx={{ mb: 1.5 }}
              >
                {isAuthenticated ? 'Place Order' : 'Sign In to Checkout'}
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <LockIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">Secure SSL encrypted payment</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
