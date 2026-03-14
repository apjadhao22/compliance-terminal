import React from 'react';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileText, Shield, Bell, Calculator, Map, Search, LayoutGrid,
  LogOut, User, Zap, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';

const NAV_ITEMS = [
  { key: 'L', label: 'Labour Feed', path: '/', icon: FileText },
  { key: 'T', label: 'Tax', path: '/', icon: FileText },
  { key: 'A', label: 'Alerts', path: '/', icon: Bell, protected: true },
  { key: 'C', label: 'Liability', path: '/liability', icon: Calculator, protected: true },
  { key: 'M', label: 'Map', path: '/map', icon: Map },
  { key: 'K', label: 'Kanban', path: '/kanban', icon: LayoutGrid, protected: true },
  { key: 'S', label: 'Settings', path: '/settings', icon: Settings, protected: true },
];

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { requireAuth } = useRequireAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (item: typeof NAV_ITEMS[0]) => {
    if (item.protected) {
      requireAuth(() => navigate(item.path));
    } else {
      navigate(item.path);
    }
  };

  return (
    <header className="bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 h-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-mono text-sm font-bold text-primary glow-green tracking-wider">
            COMPLIANCE TERMINAL
          </span>
          <span className="text-xs font-mono text-terminal-dim">v1.0</span>
        </div>

        {/* Nav items */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNav(item)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                location.pathname === item.path && item.path !== '/'
                  ? 'bg-primary/10 text-primary'
                  : location.pathname === '/' && item.path === '/' && item.label === 'Labour Feed'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span className="text-terminal-dim">[{item.key}]</span>
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Liability CTA */}
          <button
            onClick={() => requireAuth(() => navigate('/liability'))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30 transition-colors glow-amber"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Check Your Liability Now</span>
            <span className="sm:hidden">Liability</span>
          </button>
          <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <Search className="h-4 w-4" />
          </button>
          <NotificationBell />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-terminal-cyan hidden sm:inline">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-xs font-mono text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => requireAuth()}
              className="text-xs font-mono text-primary hover:text-primary/80"
            >
              <User className="h-3.5 w-3.5 mr-1" />
              LOGIN
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
