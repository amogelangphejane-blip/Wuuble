import { Button } from '@/components/ui/button';
import { 
  Play,
  ArrowRight,
  Users,
  Video,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ModernFooter } from '@/components/ModernFooter';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Clean Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Wuuble
            </h1>
            
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </div>
        </div>
      </div>
      
      {/* Clean Hero Section - Azar Style */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Simple Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30"></div>
        
        {/* Minimal Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-20"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${6 + Math.random() * 2}s`
              }}
            >
              {i % 3 === 0 && <Video className="w-6 h-6 text-purple-400" />}
              {i % 3 === 1 && <Users className="w-6 h-6 text-pink-400" />}
              {i % 3 === 2 && <Globe className="w-6 h-6 text-blue-400" />}
            </div>
          ))}
        </div>
        
        <div className="container mx-auto px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Clean Logo/Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Video className="w-12 h-12 text-white" />
              </div>
            </div>
            
            {/* Simple Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
              Meet New People
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
                Video Chat Instantly
              </span>
            </h1>
            
            {/* Clean Subtitle */}
            <p className="text-lg sm:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Connect with people from around the world through random video chats. 
              Simple, fun, and instant connections.
            </p>
            
            {/* Primary CTA */}
            <div className="mb-12">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/random-video-chat' : '/auth')}
                className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-12 py-6 text-xl font-semibold rounded-full transform hover:scale-105"
              >
                <Play className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                Start Video Chat
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
            
            {/* Simple Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Random Matching</h3>
                <p className="text-gray-600 text-sm">Meet new people instantly with our smart matching system</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">HD Video Chat</h3>
                <p className="text-gray-600 text-sm">Crystal clear video and audio for the best experience</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Global Community</h3>
                <p className="text-gray-600 text-sm">Connect with people from all around the world</p>
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