import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import InputBase from '@mui/material/InputBase';
import { styled, alpha } from '@mui/material/styles';
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

const SearchWrapper = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 40,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.25) },
  width: '100%',
  [theme.breakpoints.up('sm')]: { width: 'auto' },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: '12ch',
    [theme.breakpoints.up('md')]: { width: '20ch' },
  },
}));

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
];

export default function Header() {
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.totalItems());
  const { currentUser, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            sx={{ display: { md: 'none' } }}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </IconButton>

          <Box
            component={RouterLink}
            to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit', mr: 2 }}
          >
            <StorefrontIcon />
            <Typography variant="h6" fontWeight={700} noWrap>
              ShopNow
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
            {navLinks.map((link) => (
              <Button
                key={link.to}
                component={RouterLink}
                to={link.to}
                color="inherit"
                sx={{ fontWeight: 500 }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flex: 1 }} />

          <SearchWrapper>
            <SearchIconWrapper>
              <SearchIcon fontSize="small" />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </SearchWrapper>

          <IconButton color="inherit" onClick={() => navigate('/cart')}>
            <Badge badgeContent={totalItems} color="error">
              <ShoppingCartOutlined />
            </Badge>
          </IconButton>

          {isAuthenticated && currentUser ? (
            <>
              <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark', fontSize: 14 }}>
                  {currentUser.email[0].toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem
                  onClick={() => { navigate('/profile'); handleMenuClose(); }}
                >
                  <PersonOutlineIcon fontSize="small" sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                {currentUser.role_id === 1 && (
                  <MenuItem
                    onClick={() => { navigate('/admin'); handleMenuClose(); }}
                  >
                    <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1 }} />
                    Admin Panel
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              color="inherit"
              size="small"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
        <Box sx={{ width: 260 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorefrontIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>ShopNow</Typography>
            </Box>
            <IconButton onClick={() => setMobileOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.to} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                >
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {!isAuthenticated ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    component={RouterLink}
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                  >
                    <ListItemText primary="Sign In" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    component={RouterLink}
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                  >
                    <ListItemText primary="Register" />
                  </ListItemButton>
                </ListItem>
              </>
            ) : (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    component={RouterLink}
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                  >
                    <ListItemText primary="Profile" />
                  </ListItemButton>
                </ListItem>
                {currentUser?.role_id === 1 && (
                  <ListItem disablePadding>
                    <ListItemButton
                      component={RouterLink}
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                    >
                      <ListItemText primary="Admin Panel" />
                    </ListItemButton>
                  </ListItem>
                )}
                <ListItem disablePadding>
                  <ListItemButton onClick={() => { handleLogout(); setMobileOpen(false); }}>
                    <ListItemText primary="Logout" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
