import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Lock,
  Globe,
  Upload,
  X,
  Plus,
  Sparkles,
  Crown,
  DollarSign,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (communityId: string) => void;
}

export const CreateCommunityDialog: React.FC<CreateCommunityDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [rules, setRules] = useState('');
  const [features, setFeatures] = useState({
    discussions: true,
    events: true,
    leaderboard: true,
    resources: false,
    videoChat: false
  });

  const categories = [
    'Education',
    'Technology',
    'Gaming',
    'Art & Design',
    'Music',
    'Business',
    'Health & Fitness',
    'Lifestyle',
    'Entertainment',
    'Sports',
    'Science',
    'Other'
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a community",
        variant: "destructive"
      });
      return;
    }

    if (!name.trim() || !description.trim() || !category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: name.trim(),
          description: description.trim(),
          category: category.toLowerCase(),
          is_private: isPrivate,
          creator_id: user.id,
          owner_id: user.id,
          avatar_url: avatarUrl || null,
          tags: tags,
          member_count: 1
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as first member in community_members
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: data.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding creator as member:', memberError);
        // Don't throw - the community was created successfully
        // The trigger will handle syncing to member_profiles
      }

      // Also ensure creator is in member_profiles for immediate visibility
      // (trigger handles this, but let's be explicit for real-time data)
      await supabase
        .from('member_profiles')
        .insert({
          user_id: user.id,
          community_id: data.id,
          role: 'creator',
          status: 'active',
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Creator',
          avatar_url: user.user_metadata?.avatar_url || null,
          joined_at: new Date().toISOString(),
          activity_score: 10,
          engagement_level: 'active',
          total_points: 50
        })
        .select()
        .single()
        .then(({ error: profileError }) => {
          if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
            console.error('Error creating member profile:', profileError);
          }
        });

      toast({
        title: "Success!",
        description: `${name} has been created successfully`,
      });

      // Reset form
      setName('');
      setDescription('');
      setCategory('');
      setIsPrivate(false);
      setIsPremium(false);
      setTags([]);
      setStep(1);
      
      onSuccess?.(data.id);
    } catch (error) {
      console.error('Error creating community:', error);
      toast({
        title: "Error",
        description: "Failed to create community. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = step === 1 
    ? name.trim() && description.trim() && category
    : step === 2 
    ? true
    : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Community
          </DialogTitle>
          <DialogDescription>
            Build your own community and connect with like-minded people
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-20 h-2 rounded-full transition-colors",
                s <= step ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              )}
            />
          ))}
        </div>

        <div className="space-y-6 py-4">
          {step === 1 && (
            <>
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Community Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter a unique name for your community"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">{name.length}/50 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your community is about..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">{description.length}/500 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat.toLowerCase()}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Avatar Preview</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl">
                        {name.substring(0, 2).toUpperCase() || 'CM'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input
                        placeholder="Avatar URL (optional)"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Provide a URL for your community avatar
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Privacy & Features */}
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                      <div>
                        <p className="font-medium">Privacy</p>
                        <p className="text-sm text-gray-500">
                          {isPrivate ? 'Only approved members can join' : 'Anyone can join this community'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Premium Community</p>
                        <p className="text-sm text-gray-500">
                          Charge a monthly subscription fee
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isPremium}
                      onCheckedChange={setIsPremium}
                    />
                  </div>

                  {isPremium && (
                    <div className="space-y-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <Label htmlFor="price">Monthly Subscription Price</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          id="price"
                          type="number"
                          placeholder="9.99"
                          value={subscriptionPrice}
                          onChange={(e) => setSubscriptionPrice(e.target.value)}
                          className="pl-8"
                          min="0.99"
                          step="0.01"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Members will be charged monthly to access your community
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Community Features</Label>
                  <div className="space-y-2">
                    {Object.entries(features).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => 
                              setFeatures({ ...features, [key]: checked })
                            }
                          />
                          <span className="text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Tags & Rules */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tags (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      maxLength={20}
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      disabled={tags.length >= 5}
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="py-1">
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(index)}
                          className="ml-2 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Add up to 5 tags to help people find your community</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rules">Community Rules (Optional)</Label>
                  <Textarea
                    id="rules"
                    placeholder="Set guidelines for your community members..."
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500">{rules.length}/1000 characters</p>
                </div>

                {/* Preview Card */}
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Community Preview
                  </h4>
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold">{name || 'Community Name'}</h5>
                        {isPrivate && <Lock className="w-3 h-3" />}
                        {isPremium && <Crown className="w-3 h-3 text-yellow-500" />}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {description || 'Community description...'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{category || 'Category'}</Badge>
                        {tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed || loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={!canProceed || loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? 'Creating...' : 'Create Community'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};