import React from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Plus } from 'lucide-react';
import { Button } from '../common/Button';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { currentTab, setCurrentTab } = useApp();

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard & Overview';
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
        {currentTab !== 'analyze' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentTab('analyze')}
            leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
            className="text-xs font-medium"
          >
            Analyze Resume
          </Button>
        )}
      </div>
    </header>
  );
};
