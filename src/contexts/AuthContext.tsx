import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { LiabilityProfile } from '@/lib/compliance-rules';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  liabilityProfile: LiabilityProfile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [liabilityProfile, setLiabilityProfile] = useState<LiabilityProfile | null>(null);

  useEffect(() => {
    async function fetchProfile(userId: string) {
      const { data, error } = await supabase
        .from('liability_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) setLiabilityProfile({
          companyName: data.industry_type || '',
          industryType: data.industry_type || '',
          inSez: data.in_sez || false,
          headcountBracket: data.headcount_bracket || '',
          contractWorkerBracket: data.contract_worker_bracket || '',
          workforceNature: data.workforce_nature ? [data.workforce_nature] : [],
          employsWomen: data.employs_women || false,
          hasCanteen: data.has_canteen || false,
          states: data.states || [],
          primaryCity: data.primary_city || '',
          multipleLocations: data.multiple_locations || false,
        });
      else setLiabilityProfile(null);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) setShowAuthModal(false);
      if (session?.user) fetchProfile(session.user.id);
      else setLiabilityProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, showAuthModal, setShowAuthModal, liabilityProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useRequireAuth = () => {
  const { user, setShowAuthModal } = useAuth();
  
  const requireAuth = (callback?: () => void) => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    callback?.();
    return true;
  };

  return { requireAuth, isAuthenticated: !!user };
};
