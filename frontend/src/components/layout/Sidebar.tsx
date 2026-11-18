import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard,
  FileSearch,
  Users,
  History,
  Sparkles,
  Server,
  ToggleLeft,
  ToggleRight,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { currentTab, setCurrentTab, isDemoMode, setIsDemoMode, backendStatus, backendUrl } = useApp();

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'analyze',
      label: 'Analyze Resume',
      icon: <FileSearch className="w-4 h-4" />,
      badge: '1:1',
    },
    {
      id: 'screening',
      label: 'Bulk Screening',
      icon: <Users className="w-4 h-4" />,
      badge: '1:N',
    },
    {
      id: 'history',
      label: 'Analysis History',
      icon: <History className="w-4 h-4" />,
    },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo and Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight block">
                Resume Analyzer
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block -mt-0.5">
                ATS & Candidate Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-4 border-b border-slate-100/70">
          <button
            onClick={() => handleNavClick('analyze')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 font-medium text-xs transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>New Analysis</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left select-none',
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'shrink-0',
                      isActive ? 'text-white' : 'text-slate-400'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold',
                      isActive
                        ? 'bg-slate-800 text-slate-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Backend & Mode Status Panel */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
          {/* Demo Mode Toggle */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-800">UI Demo Mode</span>
              <span className="text-[10px] text-slate-500">
                {isDemoMode ? 'Offline Mock Data' : 'Live Backend API'}
              </span>
            </div>
            <button
              onClick={() => setIsDemoMode(!isDemoMode)}
              className="text-slate-600 hover:text-emerald-600 transition-colors p-1"
              title="Toggle between live backend API requests and realistic UI demo mode"
            >
              {isDemoMode ? (
                <ToggleRight className="w-6 h-6 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-400" />
              )}
            </button>
          </div>

          {/* Backend Connection Indicator */}
          <div className="px-2 py-1 text-[11px] flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Backend ({backendUrl.replace('http://', '')})</span>
            </div>
            <span className="flex items-center gap-1 font-medium">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  backendStatus === 'online'
                    ? 'bg-emerald-500 animate-pulse'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                )}
              />
              <span className="capitalize">{backendStatus}</span>
            </span>
          </div>

          {/* Documentation notice */}
          <div className="text-[11px] text-slate-400 flex items-center gap-1 px-2 pt-1 border-t border-slate-200/60">
            <HelpCircle className="w-3 h-3 shrink-0" />
            <span>FastAPI: /screen & /analyze ready</span>
          </div>
        </div>
      </aside>
    </>
  );
};
