
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import AuthService from '@/services/auth-service';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await AuthService.login(email, password);
      onLoginSuccess();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-finance-blue">
          Portfolio Analyzer
        </CardTitle>
        <CardDescription className="text-center">
          Login to access your financial dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="border-finance-blue/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="border-finance-blue/20"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading} 
          className="w-full bg-finance-teal hover:bg-finance-teal/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
