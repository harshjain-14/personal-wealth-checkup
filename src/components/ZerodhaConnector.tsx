
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PortfolioService from '@/services/portfolio-service';
import { Loader2 } from 'lucide-react';

interface ZerodhaConnectorProps {
  onConnect: () => void;
}

const ZerodhaConnector = ({ onConnect }: ZerodhaConnectorProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      const success = await PortfolioService.connectToZerodha(username, password);
      if (success) {
        onConnect();
      }
    } catch (error) {
      console.error('Zerodha connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-white shadow-sm border-finance-teal/20">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Connect Zerodha Account</CardTitle>
        <CardDescription>
          Connect your Zerodha account to import your portfolio data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Zerodha User ID</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ZR12345"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleConnect}
          className="w-full bg-finance-teal hover:bg-finance-teal/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Zerodha'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ZerodhaConnector;
