import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EducationalCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order_index: number;
}

export interface EducationalArticle {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  order_index: number;
  is_default: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useEducationalContent = () => {
  const [categories, setCategories] = useState<EducationalCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('educational_categories')
        .select('*')
        .order('order_index');

      if (!error && data) {
        setCategories(data);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  const fetchArticlesByCategory = async (categoryId: string): Promise<EducationalArticle[]> => {
    const { data, error } = await supabase
      .from('educational_articles')
      .select('*')
      .eq('category_id', categoryId)
      .order('order_index');

    if (error) {
      console.error('Error fetching articles:', error);
      return [];
    }

    return data || [];
  };

  const fetchArticle = async (articleId: string): Promise<EducationalArticle | null> => {
    const { data, error } = await supabase
      .from('educational_articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error) {
      console.error('Error fetching article:', error);
      return null;
    }

    return data;
  };

  const updateArticle = async (articleId: string, content: string): Promise<boolean> => {
    const { error } = await supabase
      .from('educational_articles')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', articleId);

    if (error) {
      console.error('Error updating article:', error);
      return false;
    }

    return true;
  };

  return {
    categories,
    loading,
    fetchArticlesByCategory,
    fetchArticle,
    updateArticle,
  };
};
