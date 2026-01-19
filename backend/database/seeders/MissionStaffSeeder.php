<?php

namespace Database\Seeders;

use App\Models\Mission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MissionStaffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $missions = Mission::all();
        $supervisors = User::whereIn('role', ['supervisor', 'admin', 'super_admin'])->get();
        $regularUsers = User::where('role', 'user')->get();

        if ($missions->isEmpty()) {
            $this->command->error('No missions found. Please run MissionSeeder first.');
            return;
        }

        if ($supervisors->isEmpty() || $regularUsers->isEmpty()) {
            $this->command->error('Not enough users found. Please run DatabaseSeeder first.');
            return;
        }

        $this->command->info('Assigning staff to missions...');

        foreach ($missions as $mission) {
            // Assign a supervisor
            $supervisor = $supervisors->random();
            
            // Check if already assigned to avoid unique constraint violation
            $exists = DB::table('mission_staff')
                ->where('mission_id', $mission->id)
                ->where('user_id', $supervisor->id)
                ->exists();

            if (!$exists) {
                DB::table('mission_staff')->insert([
                    'mission_id' => $mission->id,
                    'user_id' => $supervisor->id,
                    'position' => 'Mission Supervisor',
                    'assigned_at' => Carbon::now(),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }

            // Assign a regular user
            $user = $regularUsers->random();
            
            $exists = DB::table('mission_staff')
                ->where('mission_id', $mission->id)
                ->where('user_id', $user->id)
                ->exists();

            if (!$exists) {
                DB::table('mission_staff')->insert([
                    'mission_id' => $mission->id,
                    'user_id' => $user->id,
                    'position' => 'Mission Staff',
                    'assigned_at' => Carbon::now(),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
        }

        $this->command->info('Successfully assigned staff to all missions!');
    }
}
