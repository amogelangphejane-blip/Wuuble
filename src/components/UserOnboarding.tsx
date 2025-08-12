import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Camera, 
  MapPin, 
  Calendar, 
  Heart,
  Music,
  Gamepad2,
  Book,
  Palette,
  Dumbbell,
  Coffee,
  Plane,
  Film,
  Code,
  Mic,
  Car,
  ChevronRight,
  Check
} from 'lucide-react';

interface UserProfile {
  name: string;
  age: number;
  location: string;
  interests: string[];
  avatar?: string;
  bio: string;
}

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const INTEREST_OPTIONS = [
  { id: 'music', label: 'Music', icon: Music },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'reading', label: 'Reading', icon: Book },
  { id: 'art', label: 'Art', icon: Palette },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'food', label: 'Food', icon: Coffee },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'tech', label: 'Technology', icon: Code },
  { id: 'podcasts', label: 'Podcasts', icon: Mic },
  { id: 'cars', label: 'Cars', icon: Car },
];

const LOCATION_OPTIONS = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Japan',
  'South Korea',
  'Brazil',
  'Mexico',
  'India',
  'Other'
];

export const UserOnboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 18,
    location: '',
    interests: [],
    bio: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please choose an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({ ...prev, avatar: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interestId: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleNext = () => {
    if (step === 1 && (!profile.name || !profile.location || profile.age < 18)) {
      toast({
        title: "Please complete all fields",
        description: "Name, age (18+), and location are required",
        variant: "destructive"
      });
      return;
    }
    
    if (step === 2 && profile.interests.length < 3) {
      toast({
        title: "Select at least 3 interests",
        description: "This helps us find better matches for you",
        variant: "destructive"
      });
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="relative mx-auto w-24 h-24 mb-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback>
              <User className="w-12 h-12 text-gray-400" />
            </AvatarFallback>
          </Avatar>
          <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
            <Camera className="w-4 h-4" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <h2 className="text-2xl font-bold mb-2">Let's set up your profile</h2>
        <p className="text-muted-foreground">Tell us a bit about yourself</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Your Name
          </Label>
          <Input
            id="name"
            placeholder="Enter your name"
            value={profile.name}
            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="age" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Age
          </Label>
          <Input
            id="age"
            type="number"
            min="18"
            max="100"
            placeholder="18"
            value={profile.age}
            onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 18 }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </Label>
          <Select onValueChange={(value) => setProfile(prev => ({ ...prev, location: value }))}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_OPTIONS.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="bio">
            Tell us about yourself (optional)
          </Label>
          <Input
            id="bio"
            placeholder="I love music and traveling..."
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">What are you interested in?</h2>
        <p className="text-muted-foreground">Select at least 3 interests to help us find great matches</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {INTEREST_OPTIONS.map((interest) => {
          const Icon = interest.icon;
          const isSelected = profile.interests.includes(interest.id);
          
          return (
            <Button
              key={interest.id}
              variant={isSelected ? "default" : "outline"}
              className={`h-16 flex flex-col gap-2 ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => toggleInterest(interest.id)}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{interest.label}</span>
              {isSelected && <Check className="w-4 h-4 absolute top-2 right-2" />}
            </Button>
          );
        })}
      </div>

      <div className="text-center">
        <Badge variant="secondary">
          {profile.interests.length} of {INTEREST_OPTIONS.length} selected
        </Badge>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
        <p className="text-muted-foreground">Here's your profile preview</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>
                <User className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{profile.name}</h3>
              <p className="text-muted-foreground">{profile.age} • {profile.location}</p>
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
          )}

          <div>
            <h4 className="font-medium mb-2">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interestId) => {
                const interest = INTEREST_OPTIONS.find(opt => opt.id === interestId);
                return (
                  <Badge key={interestId} variant="secondary">
                    {interest?.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-8 h-1 rounded-full ${
                    i <= step ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{step}/3</span>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1">
              {step === 3 ? 'Start Matching' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};