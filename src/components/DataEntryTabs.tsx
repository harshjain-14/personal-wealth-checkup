
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import ZerodhaConnector from './ZerodhaConnector';
import ExternalInvestmentsForm from './ExternalInvestmentsForm';
import ExpensesForm from './ExpensesForm';
import FutureExpensesForm from './FutureExpensesForm';
import UserInfoForm from './UserInfoForm';
import { Button } from '@/components/ui/button';
import SeedDataButton from './SeedDataButton';
import PortfolioService, { PortfolioData, ExternalInvestment, Expense, FutureExpense, UserInfo } from '@/services/portfolio-service';
import AnalysisService from '@/services/analysis-service';
import { toast } from 'sonner';

interface DataEntryTabsProps {
  portfolioData: PortfolioData;
  onDataSaved: (updatedData: PortfolioData) => void;
  onAnalysisRequest: () => void;
}

const DataEntryTabs = ({ portfolioData, onDataSaved, onAnalysisRequest }: DataEntryTabsProps) => {
  const [zerodhaConnected, setZerodhaConnected] = useState(
    portfolioData.stocks.length > 0 || portfolioData.mutualFunds.length > 0
  );
  const [activeTab, setActiveTab] = useState('zerodha');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleZerodhaConnect = async () => {
    try {
      const zerodhaData = await PortfolioService.getZerodhaPortfolio();
      const updatedData = await PortfolioService.savePortfolioData({
        stocks: zerodhaData.stocks,
        mutualFunds: zerodhaData.mutualFunds
      });
      onDataSaved(updatedData);
      setZerodhaConnected(true);
      setActiveTab('external');
      toast.success('Zerodha portfolio data imported successfully');
    } catch (error) {
      console.error('Error importing Zerodha data:', error);
      toast.error('Failed to import Zerodha portfolio data');
    }
  };

  const handleSaveExternalInvestments = async (investments: ExternalInvestment[]) => {
    try {
      await PortfolioService.saveExternalInvestments(investments);
      const updatedData = await PortfolioService.getPortfolioData();
      onDataSaved(updatedData);
    } catch (error) {
      console.error('Error saving external investments:', error);
      toast.error('Failed to save external investments');
    }
  };

  const handleSaveExpenses = async (expenses: Expense[]) => {
    try {
      await PortfolioService.saveExpenses(expenses);
      const updatedData = await PortfolioService.getPortfolioData();
      onDataSaved(updatedData);
    } catch (error) {
      console.error('Error saving expenses:', error);
      toast.error('Failed to save expenses');
    }
  };

  const handleSaveFutureExpenses = async (futureExpenses: FutureExpense[]) => {
    try {
      await PortfolioService.saveFutureExpenses(futureExpenses);
      const updatedData = await PortfolioService.getPortfolioData();
      onDataSaved(updatedData);
    } catch (error) {
      console.error('Error saving future expenses:', error);
      toast.error('Failed to save future expenses');
    }
  };

  const handleSaveUserInfo = async (userInfo: UserInfo) => {
    try {
      await PortfolioService.saveUserInfo(userInfo);
      const updatedData = await PortfolioService.getPortfolioData();
      onDataSaved(updatedData);
    } catch (error) {
      console.error('Error saving user info:', error);
      toast.error('Failed to save user information');
    }
  };

  const handleAnalyzePortfolio = async () => {
    setIsAnalyzing(true);
    
    try {
      // This will trigger the analysis in the parent component
      onAnalysisRequest();
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      toast.error('Failed to analyze portfolio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDataSeeded = async () => {
    // Refresh all data
    const updatedData = await PortfolioService.getPortfolioData();
    onDataSaved(updatedData);
    // Update Zerodha connection status
    setZerodhaConnected(updatedData.stocks.length > 0 || updatedData.mutualFunds.length > 0);
  };

  return (
    <Card className="w-full bg-white shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center px-6 pt-4">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="zerodha">
              Zerodha Data
              {zerodhaConnected && <span className="ml-2 w-2 h-2 bg-finance-green rounded-full"></span>}
            </TabsTrigger>
            <TabsTrigger value="external">
              External Investments
              {portfolioData.externalInvestments.length > 0 && <span className="ml-2 w-2 h-2 bg-finance-green rounded-full"></span>}
            </TabsTrigger>
            <TabsTrigger value="expenses">
              Expenses
              {portfolioData.expenses.length > 0 && <span className="ml-2 w-2 h-2 bg-finance-green rounded-full"></span>}
            </TabsTrigger>
            <TabsTrigger value="future">
              Future Expenses
              {portfolioData.futureExpenses.length > 0 && <span className="ml-2 w-2 h-2 bg-finance-green rounded-full"></span>}
            </TabsTrigger>
            <TabsTrigger value="personal">
              Personal Info
              {portfolioData.userInfo?.age && <span className="ml-2 w-2 h-2 bg-finance-green rounded-full"></span>}
            </TabsTrigger>
          </TabsList>
          
          <SeedDataButton onDataSeeded={handleDataSeeded} />
        </div>
        
        <div className="p-6">
          <TabsContent value="zerodha" className="mt-0">
            <ZerodhaConnector onConnect={handleZerodhaConnect} />
          </TabsContent>
          
          <TabsContent value="external" className="mt-0">
            <ExternalInvestmentsForm 
              investments={portfolioData.externalInvestments} 
              onSave={handleSaveExternalInvestments} 
            />
          </TabsContent>
          
          <TabsContent value="expenses" className="mt-0">
            <ExpensesForm 
              expenses={portfolioData.expenses} 
              onSave={handleSaveExpenses} 
            />
          </TabsContent>
          
          <TabsContent value="future" className="mt-0">
            <FutureExpensesForm 
              futureExpenses={portfolioData.futureExpenses} 
              onSave={handleSaveFutureExpenses} 
            />
          </TabsContent>
          
          <TabsContent value="personal" className="mt-0">
            <UserInfoForm 
              userInfo={portfolioData.userInfo} 
              onSave={handleSaveUserInfo} 
            />
          </TabsContent>
        </div>
        
        <div className="p-6 pt-0 flex justify-end">
          <Button 
            onClick={handleAnalyzePortfolio}
            className="bg-finance-blue hover:bg-finance-blue/90"
            disabled={!zerodhaConnected || isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing Portfolio...' : 'Generate Portfolio Analysis'}
          </Button>
        </div>
      </Tabs>
    </Card>
  );
};

export default DataEntryTabs;
