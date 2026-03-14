import React from 'react';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, AlertTriangle } from 'lucide-react';

const LiabilityPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <AuthModal />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
          <h1 className="text-xl font-mono font-bold text-primary glow-green mb-2">
            LIABILITY CALCULATOR
          </h1>
          {user ? (
            <p className="text-sm text-muted-foreground font-mono">
              Liability assessment module coming in Phase 2. Your profile will be used to calculate compliance exposure.
            </p>
          ) : (
            <div className="flex items-center gap-2 justify-center text-sm text-warning font-mono">
              <AlertTriangle className="h-4 w-4" />
              Login required to access this feature
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiabilityPage;
