import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const welcomeEmailsSent = new Set<string>();

    const syncSessionState = async (nextSession: Session | null) => {
      if (!nextSession) {
        setSession(null);
        setUser(null);
        if (initialized) setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getUser(nextSession.access_token);

        if (error || !data.user) {
          await supabase.auth.signOut({ scope: 'local' });
          setSession(null);
          setUser(null);
        } else {
          setSession(nextSession);
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error validating session:', error);
        await supabase.auth.signOut({ scope: 'local' });
        setSession(null);
        setUser(null);
      } finally {
        if (initialized) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      void syncSessionState(session);

      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        const createdAt = new Date(user.created_at).getTime();
        const now = Date.now();
        const isNewUser = (now - createdAt) < 60000;
        const isOAuth = user.app_metadata?.provider !== 'email';

        if (isOAuth && isNewUser && user.email && !welcomeEmailsSent.has(user.email)) {
          welcomeEmailsSent.add(user.email);
          supabase.functions.invoke('send-welcome-email', {
            body: { email: user.email },
          }).catch((err) => {
            console.error('Failed to send welcome email for OAuth user:', err);
          });
        }
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      await syncSessionState(session);
      setInitialized(true);
      setLoading(false);
    }).catch(async (error) => {
      console.error('Error getting session:', error);
      await supabase.auth.signOut({ scope: 'local' });
      setSession(null);
      setUser(null);
      setInitialized(true);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [initialized]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    // Send welcome email automatically after successful signup
    if (!error) {
      supabase.functions.invoke('send-welcome-email', {
        body: { email },
      }).catch((err) => {
        console.error('Failed to send welcome email:', err);
      });
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
