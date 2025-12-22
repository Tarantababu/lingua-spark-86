import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, Search, Filter, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { WordStatus } from '@/types';

const statusLabels: Record<number, string> = {
  '-1': 'Ignored',
  0: 'Known',
  1: 'New',
  2: 'Learning 1',
  3: 'Learning 2',
  4: 'Learning 3',
  5: 'Learned',
};

const statusColors: Record<number, string> = {
  '-1': 'bg-muted text-muted-foreground',
  0: 'bg-muted text-muted-foreground',
  1: 'bg-word-new text-word-new-foreground',
  2: 'bg-word-learning-1 text-word-learning-foreground',
  3: 'bg-word-learning-2 text-word-learning-foreground',
  4: 'bg-word-learning-3 text-word-learning-foreground',
  5: 'bg-success text-success-foreground',
};

type FilterType = 'all' | 'new' | 'learning' | 'known' | 'ignored';

export default function Vocabulary() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { vocabulary, loading, getKnownWordsCount, getLearningWordsCount, getIgnoredWordsCount, updateWordStatus } = useVocabulary();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Filter and search vocabulary
  const filteredVocabulary = useMemo(() => {
    let filtered = vocabulary;

    // Apply status filter
    if (filterType === 'new') {
      filtered = filtered.filter(v => v.status === 1);
    } else if (filterType === 'learning') {
      filtered = filtered.filter(v => v.status >= 2 && v.status <= 4);
    } else if (filterType === 'known') {
      filtered = filtered.filter(v => v.status === 0 || v.status === 5);
    } else if (filterType === 'ignored') {
      filtered = filtered.filter(v => v.status === -1);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.word.toLowerCase().includes(query) || 
        v.translation?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [vocabulary, filterType, searchQuery]);

  const handleStatusChange = async (wordId: string, newStatus: WordStatus) => {
    const success = await updateWordStatus(wordId, newStatus);
    if (success) {
      toast.success('Status updated');
    } else {
      toast.error('Failed to update status');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Vocabulary</h1>
        
        {/* Stats */}
        <div className="flex gap-4 mb-4 text-sm">
          <span className="text-success font-medium">{getKnownWordsCount()} known</span>
          <span className="text-warning font-medium">{getLearningWordsCount()} learning</span>
          <span className="text-muted-foreground font-medium">{getIgnoredWordsCount()} ignored</span>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterType('all')} className={filterType === 'all' ? 'bg-accent' : ''}>
                All Words
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('new')} className={filterType === 'new' ? 'bg-accent' : ''}>
                New
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('learning')} className={filterType === 'learning' ? 'bg-accent' : ''}>
                Learning
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('known')} className={filterType === 'known' ? 'bg-accent' : ''}>
                Known
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('ignored')} className={filterType === 'ignored' ? 'bg-accent' : ''}>
                Ignored
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredVocabulary.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Languages className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-serif text-xl font-bold mb-2">No words yet</h2>
            <p className="text-muted-foreground">
              {vocabulary.length === 0 
                ? 'Start reading to build your vocabulary!'
                : 'No words match your search or filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredVocabulary.map(word => (
            <Card key={word.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-lg truncate">{word.word}</div>
                  {word.translation && (
                    <div className="text-muted-foreground text-sm truncate">
                      {word.translation}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[word.status]}>
                    {statusLabels[word.status]}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(word.id, 0)}>
                        Mark as Known
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(word.id, 1)}>
                        Mark as New
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(word.id, 2)}>
                        Learning Level 1
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(word.id, 3)}>
                        Learning Level 2
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(word.id, 4)}>
                        Learning Level 3
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(word.id, -1)}>
                        Ignore
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
