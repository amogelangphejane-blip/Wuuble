import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle,
  Store,
  CreditCard,
  FileText,
  User,
  Upload,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { createOrUpdateSellerProfile } from '@/services/storeService';
import type { UpdateSellerProfileForm } from '@/types/store';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

interface SellerOnboardingWizardProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const SellerOnboardingWizard: React.FC<SellerOnboardingWizardProps> = ({
  onComplete,
  onSkip
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    paymentEmail: '',
    bankAccount: '',
    taxId: '',
    businessType: 'individual',
    storeBanner: null as File | null,
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Selling!',
      description: 'Let\'s set up your digital store in just a few steps',
      icon: Sparkles,
      completed: false,
    },
    {
      id: 'store-info',
      title: 'Store Information',
      description: 'Tell us about your store and what you sell',
      icon: Store,
      completed: false,
    },
    {
      id: 'payment-info',
      title: 'Payment Setup',
      description: 'Configure how you\'ll receive payments',
      icon: CreditCard,
      completed: false,
    },
    {
      id: 'verification',
      title: 'Verification',
      description: 'Complete your seller verification',
      icon: Shield,
      completed: false,
    },
    {
      id: 'complete',
      title: 'You\'re Ready!',
      description: 'Your seller account is set up and ready to go',
      icon: CheckCircle,
      completed: false,
    },
  ];

  const [stepStates, setStepStates] = useState(steps);
  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateStepCompletion = (stepIndex: number, completed: boolean) => {
    setStepStates(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, completed } : step
    ));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Store Info
        return formData.storeName.length >= 3 && formData.storeDescription.length >= 20;
      case 2: // Payment Info
        return formData.paymentEmail.includes('@') && formData.businessType !== '';
      case 3: // Verification
        return formData.taxId !== '' || formData.businessType === 'individual';
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Please complete all required fields",
        description: "Fill in the required information before proceeding.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === steps.length - 2) {
      // Last step before completion - save the profile
      await handleSaveProfile();
    }

    updateStepCompletion(currentStep, true);
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const profileData: UpdateSellerProfileForm = {
        store_name: formData.storeName,
        store_description: formData.storeDescription,
        store_banner_file: formData.storeBanner || undefined,
        payment_details: {
          email: formData.paymentEmail,
          bank_account: formData.bankAccount,
          tax_id: formData.taxId,
          business_type: formData.businessType,
        },
      };

      const result = await createOrUpdateSellerProfile(profileData);
      
      if (result.success) {
        toast({
          title: "Seller Profile Created!",
          description: "Your seller account has been set up successfully.",
        });
      } else {
        throw new Error(result.error?.message);
      }
    } catch (error) {
      toast({
        title: "Setup Error",
        description: error instanceof Error ? error.message : "Failed to create seller profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto">
        <Store className="h-12 w-12 text-orange-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Start Selling Your Digital Products
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Join thousands of creators who are earning money by selling their digital products. 
          We'll help you set up your store in just a few minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-sm">Easy Upload</h3>
          <p className="text-xs text-gray-600">Upload your digital products with drag & drop</p>
        </div>
        
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-sm">Track Sales</h3>
          <p className="text-xs text-gray-600">Monitor your earnings and customer analytics</p>
        </div>
        
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-sm">Secure Payments</h3>
          <p className="text-xs text-gray-600">Get paid safely with our secure payment system</p>
        </div>
      </div>
    </div>
  );

  const renderStoreInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Tell us about your store</h2>
        <p className="text-gray-600">This information will be visible to potential customers</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="store-name">Store Name *</Label>
          <Input
            id="store-name"
            value={formData.storeName}
            onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
            placeholder="e.g., Creative Digital Studio"
            className="text-base"
          />
          {formData.storeName.length > 0 && formData.storeName.length < 3 && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Store name must be at least 3 characters
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="store-description">Store Description *</Label>
          <Textarea
            id="store-description"
            value={formData.storeDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, storeDescription: e.target.value }))}
            placeholder="Describe what you sell and what makes your products special..."
            rows={4}
            className="text-base"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>
              {formData.storeDescription.length < 20 && formData.storeDescription.length > 0 && (
                <span className="text-red-600">At least 20 characters required</span>
              )}
            </span>
            <span>{formData.storeDescription.length}/500</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="store-banner">Store Banner (Optional)</Label>
          <Input
            id="store-banner"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFormData(prev => ({ ...prev, storeBanner: file }));
              }
            }}
            className="text-base"
          />
          <p className="text-sm text-gray-500">Upload a banner image for your store (max 5MB)</p>
        </div>
      </div>
    </div>
  );

  const renderPaymentInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Information</h2>
        <p className="text-gray-600">Set up how you'll receive payments from sales</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payment-email">Payment Email *</Label>
          <Input
            id="payment-email"
            type="email"
            value={formData.paymentEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentEmail: e.target.value }))}
            placeholder="payments@yourdomain.com"
            className="text-base"
          />
          <p className="text-sm text-gray-500">We'll use this email for payment notifications</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-type">Business Type *</Label>
          <select
            id="business-type"
            value={formData.businessType}
            onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
          >
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="nonprofit">Non-profit</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank-account">Bank Account (Optional)</Label>
          <Input
            id="bank-account"
            value={formData.bankAccount}
            onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
            placeholder="Account details for direct deposits"
            className="text-base"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Payment Processing</h3>
            <p className="text-sm text-blue-700 mt-1">
              We use secure payment processing with industry-standard encryption. 
              Your payment information is never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verification</h2>
        <p className="text-gray-600">Help us verify your account for security</p>
      </div>

      <div className="space-y-4">
        {formData.businessType === 'business' && (
          <div className="space-y-2">
            <Label htmlFor="tax-id">Tax ID / EIN *</Label>
            <Input
              id="tax-id"
              value={formData.taxId}
              onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
              placeholder="12-3456789"
              className="text-base"
            />
          </div>
        )}

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Verification Benefits</h3>
          </div>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Higher search ranking for your products</li>
            <li>• Verified seller badge on your profile</li>
            <li>• Access to premium seller features</li>
            <li>• Priority customer support</li>
          </ul>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Verification Process</h3>
              <p className="text-sm text-amber-700 mt-1">
                Your account will be reviewed within 24-48 hours. You can start selling immediately, 
                but verification unlocks additional features and higher visibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Congratulations!
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Your seller account is now set up and ready. You can start listing your first digital product!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
        <Button 
          onClick={() => onComplete?.()}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Upload className="h-4 w-4 mr-2" />
          List Your First Product
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => window.open('/seller-dashboard', '_blank')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          View Dashboard
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderWelcomeStep();
      case 1: return renderStoreInfoStep();
      case 2: return renderPaymentInfoStep();
      case 3: return renderVerificationStep();
      case 4: return renderCompleteStep();
      default: return renderWelcomeStep();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              {stepStates.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = step.completed || index < currentStep;
                
                return (
                  <React.Fragment key={step.id}>
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${isCompleted 
                        ? 'bg-green-600 text-white' 
                        : isActive 
                          ? 'bg-orange-600 text-white' 
                          : 'bg-gray-200 text-gray-400'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    {index < stepStates.length - 1 && (
                      <div className={`
                        w-8 h-0.5 transition-colors
                        ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                      `} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          
          <Progress value={progress} className="w-full mb-4" />
          
          <CardTitle className="text-lg">
            Step {currentStep + 1} of {steps.length}: {stepStates[currentStep].title}
          </CardTitle>
          <CardDescription>
            {stepStates[currentStep].description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {renderCurrentStep()}
          
          {currentStep < steps.length - 1 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={currentStep === 0 ? onSkip : handlePrevious}
                disabled={loading}
              >
                {currentStep === 0 ? (
                  'Skip Setup'
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!validateCurrentStep() || loading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? (
                  'Saving...'
                ) : currentStep === steps.length - 2 ? (
                  'Complete Setup'
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};