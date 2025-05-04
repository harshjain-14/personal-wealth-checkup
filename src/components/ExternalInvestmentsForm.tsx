
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ExternalInvestment, InvestmentType } from '@/services/portfolio-service';
import { Trash2 } from 'lucide-react';

interface ExternalInvestmentsFormProps {
  investments: ExternalInvestment[];
  onSave: (investments: ExternalInvestment[]) => Promise<void>;
}

const INVESTMENT_TYPES: InvestmentType[] = [
  'Gold',
  'Fixed Deposit',
  'Real Estate',
  'Bank Deposit',
  'PPF',
  'EPF',
  'National Pension Scheme',
  'Bonds',
  'Others'
];

const ExternalInvestmentsForm = ({ investments, onSave }: ExternalInvestmentsFormProps) => {
  const [investmentsList, setInvestmentsList] = useState<ExternalInvestment[]>(investments || []);
  const [newInvestment, setNewInvestment] = useState<ExternalInvestment>({
    type: 'Fixed Deposit',
    name: '',
    amount: 0,
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Update the investments list when props change
  useEffect(() => {
    if (investments && investments.length > 0) {
      console.log("ExternalInvestmentsForm received updated investments:", investments);
      setInvestmentsList(investments);
    }
  }, [investments]);

  const handleAddInvestment = () => {
    if (!newInvestment.type || !newInvestment.name || newInvestment.amount <= 0) {
      toast.error('Please fill all required fields with valid values');
      return;
    }

    // Add ID to ensure React keys are unique if not coming from DB
    const investmentWithId = { 
      ...newInvestment, 
      amount: Number(newInvestment.amount),
      id: newInvestment.id || Date.now() 
    };
    
    // Update local state with the new investment
    const updatedList = [...investmentsList, investmentWithId];
    setInvestmentsList(updatedList);
    
    setNewInvestment({
      type: 'Fixed Deposit',
      name: '',
      amount: 0,
      notes: ''
    });
    
    toast.success('Investment added successfully');
  };

  const handleRemoveInvestment = (index: number) => {
    const newList = [...investmentsList];
    newList.splice(index, 1);
    setInvestmentsList(newList);
    toast.success('Investment removed');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log("Saving investments:", investmentsList);
      // Make a deep copy to avoid reference issues
      const investmentsToSave = JSON.parse(JSON.stringify(investmentsList));
      await onSave(investmentsToSave);
      setIsSaving(false);
      toast.success('Investments saved successfully to database');
    } catch (error) {
      console.error('Error saving investments:', error);
      setIsSaving(false);
      toast.error('Failed to save investments to database');
    }
  };

  return (
    <Card className="w-full bg-white shadow-sm border-finance-teal/20">
      <CardHeader>
        <CardTitle className="text-lg font-medium">External Investments</CardTitle>
        <CardDescription>
          Add your investments outside Zerodha to get a complete picture
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Current investments list */}
          {investmentsList.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Current Investments</h3>
              <div className="space-y-2">
                {investmentsList.map((investment, index) => (
                  <div 
                    key={investment.id || index} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{investment.name}</p>
                      <div className="flex text-xs text-gray-500 space-x-2">
                        <span>{investment.type}</span>
                        <span>•</span>
                        <span>₹{investment.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveInvestment(index)}
                    >
                      <Trash2 className="h-4 w-4 text-finance-red" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new investment form */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Add New Investment</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investmentType">Type</Label>
                  <Select 
                    value={newInvestment.type} 
                    onValueChange={(value: InvestmentType) => setNewInvestment({...newInvestment, type: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="investmentAmount">Amount (₹)</Label>
                  <Input
                    id="investmentAmount"
                    type="number"
                    min="0"
                    value={newInvestment.amount || ''}
                    onChange={(e) => setNewInvestment({
                      ...newInvestment, 
                      amount: e.target.value ? Number(e.target.value) : 0
                    })}
                    placeholder="50000"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="investmentName">Investment Name/Description</Label>
                <Input
                  id="investmentName"
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({...newInvestment, name: e.target.value})}
                  placeholder="SBI Fixed Deposit"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="investmentNotes">Notes (Optional)</Label>
                <Input
                  id="investmentNotes"
                  value={newInvestment.notes || ''}
                  onChange={(e) => setNewInvestment({...newInvestment, notes: e.target.value})}
                  placeholder="5.5% interest rate, maturing in 2025"
                />
              </div>
              
              <Button 
                onClick={handleAddInvestment}
                className="w-full bg-finance-teal/80 hover:bg-finance-teal"
              >
                Add Investment
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSave}
          className="w-full bg-finance-blue hover:bg-finance-blue/90"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save All Investments'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExternalInvestmentsForm;
