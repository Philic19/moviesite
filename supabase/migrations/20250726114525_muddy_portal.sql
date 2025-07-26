/*
  # Create user favorites table

  1. New Tables
    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `tmdb_id` (integer, TMDB movie/show ID)
      - `media_type` (text, 'movie' or 'tv')
      - `title` (text, movie/show title)
      - `poster_path` (text, poster image path)
      - `overview` (text, description)
      - `vote_average` (numeric, rating)
      - `release_date` (date, release date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_favorites` table
    - Add policies for users to manage their own favorites
*/

CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tmdb_id integer NOT NULL,
  media_type text NOT NULL DEFAULT 'movie',
  title text NOT NULL,
  poster_path text,
  overview text,
  vote_average numeric DEFAULT 0,
  release_date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tmdb_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_tmdb_id ON user_favorites(tmdb_id);