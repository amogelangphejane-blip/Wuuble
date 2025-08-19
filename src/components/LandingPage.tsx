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
  Mic,
  Crown,
  Diamond,
  Lock,
  Eye,
  Gem,
  Award,
  TrendingUp,
  Infinity as InfinityIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ModernHeader } from '@/components/ModernHeader';
import { ModernFooter } from '@/components/ModernFooter';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const exclusiveFeatures = [
    {
      icon: <Users className="w-7 h-7" />,
      title: "Social Connection Hub",
      description: "Connect with like-minded individuals and build meaningful relationships through our exclusive social networking platform.",
      badge: "Social"
    },
    {
      icon: <Crown className="w-7 h-7" />,
      title: "Exclusive Groups",
      description: "Join invitation-only groups where exceptional individuals collaborate, share insights, and grow together.",
      badge: "Exclusive"
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      title: "Personal Growth",
      description: "Accelerate your personal and professional development through peer learning and mentorship opportunities.",
      badge: "Growth"
    },
    {
      icon: <MessageCircle className="w-7 h-7" />,
      title: "Meaningful Conversations",
      description: "Engage in deep, purposeful discussions that inspire growth and foster lasting connections.",
      badge: "Connect"
    },
    {
      icon: <UserPlus className="w-7 h-7" />,
      title: "Network Expansion",
      description: "Expand your professional and personal network with curated connections and strategic introductions.",
      badge: "Network"
    },
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: "Growth Opportunities",
      description: "Discover exclusive opportunities for collaboration, learning, and advancement within your field.",
      badge: "Opportunity"
    }
  ];

  const premiumTestimonials = [
    {
      name: "Sarah Mitchell",
      role: "Community Builder",
      avatar: "SM",
      content: "Wuuble transformed how I connect with others. The exclusive groups have introduced me to incredible people who've become lifelong friends and collaborators.",
      rating: 5,
      company: "Growth Network",
      verified: true
    },
    {
      name: "David Chen",
      role: "Personal Development Coach",
      avatar: "DC",
      content: "The growth opportunities here are unmatched. I've connected with mentors and peers who've accelerated my personal journey beyond what I thought possible.",
      rating: 5,
      company: "Life Mastery",
      verified: true
    },
    {
      name: "Maria Rodriguez",
      role: "Social Impact Leader",
      avatar: "MR",
      content: "The meaningful conversations and connections I've made through Wuuble have enriched both my personal and professional life. It's where authentic relationships flourish.",
      rating: 5,
      company: "Change Makers",
      verified: true
    }
  ];

  const exclusiveStats = [
    { value: "50K+", label: "Active Connections", suffix: "Growing Daily" },
    { value: "1,200+", label: "Exclusive Groups", suffix: "Active Communities" },
    { value: "95%", label: "Growth Success", suffix: "Member Development" },
    { value: "85%", label: "Long-term Bonds", suffix: "Lasting Friendships" }
  ];

  const membershipTiers = [
    {
      title: "Growth Leaders",
      description: "For those dedicated to continuous learning and leadership",
      members: "Limited to 200",
      value: "Advanced",
      perks: ["Leadership Circle", "Mentorship Programs", "Growth Workshops"],
      gradient: "from-yellow-400 via-amber-500 to-orange-600"
    },
    {
      title: "Connection Builders", 
      description: "For community creators and relationship builders",
      members: "Limited to 800",
      value: "Enhanced",
      perks: ["Community Tools", "Event Hosting", "Collaboration Hub"],
      gradient: "from-purple-400 via-pink-500 to-rose-600"
    },
    {
      title: "Social Connectors",
      description: "For individuals seeking meaningful connections",
      members: "Limited to 3000",
      value: "Essential",
      perks: ["Group Access", "Social Features", "Growth Resources"],
      gradient: "from-blue-400 via-cyan-500 to-teal-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 relative overflow-hidden">
      <ModernHeader />
      
      {/* Exclusive Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Premium Animated Background */}
        <div className="absolute inset-0">
          {/* Luxury Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-gray-100"></div>
          
          {/* Premium Mesh Gradient */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-amber-400/30 to-orange-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          </div>
          
          {/* Floating Luxury Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float opacity-30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${8 + Math.random() * 4}s`
                }}
              >
                {i % 4 === 0 && <Diamond className="w-4 h-4 text-purple-600" />}
                {i % 4 === 1 && <Crown className="w-4 h-4 text-yellow-600" />}
                {i % 4 === 2 && <Gem className="w-4 h-4 text-pink-600" />}
                {i % 4 === 3 && <Award className="w-4 h-4 text-blue-600" />}
              </div>
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-6 lg:px-8 py-32 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Premium Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="block text-gray-900 mb-4">Where</span>
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 bg-clip-text text-transparent animate-gradient">
                Connections
              </span>
              <span className="block text-gray-900">Flourish</span>
            </h1>
            
            {/* Exclusive Badge */}
            <div className="inline-flex items-center mb-8">
              <Badge className="bg-white/80 text-gray-700 border border-purple-200 hover:border-purple-300 backdrop-blur-xl px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-lg">
                <Users className="w-6 h-6 mr-2 text-purple-600" />
                Join the Community
              </Badge>
            </div>
            
            {/* Sophisticated Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Build meaningful relationships, join exclusive groups, and accelerate your personal growth through our vibrant social community. 
              <span className="text-purple-600 font-medium"> Connect. Grow. Thrive.</span>
            </p>
            
            {/* Premium Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 max-w-4xl mx-auto">
              {exclusiveStats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
                  <div className="text-purple-600 text-xs mt-1">{stat.suffix}</div>
                </div>
              ))}
            </div>
            
            {/* Exclusive CTA */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/communities' : '/auth')}
                className="group bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 px-12 py-6 text-lg font-semibold rounded-full border border-purple-200 hover:border-purple-300 backdrop-blur-xl transform hover:scale-105"
              >
                <Crown className="mr-3 w-5 h-5 text-yellow-200 group-hover:rotate-12 transition-transform duration-300" />
                {user ? 'Enter Elite Circle' : 'Request Invitation'}
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="group border-2 border-gray-300 hover:border-purple-500 text-gray-700 hover:text-purple-700 bg-white/80 hover:bg-purple-50 px-12 py-6 text-lg backdrop-blur-xl rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
                onClick={() => navigate('/connect-video-call')}
              >
                <Eye className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                Preview Experience
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-70">
              <div className="flex items-center text-sm text-gray-600">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                Verified Members Only
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Lock className="w-4 h-4 mr-2 text-blue-600" />
                Privacy Guaranteed
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Award className="w-4 h-4 mr-2 text-purple-600" />
                Premium Experience
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exclusive Features Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-gray-50"></div>
        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-white/80 text-purple-700 border border-purple-200 backdrop-blur-xl px-4 py-2 text-sm rounded-full shadow-lg">
              <Users className="w-4 h-4 mr-2" />
              Social Features
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-8">
              Built for 
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
                Connection & Growth
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Every feature designed to foster meaningful relationships, facilitate personal growth, 
              and create exclusive communities where like-minded individuals thrive together.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {exclusiveFeatures.map((feature, index) => (
              <Card key={index} className="group bg-white/90 border border-gray-200 hover:border-purple-300 backdrop-blur-xl rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 relative overflow-hidden">
                {/* Premium Badge */}
                <div className="absolute top-6 right-6">
                  <Badge className="bg-purple-50 text-purple-700 border border-purple-200 backdrop-blur-xl text-xs px-3 py-1 rounded-full">
                    {feature.badge}
                  </Badge>
                </div>
                
                {/* Luxury Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                
                <CardHeader className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-purple-200">
                    <div className="text-purple-600 group-hover:text-purple-700 transition-colors duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-700 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Tiers Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-slate-100"></div>
        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-white/80 text-amber-700 border border-amber-200 backdrop-blur-xl px-4 py-2 text-sm rounded-full shadow-lg">
              <Users className="w-4 h-4 mr-2" />
              Community Tiers
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-8">
              Find Your
              <span className="block bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mt-2">
                Growth Community
              </span>
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {membershipTiers.map((tier, index) => (
              <Card key={index} className="group relative bg-white/95 border border-gray-200 hover:border-purple-300 backdrop-blur-xl rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl overflow-hidden">
                {/* Premium Gradient Border */}
                <div className={`absolute inset-0 bg-gradient-to-r ${tier.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}></div>
                <div className={`absolute inset-[1px] bg-white/95 rounded-3xl`}></div>
                
                <div className="relative">
                  <CardHeader className="text-center pb-8">
                    <div className={`w-20 h-20 bg-gradient-to-r ${tier.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                      {tier.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-lg">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-2">{tier.members}</div>
                      <div className="text-2xl font-bold text-gray-900">{tier.value}</div>
                      <div className="text-sm text-purple-600">Network Value</div>
                    </div>
                    
                    <div className="space-y-3">
                      {tier.perks.map((perk, perkIndex) => (
                        <div key={perkIndex} className="flex items-center text-gray-700">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                          {perk}
                        </div>
                      ))}
                    </div>
                    
                    <Button className={`w-full bg-gradient-to-r ${tier.gradient} hover:opacity-90 text-white font-semibold py-3 rounded-full transition-all duration-300 hover:scale-105 shadow-lg`}>
                      Request Access
                    </Button>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Testimonials Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-white"></div>
        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-white/80 text-green-700 border border-green-200 backdrop-blur-xl px-4 py-2 text-sm rounded-full shadow-lg">
              <Heart className="w-4 h-4 mr-2" />
              Community Stories
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-8">
              Loved by
              <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-2">
                Our Community
              </span>
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {premiumTestimonials.map((testimonial, index) => (
              <Card key={index} className="group bg-white/95 border border-gray-200 hover:border-green-300 backdrop-blur-xl rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10 relative overflow-hidden">
                {/* Verified Badge */}
                {testimonial.verified && (
                  <div className="absolute top-6 right-6">
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 backdrop-blur-xl text-xs px-3 py-1 rounded-full flex items-center shadow-sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="relative">
                  <div className="flex items-center mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {testimonial.avatar}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center shadow-sm">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition-colors">
                        {testimonial.name}
                      </div>
                      <div className="text-gray-600 text-sm">{testimonial.role}</div>
                      <div className="text-green-600 text-xs font-medium">{testimonial.company}</div>
                    </div>
                  </div>
                  <div className="flex space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform duration-300" style={{ transitionDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl text-green-400/40 mb-4 font-serif">"</div>
                  <p className="text-gray-700 leading-relaxed italic relative z-10 group-hover:text-gray-800 transition-colors duration-300">
                    {testimonial.content}
                  </p>
                  <div className="text-4xl text-green-400/40 text-right mt-4 font-serif">"</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-white to-pink-50/80"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <Users className="w-16 h-16 text-purple-600 mx-auto mb-6 animate-pulse" />
              <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-8">
                Ready to Build
                <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 bg-clip-text text-transparent mt-2">
                  Meaningful Connections?
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                Join thousands of individuals who are building lasting relationships and growing together. 
                <span className="text-purple-600 font-medium"> Your community awaits.</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/communities' : '/auth')}
                className="group bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 px-12 py-6 text-lg font-semibold rounded-full border border-purple-200 hover:border-purple-300 backdrop-blur-xl transform hover:scale-105"
              >
                <Users className="mr-3 w-5 h-5 text-pink-200 group-hover:rotate-12 transition-transform duration-300" />
                {user ? 'Join Your Community' : 'Start Connecting'}
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="group border-2 border-gray-300 hover:border-purple-500 text-gray-700 hover:text-purple-700 bg-white/80 hover:bg-purple-50 px-12 py-6 text-lg backdrop-blur-xl rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
                onClick={() => navigate('/communities')}
              >
                <MessageCircle className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                Explore Groups
              </Button>
            </div>
            
            {/* Community Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2 text-purple-600" />
                <span>50K+ active members</span>
              </div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 mr-2 text-pink-600" />
                <span>Growing daily</span>
              </div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Heart className="w-4 h-4 mr-2 text-amber-600" />
                <span>Meaningful connections</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
};

export default LandingPage;