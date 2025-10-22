# Travel App Backend API

Modern Express + TypeScript backend with session-based authentication, built for a travel insurance application.

## Tech Stack

**Core:**
- Express 4.x - Web framework
- TypeScript 5.7 - Type safety
- Node.js 20+ - Runtime

**Database:**
- PostgreSQL 16 - Relational database
- Prisma 6.x - Type-safe ORM

**Authentication:**
- BetterAuth 1.x - Session-based auth
- Argon2 - Password hashing
- Nodemailer - Email delivery

**Infrastructure:**
- Docker Compose - Local services
- Inbucket - SMTP testing

**Code Quality:**
- ESLint 9 - Linting
- Prettier - Code formatting
- Zod - Runtime validation

**Security:**
- Helmet - Security headers
- CORS - Cross-origin configuration
- express-rate-limit - Rate limiting

**Logging:**
- Pino - Structured logging
- pino-http - HTTP request logging

---

## Prerequisites

- Node.js >= 20.0.0
- Docker Desktop (for PostgreSQL + Inbucket)
- npm or pnpm

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start Docker services (PostgreSQL + Inbucket)
docker compose up -d

# 4. Run database migrations
npm run db:migrate

# 5. Start development server
npm run dev
```

Server runs on `http://localhost:3000`

---

## Environment Variables

### Required

```env
DATABASE_URL=postgresql://dev:dev@localhost:5432/travel_app
BETTER_AUTH_SECRET=min-32-characters-random-string
BETTER_AUTH_URL=http://localhost:3000
```

### Optional (with defaults)

```env
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5174
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

### Environment Variable Details

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret for signing sessions (min 32 chars)
- `BETTER_AUTH_URL` - Base URL for auth callbacks
- `CLIENT_URL` - Frontend URL for redirects
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 3000)

---

## Project Structure

```
api/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server startup + graceful shutdown
│   ├── config/
│   │   ├── auth.ts              # BetterAuth configuration
│   │   ├── database.ts          # Prisma client singleton
│   │   └── env.ts               # Environment validation (Zod)
│   ├── shared/
│   │   ├── errors/
│   │   │   ├── errors.ts        # Error classes
│   │   │   └── errorHandler.ts # Global error middleware
│   │   └── middleware/
│   │       ├── asyncHandler.ts  # Async error wrapper
│   │       ├── logger.ts        # Pino logger config
│   │       ├── requestLogger.ts # HTTP request logging
│   │       ├── requireAuth.ts   # Authentication middleware
│   │       ├── security.ts      # Helmet, rate limiting, body parsing
│   │       └── validation.ts    # Zod request validation
│   ├── features/                # Feature modules (empty - ready for use)
│   └── types/
│       └── express.d.ts         # Express type extensions
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Migration history
├── docker-compose.yml           # PostgreSQL + Inbucket
├── tsconfig.json                # TypeScript config (NodeNext)
├── eslint.config.js             # ESLint config (flat config)
└── .prettierrc                  # Prettier config
```

---

## Available Scripts

### Development

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled production build
```

### Code Quality

```bash
npm run type-check   # TypeScript type checking (no emit)
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

### Database

```bash
npm run db:migrate   # Create and run migration
npm run db:push      # Push schema changes (prototyping)
npm run db:studio    # Open Prisma Studio (GUI)
npm run db:generate  # Regenerate Prisma Client
```

---

## Authentication

### Endpoints (BetterAuth)

**Registration & Login:**
- `POST /api/auth/sign-up/email` - Register new user
- `POST /api/auth/sign-in/email` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/get-session` - Get current user

**Password Management:**
- `POST /api/auth/forget-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change password (authenticated)

**Email Verification:**
- `POST /api/auth/send-verification-email` - Send verification link
- `GET /api/auth/verify-email` - Verify email with token

**Session Management:**
- `GET /api/auth/list-sessions` - List all user sessions
- `POST /api/auth/revoke-session` - Logout from specific device

**Health Check:**
- `GET /api/auth/ok` - Auth system health check

### Authentication Flow

1. **Registration:** Creates User + Account + Session
2. **Login:** Validates credentials, creates Session
3. **Authenticated Requests:** Include session cookie
4. **Logout:** Deletes session

### Session-Based Auth

- Sessions stored in PostgreSQL
- 7-day expiry
- HTTP-only secure cookies
- Tracks IP address and user agent

---

## Database

### Schema

**Auth Tables:**
- `User` - User profiles (email, name, emailVerified)
- `Account` - Credentials (passwords, OAuth tokens)
- `Session` - Active sessions (7-day expiry)
- `Verification` - Email/password reset tokens

### Migrations

```bash
# Create new migration
npm run db:migrate -- --name description

# View database
npm run db:studio  # Opens at http://localhost:5555
```

### Prisma Client

```typescript
import { db } from './config/database.js';

// Type-safe queries
const users = await db.user.findMany();
const user = await db.user.create({ data: { email, name } });
```

---

## Middleware

### Request Flow

```
Request
  ↓
1. requestLogger (Pino HTTP logging)
  ↓
2. CORS (handle preflight, set headers)
  ↓
