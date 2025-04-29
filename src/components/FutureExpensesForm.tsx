
import { useState } from 'react';
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
import { FutureExpense } from '@/services/portfolio-service';
import { Trash2 } from 'lucide-react';

interface FutureExpensesFormProps {
  futureExpenses: FutureExpense[];
  onSave: (futureExpenses: FutureExpense[]) => void;
}

// Make sure these purpose options exactly match what's expected in the database enum
const COMMON_FUTURE_EXPENSES = [
  'House Purchase',
  'Car Purchase',
  'Education',
  'Wedding',
  'Medical Treatment',
  'Vacation',
  'Home Renovation',
  'Business Startup',
  'Other'
];

const PRIORITY_OPTIONS: { value: FutureExpense['priority']; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const TIMEFRAME_OPTIONS = [
  '3 months',
  '6 months',
  '1 year',
  '2 years',
  '3 years',
  '5 years',
  '10 years',
  'Other'
];

const FutureExpensesForm = ({ futureExpenses, onSave }: FutureExpensesFormProps) => {
  const [futureExpensesList, setFutureExpensesList] = useState<FutureExpense[]>(futureExpenses || []);
  const [newExpense, setNewExpense] = useState<FutureExpense>({
    purpose: '',
    amount: 0,
    timeframe: '',
    priority: 'medium',
    notes: ''
  });
  const [customTimeframe, setCustomTimeframe] = useState('');

  const handleAddExpense = () => {
    if (!newExpense.purpose || !newExpense.amount || newExpense.amount <= 0 || (!newExpense.timeframe && !customTimeframe)) {
      toast.error('Please fill all required fields with valid values');
      return;
    }

    const finalTimeframe = newExpense.timeframe === 'Other' ? customTimeframe : newExpense.timeframe;
    
    setFutureExpensesList([...futureExpensesList, { 
      ...newExpense, 
      timeframe: finalTimeframe,
      amount: Number(newExpense.amount) 
    }]);
    
    setNewExpense({
      purpose: '',
      amount: 0,
      timeframe: '',
      priority: 'medium',
      notes: ''
    });
    setCustomTimeframe('');
    
    toast.success('Future expense added successfully');
  };

  const handleRemoveExpense = (index: number) => {
    const newList = [...futureExpensesList];
    newList.splice(index, 1);
    setFutureExpensesList(newList);
    toast.success('Future expense removed');
  };

  const handleSave = () => {
    onSave(futureExpensesList);
    toast.success('Future expenses saved successfully');
  };

  return (
    <Card className="w-full bg-white shadow-sm border-finance-teal/20">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Upcoming Major Expenses</CardTitle>
        <CardDescription>
          Plan for your future financial needs
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Current future expenses list */}
          {futureExpensesList.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Planned Future Expenses</h3>
              <div className="space-y-2">
                {futureExpensesList.map((expense, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{expense.purpose}</p>
                      <div className="flex text-xs text-gray-500 space-x-2">
                        <span>₹{expense.amount.toLocaleString()}</span>
                        <span>•</span>
                        <span>In {expense.timeframe}</span>
                        <span>•</span>
                        <span className="capitalize">
                          {expense.priority === 'high' ? (
                            <span className="text-finance-red">{expense.priority} priority</span>
                          ) : expense.priority === 'medium' ? (
                            <span className="text-amber-500">{expense.priority} priority</span>
                          ) : (
                            <span>{expense.priority} priority</span>
                          )}
                        </span>
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

          {/* Add new future expense form */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Add New Future Expense</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expensePurpose">Purpose</Label>
                  <Select 
                    value={newExpense.purpose} 
                    onValueChange={(value) => setNewExpense({...newExpense, purpose: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_FUTURE_EXPENSES.map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
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
                    placeholder="1000000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseTimeframe">Timeframe</Label>
                  <Select 
                    value={newExpense.timeframe} 
                    onValueChange={(value) => setNewExpense({...newExpense, timeframe: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="When needed" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAME_OPTIONS.map((timeframe) => (
                        <SelectItem key={timeframe} value={timeframe}>{timeframe}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {newExpense.timeframe === 'Other' && (
                    <Input
                      value={customTimeframe}
                      onChange={(e) => setCustomTimeframe(e.target.value)}
                      placeholder="e.g., 4 years"
                      className="mt-2"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expensePriority">Priority</Label>
                  <Select 
                    value={newExpense.priority} 
                    onValueChange={(value: FutureExpense['priority']) => setNewExpense({...newExpense, priority: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
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
                  placeholder="Daughter's college education in the US"
                />
              </div>
              
              <Button 
                onClick={handleAddExpense}
                className="w-full bg-finance-teal/80 hover:bg-finance-teal"
              >
                Add Future Expense
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSave}
          className="w-full bg-finance-blue hover:bg-finance-blue/90"
        >
          Save All Future Expenses
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FutureExpensesForm;
