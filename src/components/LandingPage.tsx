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
  Smile
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              💫 Join 50,000+ people making real connections
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Make Friends,{' '}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Grow Together
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Connect with amazing people who share your interests and values. Build meaningful friendships, 
              grow personally, and create powerful connections that last a lifetime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/communities' : '/auth')}
                className="bg-gradient-hero hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all px-8 py-3 text-lg"
              >
                {user ? 'Find Your Tribe' : 'Start Making Friends'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 hover:bg-secondary px-8 py-3 text-lg"
                onClick={() => {
                  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="mr-2 w-5 h-5" />
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Azar Video Chat Feature Section */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
                ✨ NEW: Random Video Chat
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Meet Amazing People Instantly
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience the thrill of random video connections. Swipe, chat, and discover incredible people from around the world.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Random Matching</h3>
                    <p className="text-muted-foreground">Get matched with interesting people instantly. Every conversation is a new adventure.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Swipe to Connect</h3>
                    <p className="text-muted-foreground">Like someone? Swipe right! Want to meet someone new? Swipe left to skip.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
                    <p className="text-muted-foreground">Built-in safety features including reporting, blocking, and content moderation.</p>
                  </div>
                </div>
                
                <Button 
                  size="lg"
                  onClick={() => navigate('/azar-video-call')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all px-8 py-3 text-lg w-full sm:w-auto"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Start Video Chat Now
                </Button>
              </div>
              
              <div className="relative">
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl">
                  <div className="bg-black rounded-2xl aspect-[9/16] max-w-xs mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20"></div>
                    <div className="absolute top-4 left-4 right-4">
                      <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 text-white">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            A
                          </div>
                          <div>
                            <div className="font-semibold">Alex, 24</div>
                            <div className="text-xs opacity-80">New York, USA</div>
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
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-fade-in">
                <div className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-learning/10 text-learning border-learning/20">
              Connection Features
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything you need to build lasting friendships
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
                className="border-0 shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in bg-gradient-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
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
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-warning/10 text-warning border-warning/20">
              Success Stories
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Real friendships, real stories
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
                className="border-0 shadow-md bg-gradient-card animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex space-x-1 mt-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </CardContent>
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