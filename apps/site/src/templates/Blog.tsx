/**
 * Blog and newsletter: a masthead, topic filters, a featured story, a grid of
 * posts, a subscribe form that confirms with a toast, the most-read list and
 * pagination. Cover art is CSS gradients, so there are no images to load.
 */
import { useState, type CSSProperties, type FormEvent, type JSX } from 'react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Container,
  Grid,
  Heading,
  Link,
  List,
  ListItem,
  Pagination,
  Stack,
  Text,
  TextField,
  toast,
} from '@greese/react'
import { ArrowRightIcon, HeartIcon } from '@greese/icons'

interface Post {
  id: number
  title: string
  excerpt: string
  topic: Topic
  author: string
  minutes: number
  date: string
  /** The cover's hue, in degrees. */
  hue: number
}

const TOPICS = ['Design', 'Engineering', 'Culture', 'Product'] as const
type Topic = (typeof TOPICS)[number]

const POSTS: Post[] = [
  {
    id: 1,
    title: 'The case for boring CSS',
    excerpt:
      'Cascade layers, custom properties and a little restraint go further than any runtime.',
    topic: 'Engineering',
    author: 'Ada Kim',
    minutes: 7,
    date: 'Oct 21',
    hue: 210,
  },
  {
    id: 2,
    title: 'Designing for the thumb',
    excerpt:
      'Why every primary action on a phone belongs in the bottom third of the screen.',
    topic: 'Design',
    author: 'Rina Patel',
    minutes: 5,
    date: 'Oct 18',
    hue: 330,
  },
  {
    id: 3,
    title: 'Shipping on Fridays',
    excerpt:
      'What changed when we stopped treating the end of the week as a deploy freeze.',
    topic: 'Culture',
    author: 'Luis Ortega',
    minutes: 6,
    date: 'Oct 15',
    hue: 25,
  },
  {
    id: 4,
    title: 'Roadmaps that survive contact',
    excerpt:
      'Plans written as bets, not promises, and how we review them every six weeks.',
    topic: 'Product',
    author: 'Sam Okafor',
    minutes: 9,
    date: 'Oct 11',
    hue: 150,
  },
  {
    id: 5,
    title: 'Motion with a purpose',
    excerpt: 'Animation that explains a change of state, and the rest that we cut.',
    topic: 'Design',
    author: 'Ada Kim',
    minutes: 4,
    date: 'Oct 8',
    hue: 270,
  },
  {
    id: 6,
    title: 'One table, three layouts',
    excerpt:
      'How a single data table becomes cards on a phone without a second component.',
    topic: 'Engineering',
    author: 'Tomás Ruiz',
    minutes: 8,
    date: 'Oct 4',
    hue: 190,
  },
]

/** A cover: two hues in a gradient, from the post's own. */
const Cover = ({ hue, tall }: { hue: number; tall?: boolean }) => (
  <div
    className="tpl-art"
    data-tall={tall || undefined}
    style={{ '--tpl-hue': hue } as CSSProperties}
    aria-hidden="true"
  />
)

const Byline = ({ post }: { post: Post }) => (
  <Stack direction="row" gap={2} align="center">
    <Avatar name={post.author} size="xs" />
    <Text variant="caption" tone="muted">
      {post.author} · {post.date} · {post.minutes} min read
    </Text>
  </Stack>
)

const Subscribe = (): JSX.Element => {
  const [email, setEmail] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    toast({
      title: 'You’re subscribed',
      description: `The next issue goes to ${email}.`,
      tone: 'positive',
    })
    setEmail('')
  }
  return (
    <Card variant="filled">
      <Heading level={2} variant="h5">
        The Thursday letter
      </Heading>
      <Text variant="p3" tone="muted">
        One essay a week on design and engineering. No tracking, unsubscribe in one click.
      </Text>
      <form onSubmit={submit}>
        <Stack gap={2}>
          <TextField
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <Button type="submit">Subscribe</Button>
        </Stack>
      </form>
    </Card>
  )
}

