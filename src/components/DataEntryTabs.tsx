import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardDescription, CardFooter, CardTitle } from '@/components/ui/card';
import ZerodhaConnector from './ZerodhaConnector';
import ExternalInvestmentsForm from './ExternalInvestmentsForm';
import ExpensesForm from './ExpensesForm';
import FutureExpensesForm from './FutureExpensesForm';
import UserInfoForm from './UserInfoForm';
import { Button } from '@/components/ui/button';
import SeedDataButton from './SeedDataButton';
import PortfolioService, { PortfolioData, ExternalInvestment, Expense, FutureExpense, UserInfo, Stock, MutualFund } from '@/services/portfolio-service';
import AnalysisService from '@/services/analysis-service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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

  // Update the local state when portfolioData changes
  useEffect(() => {
    setZerodhaConnected(portfolioData.stocks.length > 0 || portfolioData.mutualFunds.length > 0);
  }, [portfolioData]);

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
    } catch (error: any) {
      console.error('Error importing Zerodha data:', error);
      toast.error(`Failed to import Zerodha portfolio data: ${error.message || 'Unknown error'}`);
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
            {zerodhaConnected ? (
              <ZerodhaPortfolioView 
                stocks={portfolioData.stocks} 
                mutualFunds={portfolioData.mutualFunds}
                onRefresh={handleZerodhaConnect} 
              />
            ) : (
              <ZerodhaConnector onConnect={handleZerodhaConnect} />
            )}
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

// New component to display Zerodha portfolio data
interface ZerodhaPortfolioViewProps {
  stocks: Stock[];
  mutualFunds: MutualFund[];
  onRefresh: () => void;
}

const ZerodhaPortfolioView = ({ stocks, mutualFunds, onRefresh }: ZerodhaPortfolioViewProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast.success('Portfolio data refreshed successfully');
    } catch (error: any) {
      toast.error(`Failed to refresh portfolio: ${error.message || 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate portfolio metrics
  const totalStocksValue = stocks.reduce((total, stock) => total + (stock.quantity * stock.currentPrice), 0);
  const totalMFValue = mutualFunds.reduce((total, mf) => total + mf.currentValue, 0);
  const totalPortfolioValue = totalStocksValue + totalMFValue;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-finance-blue">Zerodha Portfolio</h3>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="text-finance-teal border-finance-teal/30 hover:bg-finance-teal/10"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : 'Refresh Portfolio'}
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-finance-blue/5 border-finance-blue/20">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Total Portfolio Value</div>
            <div className="text-2xl font-semibold text-finance-blue">₹{totalPortfolioValue.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className="bg-finance-teal/5 border-finance-teal/20">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Stocks</div>
            <div className="text-2xl font-semibold text-finance-teal">₹{totalStocksValue.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className="bg-finance-green/5 border-finance-green/20">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Mutual Funds</div>
            <div className="text-2xl font-semibold text-finance-green">₹{totalMFValue.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stocks Table */}
      <div>
        <h4 className="text-md font-medium mb-2">Stocks ({stocks.length})</h4>
        <div className="rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stocks.length > 0 ? (
                stocks.map((stock) => {
                  const value = stock.quantity * stock.currentPrice;
                  const costPrice = stock.quantity * stock.averagePrice;
                  const pnl = value - costPrice;
                  const pnlPercentage = ((stock.currentPrice - stock.averagePrice) / stock.averagePrice) * 100;
                  
                  return (
                    <tr key={stock.symbol}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{stock.symbol}</div>
                        <div className="text-xs text-gray-500">{stock.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stock.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{stock.averagePrice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{stock.currentPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{value.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPercentage.toFixed(2)}%)
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No stocks available in your portfolio
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mutual Funds Table */}
      <div>
        <h4 className="text-md font-medium mb-2">Mutual Funds ({mutualFunds.length})</h4>
        <div className="rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mutualFunds.length > 0 ? (
                mutualFunds.map((fund, index) => {
                  const pnl = fund.currentValue - fund.investedAmount;
                  const pnlPercentage = (pnl / fund.investedAmount) * 100;
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{fund.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fund.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{fund.investedAmount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{fund.currentValue.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN')} ({pnlPercentage.toFixed(2)}%)
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No mutual funds available in your portfolio
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Last updated: {new Date().toLocaleString()}
      </p>
    </div>
  );
};

export default DataEntryTabs;
