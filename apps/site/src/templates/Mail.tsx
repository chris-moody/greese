/**
 * Email client: folders, a searchable message list and a reading pane side by
 * side on wide screens; on phones the list and the message take turns, with a
 * back button. Starring, archiving, a reply box and a compose dialog work.
 */
import { useState, type JSX } from 'react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  Heading,
  IconButton,
  Stack,
  Text,
  Textarea,
  TextField,
  toast,
} from '@greese/react'
import {
  ArchiveIcon,
  ChevronLeftIcon,
  DocumentIcon,
  InboxIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  StarFilledIcon,
  StarIcon,
  TrashIcon,
} from '@greese/icons'

interface Message {
  id: number
  from: string
  email: string
  subject: string
  preview: string
  body: string[]
  time: string
  unread: boolean
  starred: boolean
  label?: 'Work' | 'Personal' | 'Receipts'
}

const MESSAGES: Message[] = [
  {
    id: 1,
    from: 'Rina Patel',
    email: 'rina@northwind.dev',
    subject: 'Design review moved to Thursday',
    preview: 'Quick heads-up: we pushed the review to Thursday at 2pm so…',
    body: [
      'Hi Alex,',
      'Quick heads-up: we pushed the design review to Thursday at 2pm so the research summary can land first. Same room, same agenda.',
      'If Thursday doesn’t work, reply with a time and I’ll shuffle things around.',
      'Thanks, Rina',
    ],
    time: '9:41',
    unread: true,
    starred: true,
    label: 'Work',
  },
  {
    id: 2,
    from: 'Harbor Bank',
    email: 'statements@harborbank.example',
    subject: 'Your October statement is ready',
    preview: 'Your statement for the account ending 4821 is ready to view…',
    body: [
      'Your statement for the account ending 4821 is ready to view in online banking.',
      'This message was sent automatically. Please do not reply.',
    ],
    time: '8:02',
    unread: true,
    starred: false,
    label: 'Receipts',
  },
  {
    id: 3,
    from: 'Tomás Ruiz',
    email: 'tomas@example.com',
    subject: 'Photos from the weekend',
    preview: 'Finally sorted through them, the lake ones came out great…',
    body: [
      'Finally sorted through them: the lake ones came out great, the rest are mostly of the dog.',
      'Shared album link coming tonight. Dinner next week?',
      'T.',
    ],
    time: 'Yesterday',
    unread: false,
    starred: false,
    label: 'Personal',
  },
  {
    id: 4,
    from: 'Luis Ortega',
    email: 'luis@northwind.dev',
    subject: 'Re: Q4 roadmap draft',
    preview: 'Left comments on the onboarding section, mostly small…',
    body: [
      'Left comments on the onboarding section, mostly small wording things.',
      'The bigger question is whether the import tool ships in Q4 or slides to Q1. I lean Q1.',
      'Luis',
    ],
    time: 'Mon',
    unread: false,
    starred: true,
    label: 'Work',
  },
  {
    id: 5,
    from: 'Fieldstone',
    email: 'hello@fieldstone.example',
    subject: 'Your quarterly portfolio summary',
    preview: 'Your portfolio returned 3.1% this quarter. Here’s what moved…',
    body: [
      'Your portfolio returned 3.1% this quarter. Here’s what moved it, and what’s next.',
    ],
    time: 'Oct 18',
    unread: false,
    starred: false,
    label: 'Receipts',
  },
]

const folders = [
  { id: 'inbox', label: 'Inbox', icon: <InboxIcon /> },
  { id: 'starred', label: 'Starred', icon: <StarIcon /> },
  { id: 'sent', label: 'Sent', icon: <SendIcon /> },
  { id: 'drafts', label: 'Drafts', icon: <DocumentIcon /> },
  { id: 'archive', label: 'Archive', icon: <ArchiveIcon /> },
  { id: 'trash', label: 'Trash', icon: <TrashIcon /> },
]

const Compose = (): JSX.Element => {
  const [open, setOpen] = useState(false)
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      size="lg"
      title="New message"
      trigger={
        <Button startIcon={<PlusIcon />} fullWidth>
          Compose
        </Button>
      }
      footer={
        <Stack direction="row" gap={2} justify="end">
          <Button variant="ghost" tone="neutral" onClick={() => setOpen(false)}>
            Discard
          </Button>
          <Button
            startIcon={<SendIcon />}
            onClick={() => {
              setOpen(false)
              toast({ title: 'Message sent', tone: 'positive' })
            }}
          >
            Send
          </Button>
        </Stack>
      }
    >
      <Stack gap={3}>
        <TextField label="To" type="email" placeholder="name@example.com" />
        <TextField label="Subject" />
        <Textarea aria-label="Message" rows={8} />
      </Stack>
    </Dialog>
  )
}

