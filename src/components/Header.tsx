
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onLogout: () => void;
  onRefresh: () => void;
}

const Header = ({ onLogout, onRefresh }: HeaderProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, signOut } = useAuth();
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };
  
  const handleLogout = async () => {
    await signOut();
    onLogout();
  };
  
  return (
    <header className="w-full py-4 px-6 bg-white border-b border-gray-200 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-finance-blue">Portfolio Analyzer</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={isRefreshing}
          className="text-finance-teal border-finance-teal hover:bg-finance-teal/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 rounded-full p-0 bg-finance-lightblue text-finance-blue hover:bg-finance-lightblue/90"
            >
              <User className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <span className="font-normal text-sm text-gray-500">Signed in as</span>
              <p className="font-medium">{user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-finance-red cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
