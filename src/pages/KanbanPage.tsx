import React from 'react';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutGrid, AlertTriangle } from 'lucide-react';

const KanbanPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <AuthModal />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <LayoutGrid className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
          <h1 className="text-xl font-mono font-bold text-primary glow-green mb-2">
            COMPLIANCE KANBAN
          </h1>
          {user ? (
            <div>
              <p className="text-sm text-muted-foreground font-mono mb-6">
                Task board coming in Phase 2. Track compliance filings across TODO → IN PROGRESS → FILED stages.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {['TODO', 'IN PROGRESS', 'FILED', 'OVERDUE'].map((col) => (
                  <div key={col} className="border border-border rounded p-3 bg-card">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">{col}</span>
                    <div className="mt-2 h-20 border border-dashed border-border rounded flex items-center justify-center">
                      <span className="text-[10px] font-mono text-terminal-dim">Empty</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

export default KanbanPage;
