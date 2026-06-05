import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, X, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { searchDocuments, getDocumentById, getCategories } from '../api';
import type { Category, Wiki } from '../types';

const WorkspacePage = () => {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [results, setResults] = useState<(Wiki & { category?: Category })[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docDetail, setDocDetail] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [isOriginalExpanded, setIsOriginalExpanded] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const res = await searchDocuments({
        query,
        category_id: selectedCategory,
        status: selectedStatus,
        start_date: startDate,
        end_date: endDate,
        limit: 50
      });
      setResults(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to search", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openDocument = async (id: string) => {
    setSelectedDocId(id);
    setIsDetailLoading(true);
    setViewMode('table');
    setIsOriginalExpanded(false);
    try {
      const data = await getDocumentById(id);
      setDocDetail(data);
    } catch (err) {
      console.error("Failed to fetch document", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const renderStructuredData = (data: any) => {
    if (!data) return <p className="text-slate-400 text-sm">구조화된 데이터가 없습니다.</p>;
    
    if (viewMode === 'json') {
      return (
        <pre className="bg-slate-950 p-4 rounded-xl text-xs text-green-400 overflow-x-auto border border-white/5">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <tbody className="divide-y divide-white/10">
            {Object.entries(data).map(([key, value]) => (
              <tr key={key}>
                <th className="py-3 px-4 bg-slate-900/50 text-slate-300 font-medium w-1/3 border-r border-white/5">{key}</th>
                <td className="py-3 px-4 text-slate-400">{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full fade-in relative">
      {/* Header & Search */}
      <div className="mb-8 text-center mt-4">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">통합 문서 검색</h1>
        <p className="text-slate-400">지식 베이스와 시스템 로그에서 필요한 정보를 AI 시맨틱 검색으로 찾아보세요.</p>
      </div>

      <div className="max-w-4xl w-full mx-auto mb-8 bg-slate-900/50 p-4 rounded-3xl border border-white/5 shadow-2xl">
        <div className="relative flex items-center mb-4">
          <Search className="w-6 h-6 absolute left-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="검색어 또는 질문을 입력하세요..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-32 py-4 text-white focus:outline-none focus:border-indigo-500/50 text-lg shadow-inner"
          />
          <button 
            onClick={handleSearch}
            className="absolute right-2 top-2 bottom-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 rounded-xl font-medium transition-colors"
          >
            검색
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-2">
          <div className="flex items-center gap-2 bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-300 text-sm focus:outline-none outline-none appearance-none pr-4"
            >
              <option value="">모든 카테고리</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2">
            <select 
              value={selectedStatus} 
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-300 text-sm focus:outline-none outline-none appearance-none pr-4"
            >
              <option value="">모든 상태</option>
              <option value="PUBLISHED">승인 완료</option>
              <option value="DRAFT">대기 중</option>
              <option value="REJECTED">반려됨</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-slate-300 text-sm focus:outline-none outline-none [color-scheme:dark]" 
            />
            <span className="text-slate-500">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-slate-300 text-sm focus:outline-none outline-none [color-scheme:dark]" 
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 max-w-5xl w-full mx-auto overflow-auto pb-8">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-medium text-white">검색 결과 <span className="text-indigo-400">{total}</span>건</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {results.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => openDocument(doc.id)}
                className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all cursor-pointer flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">{doc.title}</h3>
                  {doc.semantic_score && (
                    <span className="px-2 py-1 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
                      연관도: {Math.round(doc.semantic_score * 100)}%
                    </span>
                  )}
                </div>
                
                <p className="text-slate-400 text-sm line-clamp-2">{doc.summary || doc.content}</p>
                
                <div className="flex items-center gap-3 pt-2 text-xs font-medium">
                  <span className={`px-2 py-1 rounded-md border ${
                    doc.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    doc.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {doc.status === 'PUBLISHED' ? '승인 완료' : doc.status === 'DRAFT' ? '대기 중' : '기타'}
                  </span>
                  {doc.category && (
                    <span className="text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md">{doc.category.name}</span>
                  )}
                  <span className="text-slate-500 ml-auto">{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            {results.length === 0 && (
              <div className="py-20 text-center text-slate-500 glass-panel rounded-2xl">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">조건에 맞는 검색 결과가 없습니다.</p>
                <p className="text-sm mt-1">검색어나 필터를 조정해 보세요.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-over Detail Viewer */}
      {selectedDocId && (
        <div className="absolute inset-y-0 right-0 w-[600px] max-w-full bg-slate-900 shadow-2xl flex flex-col animate-slide-in z-50 border-l border-white/10 rounded-l-3xl">
          {isDetailLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
          ) : docDetail ? (
            <>
              <div className="flex justify-between items-start p-6 border-b border-white/10 bg-slate-900/80 sticky top-0 backdrop-blur-md z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                      docDetail.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {docDetail.status === 'PUBLISHED' ? '승인 완료' : '대기 중'}
                    </span>
                    {docDetail.category && (
                      <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-md">{docDetail.category.name}</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{docDetail.title}</h2>
                </div>
                <button onClick={() => setSelectedDocId(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors bg-slate-800/50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* AI Summary Highlight */}
                {docDetail.summary && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
                      ✨ AI 요약
                    </h3>
                    <p className="text-slate-200 text-sm leading-relaxed">{docDetail.summary}</p>
                  </div>
                )}

                {/* Structured Data Viewer */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-white">구조화된 데이터</h3>
                    <div className="flex bg-slate-950 border border-white/10 rounded-lg p-1">
                      <button 
                        onClick={() => setViewMode('table')} 
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Table 보기
                      </button>
                      <button 
                        onClick={() => setViewMode('json')} 
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'json' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        JSON 보기
                      </button>
                    </div>
                  </div>
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    {renderStructuredData(docDetail.structured_data)}
                  </div>
                </div>

                {/* Original Text Accordion */}
                <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/50">
                  <button 
                    onClick={() => setIsOriginalExpanded(!isOriginalExpanded)}
                    className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm font-bold text-white">원본 텍스트 보기</span>
                    {isOriginalExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOriginalExpanded && (
                    <div className="p-4 border-t border-white/10 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/50">
                      {docDetail.original_text || docDetail.content || '원본 텍스트가 없습니다.'}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
