import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink } from 'react-router-dom';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import ProductCard from '../components/product/ProductCard';
import Layout from '../components/common/Layout';
import type { Product, Category } from '../types';

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'name';

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? '');
  const [sort, setSort] = useState<SortKey>('default');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productService.getAll(), categoryService.getAll()])
      .then(([prods, cats]) => {
        setAllProducts(prods);
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setSelectedCategory(searchParams.get('category') ?? '');
  }, [searchParams]);

  const filteredProducts = useMemo<Product[]>(() => {
    let list = allProducts;
    if (selectedCategory) {
      list = list.filter((p) => String(p.category_id) === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [allProducts, selectedCategory, search, sort]);

  const handleCategoryChange = (catId: string) => {
    const next = catId === selectedCategory ? '' : catId;
    setSelectedCategory(next);
    setSearchParams(next ? { category: next } : {});
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (e.target.value) {
      setSearchParams({ search: e.target.value });
    } else {
      setSearchParams({});
    }
  };

  const activeCategoryName = categories.find((c) => String(c.id) === selectedCategory)?.name;

  return (
    <Layout>
      <Box sx={{ bgcolor: 'grey.50', py: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Breadcrumbs>
            <Link component={RouterLink} to="/" underline="hover" color="inherit">Home</Link>
            <Typography color="text.primary">{activeCategoryName ?? 'All Products'}</Typography>
          </Breadcrumbs>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
            {activeCategoryName ?? 'All Products'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, position: 'sticky', top: 80 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Filters</Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="Search products..."
                value={search}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Category</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Chip
                  label="All Categories"
                  onClick={() => handleCategoryChange('')}
                  variant={selectedCategory === '' ? 'filled' : 'outlined'}
                  color={selectedCategory === '' ? 'primary' : 'default'}
                  sx={{ justifyContent: 'flex-start' }}
                />
                {categories.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    onClick={() => handleCategoryChange(String(cat.id))}
                    variant={selectedCategory === String(cat.id) ? 'filled' : 'outlined'}
                    color={selectedCategory === String(cat.id) ? 'primary' : 'default'}
                    sx={{ justifyContent: 'flex-start' }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Product Grid */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Sort by</InputLabel>
                <Select value={sort} label="Sort by" onChange={(e) => setSort(e.target.value as SortKey)}>
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="price-asc">Price: Low to High</MenuItem>
                  <MenuItem value="price-desc">Price: High to Low</MenuItem>
                  <MenuItem value="name">Name A–Z</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {loading ? (
              <Grid container spacing={2.5}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Skeleton variant="rounded" height={320} />
                  </Grid>
                ))}
              </Grid>
            ) : filteredProducts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="h6" color="text.secondary">No products found</Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                  Try adjusting your search or filters
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2.5}>
                {filteredProducts.map((product) => (
                  <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}
