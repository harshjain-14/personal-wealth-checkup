
import { Shield, Eye, Lock, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TrustMessage = () => {
  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-finance-blue mb-4">
          Your Portfolio's Trusted Analysis Partner
        </h2>
        <p className="text-gray-600">
          We securely connect to your Zerodha account via OAuth. No passwords are shared, and you can revoke access anytime from your Zerodha settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white">
          <CardHeader>
            <Shield className="w-8 h-8 text-finance-teal mb-2" />
            <CardTitle className="text-lg">Secure Connection</CardTitle>
            <CardDescription>
              Industry-standard OAuth security. No passwords stored.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <Eye className="w-8 h-8 text-finance-teal mb-2" />
            <CardTitle className="text-lg">Read-Only Access</CardTitle>
            <CardDescription>
              We NEVER place any trades. Just analyze your portfolio.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <Lock className="w-8 h-8 text-finance-teal mb-2" />
            <CardTitle className="text-lg">Privacy First</CardTitle>
            <CardDescription>
              Data stored only in your session unless you opt-in.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="bg-finance-teal/5">
          <CardContent className="pt-6">
            <h3 className="font-medium text-finance-blue mb-2">Find Hidden Risks</h3>
            <p className="text-sm text-gray-600">
              Discover sector concentration and volatility risks in your portfolio.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-finance-teal/5">
          <CardContent className="pt-6">
            <h3 className="font-medium text-finance-blue mb-2">Health Check</h3>
            <p className="text-sm text-gray-600">
              Get detailed insights on diversification and asset allocation.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-finance-teal/5">
          <CardContent className="pt-6">
            <h3 className="font-medium text-finance-blue mb-2">Goal Tracking</h3>
            <p className="text-sm text-gray-600">
              Ensure your investments align with your financial goals.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrustMessage;
