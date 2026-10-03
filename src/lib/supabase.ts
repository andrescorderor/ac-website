import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://epsrgbfnidejfuysjnli.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_DvB_j8sZX3Vtkw4QFPlWSg_hSF1qnIK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
