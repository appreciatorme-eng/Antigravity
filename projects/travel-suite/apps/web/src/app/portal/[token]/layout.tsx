import React from 'react';

interface PortalLayoutProps {
  children: React.ReactNode;
  params: { token: string };
}

// Mock operator info derived from token (in production, decoded from JWT/DB)
function getOperatorFromToken(token: string) {
  // Deterministic mock: use token chars to vary display slightly
  const operators = [
    { name: 'Rajasthan Heritage Tours', initials: 'RH', color: '#b45309' },
    { name: 'India Travel Co.', initials: 'IT', color: '#0a7ea4' },
    { name: 'Golden Triangle Holidays', initials: 'GT', color: '#7c3aed' },
  ];
  const idx = (token.charCodeAt(0) || 0) % operators.length;
  return operators[idx];
}

export default function PortalLayout({ children, params }: PortalLayoutProps) {
  const operator = getOperatorFromToken(params.token);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Operator header — replaces all app chrome */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Operator branding */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: operator.color }}
            >
              {operator.initials}
            </div>
            <span className="text-sm font-semibold text-gray-800 hidden sm:block">
              {operator.name}
            </span>
            <span className="text-sm font-semibold text-gray-800 sm:hidden">
              {operator.name.split(' ').slice(0, 2).join(' ')}
            </span>
          </div>

          {/* Contact chip */}
          <div className="flex items-center gap-2">
            <a
              href="tel:+911800123456"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
              </svg>
              Help
            </a>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Your trip is safe &amp; secured
          </p>
          <p className="text-[10px] text-gray-300 tracking-wide">
            Powered by TourOS
          </p>
        </div>
      </footer>
    </div>
  );
}
