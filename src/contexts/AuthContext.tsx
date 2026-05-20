import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type PortalType = 'empleado' | 'cliente' | null;

interface Profile {
  id: string;
  user_id: string;
  role: string;
  display_name: string | null;
  technician_id: string | null;
  portal_type: string;
  company_name: string | null;
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  portalType: PortalType;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchOrCreateProfile(userId: string): Promise<Profile | null> {
  // Try to fetch existing profile
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  if (data) {
    // Cast to Profile — add portal_type/company_name defaults if columns not yet in type
    return {
      id: data.id,
      user_id: data.user_id,
      role: data.role,
      display_name: data.display_name,
      technician_id: data.technician_id,
      portal_type: (data as unknown as { portal_type?: string }).portal_type ?? 'empleado',
      company_name: (data as unknown as { company_name?: string }).company_name ?? null,
      created_at: data.created_at,
    };
  }

  // No profile yet — create one with defaults
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({ user_id: userId } as Parameters<typeof supabase.from<'profiles', typeof supabase>>[0] extends never ? never : object)
    .select('*')
    .maybeSingle();

  if (insertError) {
    console.error('Error creating profile:', insertError);
    return null;
  }

  if (!newProfile) return null;

  return {
    id: newProfile.id,
    user_id: newProfile.user_id,
    role: newProfile.role,
    display_name: newProfile.display_name,
    technician_id: newProfile.technician_id,
    portal_type: (newProfile as unknown as { portal_type?: string }).portal_type ?? 'empleado',
    company_name: (newProfile as unknown as { company_name?: string }).company_name ?? null,
    created_at: newProfile.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchOrCreateProfile(s.user.id).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          // Use setTimeout to avoid Supabase deadlock in auth callback
          setTimeout(() => {
            fetchOrCreateProfile(s.user!.id).then((p) => {
              setProfile(p);
              setLoading(false);
            });
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error: new Error(error.message) };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  const portalType: PortalType = profile
    ? (profile.portal_type === 'cliente' ? 'cliente' : 'empleado')
    : null;

  return (
    <AuthContext.Provider value={{ user, session, profile, portalType, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
