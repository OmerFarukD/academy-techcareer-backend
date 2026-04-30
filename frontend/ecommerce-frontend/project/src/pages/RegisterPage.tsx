import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/common/Layout';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrong = password.length >= 8;
  const passwordsMatch = password === confirm && confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) { setError('Passwords do not match'); return; }
    if (!passwordStrong) { setError('Password must be at least 8 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await register(email, password);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', bgcolor: 'grey.50', py: 6 }}>
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{ p: { xs: 3, sm: 5 }, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  mb: 2,
                }}
              >
                <StorefrontIcon sx={{ color: 'white' }} />
              </Box>
              <Typography variant="h4" fontWeight={800}>
                Create account
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Join ShopNow today — it's free
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText={
                  password.length > 0
                    ? passwordStrong
                      ? '✓ Strong password'
                      : 'Use at least 8 characters'
                    : ''
                }
                FormHelperTextProps={{ sx: { color: passwordStrong ? 'success.main' : 'warning.main' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {passwordsMatch ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <LockOutlinedIcon color="action" />
                      )}
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" color="text.secondary">OR</Typography>
            </Divider>

            <Typography variant="body2" textAlign="center">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" fontWeight={600}>
                Sign in
              </Link>
            </Typography>
          </Paper>
        </Container>
      </Box>
    </Layout>
  );
}
