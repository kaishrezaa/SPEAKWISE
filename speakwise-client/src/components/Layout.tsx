import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Mic, TrendingUp, Zap } from 'lucide-react';

export default function Layout() {
  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/practice', icon: Mic, label: 'Practice' },
    { to: '/progress', icon: TrendingUp, label: 'Progress' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#0B0F19' }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[#1E2D3D] h-screen sticky top-0">
        {/* Logo */}
        <div className="p-6 border-b border-[#1E2D3D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B7CFF, #38BDF8)' }}>
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <span className="font-semibold text-[#F8FAFC] text-lg tracking-tight">SpeakWise</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#8B7CFF]/15 text-[#8B7CFF]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161D2B]'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Gnani branding */}
        <div className="p-4 border-t border-[#1E2D3D]">
          <div className="bg-[#161D2B] rounded-lg p-3 text-center">
            <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-1">Powered by</p>
            <p className="text-xs font-semibold text-[#38BDF8]">Gnani AI</p>
            <p className="text-[10px] text-[#475569] mt-0.5">Prisma · Timbre</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
