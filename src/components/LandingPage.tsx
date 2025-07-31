import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Users, Globe, Shield, Zap, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Video className="w-6 h-6" />,
      title: "Random Video Chat",
      description: "Connect instantly with people from around the world through high-quality video calls"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Global Community",
      description: "Meet new friends and discover different cultures in our diverse global community"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Safe & Secure",
      description: "Your privacy matters. All connections are secure and anonymous"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Connection",
      description: "No registration required. Start chatting with just one click"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Pompeii</h1>
            </div>
            <Button 
              onClick={() => navigate('/chat')}
              className="bg-gradient-primary hover:shadow-glow transition-smooth"
            >
              Start Chatting
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-accent/20 px-4 py-2 rounded-full mb-6">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">1,247 people online now</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Meet New People
            <span className="block text-transparent bg-gradient-primary bg-clip-text">
              Around the World
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect instantly with strangers from across the globe. Share moments, make friends, 
            and discover new perspectives through random video chat.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/chat')}
              size="lg"
              className="bg-gradient-primary hover:shadow-glow transition-smooth text-lg px-8 py-3"
            >
              <Video className="w-5 h-5 mr-2" />
              Start Video Chat
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-3"
            >
              <Heart className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose Pompeii?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the best random video chat platform with features designed for meaningful connections
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-smooth">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Meet Someone New?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of people making new connections every day. Your next great conversation is just one click away.
          </p>
          <Button 
            onClick={() => navigate('/chat')}
            size="lg"
            className="bg-gradient-primary hover:shadow-glow transition-smooth text-lg px-12 py-3"
          >
            <Video className="w-5 h-5 mr-2" />
            Start Chatting Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">Pompeii</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Pompeii. Connect with the world, one chat at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;