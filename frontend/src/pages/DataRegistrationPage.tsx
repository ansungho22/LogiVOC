import React, { useState, useEffect } from 'react';
import { Loader2, UploadCloud, FileUp, CheckCircle, FileText, X, Plus } from 'lucide-react';
import { getWikis, getCategories, updateWiki, verifyWiki, uploadFile, getTaskStatus, getWikiById, ApiError } from '../api';
import type { Wiki, Category } from '../types';

const MAX_PROMPT_LENGTH = 500;

const DataRegistrationPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [drafts, setDrafts] = useState<Wiki[]>([]);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Edit State (Right Panel / Split View)
  const [editingDraft, setEditingDraft] = useState<Wiki | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editContent, setEditContent] = useState('');

  const loadData = async () => {
    try {
      let catsData: Category[] = [];
      try {
        catsData = await getCategories();
      } catch (catErr) {
        console.error("Categories fetch warning:", catErr);
        catsData = [];
      }
      setCategories(catsData);
      
      const wikisData = await getWikis();
      setDrafts(wikisData.filter(w => w.status === 'DRAFT'));
    } catch (err) {
      console.error("Data load error:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setUploadError(null);
    if (!files || !files[0]) return;
    
    if (files[0].size > 5 * 1024 * 1024) {
      setUploadError('파일 크기가 5MB를 초과했습니다.');
      return;
    }

    setIsUploading(true);
    try {
      // Pass custom prompt and new category if available
      const uploadCategory = isAddingCategory && newCategory ? newCategory : undefined;
      const response = await uploadFile(files[0], customPrompt, uploadCategory);
      const taskId = response.task_id ;
      
      const poll = setInterval(async () => {
        try {
          const statusRes = await getTaskStatus(taskId);
          if (statusRes.status === 'SUCCESS' || statusRes.status === 'COMPLETED') {
            clearInterval(poll);
            setIsUploading(false);
            if (statusRes.result_wiki_id) {
              const draft = await getWikiById(statusRes.result_wiki_id);
              handleEditClick(draft);
            } else {
               
    loadData();
            }
          } else if (statusRes.status === 'FAILURE' || statusRes.status === 'FAILED') {
            clearInterval(poll);
            setIsUploading(false);
            if (statusRes.result_wiki_id) {
              alert('API or Network error occurred. Applied default category as fallback.');
              const draft = await getWikiById(statusRes.result_wiki_id);
              handleEditClick(draft);
               
    loadData();
            } else {
              alert('Document processing failed.');
            }
          }
        } catch (err) {
          console.error("Polling error", err);
          clearInterval(poll);
          setIsUploading(false);
        }
      }, 2000);
      
    } catch (err: unknown) {
      console.error("Upload error:", err);
      if (err instanceof ApiError) {
        if (err.status === 413) {
          setUploadError('파일 크기가 너무 큽니다 (서버 제한 초과).');
        } else if (err.status === 429) {
          setUploadError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setUploadError(`업로드 실패 (에러 코드: ${err.status})`);
        }
      } else {
        setUploadError('알 수 없는 이유로 업로드에 실패했습니다.');
      }
      setIsUploading(false);
    }
  };

  const handleEditClick = (draft: Wiki) => {
    setEditingDraft(draft);
    setEditTitle(draft.title || '');
    setEditCategory(draft.category_id || '');
    setEditContent(draft.content || '');
  };

  const handleGo = async () => {
    if (!editingDraft) return;
    try {
      await updateWiki(editingDraft.id, {
        title: editTitle,
        category_id: editCategory,
        content: editContent
      });
      await verifyWiki(editingDraft.id, 'GO', editContent);
      setEditingDraft(null);
       
    loadData();
    } catch (err) {
      console.error("Publish error:", err);
      alert('Failed to publish');
    }
  };

  const handleStop = async () => {
    if (!editingDraft) return;
    if (!window.confirm('Are you sure you want to discard this draft?')) return;
    try {
      await verifyWiki(editingDraft.id, 'STOP');
      setEditingDraft(null);
       
    loadData();
    } catch (err) {
      console.error("Discard error:", err);
      alert('Failed to discard draft');
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] w-full gap-6 slide-up">
      {/* Full-screen Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-16 h-16 text-indigo-400 animate-spin mb-4" />
            <h2 className="text-xl font-medium text-white tracking-wider">Processing Document...</h2>
          </div>
        </div>
      )}

      {/* Conditional Layout: Upload View vs Edit View */}
      {!editingDraft ? (
        // UPLOAD VIEW: Split 50/50 for Upload+Options vs Draft List
        <div className="flex w-full gap-6">
          <div className="w-1/2 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/60 flex flex-col">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-400" /> Upload Document
              </h2>
              <div 
                data-testid="upload-zone"
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors mb-2 ${
                  uploadError 
                    ? 'border-red-500 bg-red-500/10' 
                    : dragActive 
                      ? 'border-indigo-400 bg-indigo-500/10' 
                      : 'border-white/20 bg-slate-950/50 hover:bg-slate-900/80'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileUp className={`w-10 h-10 mb-3 ${uploadError ? 'text-red-400' : 'text-indigo-400'}`} />
                <p className="text-slate-300 mb-2 font-medium text-sm text-center">Drag and drop your files here</p>
                <p className="text-slate-500 text-xs mb-4">최대 5MB 이하의 파일만 업로드 가능합니다</p>
                <label className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors border border-white/5 cursor-pointer font-medium text-sm">
                  Browse Files
                  <input data-testid="input-file" type="file" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                </label>
              </div>
              {uploadError && (
                <div className="text-red-400 text-sm font-medium mb-4 px-2">
                  {uploadError}
                </div>
              )}

              {/* Pipeline Options Panel */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-bold text-slate-300 mb-3">Pipeline Options</h3>
                
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 flex justify-between">
                    <span>Custom Prompt</span>
                    <span className={customPrompt.length >= MAX_PROMPT_LENGTH ? 'text-red-400' : 'text-slate-500'}>
                      {customPrompt.length}/{MAX_PROMPT_LENGTH}
                    </span>
                  </label>
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[<>[\]{}\\|^~]/g, '');
                      if (val.length <= MAX_PROMPT_LENGTH) setCustomPrompt(val);
                    }}
                    placeholder="예: 이 문서에서 API 명세서 부분만 중점적으로 추출하고 요약해줘."
                    className={`w-full bg-slate-950/50 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm h-20 resize-none ${
                      customPrompt.length >= MAX_PROMPT_LENGTH ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">특수 문자 및 시스템 지시어는 자동으로 필터링됩니다.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Category Setup</label>
                  {!isAddingCategory ? (
                    <div className="flex gap-2">
                      <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="flex-1 bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm appearance-none"
                      >
                        <option value="" className="text-slate-900">Select an existing category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => setIsAddingCategory(true)}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-indigo-300 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> New
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="분류 > 중분류"
                        className="flex-1 bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500/50 text-sm"
                      />
                      <button 
                        onClick={() => { setIsAddingCategory(false); setNewCategory(''); }}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-400 flex items-center gap-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="w-1/2 glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/60 flex flex-col overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" /> Recent Documents (Drafts)
            </h2>
            <div className="overflow-y-auto flex-1 space-y-3 pr-2">
              {drafts.length === 0 && (
                <div className="text-slate-500 text-sm text-center py-10">No pending drafts.</div>
              )}
              {drafts.map(draft => (
                <div 
                  key={draft.id} 
                  onClick={() => handleEditClick(draft)}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <div className="font-medium text-slate-200 text-sm truncate mb-1">{draft.title}</div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{new Date(draft.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                      <Loader2 className="w-3 h-3 animate-spin" /> Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // EDIT VIEW: 7:3 Split (Content 70% | Viewer 30%)
        <div className="flex w-full gap-6">
          {/* Extracted Data Form (70%) */}
          <div className="w-[70%] glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/60 flex flex-col relative h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" /> Verify Extracted Data
              </h2>
              <button onClick={() => setEditingDraft(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
              {/* Badges for Prompt/Category */}
              <div className="flex gap-2 mb-2">
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30">
                  AI Extracted
                </span>
                {editingDraft.category_id && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-md border border-purple-500/30">
                    Auto-Categorized
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Title</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
                <select 
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                >
                  <option value="" className="text-slate-900">Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 flex flex-col min-h-[300px]">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Extracted Content (Rich Text)</label>
                <textarea 
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 resize-none font-mono text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                <button 
                  data-testid="btn-save-draft"
                  onClick={() => handleEditClick(editingDraft)} // dummy save draft action
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors border border-white/10"
                >
                  Save Draft
                </button>
                <button 
                  data-testid="btn-stop"
                  onClick={handleStop}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  Reject
                </button>
                <button 
                  data-testid="btn-go"
                  onClick={handleGo}
                  className="px-6 py-2 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>

          {/* Original Document Viewer (30%) */}
          <div className="w-[30%] bg-slate-950/50 border border-white/10 rounded-2xl p-4 flex flex-col h-full relative">
            <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center justify-between">
              Original Document
            </h3>
            <div className="flex-1 border border-white/5 rounded-lg flex items-center justify-center text-slate-600 bg-slate-900/80 p-4 text-center">
              <div>
                <p className="text-sm mb-2">PDF / Image Preview</p>
                <p className="text-xs opacity-50 break-words">{editingDraft.source_url || 'No Source Available'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRegistrationPage;
