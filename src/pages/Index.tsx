
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import Header from '@/components/Header';
import DataEntryTabs from '@/components/DataEntryTabs';
import PortfolioAnalysisResult from '@/components/PortfolioAnalysisResult';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PortfolioService, { PortfolioData } from '@/services/portfolio-service';
import AnalysisService, { AnalysisReport } from '@/services/analysis-service';

const Index = () => {
  const { toast } = useToast();
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    stocks: [],
    mutualFunds: [],
    externalInvestments: [],
    expenses: [],
    futureExpenses: [],
    lastUpdated: new Date().toISOString()
  });
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dataView, setDataView] = useState<'input' | 'results'>('input');

  // Load portfolio data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadPortfolioData();
    }
  }, [isAuthenticated]);
  
  // Load portfolio data
  const loadPortfolioData = async () => {
    try {
      const data = await PortfolioService.getPortfolioData();
      setPortfolioData(data);
    } catch (error) {
      console.error("Error loading portfolio data:", error);
      toast({
        title: "Data Loading Failed",
        description: "Could not load your portfolio data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    signOut();
    setAnalysisReport(null);
    navigate('/auth');
  };
  
  // Handle data refresh
  const handleRefresh = async () => {
    if (analysisReport) {
      await generateAnalysis();
    } else {
      await loadPortfolioData();
    }
  };
  
  // Handle data save
  const handleDataSaved = (updatedData: PortfolioData) => {
    setPortfolioData(updatedData);
  };
  
  // Generate portfolio analysis
  const generateAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const report = await AnalysisService.generateAnalysis(portfolioData);
      setAnalysisReport(report);
      setDataView('results');
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to generate portfolio analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Return to data input view
  const handleReturnToInput = () => {
    setDataView('input');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={handleLogout} onRefresh={handleRefresh} />
      
      <main className="container mx-auto py-6 px-4">
        {dataView === 'input' ? (
          <>
            <h1 className="text-2xl font-bold text-finance-blue mb-6">Personal Portfolio Analyzer</h1>
            <DataEntryTabs 
              portfolioData={portfolioData} 
              onDataSaved={handleDataSaved} 
              onAnalysisRequest={generateAnalysis}
            />
          </>
        ) : (
          <>
            {analysisReport && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-finance-blue">Portfolio Analysis Results</h1>
                  <button 
                    onClick={handleReturnToInput} 
                    className="text-finance-teal hover:text-finance-blue underline text-sm"
                  >
                    Return to Data Entry
                  </button>
                </div>
                <PortfolioAnalysisResult 
                  report={analysisReport} 
                  onRefresh={generateAnalysis}
                  isLoading={isAnalyzing}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
