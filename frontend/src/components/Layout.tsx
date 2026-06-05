import { NavLink, Outlet } from 'react-router-dom';
import { Hexagon, LayoutGrid, FileUp, Settings } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-purple-500/30">
      <header className="w-full flex justify-center border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 fade-in">
        <div className="w-full max-w-6xl flex justify-between items-center py-4 px-6">
          <NavLink to="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow duration-300">
              <Hexagon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tight">
              OmniLog AI
            </h1>
          </NavLink>
          
          <nav className="hidden md:flex gap-8">
            <NavLink 
              to="/workspace" 
              data-testid="tab-workspace"
              title="Manage your logic workspaces"
              className={({ isActive }) => 
                `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1 -mb-1' : 'text-slate-400 hover:text-slate-200'}`
              }
            >
              <LayoutGrid className="w-4 h-4" /> 
              Workspaces
            </NavLink>
            <NavLink 
              to="/data-registration" 
              data-testid="tab-data-registration"
              title="Register and manage your raw data"
              className={({ isActive }) => 
                `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? 'text-blue-400 border-b-2 border-blue-400 pb-1 -mb-1' : 'text-slate-400 hover:text-slate-200'}`
              }
            >
              <FileUp className="w-4 h-4" /> 
              Data Registration
            </NavLink>
            <NavLink 
              to="/system-admin" 
              data-testid="tab-admin"
              title="System administration and settings"
              className={({ isActive }) => 
                `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? 'text-purple-400 border-b-2 border-purple-400 pb-1 -mb-1' : 'text-slate-400 hover:text-slate-200'}`
              }
            >
              <Settings className="w-4 h-4" /> 
              Admin
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
