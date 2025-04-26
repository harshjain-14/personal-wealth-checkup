import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisReport, SectorBreakdown, AssetAllocation, PortfolioInsight } from '@/services/analysis-service';

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
    default:
      return null;
  }
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
          <p className="text-sm text-gray-500">Generated on {formatDate(report.timestamp)}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Performance Metrics Card */}
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

        {/* Sector Breakdown Chart */}
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

        {/* Asset Allocation Chart */}
        <Card className="bg-white shadow-sm border-finance-teal/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={report.assetAllocation}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <Tooltip formatter={(value) => [`${formatPercentage(value as number)}`, 'Allocation']} />
                  <Bar dataKey="percentage">
                    {report.assetAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {report.assetAllocation.map((asset, index) => (
                <Badge key={index} style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                  {asset.type}: {formatPercentage(asset.percentage)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Portfolio Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Insights */}
        <Card className="bg-white shadow-sm border-finance-teal/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Portfolio Insights</CardTitle>
            <CardDescription>
              Key observations and recommendations for your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.insights.map((insight, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="mt-0.5">
                    <InsightIcon type={insight.type} />
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      insight.type === 'strength' ? 'text-finance-green' :
                      insight.type === 'warning' ? 'text-finance-red' :
                      'text-amber-500'
                    }`}>
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Liquidity and Rebalancing */}
        <div className="space-y-6">
          <Card className="bg-white shadow-sm border-finance-teal/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Liquidity Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{report.liquidityAnalysis}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-finance-teal/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Rebalancing Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {report.rebalancingRecommendations?.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-600">{recommendation}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disclaimer */}
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
