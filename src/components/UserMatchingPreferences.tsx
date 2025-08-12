import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  MapPin, 
  Calendar, 
  Heart,
  Globe,
  Users,
  Filter,
  Save,
  RotateCcw,
  Shield,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor
} from 'lucide-react';

interface MatchingPreferences {
  ageRange: [number, number];
  maxDistance: number;
  locationFilter: 'local' | 'country' | 'global';
  genderPreference: 'any' | 'male' | 'female';
  interests: string[];
  onlyVerified: boolean;
  allowReconnections: boolean;
  autoNextEnabled: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  devicePreference: 'any' | 'mobile' | 'desktop';
  safetyMode: boolean;
}

interface PreferencesProps {
  initialPreferences?: Partial<MatchingPreferences>;
  onSave: (preferences: MatchingPreferences) => void;
  onCancel: () => void;
}

const INTEREST_OPTIONS = [
  'music', 'gaming', 'reading', 'art', 'fitness', 'food', 
  'travel', 'movies', 'tech', 'podcasts', 'cars', 'sports'
];

const LOCATION_FILTERS = [
  { value: 'local', label: 'Nearby (50km)', icon: MapPin },
  { value: 'country', label: 'Same Country', icon: Globe },
  { value: 'global', label: 'Worldwide', icon: Users }
];

export const UserMatchingPreferences: React.FC<PreferencesProps> = ({ 
  initialPreferences = {}, 
  onSave, 
  onCancel 
}) => {
  const [preferences, setPreferences] = useState<MatchingPreferences>({
    ageRange: [18, 35],
    maxDistance: 50,
    locationFilter: 'country',
    genderPreference: 'any',
    interests: [],
    onlyVerified: false,
    allowReconnections: true,
    autoNextEnabled: false,
    audioEnabled: true,
    videoEnabled: true,
    devicePreference: 'any',
    safetyMode: true,
    ...initialPreferences
  });

  const { toast } = useToast();

  const handleSave = () => {
    onSave(preferences);
    toast({
      title: "Preferences saved",
      description: "Your matching preferences have been updated successfully"
    });
  };

  const handleReset = () => {
    setPreferences({
      ageRange: [18, 35],
      maxDistance: 50,
      locationFilter: 'country',
      genderPreference: 'any',
      interests: [],
      onlyVerified: false,
      allowReconnections: true,
      autoNextEnabled: false,
      audioEnabled: true,
      videoEnabled: true,
      devicePreference: 'any',
      safetyMode: true
    });
    toast({
      title: "Preferences reset",
      description: "All preferences have been reset to default values"
    });
  };

  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Matching Preferences</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Customize your matching experience
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Age Range */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Age Range</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="px-2">
              <Slider
                value={preferences.ageRange}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, ageRange: value as [number, number] }))}
                min={18}
                max={65}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>18 years</span>
              <Badge variant="secondary">
                {preferences.ageRange[0]} - {preferences.ageRange[1]} years
              </Badge>
              <span>65 years</span>
            </div>
          </CardContent>
        </Card>

        {/* Location & Distance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Location Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {LOCATION_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isSelected = preferences.locationFilter === filter.value;
                
                return (
                  <Button
                    key={filter.value}
                    variant={isSelected ? "default" : "outline"}
                    className="justify-start h-12"
                    onClick={() => setPreferences(prev => ({ 
                      ...prev, 
                      locationFilter: filter.value as any 
                    }))}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {filter.label}
                  </Button>
                );
              })}
            </div>

            {preferences.locationFilter === 'local' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Maximum Distance: {preferences.maxDistance}km</Label>
                  <Slider
                    value={[preferences.maxDistance]}
                    onValueChange={(value) => setPreferences(prev => ({ 
                      ...prev, 
                      maxDistance: value[0] 
                    }))}
                    min={5}
                    max={500}
                    step={5}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Gender Preference */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Gender Preference</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Select 
              value={preferences.genderPreference} 
              onValueChange={(value) => setPreferences(prev => ({ 
                ...prev, 
                genderPreference: value as any 
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Anyone</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Preferred Interests</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Match with people who share your interests
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <Button
                  key={interest}
                  variant={preferences.interests.includes(interest) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety & Quality */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Safety & Quality</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Verified Users Only</Label>
                <p className="text-sm text-muted-foreground">
                  Match only with verified profiles
                </p>
              </div>
              <Switch
                checked={preferences.onlyVerified}
                onCheckedChange={(checked) => setPreferences(prev => ({ 
                  ...prev, 
                  onlyVerified: checked 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Safety Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enhanced content filtering and reporting
                </p>
              </div>
              <Switch
                checked={preferences.safetyMode}
                onCheckedChange={(checked) => setPreferences(prev => ({ 
                  ...prev, 
                  safetyMode: checked 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Reconnections</Label>
                <p className="text-sm text-muted-foreground">
                  Allow matching with previous connections
                </p>
              </div>
              <Switch
                checked={preferences.allowReconnections}
                onCheckedChange={(checked) => setPreferences(prev => ({ 
                  ...prev, 
                  allowReconnections: checked 
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Media Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Media Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {preferences.videoEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <Label>Video Enabled</Label>
              </div>
              <Switch
                checked={preferences.videoEnabled}
                onCheckedChange={(checked) => setPreferences(prev => ({ 
                  ...prev, 
                  videoEnabled: checked 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {preferences.audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <Label>Audio Enabled</Label>
              </div>
              <Switch
                checked={preferences.audioEnabled}
                onCheckedChange={(checked) => setPreferences(prev => ({ 
                  ...prev, 
                  audioEnabled: checked 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Next</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically find next match after disconnect
                </p>
              </div>
              <Switch
                checked={preferences.autoNextEnabled}
                onCheckedChange={(checked) => setPreferences(prev => ({ 
                  ...prev, 
                  autoNextEnabled: checked 
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Device Preference */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Device Preference</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Select 
              value={preferences.devicePreference} 
              onValueChange={(value) => setPreferences(prev => ({ 
                ...prev, 
                devicePreference: value as any 
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Device</SelectItem>
                <SelectItem value="mobile">Mobile Only</SelectItem>
                <SelectItem value="desktop">Desktop Only</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-6">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};