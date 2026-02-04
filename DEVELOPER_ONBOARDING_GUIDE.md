# REDAS Developer Onboarding Guide

Welcome to the REDAS (Remote Deployment and Support) development team! This guide will help you get started with the project.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Coding Standards](#coding-standards)
7. [Testing Guidelines](#testing-guidelines)
8. [Common Tasks](#common-tasks)
9. [Resources](#resources)

---

## Project Overview

REDAS is a comprehensive mission management system for the National Intelligence Service (NIS) that handles:

- **Mission Management:** Create, track, and manage field missions
- **User Management:** Role-based access control (User, Supervisor, Admin, Super Admin)
- **Document Management:** Upload, review, and approve mission documents
- **Reporting:** Generate and submit mission reports
- **Messaging:** Internal communication system
- **Notifications:** Real-time updates and alerts
- **Calendar:** Event scheduling and tracking
- **Archiving:** Historical data management

### Key Features

- ✅ Role-based authentication and authorization
- ✅ Rate limiting and API throttling
- ✅ Response caching for performance
- ✅ Real-time notifications
- ✅ Document upload and management
- ✅ Comprehensive audit logging
- ✅ Mobile-responsive design

---

## Technology Stack

### Frontend

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (Radix UI)
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios
- **Icons:** Lucide React

### Backend

- **Framework:** Laravel 11
- **Language:** PHP 8.2+
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Laravel Sanctum
- **Cache:** Redis (optional, database by default)
- **Queue:** Redis (optional)

### Development Tools

- **Package Manager:** pnpm (frontend), Composer (backend)
- **Version Control:** Git
- **Code Editor:** VS Code (recommended)
- **API Testing:** Postman or Thunder Client

---

## Development Environment Setup

### Prerequisites

Install the following on your machine:

1. **Node.js** (v18+): [Download](https://nodejs.org/)
2. **PHP** (8.2+): [Download](https://www.php.net/downloads)
3. **Composer**: [Download](https://getcomposer.org/)
4. **pnpm**: `npm install -g pnpm`
5. **Git**: [Download](https://git-scm.com/)

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/nis-redas-mission.git
cd nis-redas-mission
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
# Update DB_* variables with Supabase credentials

# Run migrations
php artisan migrate

# Seed database (optional)
php artisan db:seed

# Start development server
php artisan serve
```

Backend will run at: `http://localhost:8000`

### Step 3: Frontend Setup

```bash
# From project root
pnpm install

# Copy environment file
cp .env.example .env.local

# Update API URL in .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Start development server
pnpm dev
```

Frontend will run at: `http://localhost:3000`

### Step 4: Verify Setup

1. Open `http://localhost:3000` in your browser
2. You should see the login page
3. Test login with seeded credentials (check `backend/MOCK_USERS_CREDENTIALS.md`)

---

## Project Structure

### Frontend Structure

```
nis-redas-mission/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Auth-related pages
│   ├── dashboard/           # Dashboard pages by role
│   ├── missions/            # Mission management
│   ├── user-management/     # User management
│   ├── documents-review/    # Document review
│   ├── reporting/           # Reporting
│   ├── messages/            # Messaging
│   ├── calendar/            # Calendar
│   ├── archiving/           # Archiving
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── lazy/                # Lazy-loaded components
│   ├── providers/           # Context providers
│   └── pages/               # Page-specific components
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions
│   ├── api-client.ts        # API client configuration
│   ├── react-query-config.ts # React Query setup
│   └── utils.ts             # Helper functions
├── public/                  # Static assets
└── styles/                  # Global styles
```

### Backend Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/     # API controllers
│   │   └── Middleware/      # Custom middleware
│   ├── Models/              # Eloquent models
│   └── Policies/            # Authorization policies
├── config/                  # Configuration files
├── database/
│   ├── migrations/          # Database migrations
│   └── seeders/             # Database seeders
├── routes/
│   └── api.php              # API routes
├── storage/                 # File storage
└── tests/                   # Tests
```

---

## Development Workflow

### 1. Create a New Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow the coding standards (see below) and make your changes.

### 3. Test Your Changes

```bash
# Frontend
pnpm dev
# Test in browser

# Backend
php artisan serve
# Test API endpoints
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Coding Standards

### TypeScript/React

1. **Use TypeScript:** Always type your components and functions
```typescript
interface MissionProps {
  id: number
  name: string
}

const Mission: React.FC<MissionProps> = ({ id, name }) => {
  // ...
}
```

2. **Use Functional Components:** Prefer function components over class components

3. **Use React Query:** For data fetching
```typescript
const { data, isLoading } = useMissions({ status: 'active' })
```

4. **Use Lazy Loading:** For heavy components
```typescript
const LazyComponent = lazy(() => import('./HeavyComponent'))
```

5. **Follow Component Structure:**
```typescript
// 1. Imports
import { useState } from 'react'

// 2. Types/Interfaces
interface Props { }

// 3. Component
export function Component({ }: Props) {
  // 4. Hooks
  const [state, setState] = useState()
  
  // 5. Effects
  useEffect(() => { }, [])
  
  // 6. Handlers
  const handleClick = () => { }
  
  // 7. Render
  return <div>...</div>
}
```

### PHP/Laravel

1. **Follow PSR-12:** PHP coding standard

2. **Use Type Hints:**
```php
public function store(Request $request): JsonResponse
{
    // ...
}
```

3. **Use Eloquent Relationships:**
```php
public function creator(): BelongsTo
{
    return $this->belongsTo(User::class, 'created_by');
}
```

4. **Use Resource Classes:**
```php
return MissionResource::collection($missions);
```

5. **Validate Requests:**
```php
$validated = $request->validate([
    'name' => 'required|string|max:255',
    'status' => 'required|in:pending,active,completed',
]);
```

### General

1. **Use Meaningful Names:** Variables, functions, and classes should have descriptive names
2. **Keep Functions Small:** One function should do one thing
3. **Comment Complex Logic:** Explain why, not what
4. **Avoid Magic Numbers:** Use constants
5. **Handle Errors:** Always handle potential errors gracefully

---

## Testing Guidelines

### Frontend Testing

```bash
# Run tests (when implemented)
pnpm test

# Type checking
pnpm tsc --noEmit
```

### Backend Testing

```bash
cd backend

# Run tests
php artisan test

# Run specific test
php artisan test --filter=MissionTest

# With coverage
php artisan test --coverage
```

### Manual Testing

1. **Test Rate Limiting:**
```bash
cd backend
php test_rate_limiting.php
```

2. **Test API Endpoints:**
Use Postman or Thunder Client with the collection in `docs/postman/`

---

## Common Tasks

### Add a New API Endpoint

1. **Create Route:**
```php
// backend/routes/api.php
Route::get('/new-endpoint', [Controller::class, 'method']);
```

2. **Create Controller Method:**
```php
// backend/app/Http/Controllers/Controller.php
public function method(Request $request)
{
    // Implementation
}
```

3. **Add to Frontend API Client:**
```typescript
// lib/api-client.ts
export const fetchNewData = async () => {
  const response = await apiClient.get('/new-endpoint')
  return response.data
}
```

4. **Create React Query Hook:**
```typescript
// hooks/use-api.ts
export const useNewData = () => {
  return useQuery({
    queryKey: ['new-data'],
    queryFn: fetchNewData,
  })
}
```

### Add a New Page

1. **Create Page File:**
```typescript
// app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>
}
```

2. **Add to Navigation:**
```typescript
// components/AppSidebar.tsx
{
  title: "New Page",
  url: "/new-page",
  icon: Icon,
}
```

### Add a New Database Table

1. **Create Migration:**
```bash
php artisan make:migration create_table_name_table
```

2. **Define Schema:**
```php
Schema::create('table_name', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->timestamps();
});
```

3. **Run Migration:**
```bash
php artisan migrate
```

4. **Create Model:**
```bash
php artisan make:model TableName
```

### Add a New Component

1. **Create Component:**
```typescript
// components/NewComponent.tsx
export function NewComponent() {
  return <div>Component</div>
}
```

2. **Export from Index:**
```typescript
// components/index.ts
export { NewComponent } from './NewComponent'
```

---

## Resources

### Documentation

- **Next.js:** https://nextjs.org/docs
- **React:** https://react.dev
- **Laravel:** https://laravel.com/docs
- **React Query:** https://tanstack.com/query/latest
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com

### Project Documentation

- **API Documentation:** `API_DOCUMENTATION.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Troubleshooting:** `TROUBLESHOOTING_GUIDE.md`
- **Performance Optimization:** `PERFORMANCE_OPTIMIZATION_IMPLEMENTATION.md`
- **Rate Limiting:** `backend/RATE_LIMITING_IMPLEMENTATION.md`

### Useful Commands

```bash
# Frontend
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linter

# Backend
php artisan serve     # Start dev server
php artisan migrate   # Run migrations
php artisan tinker    # Interactive shell
php artisan route:list # List all routes
php artisan cache:clear # Clear cache
```

### VS Code Extensions (Recommended)

- **ESLint:** Code linting
- **Prettier:** Code formatting
- **Tailwind CSS IntelliSense:** Tailwind autocomplete
- **PHP Intelephense:** PHP autocomplete
- **Laravel Blade Snippets:** Blade syntax
- **GitLens:** Git integration

### Getting Help

1. **Check Documentation:** Start with project docs
2. **Search Issues:** Check GitHub issues
3. **Ask Team:** Use team chat/Slack
4. **Stack Overflow:** For general questions
5. **Official Docs:** Framework documentation

---

## Next Steps

1. ✅ Complete environment setup
2. ✅ Explore the codebase
3. ✅ Read project documentation
4. ✅ Pick a starter task from the backlog
5. ✅ Make your first contribution!

Welcome aboard! 🚀

---

**Last Updated:** January 2024
