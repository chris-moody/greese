/**
 * E-commerce store: a product grid with search, category filters and
 * sorting, ratings and sale prices, add-to-cart with a count on the cart
 * button, and a cart drawer with quantities, a subtotal and checkout.
 */
import { useMemo, useState, type CSSProperties, type JSX } from 'react'
import {
  Badge,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  Drawer,
  Field,
  Grid,
  Heading,
  IconButton,
  Indicator,
  NumberField,
  Rating,
  Select,
  Stack,
  Text,
  TextField,
  toast,
} from '@greese/react'
import { CartIcon, HeartIcon, SearchIcon, TrashIcon } from '@greese/icons'

interface Product {
  id: number
  name: string
  category: Category
  price: number
  was?: number
  rating: number
  reviews: number
  hue: number
}

const CATEGORIES = ['Kitchen', 'Desk', 'Outdoor', 'Bath'] as const
type Category = (typeof CATEGORIES)[number]

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Stoneware mug, set of 2',
    category: 'Kitchen',
    price: 34,
    rating: 4.5,
    reviews: 212,
    hue: 28,
  },
  {
    id: 2,
    name: 'Walnut desk organizer',
    category: 'Desk',
    price: 58,
    was: 72,
    rating: 4.8,
    reviews: 96,
    hue: 35,
  },
  {
    id: 3,
    name: 'Linen hand towels',
    category: 'Bath',
    price: 26,
    rating: 4.2,
    reviews: 151,
    hue: 190,
  },
  {
    id: 4,
    name: 'Enamel camp kettle',
    category: 'Outdoor',
    price: 44,
    rating: 4.6,
    reviews: 74,
    hue: 150,
  },
  {
    id: 5,
    name: 'Felt laptop sleeve',
    category: 'Desk',
    price: 39,
    rating: 4.4,
    reviews: 188,
    hue: 220,
  },
  {
    id: 6,
    name: 'Cast iron skillet',
    category: 'Kitchen',
    price: 49,
    was: 65,
    rating: 4.9,
    reviews: 403,
    hue: 10,
  },
  {
    id: 7,
    name: 'Cedar bath caddy',
    category: 'Bath',
    price: 52,
    rating: 4.3,
    reviews: 39,
    hue: 45,
  },
  {
    id: 8,
    name: 'Waxed canvas tote',
    category: 'Outdoor',
    price: 68,
    rating: 4.7,
    reviews: 120,
    hue: 95,
  },
]

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

type Sort = 'featured' | 'price-low' | 'price-high' | 'rating'

const sorters: Record<Sort, (a: Product, b: Product) => number> = {
  featured: (a, b) => a.id - b.id,
  'price-low': (a, b) => a.price - b.price,
  'price-high': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
}

