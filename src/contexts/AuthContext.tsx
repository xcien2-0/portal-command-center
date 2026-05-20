import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type PortalType = 'empleado' | 'cliente';

export interface UserProfile {
  id: string;
  user_id: string;
  role: 'technician' | 'supervisor';
  display_name: string | null;
  technician_id: string | null;
  created_at: string;
  portal_type: PortalType;
  company_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  portalType: PortalType | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchOrCreateProfile(userId: string): Promise<UserProfile | null> {
  // Try to fetch existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existingProfile) {
    // Cast since the DB type may not include the new columns yet in the generated types
    return existingProfile as unknown as UserProfile;
  }

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows found; other errors are real errors
    console.error('Error fetching profile:', fetchError);
    return null;
  }

  // Profile doesn't exist — create one with defaults
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      role: 'technician',
      portal_type: 'empleado',
    } as any)
    .select('*')
    .single();

  if (insertError) {
    console.error('Error creating profile:', insertError);
    return null;
  }

  return newProfile as unknown as UserProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const portalType: PortalType | null = profile?.portal_type ?? null;

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchOrCreateProfile(session.user.id).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const p = await fetchOrCreateProfile(session.user.id);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: new Error(error.message) };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, portalType, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
