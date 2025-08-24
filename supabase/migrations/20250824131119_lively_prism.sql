/*
  # Initial Database Schema for Club Management System

  1. New Tables
    - `profiles` - User profiles with roles and points
    - `activities` - Club activities and events
    - `contributions` - Member contributions and point awards
    - `activity_participants` - Track who participates in activities
    - `notifications` - System notifications for users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    - Create role-based access control

  3. Functions
    - Function to increment user points
    - Function to calculate user levels based on points
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('president', 'vice_president', 'treasurer', 'senior_executive', 'member');
CREATE TYPE activity_type AS ENUM ('workshop', 'competition', 'session', 'meeting', 'hackathon', 'seminar');
CREATE TYPE contribution_type AS ENUM ('participation', 'presentation', 'leadership', 'competition_win', 'competition_runner_up', 'project_completion', 'mentoring', 'organizing');
CREATE TYPE participation_status AS ENUM ('registered', 'attended', 'absent');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  role user_role DEFAULT 'member',
  points integer DEFAULT 0,
  level text DEFAULT 'Bronze',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  type activity_type DEFAULT 'workshop',
  max_participants integer,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  description text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  contribution_type contribution_type DEFAULT 'participation',
  date date DEFAULT CURRENT_DATE,
  recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Activity participants table
CREATE TABLE IF NOT EXISTS activity_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status participation_status DEFAULT 'registered',
  registered_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, member_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Activities policies
CREATE POLICY "Anyone can read activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can create activities"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'vice_president', 'treasurer', 'senior_executive')
    )
  );

CREATE POLICY "Creators can update their activities"
  ON activities
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Contributions policies
CREATE POLICY "Anyone can read contributions"
  ON contributions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can create contributions"
  ON contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'vice_president', 'treasurer', 'senior_executive')
    )
  );

-- Activity participants policies
CREATE POLICY "Anyone can read participants"
  ON activity_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can register themselves"
  ON activity_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "Users can update own participation"
  ON activity_participants
  FOR UPDATE
  TO authenticated
  USING (member_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to calculate user level based on points
CREATE OR REPLACE FUNCTION calculate_user_level(points integer)
RETURNS text AS $$
BEGIN
  IF points >= 500 THEN
    RETURN 'Platinum';
  ELSIF points >= 200 THEN
    RETURN 'Gold';
  ELSIF points >= 50 THEN
    RETURN 'Silver';
  ELSE
    RETURN 'Bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment user points and update level
CREATE OR REPLACE FUNCTION increment_user_points(user_id uuid, points_to_add integer)
RETURNS void AS $$
DECLARE
  new_points integer;
BEGIN
  UPDATE profiles 
  SET points = points + points_to_add,
      updated_at = now()
  WHERE id = user_id
  RETURNING points INTO new_points;
  
  UPDATE profiles 
  SET level = calculate_user_level(new_points)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();