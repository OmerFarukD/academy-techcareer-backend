import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/common/Layout';
import type { Product, Category, Order } from '../types';
import { getImageUrl } from '../lib/apiClient';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{title}</Typography>
          <Typography variant="h4" fontWeight={800}>{value}</Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <TrendingUpIcon fontSize="small" color="success" />
              <Typography variant="caption" color="success.main">{trend}</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', price: '', description: '', category_id: '' });
  const [addForm, setAddForm] = useState({ name: '', price: '', description: '', category_id: '' });
  const [snack, setSnack] = useState<{ open: boolean; msg: string; type: 'success' | 'error' }>({
    open: false, msg: '', type: 'success',
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([productService.getAll(), categoryService.getAll(), orderService.getOrders()])
      .then(([prods, cats, ords]) => {
        setProducts(prods);
        setCategories(cats);
        setOrders(ords);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (editTarget) {
      setEditForm({
        name: editTarget.name,
        price: String(editTarget.price),
        description: editTarget.description ?? '',
        category_id: String(editTarget.category_id ?? ''),
      });
    }
  }, [editTarget]);

  if (!isAuthenticated || currentUser?.role_id !== 1) {
    return (
      <Layout>
        <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Admin access required</Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/login')}>Sign In</Button>
        </Container>
      </Layout>
    );
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      categories.find((c) => c.id === p.category_id)?.name.toLowerCase().includes(search.toLowerCase()),
  );

  const revenue = orders.reduce((s, o) => s + o.total_price, 0);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productService.delete(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setSnack({ open: true, msg: `"${deleteTarget.name}" deleted`, type: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Delete failed', type: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const updated = await productService.update(editTarget.id, {
        name: editForm.name,
        price: Number(editForm.price),
        description: editForm.description,
        category_id: Number(editForm.category_id),
      });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSnack({ open: true, msg: 'Product updated', type: 'success' });
      setEditTarget(null);
    } catch {
      setSnack({ open: true, msg: 'Update failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      const created = await productService.create({
        name: addForm.name,
        price: Number(addForm.price),
        description: addForm.description,
        category_id: Number(addForm.category_id),
      });
      setProducts((prev) => [...prev, created]);
      setSnack({ open: true, msg: 'Product created', type: 'success' });
      setAddOpen(false);
      setAddForm({ name: '', price: '', description: '', category_id: '' });
    } catch {
      setSnack({ open: true, msg: 'Create failed', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const statusColors = { pending: 'warning', processing: 'info', shipped: 'primary', delivered: 'success', cancelled: 'error' } as const;

  return (
    <Layout>
      <Box sx={{ bgcolor: 'grey.50', py: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={800}>Admin Panel</Typography>
              <Typography variant="body2" color="text.secondary">{currentUser.email}</Typography>
            </Box>
            <Chip label="Admin" color="primary" icon={<PeopleIcon />} sx={{ fontWeight: 700 }} />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Stats */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[
            { title: 'Total Products', value: String(products.length), icon: <InventoryIcon />, color: '#1976d2' },
            { title: 'Total Orders', value: String(orders.length), icon: <ShoppingBagIcon />, color: '#ed6c02' },
            { title: 'Revenue', value: `$${revenue.toFixed(0)}`, icon: <AttachMoneyIcon />, color: '#00796b', trend: 'Live data' },
            { title: 'Categories', value: String(categories.length), icon: <InventoryIcon />, color: '#7b1fa2' },
          ].map((s) => (
            <Grid key={s.title} size={{ xs: 6, md: 3 }}>
              <StatCard {...s} />
            </Grid>
          ))}
        </Grid>

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="Products" />
              <Tab label="Orders" />
            </Tabs>
          </Box>

          {/* Products Tab */}
          {tab === 0 && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                  sx={{ minWidth: 220 }}
                />
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
                  Add Product
                </Button>
              </Box>

              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={50} sx={{ mb: 0.5 }} />)
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                        <TableCell>Product</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((product) => {
                        const cat = categories.find((c) => c.id === product.category_id);
                        const firstImg = product.images[0];
                        return (
                          <TableRow key={product.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                  src={firstImg ? getImageUrl(firstImg.image_url) : undefined}
                                  alt={product.name}
                                  variant="rounded"
                                  sx={{ width: 40, height: 40 }}
                                />
                                <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                                  {product.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">{cat?.name ?? '—'}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700} color="primary.main">
                                ${product.price.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small" color="primary" onClick={() => setEditTarget(product)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(product)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing {filtered.length} of {products.length} products
              </Typography>
            </Box>
          )}

          {/* Orders Tab */}
          {tab === 1 && (
            <Box sx={{ p: 2 }}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={50} sx={{ mb: 0.5 }} />)
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Items</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>#{order.id}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {order.items.reduce((s, i) => s + i.quantity, 0)} items
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                              ${order.total_price.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={order.status}
                              size="small"
                              color={statusColors[order.status]}
                              sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(order.created_at).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Paper>
      </Container>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Product Name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
            <TextField label="Price" type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={editForm.category_id} label="Category" onChange={(e) => setEditForm((f) => ({ ...f, category_id: String(e.target.value) }))}>
                {categories.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Description" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} fullWidth multiline rows={3} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Product</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Product Name" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} fullWidth required />
            <TextField label="Price" type="number" value={addForm.price} onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))} fullWidth required />
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select value={addForm.category_id} label="Category" onChange={(e) => setAddForm((f) => ({ ...f, category_id: String(e.target.value) }))}>
                {categories.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Description" value={addForm.description} onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))} fullWidth multiline rows={3} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={adding}>
            {adding ? <CircularProgress size={18} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.type} onClose={() => setSnack((s) => ({ ...s, open: false }))} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
