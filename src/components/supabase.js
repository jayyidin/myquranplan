import { createClient } from '@supabase/supabase-js'

// Masukkan langsung URL dan Kunci (Key) di sini
const supabaseUrl = 'https://ydjfgwhpwandeitjctbf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkamZnd2hwd2FuZGVpdGpjdGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjA1ODQsImV4cCI6MjA5Mjc5NjU4NH0.3drukkrtY80E35dVAt_r_PowYUAagx5VknrevOWgmrE'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)