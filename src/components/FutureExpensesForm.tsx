
// The FutureExpensesForm component is very long, so I'll focus on the most critical parts to fix

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
import { FutureExpense, FuturePurpose, TimeFrame, PriorityLevel } from '@/services/portfolio-service';
import { Trash2 } from 'lucide-react';

interface FutureExpensesFormProps {
  futureExpenses: FutureExpense[];
  onSave: (futureExpenses: FutureExpense[]) => Promise<void>;
}

// UI display values - these are what users see and select
type PurposeDisplayType = 'House Purchase' | 'Car Purchase' | 'Education' | 'Wedding' | 'Medical Treatment' | 'Vacation' | 'Home Renovation' | 'Business Startup' | 'Other';
const COMMON_FUTURE_EXPENSES: PurposeDisplayType[] = [
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

const purposeToDbMap: Record<PurposeDisplayType, FuturePurpose> = {
  'House Purchase': 'home',
  'Car Purchase': 'vehicle',
  'Education': 'education',
  'Wedding': 'wedding',
  'Medical Treatment': 'healthcare',
  'Vacation': 'vacation',
  'Home Renovation': 'home',
  'Business Startup': 'others',
  'Other': 'others'
};

const dbToPurposeMap: Record<string, PurposeDisplayType> = {
  'home': 'House Purchase',
  'vehicle': 'Car Purchase',
  'education': 'Education',
  'wedding': 'Wedding',
  'healthcare': 'Medical Treatment',
  'vacation': 'Vacation',
  'others': 'Other'
};

// UI for timeframe
type TimeFrameDisplayType = '3 months' | '6 months' | '1 year' | '2 years' | '5 years' | '10 years' | 'Other';
const TIMEFRAME_OPTIONS: TimeFrameDisplayType[] = [
  '3 months',
  '6 months',
  '1 year',
  '2 years',
  '5 years',
  '10 years',
  'Other'
];

const timeframeToDbMap: Record<TimeFrameDisplayType, TimeFrame> = {
  '3 months': 'short_term',
  '6 months': 'short_term',
  '1 year': 'short_term',
  '2 years': 'medium_term',
  '5 years': 'medium_term',
  '10 years': 'long_term',
  'Other': 'medium_term'
};

const PRIORITY_OPTIONS: { value: PriorityLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

interface UiFormExpense {
  purpose: PurposeDisplayType;
  amount: number;
  timeframe: TimeFrameDisplayType;
  priority: PriorityLevel;
  notes?: string;
  id?: number;
}

const mapDbToUiExpense = (expense: FutureExpense): UiFormExpense => {
  const purposeDisplay = dbToPurposeMap[expense.purpose] || 'Other';
  // For timeframe, we'll use a general mapping based on the term
  let timeframeDisplay: TimeFrameDisplayType = 'Other';
  if (expense.timeframe === 'short_term') timeframeDisplay = '1 year';
  else if (expense.timeframe === 'medium_term') timeframeDisplay = '5 years';
  else if (expense.timeframe === 'long_term') timeframeDisplay = '10 years';
  
  return {
    purpose: purposeDisplay,
    amount: expense.amount,
    timeframe: timeframeDisplay,
    priority: expense.priority,
    notes: expense.notes,
    id: expense.id
  };
};

const mapUiToDbExpense = (uiExpense: UiFormExpense, customTimeframe?: string): FutureExpense => {
  return {
    purpose: purposeToDbMap[uiExpense.purpose],
    amount: uiExpense.amount,
    timeframe: uiExpense.timeframe === 'Other' && customTimeframe 
      ? 'medium_term' // Default for custom timeframe
      : timeframeToDbMap[uiExpense.timeframe],
    priority: uiExpense.priority,
    notes: uiExpense.notes,
    id: uiExpense.id
  };
};

const FutureExpensesForm = ({ futureExpenses, onSave }: FutureExpensesFormProps) => {
  const [futureExpensesList, setFutureExpensesList] = useState<FutureExpense[]>(futureExpenses || []);
  const [newExpense, setNewExpense] = useState<UiFormExpense>({
    purpose: 'House Purchase',
    amount: 0,
    timeframe: '5 years',
    priority: 'medium',
    notes: ''
  });
  const [customTimeframe, setCustomTimeframe] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update the list when props change to ensure data consistency
  useEffect(() => {
    console.log("FutureExpensesForm received updated expenses:", futureExpenses);
    setFutureExpensesList(futureExpenses || []);
  }, [futureExpenses]);

  const handleAddExpense = () => {
    if (!newExpense.purpose || !newExpense.amount || newExpense.amount <= 0 || !newExpense.timeframe) {
      toast.error('Please fill all required fields with valid values');
      return;
    }

    const dbExpense = mapUiToDbExpense(newExpense, customTimeframe);
    
    // Add ID for React keys
    const expenseWithId = {
      ...dbExpense, 
      id: dbExpense.id || Date.now()
    };
    
    console.log("Adding future expense:", expenseWithId);
    
    setFutureExpensesList([...futureExpensesList, expenseWithId]);
    
    setNewExpense({
      purpose: 'House Purchase',
      amount: 0,
      timeframe: '5 years',
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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log("Saving future expenses:", futureExpensesList);
      await onSave(futureExpensesList);
      setIsSaving(false);
      // Don't reset the list here - let the parent component update through props
    } catch (error) {
      console.error('Error saving future expenses:', error);
      setIsSaving(false);
      toast.error('Failed to save future expenses');
    }
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
                {futureExpensesList.map((expense, index) => {
                  const uiExpense = mapDbToUiExpense(expense);
                  return (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div>
                        <p className="font-medium">{uiExpense.purpose}</p>
                        <div className="flex text-xs text-gray-500 space-x-2">
                          <span>₹{expense.amount.toLocaleString()}</span>
                          <span>•</span>
                          <span>In {uiExpense.timeframe}</span>
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
                  );
                })}
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
                    onValueChange={(value: PurposeDisplayType) => setNewExpense({...newExpense, purpose: value})}
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
                    onValueChange={(value: TimeFrameDisplayType) => setNewExpense({...newExpense, timeframe: value})}
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
                    onValueChange={(value: PriorityLevel) => setNewExpense({...newExpense, priority: value})}
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
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save All Future Expenses'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FutureExpensesForm;
