import { useState } from 'react';
import { Search, Folder, Plus, Activity, Power, Users, Clock } from 'lucide-react';

interface WorkspaceItem {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  members: number;
  lastUpdated: string;
}

const mockWorkspaces: WorkspaceItem[] = [
  {
    id: 'ws-1',
    name: 'Payment Processing Logs',
    description: '결제 모듈 타임아웃 및 에러 로그 분석 워크스페이스',
    status: 'Active',
    members: 5,
    lastUpdated: '2 hours ago'
  },
  {
    id: 'ws-2',
    name: 'User Authentication AuthZ',
    description: '사용자 인증 및 권한 부여 관련 장애 추적',
    status: 'Active',
    members: 3,
    lastUpdated: '1 day ago'
  },
  {
    id: 'ws-3',
    name: 'Database Migration Scripts',
    description: 'DB 마이그레이션 중 발생한 이슈 정리',
    status: 'Inactive',
    members: 2,
    lastUpdated: '2 weeks ago'
  },
  {
    id: 'ws-4',
    name: 'Frontend Performance Audit',
    description: 'Web Vitals 및 클라이언트 사이드 성능 지표 모니터링',
    status: 'Active',
    members: 4,
    lastUpdated: '5 hours ago'
  }
];

const WorkspacePage = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All'|'Active'|'Inactive'>('All');

  const filteredWorkspaces = mockWorkspaces.filter(ws => {
    const matchesSearch = ws.name.toLowerCase().includes(search.toLowerCase()) || ws.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' ? true : ws.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Folder className="w-8 h-8 text-indigo-400" />
            Your Workspaces
          </h1>
          <p className="text-slate-400 mt-2">Manage and monitor your isolated logic analysis environments.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap">
          <Plus className="w-5 h-5" />
          Create New Workspace
        </button>
      </div>

      {/* Toolbar: Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search workspaces by name or description..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Active', 'Inactive'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as 'All' | 'Active' | 'Inactive')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                filter === f 
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredWorkspaces.map(ws => (
          <div key={ws.id} className="group glass-panel rounded-2xl p-6 bg-slate-800/40 hover:bg-slate-800/60 border border-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                <Folder className="w-6 h-6" />
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${ws.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                {ws.status === 'Active' ? <Activity className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                {ws.status}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{ws.name}</h3>
            <p className="text-slate-400 text-sm flex-1 mb-6 line-clamp-2">{ws.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5 text-slate-500 text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5" title="Members">
                  <Users className="w-4 h-4" /> {ws.members}
                </span>
                <span className="flex items-center gap-1.5" title="Last Updated">
                  <Clock className="w-4 h-4" /> {ws.lastUpdated}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filteredWorkspaces.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 glass-panel rounded-2xl">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No workspaces found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspacePage;
