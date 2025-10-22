# Travel App - Client

Modern React single-page application with complete authentication, built with Vite, TypeScript, and Tailwind CSS. Part of a full-stack TypeScript monorepo with BetterAuth integration.

## Features

- ✅ **Complete Authentication System** - Login, signup, password reset with BetterAuth
- ✅ **Protected Routes** - Auth guard pattern with automatic redirects
- ✅ **Session Management** - Cookie-based persistence, auto-refresh
- ✅ **Error Boundary** - Graceful error handling with dev/prod modes
- ✅ **Toast Notifications** - User feedback system (success, error, info, warning)
- ✅ **Loading States** - Spinner, skeleton screens, button loading states
- ✅ **Type-Safe API** - Fully typed API client with error handling
- ✅ **Modern Tooling** - Vite, TypeScript strict mode, ESLint, Prettier
- ✅ **Responsive Design** - Tailwind CSS v4 with mobile-first approach
- ✅ **Production Ready** - Zero lint warnings, comprehensive error handling

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev/) | 19.1.1 | UI framework |
| [Vite](https://vite.dev/) | 7.1.7 | Build tool & dev server |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.3 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4.1.15 | Styling framework |
| [React Router](https://reactrouter.com/) | 7.9.4 | Client-side routing |
| [Zustand](https://zustand.docs.pmnd.rs/) | 5.0.8 | State management |
| [ESLint](https://eslint.org/) | 9.38.0 | Linting |
| [Prettier](https://prettier.io/) | 3.6.2 | Code formatting |

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** (comes with Node.js)
- **Backend API** running on http://localhost:3000
- **PostgreSQL** database (for backend)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file in the client directory:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

App will be available at: http://localhost:5174

### 4. Start Backend API

The client requires the backend API to be running:

```bash
cd ../api
npm run dev
```

Backend runs on: http://localhost:3000

## Project Structure

```
client/
├── src/
│   ├── config/              # Application configuration
│   │   └── api.ts          # API client & fetch wrapper
│   ├── pages/               # Route/page components
│   │   ├── Home.tsx         # Landing page
│   │   ├── Login.tsx        # Login page
│   │   ├── Signup.tsx       # Registration page
│   │   ├── ForgotPassword.tsx  # Password reset request
│   │   ├── ResetPassword.tsx   # Password reset completion
│   │   └── Dashboard.tsx    # Protected dashboard
│   ├── shared/              # Reusable code across the app
│   │   ├── components/
│   │   │   ├── AuthInitializer.tsx    # Session check on app load
│   │   │   ├── ErrorBoundary.tsx      # Error catching & recovery
│   │   │   ├── ProtectedRoute.tsx     # Route authentication guard
│   │   │   └── ui/                     # UI components
│   │   │       ├── Button.tsx          # Button with loading states
│   │   │       ├── Spinner.tsx         # Loading spinner
│   │   │       └── Skeleton.tsx        # Skeleton placeholders
│   │   ├── hooks/
│   │   │   ├── useAuthGuard.ts        # Auth permission logic
│   │   │   └── useToast.ts            # Toast notification hook
│   │   ├── providers/
│   │   │   └── ToastProvider.tsx      # Toast context & UI
│   │   ├── store/
│   │   │   └── authStore.ts           # Zustand auth state
│   │   └── types/
│   │       └── auth.ts                # TypeScript auth types
│   ├── App.tsx              # Router configuration
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles (Tailwind)
├── .vscode/                 # VSCode settings & extensions
├── .env                     # Environment variables (git-ignored)
├── .env.example             # Environment template
├── .prettierrc              # Prettier configuration
├── eslint.config.js         # ESLint configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies & scripts
```

## Available Scripts

### Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint:fix

# Check Prettier formatting
npm run format:check

# Format all files with Prettier
npm run format
```

## Architecture Overview

### Separation of Concerns

This application follows a clear layered architecture, especially for authentication:

```
┌─────────────────────────────────────┐
│  DATA LAYER (Store + Types)        │
│  - Holds auth state                │
│  - Provides actions                │
│  - Type definitions                │
└─────────────────────────────────────┘
              ↓ provides data to
┌─────────────────────────────────────┐
│  LOGIC LAYER (Guards)               │
│  - Permission checking              │
│  - Access decisions                 │
│  - Pure logic, no UI                │
└─────────────────────────────────────┘
              ↓ used by
┌─────────────────────────────────────┐
│  ENFORCEMENT LAYER (Components)     │
│  - Protected routes                 │
│  - Loading states                   │
│  - User feedback                    │
└─────────────────────────────────────┘
              ↓ protects
┌─────────────────────────────────────┐
│  APPLICATION LAYER (Pages)          │
│  - Page components                  │
│  - User interface                   │
└─────────────────────────────────────┘
```

### Directory Conventions

**`/config`** - Application-level configuration
- API client setup
- Constants
- App-wide settings

**`/pages`** - Route/page components
- One file per route
- Named after the route (Home, Login, Dashboard)
- Only imported in App.tsx router

**`/shared`** - Reusable code
- `/components` - Reusable UI components
- `/hooks` - Custom React hooks
- `/providers` - Context providers
- `/store` - State management (Zustand stores)
- `/types` - TypeScript type definitions

**`/shared/components/ui`** - Base UI components
- Button, Spinner, Skeleton, etc.
- Presentational, highly reusable
- No business logic

## Authentication System

### Overview

Complete authentication system with separated concerns:

**Auth Store** (`shared/store/authStore.ts`)
- Manages authentication state globally
- Provides auth actions (login, signup, logout, etc.)
- Handles API calls and error states

**Auth Guard** (`shared/hooks/useAuthGuard.ts`)
- Pure logic for permission checking
- Returns access decisions (canAccess, needsAuth, isChecking)
- Reusable in any component

**Protected Route** (`shared/components/ProtectedRoute.tsx`)
- Enforces authentication on routes
- Shows loading state while checking
- Redirects with user feedback if not authenticated

### Auth Store Actions

```typescript
import { useAuthStore } from './shared/store/authStore'

// In your component
const {
  user,              // Current user object
  isAuthenticated,   // Quick boolean check
  signIn,           // Login action
  signUp,           // Register action
  signOut,          // Logout action
  requestPasswordReset,  // Send reset email
  resetPassword,         // Complete reset with token
} = useAuthStore()
```

### Complete Auth Flows

#### Login Flow
```typescript
// 1. User fills login form
await signIn(email, password)

// 2. Store handles:
//    - POST /api/auth/sign-in/email
//    - Auto checkSession() to get user data
//    - Update state: user, isAuthenticated

// 3. Component navigates to dashboard
navigate('/dashboard')
```

#### Signup Flow
```typescript
// 1. User fills signup form
await signUp(name, email, password)

// 2. Store handles:
//    - POST /api/auth/sign-up/email
//    - Auto-login after signup
//    - checkSession() gets user data

// 3. Navigate to dashboard (user is logged in)
```

#### Password Reset Flow
```typescript
// 1. Request reset email
await requestPasswordReset(email)

// 2. User clicks link in email
// Opens: /reset-password?token=xxx

// 3. Submit new password
await resetPassword(token, newPassword)

// 4. Navigate to login with success message
```

#### Protected Route Access
```typescript
// In App.tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// When user tries to access:
// - If authenticated: Renders Dashboard
// - If not: Redirects to /login with toast message
// - While checking: Shows loading spinner
```

### Using Auth Guard in Components

```typescript
import { useAuthGuard } from './shared/hooks/useAuthGuard'

function MyComponent() {
  const guard = useAuthGuard()

  // Check if user can access
  if (!guard.canAccess) {
    return <p>Please log in</p>
  }

  // Show user info
  return <p>Welcome, {guard.user?.name}</p>
}
```

## Components Documentation

### ErrorBoundary

Catches JavaScript errors anywhere in the component tree.

```typescript
import { ErrorBoundary } from './shared/components/ErrorBoundary'

// Wrap your app
<ErrorBoundary>
  <App />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <ComplexComponent />
</ErrorBoundary>

// Auto-reset on route change
<ErrorBoundary resetKeys={[location.pathname]}>
  <Routes />
</ErrorBoundary>
```

**Features:**
- Dev mode: Shows error details, component stack
- Prod mode: User-friendly message
- Manual reset via "Try Again" button
- Auto-reset on navigation
- Error logging hook for services like Sentry

### Toast Notifications

Global notification system with auto-dismiss.

```typescript
import { useToast } from './shared/hooks/useToast'

function MyComponent() {
  const toast = useToast()

  // Show notifications
  toast.success('Saved successfully!')
  toast.error('Failed to save')
  toast.info('Processing...')
  toast.warning('Limited availability')

  // With custom options
  toast.info('Long message', { duration: 10000 })

  // Manual dismiss
  const id = toast.info('Loading...')
  toast.dismiss(id)
}
```

**Features:**
- 4 types: success, error, info, warning
- Auto-dismiss (4-6 seconds based on type)
- Manual dismiss (X button)
- Stack up to 4 toasts
- Slide-in/fade-out animations
- Top-right positioning

### Loading Components

#### Spinner

```typescript
import { Spinner } from './shared/components/ui/Spinner'

// Basic usage
<Spinner />

// Different sizes
<Spinner size="sm" />   // 16px
<Spinner size="md" />   // 24px (default)
<Spinner size="lg" />   // 32px
<Spinner size="xl" />   // 48px

// Different colors
<Spinner color="primary" />  // Blue (default)
<Spinner color="white" />    // White (for dark backgrounds)
<Spinner color="gray" />     // Gray
```

#### Button

Button component with built-in loading state.

```typescript
import { Button } from './shared/components/ui/Button'

// With loading state
const [loading, setLoading] = useState(false)

<Button loading={loading} onClick={handleClick}>
  Submit
</Button>

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Cancel</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

#### Skeleton

Placeholder for loading content.

```typescript
import { Skeleton } from './shared/components/ui/Skeleton'

// Text lines
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />

// Avatar
<Skeleton className="h-12 w-12 rounded-full" />

// Card
<Skeleton className="h-32 w-full rounded-lg" />
```

## API Integration

### API Client

Type-safe fetch wrapper with automatic cookie handling.

```typescript
import { fetchAPI } from './config/api'

// GET request
const data = await fetchAPI<ResponseType>('/api/endpoint')

// POST request
await fetchAPI('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify({ data }),
})

// Automatic features:
// - Credentials: 'include' (sends cookies)
// - JSON parsing
// - Error extraction
// - TypeScript return types
```

### Error Handling

```typescript
import { ApiRequestError } from './config/api'

try {
  await fetchAPI('/api/endpoint')
} catch (error) {
  if (error instanceof ApiRequestError) {
    console.log(error.message)     // User-friendly message
    console.log(error.statusCode)  // HTTP status code
    console.log(error.code)        // Optional error code
  }
}
```

## Environment Variables

### Required Variables

Create a `.env` file in the client directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000
```

### Access in Code

```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

**Note:** Vite only exposes variables prefixed with `VITE_`

### Environment Files

- `.env` - Local development (git-ignored)
- `.env.example` - Template for team members
- `.env.production` - Production variables (optional)

## Development Workflow

### Running the Full Stack

**Terminal 1 - Backend:**
```bash
cd ../api
npm run dev
# API runs on http://localhost:3000
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5174
```

**Terminal 3 - Database (if needed):**
```bash
cd ../api
npm run db:studio
# Prisma Studio on http://localhost:5555
```

### Testing Authentication

**1. View Emails (Development):**
- Open http://localhost:8025 (Inbucket)
- See signup verification and password reset emails
- Click links to test flows

**2. Create Test User:**
- Go to http://localhost:5174/signup
- Fill form and submit
- Or use Prisma Studio to create user manually

**3. Test Protected Routes:**
- Try accessing /dashboard without login
- Should redirect to /login with toast message

### Hot Module Replacement (HMR)

Vite provides instant hot reload:
- Edit React components → Instant update
- Edit CSS → Instant update
- Edit non-component files → Page refresh
- State preserved across reloads

## Code Quality

### Linting

**Configuration:** Modern ESLint flat config with TypeScript support

**Features:**
- React best practices (hooks, jsx-key, etc.)
- TypeScript strict rules
- Import ordering and organization
- Accessibility checks (jsx-a11y)
- Unused variable detection

**Run checks:**
```bash
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues
```

### Formatting

**Configuration:** Prettier with consistent rules

**Style:**
- No semicolons
- Single quotes
- 100 character line width
- Trailing commas (ES5)
- Arrow parens avoided when possible

**Run formatting:**
```bash
npm run format:check   # Check formatting
npm run format         # Format all files
```

### TypeScript

**Configuration:** Strict mode enabled

**Key settings:**
- `strict: true` - All strict checks
- `noUnusedLocals: true` - Catch unused variables
- `noUnusedParameters: true` - Catch unused params
- `noImplicitReturns: true` - Explicit returns required
- `noFallthroughCasesInSwitch: true` - Prevent fallthrough

### VSCode Integration

Recommended extensions (see `.vscode/extensions.json`):
- ESLint
- Prettier

Settings configured for:
- Format on save
- ESLint auto-fix on save
- Organize imports

## Folder Conventions

### Naming Patterns

**Components:** PascalCase
```
ErrorBoundary.tsx
Button.tsx
ProtectedRoute.tsx
```

**Hooks:** camelCase with `use` prefix
```
useToast.ts
useAuthGuard.ts
```

**Types:** PascalCase
```typescript
interface User { }
type SessionResponse = { }
```

**Utilities:** camelCase
```
api.ts
authStore.ts
```

### File Organization

**Pages:**
- One file per route
- Export named function matching filename
- Keep business logic in components/hooks

**Shared Components:**
- Highly reusable
- No page-specific logic
- Props for customization
- Documented with JSDoc

**UI Components:**
- Presentational only
- Accept className for customization
- Consistent API (variant, size props)
- Fully typed

## Common Patterns

### Form Submission with Auth Store

```typescript
import { useAuthStore } from './shared/store/authStore'
import { Button } from './shared/components/ui/Button'

function MyForm() {
  const { someAction, isAuthenticating, error, clearError } = useAuthStore()
  const [formData, setFormData] = useState({ })

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await someAction(formData)
      navigate('/success')
    } catch (error) {
      // Error already in store.error and toast shown
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <input onChange={() => clearError()} />
      <Button loading={isAuthenticating}>Submit</Button>
    </form>
  )
}
```

### Protected Content

```typescript
import { useAuthGuard } from './shared/hooks/useAuthGuard'

function MyComponent() {
  const guard = useAuthGuard()

  // Show loading
  if (guard.isChecking) {
    return <Spinner />
  }

  // Conditional rendering
  if (guard.isAuthenticated) {
    return <AuthenticatedUI user={guard.user} />
  }

  return <PublicUI />
}
```

### API Calls with Loading

```typescript
const [loading, setLoading] = useState(false)
const [data, setData] = useState(null)
const toast = useToast()

const fetchData = async () => {
  setLoading(true)
  try {
    const result = await fetchAPI('/api/data')
    setData(result)
    toast.success('Data loaded!')
  } catch (error) {
    toast.error('Failed to load data')
  } finally {
    setLoading(false)
  }
}

return (
  <>
    {loading ? <Skeleton /> : <Content data={data} />}
  </>
)
```

## Troubleshooting

### CORS Errors

**Issue:** Requests blocked by CORS policy

**Solution:** Backend CORS must allow client origin
```
API .env: CLIENT_URL=http://localhost:5174
API security.ts: origin: env.CLIENT_URL
API auth.ts: trustedOrigins: [env.CLIENT_URL]
```

### Cookies Not Being Set

**Issue:** Auth succeeds but session doesn't persist

**Checklist:**
- ✅ Backend CORS allows credentials: `credentials: true`
- ✅ Frontend sends credentials: `credentials: 'include'`
- ✅ BetterAuth trustedOrigins includes client URL
- ✅ Same-origin or CORS properly configured

### Build Errors

**Issue:** TypeScript compilation fails

**Common fixes:**
```bash
# Clear build cache
rm -rf node_modules/.vite
rm -rf dist

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript config
npm run build
```

### Hot Reload Not Working

**Issue:** Changes don't reflect in browser

**Solutions:**
- Check for syntax errors in console
- Restart dev server
- Clear browser cache
- Check file is being watched (not in node_modules)

### Toast Not Appearing

**Issue:** Toast functions called but nothing shows

**Checklist:**
- ✅ Component wrapped in `<ToastProvider>`
- ✅ Using `useToast()` hook correctly
- ✅ Check browser DevTools for errors
- ✅ Toast container z-index not covered by other elements

## Production Build

### Building for Production

```bash
# Create optimized build
npm run build

# Output: dist/ directory
# - index.html
# - assets/*.js (code-split chunks)
# - assets/*.css (minified styles)
```

### Build Optimization

Vite automatically:
- Minifies JavaScript and CSS
- Code-splits for optimal loading
- Generates source maps
- Optimizes images
- Removes dead code
- Hashes filenames for caching

### Environment Configuration

**Production `.env`:**
```env
VITE_API_URL=https://api.yourdomain.com
```

**Build commands:**
```bash
# Build with production env
npm run build

# Preview production build locally
npm run preview
```

## Deployment

### Static Hosting (Recommended)

This is a SPA - deploy to any static host:

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy
```

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 20

### Environment Variables

Configure in hosting platform:
- `VITE_API_URL` - Your production API URL

### SPA Routing

Configure hosting to redirect all routes to `index.html`:

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Netlify** (`_redirects` in public/):
```
/*  /index.html  200
```

## Adding New Features

### Creating a New Page

1. Create page component in `src/pages/`:
```typescript
// src/pages/NewPage.tsx
export function NewPage() {
  return <div>New Page Content</div>
}
```

2. Add route in `src/App.tsx`:
```typescript
import { NewPage } from './pages/NewPage'

<Route path="/new" element={<NewPage />} />
```

3. Optionally protect the route:
```typescript
<Route path="/new" element={
  <ProtectedRoute>
    <NewPage />
  </ProtectedRoute>
} />
```

### Creating a New Component

1. Create in `src/shared/components/ui/`:
```typescript
// src/shared/components/ui/Input.tsx
export interface InputProps {
  // ...props
}

export function Input({ ...props }: InputProps) {
  return <input {...props} />
}
```

2. Use in pages:
```typescript
import { Input } from '../shared/components/ui/Input'
```

### Adding Store Actions

1. Define action in store interface:
```typescript
interface AuthStore {
  newAction: (param: string) => Promise<void>
}
```

2. Implement in store:
```typescript
export const useAuthStore = create<AuthStore>()(
  devtools((set, get) => ({
    newAction: async (param) => {
      // Implementation
    }
  }))
)
```

3. Use in components:
```typescript
const { newAction } = useAuthStore()
await newAction('value')
```

## Performance Considerations

### Code Splitting

Routes are automatically code-split by Vite. For manual splitting:

```typescript
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

<Suspense fallback={<Spinner />}>
  <HeavyComponent />
</Suspense>
```

### Optimization Tips

- ✅ Use `React.memo()` for expensive components
- ✅ Lazy load heavy features
- ✅ Optimize images (WebP, lazy loading)
- ✅ Minimize bundle size (check with `npm run build`)
- ✅ Use Skeleton screens for perceived performance

## Contributing

### Code Style

- Follow existing patterns
- Run `npm run lint:fix` before committing
- Run `npm run format` before committing
- Ensure `npm run build` succeeds
- Add JSDoc comments to components

### Component Guidelines

**Do:**
- ✅ Use TypeScript strict types
- ✅ Add prop interfaces
- ✅ Include JSDoc with examples
- ✅ Handle loading and error states
- ✅ Make components reusable

**Don't:**
- ❌ Mix business logic with presentation
- ❌ Use `any` type (use `unknown` if needed)
- ❌ Ignore accessibility (add ARIA labels)
- ❌ Skip error handling
- ❌ Hardcode values (use props/config)

### Git Workflow

1. Create feature branch
2. Make changes
3. Run quality checks:
   ```bash
   npm run lint
   npm run format:check
   npm run build
   ```
4. Commit with descriptive message
5. Push and create PR

## Resources

### Documentation

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vite.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/)
- [Zustand](https://zustand.docs.pmnd.rs/)
- [BetterAuth](https://www.better-auth.com/)

### Project Links

- Backend API: `../api`
- Repository: https://github.com/jmjalil96/fullstack-travel-app

## License

[Your License Here]

---

**Built with ❤️ using modern TypeScript, React, and Vite**