export const Store = (): JSX.Element => {
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [sort, setSort] = useState<Sort>('featured')
  const [cart, setCart] = useState<Record<number, number>>({ 6: 1 })
  const [cartOpen, setCartOpen] = useState(false)
  const [saved, setSaved] = useState<number[]>([])

  const shown = useMemo(
    () =>
      PRODUCTS.filter(
        (p) =>
          (!categories.length || categories.includes(p.category)) &&
          p.name.toLowerCase().includes(query.toLowerCase())
      ).sort(sorters[sort]),
    [categories, query, sort]
  )
  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === Number(id))!, qty }))
    .filter((line) => line.qty > 0)
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = lines.reduce((n, l) => n + l.qty * l.product.price, 0)

  const add = (p: Product) => {
    setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }))
    toast({
      title: 'Added to cart',
      description: p.name,
      action: { label: 'View cart', onClick: () => setCartOpen(true) },
    })
  }

  return (
    <Container size="lg">
      <Stack gap={5} py={{ xs: 4, md: 6 }}>
        <Stack
          direction="row"
          justify="between"
          align="end"
          gap={3}
          wrap="wrap"
          greese={{ enter: 'theme', stagger: 0.06 }}
        >
          <Stack gap={1}>
            <Heading level={1} variant="h2">
              Goods for slow mornings
            </Heading>
            <Text tone="muted">Free shipping over $75 · Returns within 30 days</Text>
          </Stack>
          <Indicator
            content={
              count ? (
                <Badge tone="primary" variant="solid">
                  {count}
                </Badge>
              ) : null
            }
          >
            <Button
              variant="soft"
              tone="neutral"
              startIcon={<CartIcon />}
              onClick={() => setCartOpen(true)}
            >
              Cart
            </Button>
          </Indicator>
        </Stack>

        <Grid container columns={{ xs: 1, md: '1fr auto' }} gap={3} align="end">
          <TextField
            label="Search products"
            hideLabel
            type="search"
            placeholder="Search products"
            startAdornment={<SearchIcon />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          <Field label="Sort by" hideLabel>
            <Select value={sort} onChange={(e) => setSort(e.currentTarget.value as Sort)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Best rated</option>
            </Select>
          </Field>
        </Grid>
        <Stack direction="row" gap={2} wrap="wrap" role="group" aria-label="Categories">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              selectable
              selected={categories.includes(c)}
              onSelectedChange={(on) =>
                setCategories((all) => (on ? [...all, c] : all.filter((x) => x !== c)))
              }
            >
              {c}
            </Chip>
          ))}
        </Stack>

        <Text variant="p3" tone="muted" role="status">
          {shown.length} {shown.length === 1 ? 'product' : 'products'}
        </Text>
        <Grid
          container
          minChildWidth="14rem"
          gap={4}
          greese={{ inView: 'theme', stagger: 0.06 }}
        >
          {shown.map((p) => (
            <Card key={p.id} variant="outline" padding={3}>
              <div
                className="tpl-product-art"
                style={{ '--tpl-hue': p.hue } as CSSProperties}
                aria-hidden="true"
              >
                {p.was && (
                  <Badge tone="negative" variant="solid" className="tpl-product-sale">
                    Sale
                  </Badge>
                )}
              </div>
              <Stack gap={1}>
                <Stack direction="row" justify="between" align="start" gap={2}>
                  <Heading level={2} variant="h6">
                    {p.name}
                  </Heading>
                  <IconButton
                    size="sm"
                    label={
                      saved.includes(p.id)
                        ? `Remove ${p.name} from saved`
                        : `Save ${p.name}`
                    }
                    aria-pressed={saved.includes(p.id)}
                    tone={saved.includes(p.id) ? 'primary' : 'neutral'}
                    onClick={() =>
                      setSaved((s) =>
                        s.includes(p.id) ? s.filter((id) => id !== p.id) : [...s, p.id]
                      )
                    }
                  >
                    <HeartIcon />
                  </IconButton>
                </Stack>
                <Stack direction="row" gap={2} align="center">
                  <Rating
                    label={`Rated ${p.rating} out of 5`}
                    hideLabel
                    value={p.rating}
                    step={0.5}
                    readOnly
                    size="xs"
                  />
                  <Text variant="caption" tone="muted">
                    {p.reviews}
                  </Text>
                </Stack>
                <Stack direction="row" gap={2} align="baseline">
                  <Text weight="bold">{money(p.price)}</Text>
                  {p.was && (
                    <Text variant="p3" tone="muted" className="tpl-was">
                      <span className="greese-VisuallyHidden">was </span>
                      {money(p.was)}
                    </Text>
                  )}
                </Stack>
              </Stack>
              <Button fullWidth onClick={() => add(p)}>
                Add to cart
              </Button>
            </Card>
          ))}
        </Grid>
      </Stack>

      <Drawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        title={`Your cart (${count})`}
        placement={{ xs: 'bottom', md: 'end' }}
        footer={
          <Stack gap={3}>
            <Stack direction="row" justify="between">
              <Text weight="semibold">Subtotal</Text>
              <Text weight="bold">{money(subtotal)}</Text>
            </Stack>
            <Text variant="caption" tone="muted">
              {subtotal >= 75
                ? 'Shipping is on us.'
                : `${money(75 - subtotal)} more for free shipping.`}
            </Text>
            <Button
              size="lg"
              fullWidth
              disabled={!count}
              onClick={() => {
                setCartOpen(false)
                setCart({})
                toast({
                  title: 'Order placed',
                  description: 'A receipt is on its way.',
                  tone: 'positive',
                })
              }}
            >
              Check out
            </Button>
          </Stack>
        }
      >
        {lines.length === 0 ? (
          <Text tone="muted">Your cart is empty.</Text>
        ) : (
          <Stack gap={4}>
            {lines.map(({ product, qty }, i) => (
              <Stack key={product.id} gap={3}>
                {i > 0 && <Divider />}
                <Stack direction="row" gap={3} align="center">
                  <div
                    className="tpl-product-art tpl-product-art--thumb"
                    style={{ '--tpl-hue': product.hue } as CSSProperties}
                    aria-hidden="true"
                  />
                  <Stack gap={1} className="tpl-grow">
                    <Text weight="semibold">{product.name}</Text>
                    <Text variant="p3" tone="muted">
                      {money(product.price)} each
                    </Text>
                  </Stack>
                  <IconButton
                    size="sm"
                    label={`Remove ${product.name}`}
                    onClick={() => setCart((c) => ({ ...c, [product.id]: 0 }))}
                  >
                    <TrashIcon />
                  </IconButton>
                </Stack>
                <NumberField
                  label={`Quantity of ${product.name}`}
                  hideLabel
                  value={qty}
                  min={0}
                  max={10}
                  onValueChange={(v) => setCart((c) => ({ ...c, [product.id]: v ?? 0 }))}
                />
              </Stack>
            ))}
          </Stack>
        )}
      </Drawer>
    </Container>
  )
}
