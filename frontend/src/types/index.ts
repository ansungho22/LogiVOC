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
}
