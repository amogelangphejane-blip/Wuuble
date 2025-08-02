import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Users, Globe, Shield, Zap, Crown, Star, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroWoman from '@/assets/hero-woman.webp';
import womanLaptop from '@/assets/woman-laptop.jpg';
import womanLaptop2 from '@/assets/woman-laptop-2.jpg';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Crown className="w-6 h-6" />,
      title: "Elite Connections",
      description: "Connect with industry leaders, entrepreneurs, and influential minds from around the globe"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Premium Community",
      description: "Join an exclusive network of successful professionals and thought leaders"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Verified Profiles",
      description: "Connect with confidence through our verified member system ensuring authentic interactions"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Curated Matches",
      description: "Our algorithm connects you with influential people who share your interests and goals"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-luxury/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-luxury opacity-5"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-luxury/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-sm bg-background/80">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-luxury rounded-lg flex items-center justify-center shadow-luxury">
                  <Crown className="w-5 h-5 text-luxury-foreground" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-luxury bg-clip-text text-transparent">Inner Circle</h1>
              </div>
              <Button 
                onClick={() => navigate('/chat')}
                className="bg-gradient-luxury hover:shadow-luxury transition-smooth"
              >
                Join Elite Circle
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 bg-luxury/20 px-4 py-2 rounded-full mb-6 border border-luxury/30">
                  <Crown className="w-4 h-4 text-luxury" />
                  <span className="text-sm font-medium text-foreground">832 influential leaders online</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                  Meet Influential
                  <span className="block text-transparent bg-gradient-luxury bg-clip-text">
                    Industry Leaders
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                  Connect with an elite group of like-minded people. 
                  Expand your network and unlock opportunities through premium video conversations.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    onClick={() => navigate('/chat')}
                    size="lg"
                    className="bg-gradient-luxury hover:shadow-luxury transition-smooth text-lg px-8 py-3"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Connect with Leaders
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="text-lg px-8 py-3 border-luxury text-luxury hover:bg-luxury/10"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    View Elite Features
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-luxury">
                  <img 
                    src={heroWoman} 
                    alt="Professional woman in premium video consultation" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury/20 to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-luxury/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-luxury-foreground flex items-center">
                      <Crown className="w-3 h-3 mr-1" />
                      Elite Member
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-luxury rounded-full opacity-20 blur-2xl"></div>
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-luxury rounded-full opacity-30 blur-xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose <span className="text-transparent bg-gradient-luxury bg-clip-text">Inner Circle</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The premier platform for connecting with industry leaders, entrepreneurs, and influential minds
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="border-luxury/30 bg-card/50 backdrop-blur-sm hover:shadow-luxury transition-smooth hover:border-luxury/50 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-luxury rounded-lg flex items-center justify-center mb-4 group-hover:shadow-luxury transition-smooth">
                    <div className="text-luxury-foreground">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-luxury transition-smooth">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Elite Showcase */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative group">
              <img 
                src={womanLaptop} 
                alt="Executive in professional video consultation" 
                className="w-full h-80 object-cover rounded-2xl shadow-luxury"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-luxury/10 to-transparent rounded-2xl"></div>
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-foreground">CEO, Tech Startup</span>
              </div>
            </div>
            <div className="relative group">
              <img 
                src={womanLaptop2} 
                alt="Business leader in premium network meeting" 
                className="w-full h-80 object-cover rounded-2xl shadow-luxury"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-luxury/10 to-transparent rounded-2xl"></div>
              <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-foreground">Investment Director</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="bg-gradient-to-r from-luxury/10 to-accent/10 rounded-2xl p-12 text-center border border-luxury/20 shadow-luxury">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Join the <span className="text-transparent bg-gradient-luxury bg-clip-text">Elite Circle</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with industry leaders, entrepreneurs, and visionaries. Your next breakthrough conversation awaits.
            </p>
            <Button 
              onClick={() => navigate('/chat')}
              size="lg"
              className="bg-gradient-luxury hover:shadow-luxury transition-smooth text-lg px-12 py-3"
            >
              <Crown className="w-5 h-5 mr-2" />
              Enter Elite Network
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-6 h-6 bg-gradient-luxury rounded flex items-center justify-center">
                  <Crown className="w-4 h-4 text-luxury-foreground" />
                </div>
                <span className="font-semibold bg-gradient-luxury bg-clip-text text-transparent">Inner Circle</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2024 Inner Circle. Where influence meets opportunity.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;