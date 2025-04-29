
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
import { UserInfo } from '@/services/portfolio-service';

interface UserInfoFormProps {
  userInfo?: UserInfo;
  onSave: (userInfo: UserInfo) => void;
}

// Indian major cities
const MAJOR_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Other'
];

const RISK_TOLERANCE_OPTIONS: { value: UserInfo['riskTolerance']; label: string }[] = [
  { value: 'low', label: 'Low - Safety First' },
  { value: 'medium', label: 'Medium - Balanced Approach' },
  { value: 'high', label: 'High - Growth Focused' }
];

const FINANCIAL_GOALS = [
  'Retirement',
  'Children\'s Education',
  'Home Purchase',
  'Wealth Creation',
  'Tax Efficiency',
  'Debt Free',
  'Financial Independence',
  'Business Expansion',
  'Travel'
];

const UserInfoForm = ({ userInfo, onSave }: UserInfoFormProps) => {
  const [formData, setFormData] = useState<UserInfo>({
    age: userInfo?.age || 0,
    city: userInfo?.city || '',
    riskTolerance: userInfo?.riskTolerance || 'medium',
    financialGoals: userInfo?.financialGoals || []
  });
  const [otherCity, setOtherCity] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(formData.financialGoals || []);
  
  useEffect(() => {
    if (userInfo) {
      setFormData(userInfo);
      setSelectedGoals(userInfo.financialGoals || []);
    }
  }, [userInfo]);

  const handleGoalToggle = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleSubmit = () => {
    if (!formData.age || formData.age <= 0 || formData.age > 100) {
      toast.error('Please enter a valid age');
      return;
    }

    if (!formData.city) {
      toast.error('Please select your city');
      return;
    }

    const finalCity = formData.city === 'Other' ? otherCity : formData.city;
    
    console.log("DEBUG - Submitting user info with financial goals:", selectedGoals);
    
    onSave({
      ...formData,
      city: finalCity,
      financialGoals: selectedGoals
    });
  };

  return (
    <Card className="w-full bg-white shadow-sm border-finance-teal/20">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Personal Information</CardTitle>
        <CardDescription>
          Provide your basic details for personalized financial analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min="18"
                max="100"
                value={formData.age || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  age: e.target.value ? parseInt(e.target.value) : 0
                })}
                placeholder="30"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Select 
                value={formData.city} 
                onValueChange={(value) => setFormData({...formData, city: value})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {MAJOR_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {formData.city === 'Other' && (
                <Input
                  value={otherCity}
                  onChange={(e) => setOtherCity(e.target.value)}
                  placeholder="Enter your city"
                  className="mt-2"
                />
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="riskTolerance">Investment Risk Tolerance</Label>
            <Select 
              value={formData.riskTolerance} 
              onValueChange={(value: UserInfo['riskTolerance']) => 
                setFormData({...formData, riskTolerance: value})
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select risk tolerance" />
              </SelectTrigger>
              <SelectContent>
                {RISK_TOLERANCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label>Financial Goals (Select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {FINANCIAL_GOALS.map((goal) => (
                <Button
                  key={goal}
                  type="button"
                  variant={selectedGoals.includes(goal) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleGoalToggle(goal)}
                  className={selectedGoals.includes(goal) 
                    ? "bg-finance-teal hover:bg-finance-teal/90" 
                    : "text-finance-blue hover:bg-finance-teal/10"
                  }
                >
                  {goal}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSubmit}
          className="w-full bg-finance-blue hover:bg-finance-blue/90"
        >
          Save Personal Information
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserInfoForm;
