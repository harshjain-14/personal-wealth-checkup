
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import TrustMessage from './TrustMessage';
import PortfolioService from '@/services/portfolio-service';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ZerodhaConnectorProps {
  onConnect: () => void;
}

const ZerodhaConnector = ({ onConnect }: ZerodhaConnectorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Handler for message from popup
  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (event.origin !== window.origin) return;
    
    if (event.data.requestToken) {
      setIsLoading(true);
      try {
        // Exchange request token for access token
        const success = await PortfolioService.exchangeZerodhaToken(event.data.requestToken);
        if (success) {
          toast.success('Connected to Zerodha successfully');
          onConnect();
        } else {
          toast.error('Failed to connect to Zerodha');
        }
      } catch (error) {
        console.error('Zerodha token exchange error:', error);
        toast.error('Failed to connect to Zerodha');
      } finally {
        setIsLoading(false);
      }
    }
  }, [onConnect]);

  // Set up event listener for popup message
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const handleConnectZerodha = () => {
    setIsLoading(true);
    
    try {
      // Open Zerodha login popup
      const width = 800;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      // We'll use the login URL from Supabase function to avoid exposing API key in frontend
      PortfolioService.getZerodhaLoginUrl().then(url => {
        if (!url) {
          toast.error('Failed to generate Zerodha login URL');
          setIsLoading(false);
          return;
        }
        
        const popup = window.open(
          url,
          'Zerodha Login',
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        // Check if popup was blocked
        if (!popup || popup.closed) {
          toast.error('Popup was blocked. Please allow popups for this site.');
          setIsLoading(false);
        }
      }).catch(error => {
        console.error('Error getting Zerodha login URL:', error);
        toast.error('Failed to connect to Zerodha');
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Zerodha connection error:', error);
      toast.error('Failed to connect to Zerodha');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <TrustMessage />
      
      <Card className="w-full bg-white shadow-sm border-finance-teal/20">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Connect Zerodha Account</CardTitle>
          <CardDescription>
            Better investing starts with better awareness. Connect your account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-center text-gray-500 mb-6">
            Connect your Zerodha account to import your portfolio holdings and analyze your investments securely.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleConnectZerodha}
            className="w-full bg-finance-teal hover:bg-finance-teal/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Login with Zerodha'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ZerodhaConnector;
