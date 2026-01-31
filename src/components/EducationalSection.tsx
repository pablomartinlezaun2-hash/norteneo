import { useState, useEffect } from 'react';
import { useEducationalContent, EducationalCategory, EducationalArticle } from '@/hooks/useEducationalContent';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dumbbell, Waves, Footprints, ChevronRight, ArrowLeft, 
  Edit2, Save, X, BookOpen, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const iconMap: Record<string, React.ElementType> = {
  Dumbbell: Dumbbell,
  Waves: Waves,
  Footprints: Footprints,
};

export const EducationalSection = () => {
  const { categories, loading, fetchArticlesByCategory, updateArticle } = useEducationalContent();
  const [selectedCategory, setSelectedCategory] = useState<EducationalCategory | null>(null);
  const [articles, setArticles] = useState<EducationalArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<EducationalArticle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [loadingArticles, setLoadingArticles] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      loadArticles(selectedCategory.id);
    }
  }, [selectedCategory]);

  const loadArticles = async (categoryId: string) => {
    setLoadingArticles(true);
    const data = await fetchArticlesByCategory(categoryId);
    setArticles(data);
    setLoadingArticles(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedArticle) return;
    
    const success = await updateArticle(selectedArticle.id, editContent);
    if (success) {
      setSelectedArticle({ ...selectedArticle, content: editContent });
      setIsEditing(false);
      toast.success('Artículo actualizado');
    } else {
      toast.error('Error al guardar');
    }
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold text-foreground mt-6 mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-semibold text-foreground mt-5 mb-3">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-medium text-foreground mt-4 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold text-foreground my-2">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="text-muted-foreground ml-4">{line.slice(2)}</li>;
        }
        if (line.startsWith('```')) {
          return null; // Skip code blocks for now
        }
        if (line.startsWith('|')) {
          return <p key={i} className="text-sm text-muted-foreground font-mono my-1">{line}</p>;
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        return <p key={i} className="text-muted-foreground my-2 leading-relaxed">{line}</p>;
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Article view
  if (selectedArticle) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSelectedArticle(null);
              setIsEditing(false);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setEditContent(selectedArticle.content);
                setIsEditing(true);
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="gradient-primary text-primary-foreground">
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[500px] font-mono text-sm"
            placeholder="Contenido en Markdown..."
          />
        ) : (
          <div className="gradient-card rounded-xl p-6 border border-border">
            {renderMarkdown(selectedArticle.content)}
          </div>
        )}
      </div>
    );
  }

  // Articles list
  if (selectedCategory) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h2 className="text-xl font-bold text-foreground">{selectedCategory.name}</h2>
        </div>

        {loadingArticles ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay artículos en esta categoría
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="w-full gradient-card rounded-xl p-4 border border-border text-left hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{article.title}</h3>
                    {article.summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Categories view
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="gradient-primary rounded-xl p-2.5">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Fundamentación Teórica</h2>
          <p className="text-sm text-muted-foreground">Conocimiento científico para optimizar tu entrenamiento</p>
        </div>
      </div>

      <div className="grid gap-4">
        {categories.map((category) => {
          const Icon = iconMap[category.icon || 'Dumbbell'] || Dumbbell;
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              className="gradient-card rounded-xl p-5 border border-border text-left hover:border-primary/50 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "rounded-xl p-3 transition-all",
                  "bg-primary/10 group-hover:bg-primary/20"
                )}>
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
