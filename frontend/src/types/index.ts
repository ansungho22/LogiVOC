export interface Category {
  id: string;
  name: string;
  description?: string;
  level: number;
  parent_id?: string;
  created_at: string;
}

export interface Wiki {
  id: string;
  title: string;
  content: string;
  category_id: string;
  author_id: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_at: string;
  updated_at?: string;
  source_url?: string;
  summary?: string;
  original_text?: string;
  structured_data?: Record<string, any>;
  semantic_score?: number;
}

export interface SearchResponse {
  total: number;
  page: number;
  limit: number;
  data: (Wiki & { category?: Category })[];
}

export interface AdminStatsOverview {
  total_documents: number;
  status_counts: {
    PUBLISHED: number;
    DRAFT: number;
    REJECTED: number;
    [key: string]: number;
  };
}

export interface AdminStatsCategory {
  category_id: string;
  category_name: string;
  count: number;
}

export interface AdminActivity {
  activity_id: string | number;
  event_type: string;
  document_id: string | number;
  document_title: string;
  user_name: string;
  timestamp: string;
  old_status?: string;
  new_status?: string;
}
