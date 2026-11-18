import React from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { currentTab, isDemoMode, backendStatus, refreshBackendStatus } = useApp();

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'System Overview & Analytics';
      case 'analyze':
        return 'One-to-One Resume Analysis';
      case 'screening':
        return 'Bulk Candidate Screening';
      case 'history':
        return 'Analysis Records & History';
      case 'candidate-detail':
        return 'Candidate Match Report';
      default:
        return 'Resume Analyzer';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Resume Analyzer
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <h1 className="text-sm md:text-base font-semibold text-slate-900">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Demo Mode Badge */}
        {isDemoMode && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>UI Demo Mode</span>
          </span>
        )}

        {/* Backend health ping */}
        {!isDemoMode && backendStatus === 'offline' && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Backend Offline (Port 8000)</span>
            <span className="sm:hidden">Offline</span>
            <button
              onClick={refreshBackendStatus}
              title="Ping backend"
              className="p-0.5 hover:text-rose-900"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Connected state */}
        {!isDemoMode && backendStatus === 'online' && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">Backend Connected</span>
            <span className="sm:hidden">API Live</span>
          </div>
        )}
      </div>
    </header>
  );
};
