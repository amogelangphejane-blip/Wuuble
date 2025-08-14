import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Users, 
  MessageCircle, 
  Calendar, 
  Star, 
  CheckCircle, 
  ArrowRight,
  Play,
  Sparkles,
  Target,
  Zap,
  Shield,
  Globe,
  UserPlus,
  Coffee,
  Smile,
  Flag,
  Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ModernHeader } from '@/components/ModernHeader';
import { ModernFooter } from '@/components/ModernFooter';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Vibrant Communities",
      description: "Join thriving social communities where meaningful friendships are born and genuine connections flourish."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Meaningful Connections",
      description: "Build lasting relationships with like-minded people who share your interests, values, and aspirations."
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Real-time Conversations",
      description: "Engage in authentic conversations that spark new friendships and deepen existing bonds."
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Social Events",
      description: "Join exciting meetups, hangouts, and social activities designed to bring people together."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Personal Growth",
      description: "Grow alongside your new friends through shared experiences and mutual support."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Safe Environment",
      description: "Connect in a secure, welcoming space designed for authentic social interactions."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Community Member",
      avatar: "SC",
      content: "I found my closest friends through wobble. The genuine connections I've made here have transformed my social life completely.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Social Connector",
      avatar: "MR",
      content: "The community events helped me break out of my shell. I've built meaningful friendships that extend far beyond the platform.",
      rating: 5
    },
    {
      name: "Emily Johnson",
      role: "Friend & Mentor",
      avatar: "EJ",
      content: "Not only did I make amazing friends, but I also found mentors who've helped me grow personally and professionally.",
      rating: 5
    }
  ];

  const stats = [
    { value: "50K+", label: "New Friendships" },
    { value: "200+", label: "Communities" },
    { value: "1M+", label: "Connections Made" },
    { value: "95%", label: "Find Their Tribe" }
  ];

  const connectionTypes = [
    {
      title: "Close Friendships",
      description: "Build deep, meaningful friendships with people who truly understand you",
      members: 12500,
      rating: 4.9,
      image: "💝",
      category: "Deep Bonds"
    },
    {
      title: "Professional Network",
      description: "Connect with ambitious individuals who can support your career growth",
      members: 8900,
      rating: 4.8,
      image: "🚀",
      category: "Career Growth"
    },
    {
      title: "Hobby Communities",
      description: "Find your tribe through shared interests, hobbies, and passions",
      members: 21000,
      rating: 4.9,
      image: "🎨",
      category: "Shared Interests"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-bg">
      <ModernHeader />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
        
        {/* Friends Socializing Overlay */}
        <div className="absolute inset-0">
          {/* Floating Social Elements */}
          <div className="absolute top-20 left-4 sm:left-10 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center animate-bounce">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white/80" />
          </div>
          <div className="absolute top-32 right-4 sm:right-16 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center animate-pulse">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
          </div>
          <div className="absolute bottom-32 left-4 sm:left-20 w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white/80" />
          </div>
          <div className="absolute bottom-40 right-4 sm:right-12 w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center animate-pulse" style={{ animationDelay: '2s' }}>
            <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
          </div>
          
          {/* Friends Silhouettes */}
          <div className="absolute bottom-0 left-0 right-0 h-48 sm:h-64 bg-gradient-to-t from-black/20 to-transparent">
            <div className="absolute bottom-6 sm:bottom-8 left-1/4 transform -translate-x-1/2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full backdrop-blur-md border-2 border-white/30 flex items-center justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                  A
                </div>
              </div>
              <div className="mt-1 sm:mt-2 text-center mobile-hidden">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full mx-auto backdrop-blur-md border border-white/20"></div>
              </div>
            </div>
            
            <div className="absolute bottom-8 sm:bottom-12 right-1/4 transform translate-x-1/2">
              <div className="w-14 h-14 sm:w-18 sm:h-18 bg-white/20 rounded-full backdrop-blur-md border-2 border-white/30 flex items-center justify-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  M
                </div>
              </div>
              <div className="mt-1 sm:mt-2 text-center mobile-hidden">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/10 rounded-full mx-auto backdrop-blur-md border border-white/20"></div>
              </div>
            </div>
            
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full backdrop-blur-md border-2 border-white/30 flex items-center justify-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                  S
                </div>
              </div>
              <div className="mt-1 sm:mt-2 text-center mobile-hidden">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full mx-auto backdrop-blur-md border border-white/20"></div>
              </div>
            </div>
          </div>
          
          {/* Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
              </linearGradient>
            </defs>
            <path
              d="M 25% 80% Q 50% 60% 75% 85%"
              stroke="url(#connectionGradient)"
              strokeWidth="2"
              fill="none"
              className="animate-pulse"
            />
            <path
              d="M 20% 75% Q 40% 50% 60% 80%"
              stroke="url(#connectionGradient)"
              strokeWidth="1.5"
              fill="none"
              className="animate-pulse"
              style={{ animationDelay: '1s' }}
            />
          </svg>
        </div>
        
        {/* Particle Effect - Hidden on mobile for performance */}
        <div className="absolute inset-0 hero-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-md">
              💫 Join 50,000+ people making real connections
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Make Friends,{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                Grow Together
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              Connect with amazing people who share your interests and values. Build meaningful friendships, 
              grow personally, and create powerful connections that last a lifetime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/communities' : '/auth')}
                className="bg-white text-purple-600 hover:bg-white/90 shadow-2xl hover:shadow-3xl transition-all px-8 py-4 text-lg font-bold rounded-full transform hover:scale-105"
              >
                {user ? 'Find Your Tribe' : 'Start Making Friends'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/20 px-8 py-4 text-lg backdrop-blur-md rounded-full"
                onClick={() => navigate('/connect-video-call')}
              >
                <Play className="mr-2 w-5 h-5" />
                Start Chat
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Connect Video Chat Feature Section */}
      <section className="py-20 bg-gradient-to-br from-purple-900/10 via-black/50 to-pink-900/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-pink-500/5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">

              <h2 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-6">
                Meet Amazing People Instantly
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                Experience the thrill of immersive random video connections. Swipe, chat, and discover incredible people from around the world with our modern interface.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-purple-500/30">
                    <Sparkles className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-white">Instant Random Matching</h3>
                    <p className="text-white/70 text-lg">Get matched with fascinating people instantly. Every conversation is a new adventure waiting to unfold.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-pink-500/30">
                    <Heart className="w-7 h-7 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-white">Swipe to Connect</h3>
                    <p className="text-white/70 text-lg">Like someone? Swipe right to show interest! Want to meet someone new? Swipe left to skip to the next person.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-blue-500/30">
                    <Shield className="w-7 h-7 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-white">Safe & Secure</h3>
                    <p className="text-white/70 text-lg">Advanced safety features including real-time reporting, blocking, and AI-powered content moderation.</p>
                  </div>
                </div>
                
                <Button 
                  size="lg"
                  onClick={() => navigate('/connect-video-call')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all px-12 py-6 text-xl w-full sm:w-auto rounded-full transform hover:scale-105"
                >
                  <Play className="mr-3 w-6 h-6" />
                  Start Video Chat Now
                </Button>
              </div>
              
              <div className="relative">
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
                  <div className="bg-black rounded-2xl aspect-[9/16] max-w-xs mx-auto relative overflow-hidden border border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30"></div>
                    <div className="absolute top-4 left-4 right-4">
                      <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 text-white border border-white/20">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                              A
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <div className="font-bold">Alex, 24</div>
                            <div className="text-xs opacity-80 flex items-center">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                              New York, USA
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex justify-center space-x-4">
                        <div className="w-12 h-12 bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-red-500/30">
                          <Flag className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                          <Mic className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
                          <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-blue-500/30">
                          <ArrowRight className="w-5 h-5 text-blue-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-3">
                      <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white fill-current" />
                      </div>
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-6 h-6 bg-white/20 rounded-full animate-ping"></div>
          <div className="absolute bottom-10 right-1/3 w-4 h-4 bg-white/30 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-10 w-8 h-8 bg-white/10 rounded-full animate-bounce"></div>
          <div className="absolute top-20 right-20 w-5 h-5 bg-white/25 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-fade-in group">
                <div className="relative">
                  {/* Icon Background */}
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl mx-auto mb-4 flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                    {index === 0 && <Heart className="w-8 h-8 text-white/90" />}
                    {index === 1 && <Users className="w-8 h-8 text-white/90" />}
                    {index === 2 && <MessageCircle className="w-8 h-8 text-white/90" />}
                    {index === 3 && <Star className="w-8 h-8 text-white/90 fill-current" />}
                  </div>
                  
                  {/* Stat Value */}
                  <div className="text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-105 transition-transform duration-300">
                    {stat.value}
                  </div>
                  
                  {/* Stat Label */}
                  <div className="text-white/80 font-medium text-lg">
                    {stat.label}
                  </div>
                  
                  {/* Connecting Line */}
                  {index < stats.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-4 w-8 h-0.5 bg-white/30"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Social Proof Message */}
          <div className="text-center mt-12">
            <p className="text-xl text-white/90 font-medium">
              🌟 Join thousands of people building{' '}
              <span className="text-yellow-300 font-bold">meaningful connections</span>
              {' '}every day!
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-500/20 backdrop-blur-sm">
              ✨ Connection Features
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything you need to build{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                lasting friendships
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover powerful features designed to help you connect authentically 
              with people who matter and grow together.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 animate-fade-in bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm group hover:scale-105 relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-blue-500/5 transition-all duration-500"></div>
                
                <CardHeader className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div className="text-purple-600 group-hover:text-purple-700 transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                
                {/* Animated Border */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Connection Types Section */}
      <section id="connections" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-success/10 text-success border-success/20">
              Connection Types
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Find your perfect connection style
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're looking for deep friendships, professional connections, 
              or hobby buddies - we've got the perfect community for you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {connectionTypes.map((type, index) => (
              <Card 
                key={index}
                className="border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group bg-gradient-card"
              >
                <CardHeader>
                  <div className="text-4xl mb-4">{type.image}</div>
                  <Badge variant="secondary" className="w-fit mb-2">
                    {type.category}
                  </Badge>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {type.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {type.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {type.members.toLocaleString()} members
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                        {type.rating}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/communities')}
              className="border-2 hover:bg-secondary px-8"
            >
              Explore All Communities
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-16 w-16 h-16 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-md animate-float" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-orange-600 border-orange-500/20 backdrop-blur-sm">
              💬 Success Stories
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Real friendships,{' '}
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                real stories
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from our community members about the meaningful connections 
              and lasting friendships they've built through wobble.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className="border-0 shadow-xl bg-white/80 backdrop-blur-sm animate-fade-in hover:shadow-2xl transition-all duration-500 group relative overflow-hidden hover:scale-105"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Card Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {testimonial.avatar}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex space-x-1 mt-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform duration-300" style={{ transitionDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl text-purple-200 mb-2 font-serif">"</div>
                  <p className="text-gray-700 leading-relaxed italic relative z-10">
                    {testimonial.content}
                  </p>
                  <div className="text-4xl text-purple-200 text-right mt-2 font-serif">"</div>
                </CardContent>
                
                {/* Hover Effect Border */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500 -z-10"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to build meaningful connections?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Join thousands of people who are already building lasting friendships 
              and growing together in our vibrant communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/communities' : '/auth')}
                className="bg-white text-primary hover:bg-white/90 shadow-lg px-8 py-3 text-lg font-semibold"
              >
                {user ? 'Find Your Community' : 'Start Connecting Today'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
                onClick={() => navigate('/communities')}
              >
                Browse Communities
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
};

export default LandingPage;