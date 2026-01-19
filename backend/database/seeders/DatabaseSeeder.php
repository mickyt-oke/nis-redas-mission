<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Super Admin user
        User::factory()->superAdmin()->create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'super_admin@example.com',
        ]);

        // Create Admin user
        User::factory()->admin()->create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com',
        ]);

        // Create Supervisor user
        User::factory()->supervisor()->create([
            'first_name' => 'Supervisor',
            'last_name' => 'User',
            'email' => 'supervisor@example.com',
        ]);

        // Create Regular user
        User::factory()->create([
            'first_name' => 'Regular',
            'last_name' => 'User',
            'email' => 'user@example.com',
        ]);

        // Create additional random users for testing (optional)
        User::factory(5)->create();

        // Seed missions
        $this->call(MissionSeeder::class);

        // Seed mission staff
        $this->call(MissionStaffSeeder::class);
    }
}
