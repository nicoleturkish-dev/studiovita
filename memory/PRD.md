# Studio Vita — PRD

## Original Problem Statement
Design and build a website for **Studio Vita**, a Hungarian multidisciplinary wellbeing and development studio bringing together psychologists, coaches, family/couples therapists, child development specialists and workshop leaders. Brand: „Teret adunk a változásnak." Must feel warm, safe, professional, human, calm — never clinical, corporate, or spa-like.

## User Choices
- Language: Hungarian only
- Booking: Full working system (professional → service → date/time → contact → confirmation)
- Admin: Full admin panel with login
- Email: Resend (Emergent-managed) confirmations
- Images: CSS placeholder blocks with descriptive Hungarian text (no stock photos)

## Personas
1. Adults seeking therapy / coaching / self-development
2. Parents needing child psychology or developmental support
3. Couples & families in transition or conflict
4. People seeking workshops, movement, creative programs

## Architecture
- Backend: FastAPI + Motor (MongoDB `studio_vita`) with JWT+cookie auth (bcrypt), Emergent-managed Resend email proxy
- Frontend: React 19 + React Router + Tailwind + shadcn/ui, Cormorant Garamond + Manrope, warm cream/taupe/terracotta/sage palette

## Implemented (Feb 2026)
- Public pages: Home, About (Rólunk), Services (Szolgáltatások — 5 categories, 10 seeded), Team grid + individual profiles (6 seeded), Workshops (4 seeded, inline join), FAQ, Contact
- 4-step booking flow with confirmation email
- Workshop registration with capacity/spots_left decrement + confirmation email
- Contact form → admin messages
- Admin auth (login/logout/me) at /admin/login + protected /admin dashboard
- Admin CRUD: team, services, workshops; booking status + delete; messages view
- Seed on startup (idempotent) — admin + 6 team + 10 services + 4 workshops
- data-testid coverage across all interactive elements
- Backend + frontend testing_agent PASS (100%)

## Backlog (P1/P2)
- P1: Real photography swap-in (client-supplied)
- P1: Guided "find your professional" quiz (self/child/couple/family + area → recommend members)
- P1: Cancellation / rescheduling flow, email reminders
- P2: Blog / SEO content module
- P2: Newsletter signup
- P2: Waiting list for full workshops
- P2: Online payment on booking

## Credentials
See /app/memory/test_credentials.md
