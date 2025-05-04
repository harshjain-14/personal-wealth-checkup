
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
import { Expense, ExpenseFrequency, ExpenseType } from '@/services/portfolio-service';
import { Trash2 } from 'lucide-react';

interface ExpensesFormProps {
  expenses: Expense[];
  onSave: (expenses: Expense[]) => Promise<void>;
}

const EXPENSE_TYPES: ExpenseType[] = [
  'EMI',
  'Rent',
  'School Fees',
  'Loan Payment',
  'Insurance Premium',
  'Utility Bills',
  'Medical',
  'Others'
];

const FREQUENCY_OPTIONS: { value: ExpenseFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one-time', label: 'One-time' }
];

const ExpensesForm = ({ expenses, onSave }: ExpensesFormProps) => {
  const [expensesList, setExpensesList] = useState<Expense[]>(expenses || []);
  const [newExpense, setNewExpense] = useState<Expense>({
    type: 'EMI',
    name: '',
    amount: 0,
    frequency: 'monthly',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Update expenses list when props change
  useEffect(() => {
    console.log("ExpensesForm received updated expenses:", expenses);
    setExpensesList(expenses || []);
  }, [expenses]);

  const handleAddExpense = () => {
    if (!newExpense.type || !newExpense.name || newExpense.amount <= 0) {
      toast.error('Please fill all required fields with valid values');
      return;
    }

    // Add ID for React keys
    const expenseWithId = {
      ...newExpense,
      amount: Number(newExpense.amount),
      id: newExpense.id || Date.now()
    };

    setExpensesList([...expensesList, expenseWithId]);
    setNewExpense({
      type: 'EMI',
      name: '',
      amount: 0,
      frequency: 'monthly',
      notes: ''
    });
    
    toast.success('Expense added successfully');
  };

  const handleRemoveExpense = (index: number) => {
    const newList = [...expensesList];
    newList.splice(index, 1);
    setExpensesList(newList);
    toast.success('Expense removed');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log("Saving expenses:", expensesList);
      await onSave(expensesList);
      setIsSaving(false);
      // Don't reset the list here - let the parent component update through props
    } catch (error) {
      console.error('Error saving expenses:', error);
      setIsSaving(false);
      toast.error('Failed to save expenses');
    }
  };

  return (
    <Card className="w-full bg-white shadow-sm border-finance-teal/20">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Regular Expenses</CardTitle>
        <CardDescription>
          Add your recurring expenses to improve your financial planning
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Current expenses list */}
          {expensesList.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Current Expenses</h3>
              <div className="space-y-2">
                {expensesList.map((expense, index) => (
                  <div 
                    key={expense.id || index} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{expense.name}</p>
                      <div className="flex text-xs text-gray-500 space-x-2">
                        <span>{expense.type}</span>
                        <span>•</span>
                        <span>₹{expense.amount.toLocaleString()}</span>
                        <span>•</span>
                        <span className="capitalize">{expense.frequency}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveExpense(index)}
                    >
                      <Trash2 className="h-4 w-4 text-finance-red" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new expense form */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Add New Expense</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseType">Type</Label>
                  <Select 
                    value={newExpense.type} 
                    onValueChange={(value: ExpenseType) => setNewExpense({...newExpense, type: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expenseAmount">Amount (₹)</Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    min="0"
                    value={newExpense.amount || ''}
                    onChange={(e) => setNewExpense({
                      ...newExpense, 
                      amount: e.target.value ? Number(e.target.value) : 0
                    })}
                    placeholder="10000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseName">Expense Name/Description</Label>
                  <Input
                    id="expenseName"
                    value={newExpense.name}
                    onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                    placeholder="Home Loan EMI"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expenseFrequency">Frequency</Label>
                  <Select 
                    value={newExpense.frequency} 
                    onValueChange={(value: ExpenseFrequency) => setNewExpense({...newExpense, frequency: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expenseNotes">Notes (Optional)</Label>
                <Input
                  id="expenseNotes"
                  value={newExpense.notes || ''}
                  onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
                  placeholder="20 year term, 7.5% interest rate"
                />
              </div>
              
              <Button 
                onClick={handleAddExpense}
                className="w-full bg-finance-teal/80 hover:bg-finance-teal"
              >
                Add Expense
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
          {isSaving ? 'Saving...' : 'Save All Expenses'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExpensesForm;
