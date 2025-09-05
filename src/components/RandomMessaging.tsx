import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRandomMessaging } from '@/hooks/useRandomMessaging';
import { RandomMessagingPreferences } from '@/services/randomMessagingService';
import { 
  MessageCircle,
  Send,
  SkipForward, 
  Flag,
  Settings,
  Shield,
  Heart,
  MapPin,
  Sparkles,
  Search,
  X,
  Users,
  Globe,
  Clock,
  RefreshCw
} from 'lucide-react';

export const RandomMessaging = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use the random messaging hook
  const {
    currentPartner,
    messages,
    status,
    isTyping: hookIsTyping,
    findPartner,
    sendMessage: hookSendMessage,
    endConversation,
    skipToNext,
    reportUser,
    likeUser
  } = useRandomMessaging();
  
  const [onlineUsers] = useState(Math.floor(Math.random() * 2000) + 800); // Simulated online count
  
  // Chat state
  const [messageInput, setMessageInput] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  
  // UI States
  const [showUserInfo, setShowUserInfo] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // User preferences
  const [preferences, setPreferences] = useState<RandomMessagingPreferences>({
    ageRange: '18-35',
    interests: [],
    location: 'global',
    language: 'en'
  });
  
  // Report states
  const [reportReason, setReportReason] = useState<'inappropriate_behavior' | 'harassment' | 'spam' | 'underage' | 'fake_profile' | 'other'>('inappropriate_behavior');
  const [reportDescription, setReportDescription] = useState('');

  // Start random messaging
  const startRandomMessaging = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start random messaging.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await findPartner(preferences);
      setIsLiked(false);
      setShowUserInfo(true);
      setUnreadMessages(0);
      
      toast({
        title: "Connected! 💬",
        description: `You're now chatting with ${currentPartner?.displayName || 'someone new'}`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Unable to find a chat partner. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, preferences, findPartner, currentPartner, toast]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !currentPartner) return;

    try {
      await hookSendMessage(messageInput.trim());
      setMessageInput('');
      setIsTyping(false);
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  }, [messageInput, currentPartner, hookSendMessage, toast]);

  // Skip to next partner
  const skipToNextPartner = useCallback(async () => {
    if (!currentPartner) return;

    try {
      toast({
        title: "Finding next person...",
        description: "Connecting you with someone new",
      });
      
      await skipToNext(preferences);
      setIsLiked(false);
      setShowUserInfo(true);
      setUnreadMessages(0);
    } catch (error) {
      toast({
        title: "Failed to find next partner",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  }, [currentPartner, skipToNext, preferences, toast]);

  // Handle like
  const handleLike = useCallback(async () => {
    if (!currentPartner) return;

    try {
      await likeUser();
      setIsLiked(true);
      toast({
        title: "❤️ Liked!",
        description: "Your interest has been sent",
      });
    } catch (error) {
      toast({
        title: "Failed to send like",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  }, [currentPartner, likeUser, toast]);

  // Handle report
  const handleReport = useCallback(() => {
    setShowReportDialog(true);
  }, []);

  const submitReport = useCallback(async () => {
    try {
      await reportUser(reportReason, reportDescription);
      toast({
        title: "User Reported",
        description: "Thank you for helping keep our community safe. This user has been reported.",
      });
      
      setShowReportDialog(false);
      setReportDescription('');
    } catch (error) {
      toast({
        title: "Failed to report user",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  }, [reportUser, reportReason, reportDescription, toast]);

  // Auto-hide user info after 10 seconds
  useEffect(() => {
    if (currentPartner && showUserInfo) {
      const timer = setTimeout(() => {
        setShowUserInfo(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [currentPartner, showUserInfo]);

  // Handle typing indicator
  useEffect(() => {
    if (messageInput.trim()) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [messageInput]);

  // Mark messages as read when component is visible
  const markMessagesAsRead = useCallback(() => {
    setUnreadMessages(0);
  }, []);

  useEffect(() => {
    markMessagesAsRead();
  }, [messages.length, markMessagesAsRead]);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border shadow-lg">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Please log in to access Random Messaging</h2>
          <p className="text-gray-600 dark:text-gray-300">You need to be authenticated to start random conversations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b shadow-sm p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Random Messaging</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{onlineUsers.toLocaleString()} people online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(true)}
              className="hidden sm:flex"
            >
              <Settings className="w-4 h-4 mr-2" />
              Preferences
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreferences(true)}
              className="sm:hidden"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
        {/* Partner Info Card */}
        {currentPartner && showUserInfo && (
          <Card className="mb-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {currentPartner.displayName.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {currentPartner.displayName}, {currentPartner.age}
                    </h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span>{currentPartner.location}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserInfo(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Interests */}
              <div className="flex flex-wrap gap-2 mt-3">
                {currentPartner.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border shadow-sm">
          {currentPartner ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Start a conversation with {currentPartner.displayName}!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.isOwn 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          <p>{message.text}</p>
                          <p className={`text-xs mt-1 ${
                            message.isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {partnerTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-2 max-w-xs">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Message ${currentPartner.displayName}...`}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="pr-12"
                    />
                    {isTyping && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                        typing...
                      </div>
                    )}
                  </div>
                  <Button onClick={sendMessage} size="sm" disabled={!messageInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReport}
                    className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLike}
                    className={`${isLiked ? 'bg-pink-50 text-pink-600 border-pink-200' : 'hover:bg-pink-50 hover:text-pink-600'}`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked ? 'Liked!' : 'Like'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipToNextPartner}
                    className="text-blue-500 hover:text-blue-600 border-blue-200 hover:border-blue-300"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Next
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={endConversation}
                    className="text-gray-500 hover:text-gray-600"
                  >
                    End Chat
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Welcome State */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                {status === 'searching' ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-6 relative">
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                      <Search className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Finding someone to chat with...</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">Connecting you with a random person based on your preferences</p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>{onlineUsers.toLocaleString()} people online</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Ready to meet someone new?</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">Start a random conversation with someone from around the world</p>
                    
                    <div className="space-y-4">
                      <Button
                        onClick={startRandomMessaging}
                        disabled={status === 'searching'}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-3 rounded-full text-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <MessageCircle className="w-5 h-5 mr-3" />
                        Start Random Messaging
                      </Button>
                      
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Globe className="w-4 h-4" />
                        <span>Connect with {onlineUsers.toLocaleString()} people worldwide</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Messaging Preferences</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Age Range</Label>
              <Select
                value={preferences.ageRange}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, ageRange: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="18-35">18-35</SelectItem>
                  <SelectItem value="25-45">25-45</SelectItem>
                  <SelectItem value="18-99">All ages (18+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Location Preference</Label>
              <Select
                value={preferences.location}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, location: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="local">Local Area</SelectItem>
                  <SelectItem value="country">Same Country</SelectItem>
                  <SelectItem value="continent">Same Continent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, language: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Interests (Select up to 5)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Music", "Travel", "Sports", "Art", "Technology", "Books", "Movies", "Gaming", "Food", "Photography", "Fitness", "Science", "Nature", "Fashion", "History"].map((interest) => {
                  const isSelected = preferences.interests.includes(interest);
                  return (
                    <Badge 
                      key={interest} 
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? "bg-blue-500 text-white hover:bg-blue-600" 
                          : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setPreferences(prev => ({
                            ...prev,
                            interests: prev.interests.filter(i => i !== interest)
                          }));
                        } else if (preferences.interests.length < 5) {
                          setPreferences(prev => ({
                            ...prev,
                            interests: [...prev.interests, interest]
                          }));
                        }
                      }}
                    >
                      {interest}
                    </Badge>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {preferences.interests.length}/5 selected
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPreferences(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowPreferences(false);
                  toast({
                    title: "Preferences Updated",
                    description: "Your matching preferences have been saved.",
                  });
                }}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <Flag className="w-5 h-5" />
              <span>Report User</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for reporting</Label>
              <Select
                value={reportReason}
                onValueChange={(value: any) => setReportReason(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate_behavior">Inappropriate Behavior</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="underage">Underage User</SelectItem>
                  <SelectItem value="fake_profile">Fake Profile</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional details (optional)</Label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please provide any additional details that might help us investigate..."
                className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Your safety is our priority</p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    All reports are reviewed by our moderation team. False reports may result in account restrictions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportDialog(false);
                  setReportDescription('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={submitReport}
                className="flex items-center space-x-2"
              >
                <Flag className="w-4 h-4" />
                <span>Submit Report</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Safety Notice */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 p-4">
        <span className="font-medium">18+ only.</span> Keep conversations respectful and report any inappropriate behavior.
      </div>
    </div>
  );
};