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
    // Track emails we've already sent welcome emails to in this session
    const welcomeEmailsSent = new Set<string>();

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);

        // Send welcome email for new OAuth users (Google/Apple)
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          const createdAt = new Date(user.created_at).getTime();
          const now = Date.now();
          const isNewUser = (now - createdAt) < 60000; // Created less than 60s ago
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
        
        // Only set loading to false after we've initialized
        if (initialized) {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
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