3. BetterAuth routes (/api/auth/*)
  ↓
4. Security (Helmet, Rate limiting, Body parsing)
  ↓
5. Application routes
  ↓
6. 404 handler
  ↓
7. errorHandler (global)
  ↓
Response
```

### Middleware Usage

**Async routes:**
```typescript
app.get('/route', asyncHandler(async (req, res) => {
  // Errors auto-caught and passed to errorHandler
}));
```

**Protected routes:**
```typescript
app.get('/route', requireAuth, asyncHandler(async (req, res) => {
  // req.user available (session validated)
}));
```

**Validated routes:**
```typescript
app.post('/route',
  validateRequest({ body: schema }),
  asyncHandler(async (req, res) => {
    // req.body validated against Zod schema
  })
);
```

---

## Error Handling

### Custom Errors

```typescript
import { NotFoundError, UnauthorizedError, BadRequestError } from './shared/errors/errors.js';

throw new NotFoundError('User not found');
throw new UnauthorizedError('Not authenticated');
throw new BadRequestError('Invalid input', { field: 'email' });
```

### Error Response Format

```json
{
  "error": "User not found",
  "statusCode": 404,
  "metadata": { "field": "email" },
  "stack": "..." // Development only
}
```

### Logging

**Development:** Pretty-formatted colored logs
**Production:** Structured JSON logs

```typescript
import { logger } from './shared/middleware/logger.js';

logger.info('Something happened', { userId: 123 });
logger.error('Error occurred', { error, context });
```

---

## Security

### Features

- **CORS:** Configurable allowed origins (no wildcards in production)
- **Helmet:** Security headers (CSP, XSS protection, etc.)
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **Body Size Limits:** JSON 10mb, URL-encoded 1mb
- **Session Security:** HTTP-only, secure, SameSite cookies

### Middleware Order

Critical: CORS before BetterAuth (for OPTIONS preflight)

---

## Development

### Running Locally

```bash
# Terminal 1: Start Docker services
docker compose up

# Terminal 2: Start API
npm run dev

# Optional: View database
npm run db:studio
```

### Debugging

**View logs:** Pino pretty-prints in development

**Database:** Prisma Studio at http://localhost:5555

**Emails:** Inbucket UI at http://localhost:9000

### Code Quality

```bash
# Before committing
npm run lint && npm run type-check && npm run format:check
```

---

## API Endpoints

### Public

- `GET /health` - Health check

### Authentication (see Authentication section)

- All `/api/auth/*` endpoints

### Protected (Examples)

- `GET /api/protected` - Demo protected route (requires auth)

---

## Docker Services

**PostgreSQL:**
- Port: 5432
- Database: travel_app
- User/Pass: dev/dev

**Inbucket (SMTP):**
- Web UI: http://localhost:9000
- SMTP: localhost:2500
- All emails captured for testing

### Docker Commands

```bash
docker compose up -d      # Start services
docker compose down       # Stop services
docker compose logs -f    # View logs
docker compose ps         # Check status
```

---

## Production Considerations

### Before Deploying

1. **Environment Variables:**
   - Generate strong `BETTER_AUTH_SECRET` (32+ characters)
   - Set `BETTER_AUTH_URL` to production domain
   - Update `CORS_ALLOWED_ORIGINS` with production frontend
   - Use production `DATABASE_URL`

2. **Database:**
   - Run migrations: `npm run db:migrate`
   - Set up backup strategy
   - Configure connection pooling if needed

3. **Build:**
   - `npm run build` - Creates `dist/` directory
   - `npm start` - Runs compiled code

4. **Logging:**
   - Production logs are JSON (for log aggregation)
   - Configure log shipping (Datadog, CloudWatch, etc.)

5. **Security:**
   - Review CORS origins
   - Adjust rate limits for production traffic
   - Enable HTTPS (TLS termination at load balancer)

### Environment-Specific Config

**Development:**
- Pretty logs
- Debug level logging
- Permissive CORS (localhost)
- Stack traces in errors

**Production:**
- JSON logs
- Info level logging
- Strict CORS
- Hidden stack traces

---

## Architecture Decisions

### TypeScript Configuration

- **Module:** NodeNext (accurate for Node.js ESM)
- **Module Resolution:** NodeNext
- **Target:** ES2022 (Node 20+ features)
- **Strict:** Enabled (full type safety)

### Why Session-Based Auth?

- Instant revocation (logout everywhere)
- No JWT complexity
- Better security for financial app
- Uses existing PostgreSQL (no Redis needed)

### Why Prisma?

- Type-safe queries (compile-time checking)
- Auto-generated types
- Migration system
- Studio UI for database

### Error Handling Pattern

- All async middleware: `.catch(next)`
- All route handlers: wrapped in `asyncHandler`
- Global error handler formats all responses
- Consistent JSON error format

---

## Common Tasks

### Add a New Route

```typescript
// src/features/myfeature/myfeature.routes.ts
import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';

const router = Router();

router.get('/',
  requireAuth,
  asyncHandler(async (req, res) => {
    // req.user available
    res.json({ data: 'something' });
  })
);

export { router as myFeatureRouter };
```

### Add Database Model

1. Update `prisma/schema.prisma`
2. Run `npm run db:migrate -- --name add_model`
3. Prisma Client auto-updates with new types

### Add Environment Variable

1. Add to `src/config/env.ts` (Zod schema)
2. Add to `.env` and `.env.example`
3. Use via `env.YOUR_VAR`

---

## Troubleshooting

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Database connection fails:**
```bash
docker compose ps  # Check PostgreSQL is running
docker compose up -d postgres
```

**Migrations out of sync:**
```bash
npm run db:push  # Push schema without migration (dev only)
```

**Clear all data:**
```bash
docker exec travel-app-postgres psql -U dev -d travel_app -c "TRUNCATE TABLE \"User\", \"Account\", \"Session\", \"Verification\" CASCADE;"
```

---

## Testing

Currently manual testing via curl/Postman.

**Future:** Vitest + Supertest for automated testing

---

## License

MIT

---

## Notes

- **No overengineering:** Simple, pragmatic patterns
- **Type-safe:** Full TypeScript throughout
- **Production-ready:** All best practices applied
- **Well-documented:** Code comments + this README
