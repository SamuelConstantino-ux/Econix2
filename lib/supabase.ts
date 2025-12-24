import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oqlgudlscghdycwgjlve.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nMYB87UsO-fwjjMasPbZew_F83FUMjF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
