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
  Infinity
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
      icon: <Crown className="w-7 h-7" />,
      title: "Elite Communities",
      description: "Join curated, invitation-only communities where exceptional individuals connect and thrive together.",
      badge: "Exclusive"
    },
    {
      icon: <Diamond className="w-7 h-7" />,
      title: "Premium Connections",
      description: "Experience meaningful relationships with verified, like-minded professionals and creators.",
      badge: "Verified"
    },
    {
      icon: <Gem className="w-7 h-7" />,
      title: "Luxury Experiences",
      description: "Access premium events, masterclasses, and networking opportunities designed for success.",
      badge: "VIP Only"
    },
    {
      icon: <Award className="w-7 h-7" />,
      title: "Achievement Network",
      description: "Connect with high-achievers, entrepreneurs, and thought leaders in your field.",
      badge: "Elite"
    },
    {
      icon: <Lock className="w-7 h-7" />,
      title: "Private Sanctuary",
      description: "Enjoy a secure, ad-free environment designed exclusively for meaningful discourse.",
      badge: "Private"
    },
    {
      icon: <Infinity className="w-7 h-7" />,
      title: "Limitless Growth",
      description: "Unlock unlimited potential through exclusive mentorship and collaborative opportunities.",
      badge: "Unlimited"
    }
  ];

  const premiumTestimonials = [
    {
      name: "Alexandra Sterling",
      role: "CEO, Tech Innovator",
      avatar: "AS",
      content: "Wobble isn't just another social platform—it's where I've found my inner circle of exceptional minds. The quality of connections here is unparalleled.",
      rating: 5,
      company: "Fortune 500",
      verified: true
    },
    {
      name: "Marcus Chen",
      role: "Venture Capitalist",
      avatar: "MC",
      content: "The caliber of individuals on this platform is extraordinary. I've formed strategic partnerships that have transformed my investment portfolio.",
      rating: 5,
      company: "Top VC Firm",
      verified: true
    },
    {
      name: "Dr. Sophia Rodriguez",
      role: "Research Director",
      avatar: "SR",
      content: "Finally, a platform that understands the value of quality over quantity. The intellectual conversations here are genuinely inspiring.",
      rating: 5,
      company: "Leading University",
      verified: true
    }
  ];

  const exclusiveStats = [
    { value: "10K+", label: "Elite Members", suffix: "Invitation Only" },
    { value: "500+", label: "Premium Events", suffix: "Monthly" },
    { value: "98%", label: "Success Rate", suffix: "Meaningful Connections" },
    { value: "$2M+", label: "Network Value", suffix: "Combined Worth" }
  ];

  const membershipTiers = [
    {
      title: "Visionary",
      description: "For thought leaders and industry pioneers",
      members: "Limited to 100",
      value: "$10M+",
      perks: ["Private CEO Circle", "Exclusive Events", "Direct Access"],
      gradient: "from-yellow-400 via-amber-500 to-orange-600"
    },
    {
      title: "Innovator", 
      description: "For entrepreneurs and creative professionals",
      members: "Limited to 500",
      value: "$1M+",
      perks: ["Startup Network", "Investor Access", "Mentorship"],
      gradient: "from-purple-400 via-pink-500 to-rose-600"
    },
    {
      title: "Catalyst",
      description: "For high-achieving professionals",
      members: "Limited to 2000",
      value: "$250K+",
      perks: ["Professional Network", "Skill Exchange", "Career Growth"],
      gradient: "from-blue-400 via-cyan-500 to-teal-600"
    }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <ModernHeader />
      
      {/* Exclusive Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Premium Animated Background */}
        <div className="absolute inset-0">
          {/* Luxury Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
          
          {/* Premium Mesh Gradient */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          </div>
          
          {/* Floating Luxury Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float opacity-20"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${8 + Math.random() * 4}s`
                }}
              >
                {i % 4 === 0 && <Diamond className="w-4 h-4 text-purple-400" />}
                {i % 4 === 1 && <Crown className="w-4 h-4 text-yellow-400" />}
                {i % 4 === 2 && <Gem className="w-4 h-4 text-pink-400" />}
                {i % 4 === 3 && <Award className="w-4 h-4 text-blue-400" />}
              </div>
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-6 lg:px-8 py-32 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Exclusive Badge */}
            <div className="inline-flex items-center mb-8">
              <Badge className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30 hover:border-purple-400/50 backdrop-blur-xl px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 hover:scale-105">
                <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                Invitation Only • Elite Network • 10,000 Members
              </Badge>
            </div>
            
            {/* Premium Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="block text-white mb-4">Where</span>
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent animate-gradient">
                Excellence
              </span>
              <span className="block text-white">Connects</span>
            </h1>
            
            {/* Sophisticated Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              An exclusive sanctuary for visionaries, innovators, and thought leaders. 
              <span className="text-purple-400 font-medium"> Invitation required.</span>
            </p>
            
            {/* Premium Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 max-w-4xl mx-auto">
              {exclusiveStats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
                  <div className="text-purple-400 text-xs mt-1">{stat.suffix}</div>
                </div>
              ))}
            </div>
            
            {/* Exclusive CTA */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/communities' : '/auth')}
                className="group bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 px-12 py-6 text-lg font-semibold rounded-full border border-purple-500/30 hover:border-purple-400/50 backdrop-blur-xl transform hover:scale-105"
              >
                <Crown className="mr-3 w-5 h-5 text-yellow-400 group-hover:rotate-12 transition-transform duration-300" />
                {user ? 'Enter Elite Circle' : 'Request Invitation'}
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="group border-2 border-gray-600 hover:border-purple-500 text-gray-300 hover:text-white bg-black/50 hover:bg-purple-600/10 px-12 py-6 text-lg backdrop-blur-xl rounded-full transition-all duration-300 hover:scale-105"
                onClick={() => navigate('/connect-video-call')}
              >
                <Eye className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                Preview Experience
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="flex items-center text-sm text-gray-400">
                <Shield className="w-4 h-4 mr-2 text-green-400" />
                Verified Members Only
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <Lock className="w-4 h-4 mr-2 text-blue-400" />
                Privacy Guaranteed
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <Award className="w-4 h-4 mr-2 text-purple-400" />
                Premium Experience
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exclusive Features Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black"></div>
        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/30 backdrop-blur-xl px-4 py-2 text-sm rounded-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Premium Features
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">
              Designed for the 
              <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">
                Exceptional Few
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Every feature crafted with meticulous attention to detail, 
              creating an unparalleled social experience for discerning individuals.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {exclusiveFeatures.map((feature, index) => (
              <Card key={index} className="group bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-800/50 hover:border-purple-500/30 backdrop-blur-xl rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 relative overflow-hidden">
                {/* Premium Badge */}
                <div className="absolute top-6 right-6">
                  <Badge className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 border border-purple-500/40 backdrop-blur-xl text-xs px-3 py-1 rounded-full">
                    {feature.badge}
                  </Badge>
                </div>
                
                {/* Luxury Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                
                <CardHeader className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-purple-500/30">
                    <div className="text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
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
        <div className="absolute inset-0 bg-gradient-to-b from-black to-gray-900"></div>
        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-300 border border-amber-500/30 backdrop-blur-xl px-4 py-2 text-sm rounded-full">
              <Crown className="w-4 h-4 mr-2" />
              Membership Tiers
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">
              Choose Your
              <span className="block bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mt-2">
                Circle of Excellence
              </span>
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {membershipTiers.map((tier, index) => (
              <Card key={index} className="group relative bg-gradient-to-br from-gray-900/90 to-black/90 border border-gray-800/50 hover:border-purple-500/30 backdrop-blur-xl rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl overflow-hidden">
                {/* Premium Gradient Border */}
                <div className={`absolute inset-0 bg-gradient-to-r ${tier.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-3xl`}></div>
                <div className={`absolute inset-[1px] bg-gradient-to-br from-gray-900/90 to-black/90 rounded-3xl`}></div>
                
                <div className="relative">
                  <CardHeader className="text-center pb-8">
                    <div className={`w-20 h-20 bg-gradient-to-r ${tier.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-white mb-4">
                      {tier.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-lg">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-2">{tier.members}</div>
                      <div className="text-2xl font-bold text-white">{tier.value}</div>
                      <div className="text-sm text-purple-400">Network Value</div>
                    </div>
                    
                    <div className="space-y-3">
                      {tier.perks.map((perk, perkIndex) => (
                        <div key={perkIndex} className="flex items-center text-gray-300">
                          <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
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
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black"></div>
        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-300 border border-green-500/30 backdrop-blur-xl px-4 py-2 text-sm rounded-full">
              <Award className="w-4 h-4 mr-2" />
              Member Testimonials
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">
              Trusted by
              <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mt-2">
                Industry Leaders
              </span>
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {premiumTestimonials.map((testimonial, index) => (
              <Card key={index} className="group bg-gradient-to-br from-gray-900/90 to-black/90 border border-gray-800/50 hover:border-green-500/30 backdrop-blur-xl rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10 relative overflow-hidden">
                {/* Verified Badge */}
                {testimonial.verified && (
                  <div className="absolute top-6 right-6">
                    <Badge className="bg-gradient-to-r from-blue-600/30 to-cyan-600/30 text-blue-300 border border-blue-500/40 backdrop-blur-xl text-xs px-3 py-1 rounded-full flex items-center">
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
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-black flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-white text-lg group-hover:text-green-300 transition-colors">
                        {testimonial.name}
                      </div>
                      <div className="text-gray-400 text-sm">{testimonial.role}</div>
                      <div className="text-green-400 text-xs font-medium">{testimonial.company}</div>
                    </div>
                  </div>
                  <div className="flex space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform duration-300" style={{ transitionDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl text-green-200/30 mb-4 font-serif">"</div>
                  <p className="text-gray-300 leading-relaxed italic relative z-10 group-hover:text-gray-200 transition-colors duration-300">
                    {testimonial.content}
                  </p>
                  <div className="text-4xl text-green-200/30 text-right mt-4 font-serif">"</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-6 animate-pulse" />
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">
                Ready to Join the
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent mt-2">
                  Elite Circle?
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-12 leading-relaxed">
                Applications are reviewed exclusively by our membership committee. 
                <span className="text-purple-400 font-medium"> Limited spots available.</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/communities' : '/auth')}
                className="group bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 px-12 py-6 text-lg font-semibold rounded-full border border-purple-500/30 hover:border-purple-400/50 backdrop-blur-xl transform hover:scale-105"
              >
                <Diamond className="mr-3 w-5 h-5 text-pink-300 group-hover:rotate-12 transition-transform duration-300" />
                {user ? 'Access Elite Network' : 'Apply for Membership'}
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="group border-2 border-gray-600 hover:border-purple-500 text-gray-300 hover:text-white bg-black/50 hover:bg-purple-600/10 px-12 py-6 text-lg backdrop-blur-xl rounded-full transition-all duration-300 hover:scale-105"
                onClick={() => navigate('/communities')}
              >
                <TrendingUp className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                View Success Stories
              </Button>
            </div>
            
                         {/* Urgency Indicators */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
               <div className="flex items-center justify-center text-sm text-gray-400">
                 <Users className="w-4 h-4 mr-2 text-purple-400" />
                 <span>47 spots remaining</span>
               </div>
               <div className="flex items-center justify-center text-sm text-gray-400">
                 <Zap className="w-4 h-4 mr-2 text-pink-400" />
                 <span>Applications close soon</span>
               </div>
               <div className="flex items-center justify-center text-sm text-gray-400">
                 <Award className="w-4 h-4 mr-2 text-amber-400" />
                 <span>95% acceptance rate</span>
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