export const Blog = (): JSX.Element => {
  const [topics, setTopics] = useState<Topic[]>([])
  const [page, setPage] = useState(1)
  const [liked, setLiked] = useState<number[]>([])
  const [featured, ...rest] = POSTS
  const posts = rest.filter((p) => !topics.length || topics.includes(p.topic))

  return (
    <Container size="lg">
      <Stack gap={6} py={{ xs: 5, md: 7 }}>
        <Stack
          gap={3}
          align="center"
          textAlign="center"
          greese={{ enter: 'theme', stagger: 0.06 }}
        >
          <Text variant="caption" tone="muted" className="tpl-kicker">
            Issue 142 · October 2026
          </Text>
          <Heading level={1} variant="h1">
            Field Notes
          </Heading>
          <Text tone="muted" className="tpl-measure">
            Essays on building software people enjoy using, from the team at Northwind.
          </Text>
          <Stack
            direction="row"
            gap={2}
            wrap="wrap"
            justify="center"
            role="group"
            aria-label="Filter by topic"
          >
            {TOPICS.map((topic) => (
              <Chip
                key={topic}
                selectable
                selected={topics.includes(topic)}
                onSelectedChange={(on) =>
                  setTopics((all) =>
                    on ? [...all, topic] : all.filter((t) => t !== topic)
                  )
                }
              >
                {topic}
              </Chip>
            ))}
          </Stack>
        </Stack>

        {featured && (
          <Card variant="outline" interactive asChild>
            <a href="#featured" className="tpl-featured">
              <Cover hue={featured.hue} tall />
              <Stack gap={3} justify="center">
                <span>
                  <Badge tone="primary">Featured · {featured.topic}</Badge>
                </span>
                <Heading level={2} variant="h2">
                  {featured.title}
                </Heading>
                <Text tone="muted">{featured.excerpt}</Text>
                <Byline post={featured} />
              </Stack>
            </a>
          </Card>
        )}

        <Grid container columns={{ xs: 1, lg: '1fr 20rem' }} gap={6}>
          <Stack gap={5}>
            <Grid
              container
              minChildWidth="16rem"
              gap={4}
              greese={{ inView: 'theme', stagger: 0.06 }}
            >
              {posts.map((post) => (
                <Card key={post.id} variant="outline">
                  <Cover hue={post.hue} />
                  <Stack direction="row" justify="between" align="center">
                    <Badge>{post.topic}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      tone={liked.includes(post.id) ? 'primary' : 'neutral'}
                      aria-pressed={liked.includes(post.id)}
                      startIcon={<HeartIcon />}
                      onClick={() =>
                        setLiked((all) =>
                          all.includes(post.id)
                            ? all.filter((id) => id !== post.id)
                            : [...all, post.id]
                        )
                      }
                    >
                      {liked.includes(post.id) ? 'Liked' : 'Like'}
                    </Button>
                  </Stack>
                  <Heading level={3} variant="h5">
                    <Link href={`#post-${post.id}`} tone="neutral" underline="hover">
                      {post.title}
                    </Link>
                  </Heading>
                  <Text variant="p3" tone="muted">
                    {post.excerpt}
                  </Text>
                  <Byline post={post} />
                </Card>
              ))}
            </Grid>
            {posts.length === 0 && (
              <Text tone="muted">No posts on those topics yet.</Text>
            )}
            <Pagination
              count={12}
              page={page}
              onPageChange={setPage}
              label="Older posts"
            />
          </Stack>

          <Stack gap={5}>
            <Subscribe />
            <Stack gap={2}>
              <Heading level={2} variant="h6">
                Most read this month
              </Heading>
              <List divided>
                {POSTS.slice(0, 4).map((post, i) => (
                  <ListItem
                    key={post.id}
                    start={
                      <Text weight="bold" tone="muted">
                        {i + 1}
                      </Text>
                    }
                    title={
                      <Link href={`#post-${post.id}`} tone="neutral" underline="hover">
                        {post.title}
                      </Link>
                    }
                    description={`${post.author} · ${post.minutes} min`}
                  />
                ))}
              </List>
              <Link href="#archive" underline="hover">
                <Stack direction="row" gap={1} align="center" asChild>
                  <span>
                    The full archive <ArrowRightIcon />
                  </span>
                </Stack>
              </Link>
            </Stack>
          </Stack>
        </Grid>
      </Stack>
    </Container>
  )
}
