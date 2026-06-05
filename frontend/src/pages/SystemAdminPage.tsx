import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, LayoutDashboard, Loader2, Database as DbIcon, Users, Grid, } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory, getWikis, deleteWiki } from '../api';
import type { Category, Wiki } from '../types';

const SystemAdminPage = () => {
  const [activeTab, setActiveTab] = useState<'dashboard'|'data'|'users'|'categories'>('data');

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
  
  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const loadWikis = async () => {
    try {
      const data = await getWikis();
      setWikis(data);
    } catch (err) {
      console.error("Failed to load wikis:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'categories') // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories();
    if (activeTab === 'data') {
       
      loadWikis();
       
    loadCategories();
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
      console.error("Failed to save category:", err);
      alert('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await deleteCategory(id);
       
    loadCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);
      alert('Failed to delete category (might be in use)');
    }
  };

  // Data Management Handlers
  const handleDeleteWiki = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this data? This action cannot be undone.')) return;
    try {
      await deleteWiki(id);
       
      loadWikis();
    } catch (err) {
      console.error("Failed to delete wiki", err);
      alert('Failed to delete data');
    }
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));
  const filteredWikis = wikis.filter(w => dataFilter === 'ALL' ? true : w.status === dataFilter);

  return (
    <div className="flex h-[calc(100vh-120px)] w-full gap-6 slide-up">
      {/* Left LNB */}
      <div className="w-64 glass-panel p-4 rounded-2xl border border-white/5 bg-slate-900/60 flex flex-col gap-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Admin Menu</h2>
        
        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'dashboard' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </button>
        <button onClick={() => setActiveTab('data')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'data' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
          <DbIcon className="w-4 h-4" /> Data/Knowledge
        </button>
        <button onClick={() => setActiveTab('users')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'users' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
          <Users className="w-4 h-4" /> User Management
        </button>
        <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === 'categories' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
          <Grid className="w-4 h-4" /> Categories
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 glass-panel rounded-2xl border border-white/5 bg-slate-900/60 flex flex-col overflow-hidden relative">
        
        {activeTab === 'dashboard' && (
          <div className="p-6 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">System Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                <div className="p-4 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <Grid className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total Workspaces</p>
                  <p className="text-3xl font-bold text-white">4</p>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                <div className="p-4 bg-blue-500/20 rounded-xl text-blue-400">
                  <DbIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Registered Data</p>
                  <p className="text-3xl font-bold text-white">{wikis.length}</p>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                <div className="p-4 bg-purple-500/20 rounded-xl text-purple-400">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Active Users</p>
                  <p className="text-3xl font-bold text-white">12</p>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-200 mb-4">Recent Activities</h3>
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
              <ul className="space-y-6">
                <li className="flex gap-4 relative">
                  <div className="absolute left-2.5 top-8 w-0.5 h-full bg-slate-800 -ml-px"></div>
                  <div className="relative z-10 w-5 h-5 rounded-full bg-indigo-500 border-4 border-slate-900 mt-1"></div>
                  <div>
                    <p className="text-white font-medium">New Workspace created</p>
                    <p className="text-slate-400 text-sm">Frontend Performance Audit workspace was created.</p>
                    <p className="text-slate-500 text-xs mt-1">2 hours ago</p>
                  </div>
                </li>
                <li className="flex gap-4 relative">
                  <div className="absolute left-2.5 top-8 w-0.5 h-full bg-slate-800 -ml-px"></div>
                  <div className="relative z-10 w-5 h-5 rounded-full bg-blue-500 border-4 border-slate-900 mt-1"></div>
                  <div>
                    <p className="text-white font-medium">Data Registration uploaded</p>
                    <p className="text-slate-400 text-sm">System admin uploaded "auth-service-logs.csv"</p>
                    <p className="text-slate-500 text-xs mt-1">5 hours ago</p>
                  </div>
                </li>
                <li className="flex gap-4 relative">
                  <div className="relative z-10 w-5 h-5 rounded-full bg-slate-600 border-4 border-slate-900 mt-1"></div>
                  <div>
                    <p className="text-white font-medium">System Update</p>
                    <p className="text-slate-400 text-sm">OmniLog AI v1.2.0 deployed successfully.</p>
                    <p className="text-slate-500 text-xs mt-1">1 day ago</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" /> User Management
                </h2>
                <p className="text-slate-400 text-sm mt-1">Manage system access and roles.</p>
              </div>
              <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>
            
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search users by name or email..." 
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
                />
              </div>
              <select className="bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 outline-none">
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="py-4 px-6 text-slate-400 font-medium text-sm">User ID</th>
                    <th className="py-4 px-6 text-slate-400 font-medium text-sm">Name / Email</th>
                    <th className="py-4 px-6 text-slate-400 font-medium text-sm">Role</th>
                    <th className="py-4 px-6 text-slate-400 font-medium text-sm">Status</th>
                    <th className="py-4 px-6 text-slate-400 font-medium text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-mono text-sm">usr_001</td>
                    <td className="py-4 px-6">
                      <p className="text-white font-medium">Admin User</p>
                      <p className="text-slate-400 text-xs">admin@omnilog.ai</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-500/20 text-purple-400">Admin</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-400">Active</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-mono text-sm">usr_002</td>
                    <td className="py-4 px-6">
                      <p className="text-white font-medium">Test Developer</p>
                      <p className="text-slate-400 text-xs">dev@omnilog.ai</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-400">User</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-400">Active</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Delete">
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
                  <DbIcon className="w-5 h-5 text-indigo-400" /> Data & Knowledge Management
                </h2>
                <p className="text-slate-400 text-sm mt-1">Manage all registered documents and knowledge data.</p>
              </div>
              
              <div className="flex bg-slate-950/50 rounded-lg p-1 border border-white/10">
                <button onClick={() => setDataFilter('ALL')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dataFilter === 'ALL' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>All</button>
                <button onClick={() => setDataFilter('DRAFT')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dataFilter === 'DRAFT' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>Draft</button>
                <button onClick={() => setDataFilter('PUBLISHED')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dataFilter === 'PUBLISHED' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>Published</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase text-slate-500 tracking-wider">
                    <th className="pb-3 font-medium px-4">ID</th>
                    <th className="pb-3 font-medium px-4">Title</th>
                    <th className="pb-3 font-medium px-4">Status</th>
                    <th className="pb-3 font-medium px-4">Category</th>
                    <th className="pb-3 font-medium px-4">Uploader</th>
                    <th className="pb-3 font-medium px-4">Date</th>
                    <th className="pb-3 font-medium px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-300">
                  {filteredWikis.map(wiki => (
                    <tr key={wiki.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs text-slate-500">{wiki.id.slice(0,8)}</td>
                      <td className="py-4 px-4 font-medium text-white">{wiki.title || 'Untitled'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${wiki.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {wiki.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">{categories.find(c => c.id === wiki.category_id)?.name || '-'}</td>
                      <td className="py-4 px-4 text-slate-400">Admin</td>
                      <td className="py-4 px-4 text-slate-400">{new Date(wiki.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteWiki(wiki.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredWikis.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">No data found.</td>
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
                  <Grid className="w-5 h-5 text-indigo-400" /> Category Management
                </h2>
                <p className="text-slate-400 text-sm mt-1">Organize your knowledge base structure.</p>
              </div>
              <button 
                onClick={handleOpenCreateCat}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" /> New Category
              </button>
            </div>
            
            <div className="p-6 border-b border-white/5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search categories..." 
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
                    <p className="text-sm text-slate-400 line-clamp-2">{cat.description || 'No description provided.'}</p>
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
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCat} className="flex-1 flex flex-col p-6 overflow-y-auto gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Category Name *</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Frontend Architecture"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                <textarea 
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Describe what kind of documents belong here..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 h-32 resize-none"
                />
              </div>

              <div className="mt-auto pt-6 border-t border-white/10 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !formName.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Category
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
