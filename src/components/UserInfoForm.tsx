
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
import { UserInfo, CityType, RiskTolerance } from '@/services/portfolio-service';

interface UserInfoFormProps {
  userInfo?: UserInfo;
  onSave: (userInfo: UserInfo) => Promise<void>;
}

// City mapping for UI display
type CityDisplayType = 'Mumbai' | 'Delhi' | 'Bangalore' | 'Hyderabad' | 'Chennai' | 'Kolkata' | 'Pune' | 'Ahmedabad' | 'Jaipur' | 'Lucknow' | 'Other';
const MAJOR_CITIES: CityDisplayType[] = [
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

// Map frontend display values to database enum values
const cityToDbMap: Record<CityDisplayType, CityType> = {
  'Mumbai': 'metro',
  'Delhi': 'metro',
  'Bangalore': 'metro',
  'Hyderabad': 'tier1',
  'Chennai': 'tier1',
  'Kolkata': 'tier1',
  'Pune': 'tier1',
  'Ahmedabad': 'tier2',
  'Jaipur': 'tier2',
  'Lucknow': 'tier3',
  'Other': 'overseas'
};

const dbToCityMap: Record<CityType, CityDisplayType> = {
  'metro': 'Mumbai',
  'tier1': 'Chennai',
  'tier2': 'Ahmedabad',
  'tier3': 'Lucknow',
  'overseas': 'Other'
};

// Risk tolerance mapping
type RiskDisplayType = 'low' | 'medium' | 'high';
const riskToDbMap: Record<RiskDisplayType, RiskTolerance> = {
  'low': 'conservative',
  'medium': 'moderate',
  'high': 'aggressive'
};

const dbToRiskMap: Record<RiskTolerance, RiskDisplayType> = {
  'conservative': 'low',
  'moderate': 'medium',
  'aggressive': 'high'
};

const RISK_TOLERANCE_OPTIONS: { value: RiskDisplayType; label: string }[] = [
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
  const [formData, setFormData] = useState<{
    age: number;
    city: CityDisplayType;
    riskTolerance: RiskDisplayType;
    financialGoals: string[];
    id?: string;
  }>({
    age: userInfo?.age || 30,
    city: userInfo?.city ? dbToCityMap[userInfo.city] : 'Mumbai',
    riskTolerance: userInfo?.riskTolerance ? dbToRiskMap[userInfo.riskTolerance] : 'medium',
    financialGoals: userInfo?.financialGoals || [],
    id: userInfo?.id
  });
  const [otherCity, setOtherCity] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(userInfo?.financialGoals || []);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Update form data when userInfo changes
  useEffect(() => {
    if (userInfo) {
      console.log("UserInfoForm received updated user info:", userInfo);
      setFormData({
        age: userInfo.age || 30,
        city: userInfo.city ? dbToCityMap[userInfo.city] : 'Mumbai',
        riskTolerance: userInfo.riskTolerance ? dbToRiskMap[userInfo.riskTolerance] : 'medium',
        financialGoals: userInfo.financialGoals || [],
        id: userInfo.id
      });
      setSelectedGoals(userInfo.financialGoals || []);
      setHasError(false);
    }
  }, [userInfo]);

  const handleGoalToggle = (goal: string) => {
    const updatedGoals = selectedGoals.includes(goal)
      ? selectedGoals.filter(g => g !== goal)
      : [...selectedGoals, goal];
    
    setSelectedGoals(updatedGoals);
    setFormData(prev => ({ ...prev, financialGoals: updatedGoals }));
  };

  const handleSubmit = async () => {
    if (!formData.age || formData.age <= 0 || formData.age > 100) {
      toast.error('Please enter a valid age');
      setHasError(true);
      return;
    }

    if (!formData.city) {
      toast.error('Please select your city');
      setHasError(true);
      return;
    }

    setIsSaving(true);
    setHasError(false);
    
    const mappedCity = formData.city === 'Other' && otherCity ? 'overseas' : cityToDbMap[formData.city];
    const mappedRiskTolerance = riskToDbMap[formData.riskTolerance];
    
    console.log("DEBUG - Submitting user info with id:", formData.id);
    console.log("DEBUG - Submitting user info with financial goals:", selectedGoals);
    
    try {
      await onSave({
        id: formData.id,
        age: formData.age,
        city: mappedCity,
        riskTolerance: mappedRiskTolerance,
        financialGoals: selectedGoals
      });
      
      // Success message shown by the parent component
    } catch (error) {
      console.error("Error saving user info:", error);
      setHasError(true);
      toast.error("Failed to save personal information");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={`w-full bg-white shadow-sm ${hasError ? 'border-red-300' : 'border-finance-teal/20'}`}>
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
                onValueChange={(value: CityDisplayType) => setFormData({...formData, city: value})}
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
              onValueChange={(value: RiskDisplayType) => 
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
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Personal Information'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserInfoForm;
