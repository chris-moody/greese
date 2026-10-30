---
'@greese/react': patch
---

`usePageNavigate` takes a router's navigate as it is, React Router's `useNavigate()` included: it asks only for the path form (`(to, { replace })`), which an overloaded navigate satisfies. A history step (`page.navigate(-1)`) goes to the browser's history, which routers follow.
