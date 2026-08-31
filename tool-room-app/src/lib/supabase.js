import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qhyzxriidjnuvfccsvkc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Jp6Rsx_8RSehwNBIZlBhfA_SRIVT9xb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);