export const Mail = (): JSX.Element => {
  const [messages, setMessages] = useState(MESSAGES)
  const [folder, setFolder] = useState('inbox')
  const [openId, setOpenId] = useState<number | undefined>(1)
  const [query, setQuery] = useState('')

  const update = (id: number, change: Partial<Message>) =>
    setMessages((all) => all.map((m) => (m.id === id ? { ...m, ...change } : m)))

  const visible = messages.filter(
    (m) =>
      (folder !== 'starred' || m.starred) &&
      (folder === 'inbox' || folder === 'starred') &&
      `${m.from} ${m.subject} ${m.preview}`.toLowerCase().includes(query.toLowerCase())
  )
  const open = messages.find((m) => m.id === openId)
  const unread = messages.filter((m) => m.unread).length

  return (
    <div className="tpl-mail" data-reading={open ? '' : undefined}>
      <nav className="tpl-mail-folders" aria-label="Folders">
        <Stack gap={1} p={3}>
          <Compose />
          <Divider />
          {folders.map((f) => (
            <Button
              key={f.id}
              variant={folder === f.id ? 'soft' : 'ghost'}
              tone={folder === f.id ? 'primary' : 'neutral'}
              startIcon={f.icon}
              className="tpl-nav-button"
              aria-current={folder === f.id ? 'page' : undefined}
              onClick={() => {
                setFolder(f.id)
                setOpenId(undefined)
              }}
              endIcon={
                f.id === 'inbox' && unread ? (
                  <Badge tone="primary">{unread}</Badge>
                ) : undefined
              }
            >
              {f.label}
            </Button>
          ))}
          <Divider />
          <Text variant="caption" tone="muted">
            Labels
          </Text>
          <Stack direction="row" gap={1} wrap="wrap">
            <Chip tone="primary">Work</Chip>
            <Chip tone="secondary">Personal</Chip>
            <Chip>Receipts</Chip>
          </Stack>
        </Stack>
      </nav>

      <section className="tpl-mail-list" aria-label="Messages">
        <Stack gap={2} p={3}>
          <TextField
            label="Search mail"
            hideLabel
            type="search"
            size="sm"
            placeholder="Search mail"
            startAdornment={<SearchIcon />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
        </Stack>
        <ul className="tpl-mail-items">
          {visible.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="tpl-mail-item"
                aria-current={m.id === openId || undefined}
                data-unread={m.unread || undefined}
                onClick={() => {
                  setOpenId(m.id)
                  update(m.id, { unread: false })
                }}
              >
                <Avatar name={m.from} size="sm" />
                <span className="tpl-mail-item-text">
                  <span className="tpl-mail-item-top">
                    <Text variant="p3" weight={m.unread ? 'bold' : 'medium'} truncate>
                      {m.from}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {m.time}
                    </Text>
                  </span>
                  <Text variant="p3" weight={m.unread ? 'semibold' : 'regular'} truncate>
                    {m.subject}
                  </Text>
                  <Text variant="caption" tone="muted" truncate>
                    {m.preview}
                  </Text>
                </span>
              </button>
            </li>
          ))}
          {visible.length === 0 && (
            <li>
              <Text tone="muted" className="tpl-empty">
                Nothing here.
              </Text>
            </li>
          )}
        </ul>
      </section>

      <section className="tpl-mail-reader" aria-label="Message">
        {open ? (
          <Stack gap={4} p={{ xs: 3, md: 5 }} greese={{ enter: 'theme', stagger: 0.06 }}>
            <Stack direction="row" gap={1} align="center">
              <IconButton
                label="Back to messages"
                className="tpl-mail-back"
                onClick={() => setOpenId(undefined)}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                label={open.starred ? 'Unstar' : 'Star'}
                aria-pressed={open.starred}
                onClick={() => update(open.id, { starred: !open.starred })}
              >
                {open.starred ? <StarFilledIcon /> : <StarIcon />}
              </IconButton>
              <IconButton
                label="Archive"
                onClick={() => {
                  const before = messages
                  setMessages(messages.filter((m) => m.id !== open.id))
                  setOpenId(undefined)
                  toast({
                    title: 'Archived',
                    action: { label: 'Undo', onClick: () => setMessages(before) },
                  })
                }}
              >
                <ArchiveIcon />
              </IconButton>
            </Stack>
            <Stack gap={2}>
              <Heading level={1} variant="h4">
                {open.subject}
              </Heading>
              {open.label && (
                <span>
                  <Badge>{open.label}</Badge>
                </span>
              )}
            </Stack>
            <Stack direction="row" gap={3} align="center">
              <Avatar name={open.from} />
              <Stack gap={0}>
                <Text weight="semibold">{open.from}</Text>
                <Text variant="caption" tone="muted">
                  {open.email} · {open.time}
                </Text>
              </Stack>
            </Stack>
            <Stack gap={3}>
              {open.body.map((p, i) => (
                <Text key={i}>{p}</Text>
              ))}
            </Stack>
            <Card variant="outline">
              <Textarea
                aria-label={`Reply to ${open.from}`}
                placeholder={`Reply to ${open.from}…`}
                rows={3}
              />
              <Stack direction="row" justify="end">
                <Button
                  size="sm"
                  startIcon={<SendIcon />}
                  onClick={() =>
                    toast({ title: `Reply sent to ${open.from}`, tone: 'positive' })
                  }
                >
                  Send
                </Button>
              </Stack>
            </Card>
          </Stack>
        ) : (
          <Stack align="center" justify="center" className="tpl-empty" p={5}>
            <Text tone="muted">Select a message to read it.</Text>
          </Stack>
        )}
      </section>
    </div>
  )
}
