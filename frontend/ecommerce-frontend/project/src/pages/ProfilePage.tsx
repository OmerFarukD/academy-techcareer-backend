import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Skeleton from '@mui/material/Skeleton';
import EmailIcon from '@mui/icons-material/Email';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { useAuthStore } from '../store/authStore';
import { orderService } from '../services/orderService';
import Layout from '../components/common/Layout';
import type { Order } from '../types';

const statusConfig = {
  pending: { color: 'warning' as const, icon: <PendingIcon fontSize="small" /> },
  processing: { color: 'info' as const, icon: <PendingIcon fontSize="small" /> },
  shipped: { color: 'primary' as const, icon: <LocalShippingIcon fontSize="small" /> },
  delivered: { color: 'success' as const, icon: <CheckCircleIcon fontSize="small" /> },
  cancelled: { color: 'error' as const, icon: <CheckCircleIcon fontSize="small" /> },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    orderService
      .getOrders()
      .then(setOrders)
      .finally(() => setLoadingOrders(false));
  }, [isAuthenticated]);

  if (!isAuthenticated || !currentUser) {
    return (
      <Layout>
        <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
            Please sign in to view your profile
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </Container>
      </Layout>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = currentUser.role_id === 1;
  const totalSpent = orders.reduce((s, o) => s + o.total_price, 0);

  return (
    <Layout>
      <Box sx={{ bgcolor: 'grey.50', py: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={800}>My Account</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
              <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 40 }}>
                {currentUser.email[0].toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }} noWrap>
                {currentUser.email}
              </Typography>
              <Chip
                label={isAdmin ? 'Administrator' : 'Member'}
                color={isAdmin ? 'primary' : 'default'}
                size="small"
                sx={{ mb: 2, fontWeight: 600 }}
              />

              <Divider sx={{ mb: 2 }} />

              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <EmailIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={currentUser.email}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {isAdmin && (
                  <Button variant="outlined" startIcon={<AdminPanelSettingsIcon />} onClick={() => navigate('/admin')} fullWidth>
                    Admin Panel
                  </Button>
                )}
                <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout} fullWidth>
                  Sign Out
                </Button>
              </Box>
            </Paper>

            {/* Stats */}
            <Paper elevation={0} sx={{ p: 3, mt: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Account Stats</Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Orders', value: orders.length },
                  { label: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length },
                  { label: 'Total Spent', value: `$${totalSpent.toFixed(0)}` },
                ].map((stat) => (
                  <Grid key={stat.label} size={{ xs: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight={800} color="primary.main">{stat.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Orders */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingBagIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>Order History</Typography>
              </Box>
              <Divider />

              {loadingOrders ? (
                <Box sx={{ p: 2 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={80} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : orders.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <ShoppingBagIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No orders yet</Typography>
                  <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/products')}>
                    Start Shopping
                  </Button>
                </Box>
              ) : (
                orders.map((order) => {
                  const cfg = statusConfig[order.status];
                  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <Box key={order.id}>
                      <Box sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>Order #{order.id}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              color={cfg.color}
                              size="small"
                              icon={cfg.icon}
                              sx={{ fontWeight: 600 }}
                            />
                            <Typography variant="subtitle2" fontWeight={700}>
                              ${order.total_price.toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {itemCount} item{itemCount !== 1 ? 's' : ''} · {order.items.length} product{order.items.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Divider />
                    </Box>
                  );
                })
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}
