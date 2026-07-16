import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="flex flex-col">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
            {breadcrumbs.map((bc, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="mx-2">/</span>}
                {bc.href ? (
                  <a href={bc.href} className="hover:text-indigo-600 transition-colors">
                    {bc.label}
                  </a>
                ) : (
                  <span className="text-gray-900 dark:text-gray-100">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
