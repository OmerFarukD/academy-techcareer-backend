import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import type { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { getImageUrl } from '../../lib/apiClient';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [snackOpen, setSnackOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const firstImage = product.images[0];
  const imageSrc = imgError || !firstImage
    ? 'https://via.placeholder.com/400x300?text=Product'
    : getImageUrl(firstImage.image_url);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    setSnackOpen(true);
  };

  return (
    <>
      <Card
        elevation={0}
        onClick={() => navigate(`/products/${product.id}`)}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          transition: 'box-shadow 0.2s, transform 0.2s',
          '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
        }}
      >
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            height={220}
            image={imageSrc}
            alt={product.name}
            onError={() => setImgError(true)}
            sx={{ objectFit: 'cover', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.04)' } }}
          />
          <Tooltip title="Add to cart">
            <IconButton
              onClick={handleAddToCart}
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: 'background.paper',
                boxShadow: 2,
                opacity: 0,
                transform: 'translateY(4px)',
                transition: 'opacity 0.2s, transform 0.2s',
                '.MuiCard-root:hover &': { opacity: 1, transform: 'translateY(0)' },
              }}
            >
              <AddShoppingCartIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        </Box>

        <CardContent sx={{ flex: 1, pb: 1 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              mb: 0.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.name}
          </Typography>
          {product.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {product.description}
            </Typography>
          )}
          <Typography variant="h6" fontWeight={700} color="primary.main">
            ${product.price.toFixed(2)}
          </Typography>
        </CardContent>

        <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<AddShoppingCartIcon />}
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        </CardActions>
      </Card>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSnackOpen(false)} variant="filled">
          Added to cart!
        </Alert>
      </Snackbar>
    </>
  );
}
