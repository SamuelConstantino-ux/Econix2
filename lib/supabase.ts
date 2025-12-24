
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqlgudlscghdycwgjlve.supabase.co';
const supabaseAnonKey = 'sb_publishable_nMYB87UsO-fwjjMasPbZew_F83FUMjF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
