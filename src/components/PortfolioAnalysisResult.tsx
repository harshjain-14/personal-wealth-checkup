
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Lightbulb,
  RefreshCw,
  ChartBar,
  ChartPie,
  Shield,
  IndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AnalysisReport, 
  PortfolioInsight,
  AssetAllocationItem
} from '@/services/analysis-service';

interface PortfolioAnalysisResultProps {
  report: AnalysisReport;
  onRefresh: () => void;
  isLoading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB', '#A569BD', '#5DADE2', '#F1948A'];

const InsightIcon = ({ type }: { type: PortfolioInsight['type'] }) => {
  switch (type) {
    case 'strength':
      return <TrendingUp className="h-5 w-5 text-finance-green" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-finance-red" />;
    case 'suggestion':
      return <Lightbulb className="h-5 w-5 text-amber-500" />;
    case 'tax':
      return <IndianRupee className="h-5 w-5 text-emerald-500" />;
    case 'goal':
      return <ChartBar className="h-5 w-5 text-blue-500" />;
    case 'volatility':
      return <ChartPie className="h-5 w-5 text-purple-500" />;
    default:
      return <Shield className="h-5 w-5 text-gray-500" />;
  }
};

const InsightPriorityBadge = ({ priority }: { priority?: PortfolioInsight['priority'] }) => {
  if (!priority) return null;
  
  const colors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colors[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
    </span>
  );
};

const PortfolioAnalysisResult = ({ report, onRefresh, isLoading }: PortfolioAnalysisResultProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const formatCurrency = (value: number) => {
    return '₹' + value.toLocaleString('en-IN');
  };

  const formatPercentage = (value: number) => {
    return value.toFixed(1) + '%';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-finance-blue">Portfolio Analysis</h2>
          <p className="text-sm text-gray-500">Generated on {formatDate(report.generatedAt)}</p>
        </div>
        <Button 
          onClick={onRefresh}
          variant="outline"
          disabled={isLoading}
          className="border-finance-teal text-finance-teal hover:bg-finance-teal/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {report.performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-sm border-finance-teal/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Portfolio Value</span>
                  <span className="text-lg font-semibold">{formatCurrency(report.performanceMetrics.totalValue)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Profit/Loss</span>
                  <span className={`font-semibold ${report.performanceMetrics.profitLoss >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                    {report.performanceMetrics.profitLoss >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(report.performanceMetrics.profitLoss))}
                    <span className="text-xs ml-1">
                      ({report.performanceMetrics.profitLossPercentage >= 0 ? '+' : ''}
                      {formatPercentage(report.performanceMetrics.profitLossPercentage)})
                    </span>
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">CAGR (Est.)</span>
                  <span className="font-medium">{formatPercentage(report.performanceMetrics.cagr || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">IRR (Est.)</span>
                  <span className="font-medium">{formatPercentage(report.performanceMetrics.irr || 0)}</span>
                </div>
                
                {report.performanceMetrics.sharpeRatio && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Sharpe Ratio</span>
                    <span className="font-medium">{report.performanceMetrics.sharpeRatio.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {report.sectorBreakdown && (
            <Card className="bg-white shadow-sm border-finance-teal/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Sector Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.sectorBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalValue"
                        nameKey="sector"
                      >
                        {report.sectorBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white shadow-sm border-finance-teal/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {report.assetAllocation && report.assetAllocation.currentAllocation && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(report.assetAllocation.currentAllocation).map(([type, percentage]) => ({
                        type,
                        percentage
                      }))}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <Tooltip formatter={(value) => [`${formatPercentage(value as number)}`, 'Allocation']} />
                      <Bar dataKey="percentage">
                        {Object.keys(report.assetAllocation.currentAllocation).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {report.assetAllocation && report.assetAllocation.currentAllocation && 
                  Object.entries(report.assetAllocation.currentAllocation).map(([type, percentage], index) => (
                    <Badge key={index} style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                      {type}: {formatPercentage(percentage)}
                    </Badge>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {report.insights && (
          <Card className="bg-white shadow-sm border-finance-teal/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Smart Portfolio Insights</CardTitle>
              <CardDescription>
                Personalized observations and actionable recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {report.insights.map((insight, index) => (
                  <div key={index} className="flex space-x-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="mt-1">
                      <InsightIcon type={insight.type} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        {insight.priority && <InsightPriorityBadge priority={insight.priority} />}
                      </div>
                      <p className="text-gray-600">{insight.description}</p>
                      {insight.actionable && (
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-finance-teal hover:bg-finance-teal/10"
                          >
                            See Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {report.riskMetrics && (
            <Card className="bg-white shadow-sm border-finance-teal/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">Risk Analysis</CardTitle>
                  <TrendingDown className={`h-5 w-5 ${
                    report.riskMetrics.volatility.portfolioBeta > 1 
                      ? 'text-finance-red' 
                      : 'text-finance-green'
                  }`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Portfolio Beta</h4>
                    <div className="text-xl font-semibold">
                      {report.riskMetrics.volatility.portfolioBeta.toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {report.riskMetrics.volatility.marketComparison}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Quality Score</h4>
                    <div className="text-xl font-semibold">
                      {report.riskMetrics.qualityScore.overall.toFixed(1)}/100
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {report.taxInsights && (
            <Card className="bg-white shadow-sm border-finance-teal/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">Tax Insights</CardTitle>
                  <IndianRupee className="h-5 w-5 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Potential Tax Savings</h4>
                    <div className="text-xl font-semibold text-emerald-600">
                      ₹{Math.floor(report.taxInsights.potentialSavings/1000)}K
                    </div>
                  </div>
                  <ul className="list-disc pl-5 space-y-2">
                    {report.taxInsights.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
        <p className="text-sm text-amber-800 font-medium mb-1">Disclaimer:</p>
        <p className="text-xs text-amber-700">
          This analysis is for informational purposes only and does not constitute investment advice. Past performance is not indicative of future results. Consider consulting with a qualified financial advisor before making investment decisions.
        </p>
      </div>
    </div>
  );
};

export default PortfolioAnalysisResult;
