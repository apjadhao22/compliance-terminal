import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import { LiabilityWizard } from '@/components/liability/LiabilityWizard';
import { ComplianceReport } from '@/components/liability/ComplianceReport';
import { PenaltyCalculator } from '@/components/liability/PenaltyCalculator';
import { LiabilityProfile } from '@/lib/compliance-rules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle } from 'lucide-react';

const LiabilityPage: React.FC = () => {
  const { user } = useAuth();
  const { requireAuth } = useRequireAuth();
  const [profile, setProfile] = useState<LiabilityProfile | null>(null);
  const [activeTab, setActiveTab] = useState('report');

  useEffect(() => {
    if (!user) {
      requireAuth();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header />
        <AuthModal />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
            <h1 className="text-xl font-mono font-bold text-primary glow-green mb-2">LIABILITY CHECKER</h1>
            <div className="flex items-center gap-2 justify-center text-sm text-warning font-mono">
              <AlertTriangle className="h-4 w-4" /> Login required to access this feature
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <AuthModal />

      <div className="flex-1 overflow-hidden">
        {!profile ? (
          <div className="h-full overflow-y-auto py-8 px-4">
            <div className="text-center mb-6">
              <h1 className="text-lg font-mono font-bold text-warning glow-amber">
                ⚡ CHECK YOUR LIABILITY NOW
              </h1>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Complete the wizard below to generate your personalized compliance report
              </p>
            </div>
            <LiabilityWizard onComplete={setProfile} />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b border-border px-4 flex-shrink-0">
              <TabsList className="bg-transparent h-10 gap-1">
                <TabsTrigger value="report" className="font-mono text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded">
                  📋 Compliance Report
                </TabsTrigger>
                <TabsTrigger value="penalty" className="font-mono text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded">
                  🧮 Penalty Calculator
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="report" className="flex-1 overflow-hidden mt-0">
              <ComplianceReport profile={profile} />
            </TabsContent>
            <TabsContent value="penalty" className="flex-1 overflow-y-auto mt-0">
              <PenaltyCalculator />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default LiabilityPage;
