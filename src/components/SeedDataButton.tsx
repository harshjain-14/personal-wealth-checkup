
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SeedDataButtonProps {
  onDataSeeded: () => void;
}

const SeedDataButton = ({ onDataSeeded }: SeedDataButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSeedData = async () => {
    if (!user) {
      toast.error('You must be logged in to seed data');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-data', {
        body: { userId: user.id }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success('Dummy data seeded successfully');
        onDataSeeded();
      } else {
        throw new Error(data.message || 'Failed to seed data');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed test data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSeedData}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="text-finance-blue border-finance-blue hover:bg-finance-blue/10"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Seeding Data...
        </>
      ) : (
        'Seed Test Data'
      )}
    </Button>
  );
};

export default SeedDataButton;
