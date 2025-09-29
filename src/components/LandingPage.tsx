import { Button } from '@/components/ui/button';
import { 
  Play,
  ArrowRight,
  Users,
  BookOpen,
  MessageSquare,
  Trophy,
  Calendar,
  Globe,
  Star,
  Shield,
  Zap,
  Heart,
  CheckCircle,
  Video,
  Link,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ModernFooter } from '@/components/ModernFooter';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse opacity-10"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              {i % 4 === 0 && <div className="w-32 h-32 bg-primary/20 rounded-full blur-xl" />}
              {i % 4 === 1 && <div className="w-24 h-24 bg-purple-500/20 rounded-full blur-xl" />}
              {i % 4 === 2 && <div className="w-40 h-40 bg-blue-500/20 rounded-full blur-xl" />}
              {i % 4 === 3 && <div className="w-28 h-28 bg-pink-500/20 rounded-full blur-xl" />}
            </div>
          ))}
        </div>
        
        <div className="container mx-auto px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Logo Badge */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-purple-600 rounded-2xl mb-8 shadow-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 text-foreground leading-tight">
              Where Communities
              <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mt-2">
                Come to Life
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Build meaningful connections, share knowledge, and grow together in 
              vibrant communities designed for creators and learners.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/communities' : '/auth')}
                className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105"
              >
                <Play className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                Start Building
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg font-semibold rounded-xl border-2 hover:bg-muted/50 transition-all duration-300"
              >
                <Video className="mr-3 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-background" />
                  ))}
                </div>
                <span className="text-sm font-medium">10,000+ active members</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-medium">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-foreground">
              Everything you need to build
              <span className="block text-primary">amazing communities</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools and features designed to help you create, manage, and grow thriving communities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: MessageSquare,
                title: "Rich Discussions",
                description: "Foster meaningful conversations with threaded discussions, real-time chat, and interactive polls.",
                color: "purple"
              },
              {
                icon: BookOpen,
                title: "Virtual Classroom",
                description: "Share knowledge through courses, workshops, and live sessions with built-in progress tracking.",
                color: "blue"
              },
              {
                icon: Trophy,
                title: "Gamification",
                description: "Boost engagement with leaderboards, achievements, and reward systems that motivate participation.",
                color: "yellow"
              },
              {
                icon: Calendar,
                title: "Event Management",
                description: "Organize and manage community events, workshops, and meetups with RSVP functionality.",
                color: "green"
              },
              {
                icon: Users,
                title: "Member Management",
                description: "Advanced member profiles, role management, and community analytics to understand your audience.",
                color: "pink"
              },
              {
                icon: Shield,
                title: "Safe & Secure",
                description: "Built-in moderation tools, privacy controls, and secure infrastructure to protect your community.",
                color: "red"
              }
            ].map((feature, index) => (
              <div key={index} className="group bg-background rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/20">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${
                  feature.color === 'purple' ? 'bg-purple-100' :
                  feature.color === 'blue' ? 'bg-blue-100' :
                  feature.color === 'yellow' ? 'bg-yellow-100' :
                  feature.color === 'green' ? 'bg-green-100' :
                  feature.color === 'pink' ? 'bg-pink-100' :
                  'bg-red-100'
                }`}>
                  <feature.icon className={`w-8 h-8 ${
                    feature.color === 'purple' ? 'text-purple-600' :
                    feature.color === 'blue' ? 'text-blue-600' :
                    feature.color === 'yellow' ? 'text-yellow-600' :
                    feature.color === 'green' ? 'text-green-600' :
                    feature.color === 'pink' ? 'text-pink-600' :
                    'text-red-600'
                  }`} />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { number: "10K+", label: "Active Members" },
              { number: "500+", label: "Communities" },
              { number: "1M+", label: "Conversations" },
              { number: "99.9%", label: "Uptime" }
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="text-4xl sm:text-5xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid" />
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to build something amazing?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed">
              Join thousands of community builders who trust Wuuble to bring their vision to life.
              Start your free community today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/communities' : '/auth')}
                className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105"
              >
                <Sparkles className="mr-3 w-5 h-5" />
                Get Started Free
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
              >
                <Link className="mr-3 w-5 h-5" />
                Learn More
              </Button>
            </div>
            
            <p className="text-white/70 text-sm mt-6">
              No credit card required • Free forever for small communities
            </p>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
};

export default LandingPage;