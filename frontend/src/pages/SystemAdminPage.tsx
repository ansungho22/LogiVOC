import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, LayoutDashboard, Loader2, Database as DbIcon, Users, Grid, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory, getWikis, deleteWiki, getAdminStatsOverview, getAdminStatsCategories, getAdminRecentActivities } from '../api';
import type { Category, Wiki, AdminStatsOverview, AdminStatsCategory, AdminActivity } from '../types';

const SystemAdminPage = () => {
  const [activeTab, setActiveTab] = useState<'dashboard'|'data'|'users'|'categories'>('dashboard');

  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [catSearch, setCatSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Management State
  const [wikis, setWikis] = useState<Wiki[]>([]);
  const [dataFilter, setDataFilter] = useState<'ALL'|'DRAFT'|'PUBLISHED'>('ALL');

  // Dashboard Stats State
  const [statsOverview, setStatsOverview] = useState<AdminStatsOverview | null>(null);
  const [statsCategories, setStatsCategories] = useState<AdminStatsCategory[]>([]);
  const [recentActivities, setRecentActivities] = useState<AdminActivity[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("카테고리 로딩 실패:", err);
    }
  };

  const loadWikis = async () => {
    try {
      const data = await getWikis();
      setWikis(data);
    } catch (err) {
      console.error("데이터 로딩 실패:", err);
    }
  };

  const loadDashboardStats = async () => {
    setIsStatsLoading(true);
    try {
      const [overview, cats, acts] = await Promise.all([
        getAdminStatsOverview().catch(() => null),
        getAdminStatsCategories().catch(() => ({ data: [] })),
        getAdminRecentActivities(10).catch(() => ({ data: [] }))
      ]);
      setStatsOverview(overview);
      setStatsCategories(cats.data);
      setRecentActivities(acts.data);
    } catch (err) {
      console.error("대시보드 통계 로딩 실패:", err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'categories') {
      loadCategories();
    } else if (activeTab === 'data') {
      loadWikis();
      loadCategories();
    } else if (activeTab === 'dashboard') {
      loadDashboardStats();
    }
  }, [activeTab]);

  // Category Handlers
  const handleOpenCreateCat = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDesc('');
    setIsDrawerOpen(true);
  };

  const handleOpenEditCat = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDesc(cat.description || '');
    setIsDrawerOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: formName, description: formDesc });
      } else {
        await createCategory({ name: formName, description: formDesc });
      }
      setIsDrawerOpen(false);
      loadCategories();
    } catch (err) {
      console.error("카테고리 저장 실패:", err);
      alert('카테고리 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 카테고리를 삭제하시겠습니까?')) return;
    
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      console.error("카테고리 삭제 실패:", err);
      alert('카테고리 삭제에 실패했습니다. (사용 중일 수 있음)');
    }
  };

  // Data Management Handlers
  const handleDeleteWiki = async (id: string) => {
    if (!window.confirm('정말 이 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await deleteWiki(id);
      loadWikis();
    } catch (err) {
      console.error("위키 삭제 실패", err);
      alert('데이터 삭제에 실패했습니다.');
    }
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));
  const filteredWikis = wikis.filter(w => dataFilter === 'ALL' ? true : w.status === dataFilter);

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-slate-500';
    if (status === 'PUBLISHED') return 'bg-green-500';
    if (status === 'DRAFT') return 'bg-amber-500';
    if (status === 'REJECTED') return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <div className="flex h-[calc(100vh-120px)] w-full gap-6 slide-up">
      {/* Left LNB */}
      <div className="w-64 glass-panel p-4 rounded-2xl border border-white/5 bg-slate-900/60 flex flex-col gap-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">관리자 메뉴</h2>
        
        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'dashboard' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
          <LayoutDashboard className="w-4 h-4" /> 대시보드
        </button>
        <button onClick={() => setActiveTab('data')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'data' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
          <DbIcon className="w-4 h-4" /> 데이터 / 지식 관리
        </button>
        <button onClick={() => setActiveTab('users')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'users' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
          <Users className="w-4 h-4" /> 사용자 관리
        </button>
        <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'categories' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
          <Grid className="w-4 h-4" /> 카테고리 관리
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 glass-panel rounded-2xl border border-white/5 bg-slate-900/60 flex flex-col overflow-hidden relative">
        
        {activeTab === 'dashboard' && (
          <div className="p-6 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">시스템 대시보드</h2>
            
            {isStatsLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 lg:p-6 flex items-center gap-3 lg:gap-4">
                    <div className="p-3 lg:p-4 bg-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
                      <FileText className="w-6 h-6 lg:w-8 lg:h-8" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-400 text-xs lg:text-sm font-medium whitespace-nowrap truncate">총 문서 수</p>
                      <p className="text-2xl lg:text-3xl font-bold text-white truncate">{statsOverview?.total_documents || 0}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 lg:p-6 flex items-center gap-3 lg:gap-4">
                    <div className="p-3 lg:p-4 bg-green-500/20 rounded-xl text-green-400 shrink-0">
                      <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-400 text-xs lg:text-sm font-medium whitespace-nowrap truncate">승인 완료</p>
                      <p className="text-2xl lg:text-3xl font-bold text-white truncate">{statsOverview?.status_counts?.PUBLISHED || 0}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 lg:p-6 flex items-center gap-3 lg:gap-4">
                    <div className="p-3 lg:p-4 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
                      <Clock className="w-6 h-6 lg:w-8 lg:h-8" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-400 text-xs lg:text-sm font-medium whitespace-nowrap truncate">대기 중</p>
                      <p className="text-2xl lg:text-3xl font-bold text-white truncate">{statsOverview?.status_counts?.DRAFT || 0}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 lg:p-6 flex items-center gap-3 lg:gap-4">
                    <div className="p-3 lg:p-4 bg-red-500/20 rounded-xl text-red-400 shrink-0">
                      <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-400 text-xs lg:text-sm font-medium whitespace-nowrap truncate">반려됨</p>
                      <p className="text-2xl lg:text-3xl font-bold text-white truncate">{statsOverview?.status_counts?.REJECTED || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Categories Chart (Bar representation) */}
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-slate-200 mb-6">카테고리별 문서 현황</h3>
                    <div className="space-y-4">
                      {statsCategories.map((cat, idx) => {
                        const total = statsOverview?.total_documents || 1;
                        const percentage = Math.round((cat.count / total) * 100) || 0;
                        return (
                          <div key={cat.category_id || idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white font-medium">{cat.category_name}</span>
                              <span className="text-slate-400">{cat.count}건 ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2.5">
                              <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                      {statsCategories.length === 0 && (
                        <p className="text-slate-500 text-sm text-center py-4">데이터가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Activities */}
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-slate-200 mb-6">최근 활동 내역</h3>
                    <ul className="space-y-6">
                      {recentActivities.map((act, idx) => (
                        <li key={act.activity_id || idx} className="flex gap-4 relative">
                          {idx !== recentActivities.length - 1 && (
                            <div className="absolute left-2.5 top-8 w-0.5 h-full bg-slate-800 -ml-px"></div>
                          )}
                          <div className={`relative z-10 w-5 h-5 rounded-full ${getStatusColor(act.new_status)} border-4 border-slate-900 mt-1`}></div>
                          <div>
                            <p className="text-white font-medium text-sm">
                              {act.event_type === 'DOCUMENT_CREATED' ? '새 문서 등록' : 
                               act.event_type === 'STATUS_CHANGED' ? '상태 변경' : act.event_type}
                            </p>
                            <p className="text-slate-400 text-sm">
                              [{act.user_name}]님이 "{act.document_title}" 문서를 
                              {act.event_type === 'DOCUMENT_CREATED' ? ' 등록했습니다.' : 
                               ` ${act.old_status || ''}에서 ${act.new_status}로 변경했습니다.`}
                            </p>
                            <p className="text-slate-500 text-xs mt-1">{new Date(act.timestamp).toLocaleString()}</p>
                          </div>
                        </li>
                      ))}
                      {recentActivities.length === 0 && (
                        <p className="text-slate-500 text-sm text-center py-4">활동 내역이 없습니다.</p>
                      )}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" /> 사용자 관리
                </h2>
                <p className="text-slate-400 text-sm mt-1">시스템 접근 및 역할(Role)을 관리합니다.</p>
              </div>
              <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                <Plus className="w-4 h-4" /> 사용자 추가
              </button>
            </div>
            
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="이름 또는 이메일로 검색..." 
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
                />
              </div>
              <select className="bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 outline-none">
                <option value="all">모든 역할</option>
                <option value="admin">관리자</option>
                <option value="user">사용자</option>
              </select>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="py-4 px-6 text-slate-400 font-medium text-sm">사용자 ID</th>
                    <th className="py-4 px-6 text-slate-400 font-medium text-sm">이름 / 이메일</th>
                    <th className="py-4 px-6 text-slate-400 font-medium text-sm">역할</th>
                    <th className="py-4 px-6 text-slate-400 font-medium text-sm">상태</th>
                    <th className="py-4 px-6 text-slate-400 font-medium text-sm text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-mono text-sm">usr_001</td>
                    <td className="py-4 px-6">
                      <p className="text-white font-medium">관리자 계정</p>
                      <p className="text-slate-400 text-xs">admin@omnilog.ai</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-500/20 text-purple-400">Admin</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-400">활성</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors" title="수정">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="삭제">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-mono text-sm">usr_002</td>
                    <td className="py-4 px-6">
                      <p className="text-white font-medium">테스트 개발자</p>
                      <p className="text-slate-400 text-xs">dev@omnilog.ai</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-400">User</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-400">활성</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors" title="수정">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="삭제">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <DbIcon className="w-5 h-5 text-indigo-400" /> 데이터 및 지식 관리
                </h2>
                <p className="text-slate-400 text-sm mt-1">등록된 모든 문서 및 지식 데이터를 관리합니다.</p>
              </div>
              
              <div className="flex bg-slate-950/50 rounded-lg p-1 border border-white/10">
                <button onClick={() => setDataFilter('ALL')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dataFilter === 'ALL' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>전체</button>
                <button onClick={() => setDataFilter('DRAFT')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dataFilter === 'DRAFT' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>대기 중</button>
                <button onClick={() => setDataFilter('PUBLISHED')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dataFilter === 'PUBLISHED' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>승인 완료</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase text-slate-500 tracking-wider">
                    <th className="pb-3 font-medium px-4">ID</th>
                    <th className="pb-3 font-medium px-4">제목</th>
                    <th className="pb-3 font-medium px-4">상태</th>
                    <th className="pb-3 font-medium px-4">카테고리</th>
                    <th className="pb-3 font-medium px-4">등록자</th>
                    <th className="pb-3 font-medium px-4">등록일</th>
                    <th className="pb-3 font-medium px-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-300">
                  {filteredWikis.map(wiki => (
                    <tr key={wiki.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs text-slate-500">{wiki.id.slice(0,8)}</td>
                      <td className="py-4 px-4 font-medium text-white">{wiki.title || '제목 없음'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${wiki.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {wiki.status === 'PUBLISHED' ? '승인 완료' : wiki.status === 'DRAFT' ? '대기 중' : wiki.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">{categories.find(c => c.id === wiki.category_id)?.name || '-'}</td>
                      <td className="py-4 px-4 text-slate-400">관리자</td>
                      <td className="py-4 px-4 text-slate-400">{new Date(wiki.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors" title="수정">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteWiki(wiki.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="삭제">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredWikis.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">조회된 데이터가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-indigo-400" /> 카테고리 관리
                </h2>
                <p className="text-slate-400 text-sm mt-1">지식 베이스의 분류 체계를 관리합니다.</p>
              </div>
              <button 
                onClick={handleOpenCreateCat}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" /> 새 카테고리
              </button>
            </div>
            
            <div className="p-6 border-b border-white/5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="카테고리 검색..." 
                  value={catSearch}
                  onChange={e => setCatSearch(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.map(cat => (
                  <div key={cat.id} className="bg-slate-950/50 border border-white/5 rounded-xl p-5 hover:border-indigo-500/30 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-200">{cat.name}</h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEditCat(cat)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => handleDeleteCat(cat.id, e)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{cat.description || '설명이 없습니다.'}</p>
                    <div className="mt-4 flex justify-between items-center text-xs text-slate-500 border-t border-white/5 pt-3">
                      <span>ID: {cat.id.slice(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Slide-over Drawer for Category */}
        {isDrawerOpen && (
          <div className="absolute inset-y-0 right-0 w-[400px] bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col animate-slide-in z-50">
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-slate-900/50">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                {editingCategory ? <Edit2 className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-400" />}
                {editingCategory ? '카테고리 수정' : '새 카테고리'}
              </h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCat} className="flex-1 flex flex-col p-6 overflow-y-auto gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">카테고리 이름 *</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="예: 프론트엔드 아키텍처"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">설명</label>
                <textarea 
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="이 카테고리에 포함될 문서에 대해 설명하세요..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 h-32 resize-none"
                />
              </div>

              <div className="mt-auto pt-6 border-t border-white/10 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors border border-white/10"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !formName.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  저장
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default SystemAdminPage;
