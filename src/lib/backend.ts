import { supabase as cloud } from '@/integrations/supabase/client';
import { localClient } from './local-client';

export const isLocalRuntime = import.meta.env['VITE_LOCAL_RUNTIME'] === 'true';
export const supabase = isLocalRuntime ? localClient as unknown as typeof cloud : cloud;
