
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface BreadcrumbsProps {
  lang: Language;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ lang }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isRtl = lang === 'ar';

  if (location.pathname === '/') return null;

  return (
    <nav className="hidden lg:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-1">
      <Link to="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
        <Home size={14} />
        {t('dashboard')}
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <React.Fragment key={name}>
            <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
            {isLast ? (
              <span className="text-blue-600">{t(name)}</span>
            ) : (
              <Link to={routeTo} className="hover:text-blue-600 transition-colors">
                {t(name)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
