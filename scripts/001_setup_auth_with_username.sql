-- Create a custom users table for username-based auth
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Update profiles table to reference our custom users table
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add foreign key to our custom users table
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update other tables to reference our custom users table
ALTER TABLE public.posts 
  DROP CONSTRAINT IF EXISTS posts_author_id_fkey;

ALTER TABLE public.posts 
  ADD CONSTRAINT posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
  DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

ALTER TABLE public.comments 
  ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
  DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

ALTER TABLE public.likes 
  ADD CONSTRAINT likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.reposts 
  DROP CONSTRAINT IF EXISTS reposts_user_id_fkey;

ALTER TABLE public.reposts 
  ADD CONSTRAINT reposts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
