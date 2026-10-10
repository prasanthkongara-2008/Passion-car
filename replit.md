# Passion Car

The project is being rebuilt as a React + Express application backed by the
Replit PostgreSQL database. Public car listings and inquiries use the Express
API; management APIs require a verified Clerk account whose email is listed in
the server-only `ADMIN_EMAILS` environment variable.

The imported customer handover photos are in `public/images/reviews`; the
hero uses the matching handover image at `public/images/hero-delivery.webp`.
The initial inventory is copied from the four listings publicly shown by the
existing Passion Car site. That copy does not change the old site's Firebase
data.

Development commands:

- `npm run dev` — start the Vite/Express app on port 5000.
- `npm run db:push` — apply the Drizzle schema to the development database.
- `npm run db:seed` — import the initial cars and the editable cars-sold count.
- `npm run typecheck` — check TypeScript.
