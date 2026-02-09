
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://axftmwjnnqpcqhqxhque.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4ZnRtd2pubnFwY3FocXhocXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzUxNDEsImV4cCI6MjA4NjA1MTE0MX0.7TTMAaHI-8qU0mmZQZ6aUtAPjsQUmi6GPPA-67jjmCM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
