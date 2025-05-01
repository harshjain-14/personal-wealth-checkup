
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import TrustMessage from './TrustMessage';
import PortfolioService from '@/services/portfolio-service';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ZerodhaConnectorProps {
  onConnect: () => void;
}

const ZerodhaConnector = ({ onConnect }: ZerodhaConnectorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  // Handler for message from popup
  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (event.origin !== window.location.origin) {
      console.log(`Ignoring message from unexpected origin: ${event.origin}, expected: ${window.location.origin}`);
      return;
    }
    
    if (event.data.requestToken) {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Received request token from popup:", event.data.requestToken);
        // Exchange request token for access token
        const success = await PortfolioService.exchangeZerodhaToken(event.data.requestToken);
        
        console.log("Token exchange result:", success);
        
        if (success) {
          toast.success('Connected to Zerodha successfully');
          onConnect();
        } else {
          const errorMessage = 'Failed to connect to Zerodha. Please try again.';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (error: any) {
        console.error('Zerodha token exchange error:', error);
        const errorMessage = error.message || 'Failed to connect to Zerodha';
        setError(errorMessage);
        toast.error(errorMessage);
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

  const handleConnectZerodha = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the Zerodha login URL from Supabase function
      const url = await PortfolioService.getZerodhaLoginUrl();
      
      if (!url) {
        const errorMessage = 'Failed to generate Zerodha login URL. Please check Supabase function logs.';
        console.error(errorMessage);
        setError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }
      
      console.log("Opening Zerodha login with URL:", url);
      
      // Open Zerodha login popup
      const width = 800;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        'Zerodha Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Check if popup was blocked
      if (!popup || popup.closed) {
        const errorMessage = 'Popup was blocked. Please allow popups for this site.';
        setError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
      } else {
        // Set up a check to handle case when user closes popup without completing flow
        const checkPopupClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopupClosed);
            // Only show message if we're still in loading state (no token received)
            if (isLoading) {
              setIsLoading(false);
              setError('Login window was closed. Please try again.');
            }
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Zerodha connection error:', error);
      const errorMessage = error.message || 'Failed to connect to Zerodha';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setReconnectAttempts(prev => prev + 1);
    setError(null);
    handleConnectZerodha();
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
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              {reconnectAttempts < 3 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={handleRetry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Connection
                </Button>
              )}
            </Alert>
          )}
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
