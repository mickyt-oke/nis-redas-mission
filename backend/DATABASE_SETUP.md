# Database Setup Guide

## Mock Users for Login Authentication

This guide explains how to set up the PostgreSQL database with mock users for testing login authentication.

## Prerequisites

- PHP 8.2 or higher
- Composer installed
- PostgreSQL installed and running
- PostgreSQL PHP extension (pdo_pgsql) enabled
- Database configured in `.env` file

## Setup Instructions

### 1. Configure Database

Make sure your `.env` file has the correct PostgreSQL database configuration:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=nis_redas_app
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

**Note:** Update the `DB_PASSWORD` with your actual PostgreSQL password. If you haven't set a password for the postgres user, you can leave it empty or set one in PostgreSQL.

### 2. Run Migrations

Create all database tables:

```bash
cd backend
php artisan migrate:fresh
```

Or if you want to keep existing data:

```bash
php artisan migrate
```

### 3. Seed Mock Users

Populate the database with mock users:

```bash
php artisan db:seed
```

Or run both migration and seeding in one command:

```bash
php artisan migrate:fresh --seed
```

## Mock User Credentials

After seeding, you'll have the following test users available:

| Role | Email | Password | First Name | Last Name |
| --- | --- | --- | --- | --- |
| Super Admin | <super_admin@example.com> | password | Super | Admin |
| Admin | <admin@example.com> | password | Admin | User |
| Supervisor | <supervisor@example.com> | password | Supervisor | User |
| User | <user@example.com> | password | Regular | User |

**Note:** All users have the same password: `password`

Additionally, 5 random users with the 'user' role are created for testing purposes.

## User Roles and Permissions

The system has 4 role levels:

1. **super_admin** - Highest level access
2. **admin** - Administrative access
3. **supervisor** - Supervisory access
4. **user** - Regular user access

### Role Checking Methods

The User model provides helper methods:

```php
$user->hasRole('admin');           // Check specific role
$user->hasRole(['admin', 'user']); // Check multiple roles
$user->isSupervisor();             // Returns true for supervisor, admin, super_admin
$user->isAdmin();                  // Returns true for admin, super_admin
$user->isSuperAdmin();             // Returns true only for super_admin
```

## Testing Authentication

### Using Laravel Tinker

```bash
php artisan tinker
```

```php
// Get a user
$user = User::where('email', 'admin@example.com')->first();

// Check role
$user->role; // 'admin'
$user->isAdmin(); // true

// Verify password
Hash::check('password', $user->password); // true
```

### API Testing

Use these credentials to test your authentication endpoints:

```bash
# Example login request
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

## Resetting the Database

To start fresh:

```bash
php artisan migrate:fresh --seed
```

This will:

1. Drop all tables
2. Run all migrations
3. Seed mock users

## Custom Seeding

If you need to create additional users, you can use the UserFactory:

```php
// In tinker or a seeder
use App\Models\User;

// Create a regular user
User::factory()->create([
    'email' => 'custom@example.com',
    'first_name' => 'Custom',
    'last_name' => 'User',
]);

// Create a supervisor
User::factory()->supervisor()->create([
    'email' => 'custom.supervisor@example.com',
]);

// Create multiple random users
User::factory(10)->create();
```

## Troubleshooting

### Migration Errors

If you encounter migration errors:

```bash
# Reset migrations
php artisan migrate:reset

# Run migrations again
php artisan migrate
```

### Seeder Errors

If seeding fails:

```bash
# Clear the database
php artisan db:wipe

# Run fresh migration with seeding
php artisan migrate:fresh --seed
```

### Check Database Connection

```bash
php artisan db:show
```

## Security Notes

⚠️ **Important:** These mock users are for development and testing only!

- Never use these credentials in production
- Change all passwords before deploying
- Use strong, unique passwords for production users
- Consider using Laravel's built-in password reset functionality

## Next Steps

1. Test login with each user role
2. Verify role-based access control
3. Implement authentication middleware
4. Set up API token authentication (Laravel Sanctum is already included)
5. Create protected routes based on user roles

## Additional Resources

- [Laravel Authentication Documentation](https://laravel.com/docs/authentication)
- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [Database Seeding Documentation](https://laravel.com/docs/seeding)
