# Database Configuration Update - Supabase Integration

## Tasks to Complete

### Backend Configuration

- [ ] Update `backend/.env` with Supabase PostgreSQL connection details
  - [ ] Set DB_HOST to Supabase host
  - [ ] Set DB_PORT to 5432
  - [ ] Set DB_DATABASE to postgres
  - [ ] Set DB_USERNAME to Supabase user
  - [ ] Set DB_PASSWORD to Supabase password
  - [ ] Set DB_URL to Supabase non-pooling URL
  - [ ] Set DB_SSLMODE to require
  - [ ] Add Supabase service role key for backend operations

### Frontend Configuration

- [ ] Create `.env.local` in root directory
  - [ ] Add NEXT_PUBLIC_SUPABASE_URL
  - [ ] Add NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] Add SUPABASE_SERVICE_ROLE_KEY
  - [ ] Preserve NEXT_PUBLIC_API_URL for Laravel backend

### Testing & Verification

- [ ] Test database connection: `php artisan db:show`
- [ ] Verify migrations can run: `php artisan migrate:status`
- [ ] Test Laravel API endpoints
- [ ] Verify frontend can communicate with backend

## Notes

- Preserving existing Laravel API setup
- Using Supabase only through Laravel backend (no direct frontend access)
- All Supabase database operations will go through Laravel API
