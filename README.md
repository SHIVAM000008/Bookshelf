# Bookshelf

Book tracker with user login, roles and AI summaries. Built with Node.js, Express.js and MongoDB (Mongoose).

## Run it

1. Make sure MongoDB is running locally, or put an Atlas connection string in `.env`
2. `cp .env.example .env` (Windows: `copy .env.example .env`)
3. Set `JWT_SECRET` in `.env`. Generate one with:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. `npm install`
5. `npm start`
6. Open http://localhost:3000

## Authentication and roles

- Register and log in from the login page. Passwords are hashed with bcrypt.
- Login sets a JWT in an httpOnly cookie that lasts 7 days.
- Normal users only see and manage their own books.
- The account that registers with the email in `ADMIN_EMAIL` becomes an admin.
  Admins see every book, can manage any book, and can view or delete users.

## AI summaries

Each book has an "AI summary" button that asks Claude for a short, spoiler-free summary.
Set `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) in `.env` to turn it on.

## API

| Method | Route | Access | What it does |
|--------|-------|--------|--------------|
| POST | /api/auth/register | public | Create an account |
| POST | /api/auth/login | public | Log in |
| POST | /api/auth/logout | public | Log out |
| GET | /api/auth/me | logged in | Current user |
| GET | /api/books | logged in | List your books (all books for admin) |
| GET | /api/books/:id | owner or admin | Get one book |
| POST | /api/books | logged in | Create a book |
| PUT | /api/books/:id | owner or admin | Update a book |
| POST | /api/books/:id/summary | owner or admin | Generate and save an AI summary |
| DELETE | /api/books/:id | owner or admin | Delete a book |
| GET | /api/users | admin | List users |
| DELETE | /api/users/:id | admin | Delete a user and their books |
# Bookshelf
