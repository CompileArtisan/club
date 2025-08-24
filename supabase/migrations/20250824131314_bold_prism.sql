/*
  # Fix existing database schema

  1. Changes
    - Safely create any missing tables, policies, and functions
    - Use IF NOT EXISTS and DROP IF EXISTS to handle existing objects
    - Ensure all required objects are present without conflicts

  2. Security
    - Maintain existing RLS policies
    - Add any missing policies safely
*/

-- Drop existing policies if they exist to recreate them safely
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can read activities" ON activities;
DROP POLICY IF EXISTS "Executives can create activities" ON activities;
DROP POLICY IF EXISTS "Creators can update their activities" ON activities;
DROP POLICY IF EXISTS "Anyone can read contributions" ON contributions;
DROP POLICY IF EXISTS "Executives can create contributions" ON contributions;
DROP POLICY IF EXISTS "Anyone can read participants" ON activity_participants;
DROP POLICY IF EXISTS "Users can register themselves" ON activity_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON activity_participants;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Recreate policies
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

-- Ensure functions exist
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