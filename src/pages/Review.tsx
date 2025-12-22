import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function Review() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-6">Review</h1>
      <Card className="text-center py-12">
        <CardContent>
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="font-serif text-xl font-bold mb-2">No reviews due</h2>
          <p className="text-muted-foreground">
            Add words to your vocabulary to start reviewing!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
