---
'@greese/react': minor
---

**`Pagination` with `getHref` and a controlled `page` is a Server Component,** so a Server Component can now pass it `getHref` and `labels.page` (it couldn't before: functions don't cross into a client component). Buttons, and links that track their own page, are unchanged.
