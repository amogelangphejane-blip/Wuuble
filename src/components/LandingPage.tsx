import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  MessageCircle, 
  Calendar, 
  Star, 
  CheckCircle, 
  ArrowRight,
  Play,
  Award,
  Target,
  Zap,
  Shield,
  Globe
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
      description: "Join thriving learning communities where knowledge meets collaboration and growth happens naturally."
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Interactive Courses",
      description: "Access expertly crafted courses designed to accelerate your learning journey with practical skills."
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Real-time Discussions",
      description: "Engage in meaningful conversations with peers and mentors through our seamless chat system."
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Live Sessions",
      description: "Participate in scheduled workshops, webinars, and interactive learning sessions."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Achievements",
      description: "Track your progress and earn recognition for your learning milestones and contributions."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Safe Learning",
      description: "Learn in a secure, moderated environment designed for productive educational experiences."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      avatar: "SC",
      content: "LearnHub transformed my career. The community support and quality content made all the difference in my learning journey.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Product Designer",
      avatar: "MR",
      content: "The interactive discussions and peer feedback helped me grow faster than any traditional course ever could.",
      rating: 5
    },
    {
      name: "Emily Johnson",
      role: "Marketing Manager",
      avatar: "EJ",
      content: "I love how easy it is to connect with like-minded learners. The platform feels intuitive and engaging.",
      rating: 5
    }
  ];

  const stats = [
    { value: "50K+", label: "Active Learners" },
    { value: "200+", label: "Communities" },
    { value: "1M+", label: "Discussions" },
    { value: "95%", label: "Success Rate" }
  ];

  const courses = [
    {
      title: "Web Development Mastery",
      description: "Learn modern web development with React, Node.js, and best practices",
      students: 1250,
      rating: 4.9,
      image: "🌐",
      category: "Technology"
    },
    {
      title: "Digital Marketing Strategy",
      description: "Master digital marketing from SEO to social media and analytics",
      students: 890,
      rating: 4.8,
      image: "📱",
      category: "Marketing"
    },
    {
      title: "Data Science Fundamentals",
      description: "Dive into data analysis, machine learning, and statistical modeling",
      students: 2100,
      rating: 4.9,
      image: "📊",
      category: "Data Science"
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
              🚀 Join 50,000+ learners worldwide
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Learn Together,{' '}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Grow Faster
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Join vibrant learning communities where knowledge sharing accelerates growth. 
              Connect with peers, access premium courses, and transform your skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/communities' : '/auth')}
                className="bg-gradient-hero hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all px-8 py-3 text-lg"
              >
                {user ? 'Explore Communities' : 'Get Started Free'}
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
                Watch Demo
              </Button>
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
              Features
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything you need to learn and grow
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover powerful features designed to enhance your learning experience 
              and connect you with a global community of learners.
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

      {/* Courses Section */}
      <section id="courses" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-success/10 text-success border-success/20">
              Popular Courses
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Start learning today
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our most popular courses designed by industry experts 
              and loved by thousands of learners.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <Card 
                key={index}
                className="border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group bg-gradient-card"
              >
                <CardHeader>
                  <div className="text-4xl mb-4">{course.image}</div>
                  <Badge variant="secondary" className="w-fit mb-2">
                    {course.category}
                  </Badge>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {course.students.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                        {course.rating}
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
              View All Courses
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
              Testimonials
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Loved by learners worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our community members have to say about their 
              learning experience on LearnHub.
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
              Ready to transform your learning journey?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Join thousands of learners who are already growing their skills 
              and advancing their careers with LearnHub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate(user ? '/communities' : '/auth')}
                className="bg-white text-primary hover:bg-white/90 shadow-lg px-8 py-3 text-lg font-semibold"
              >
                {user ? 'Explore Communities' : 'Start Learning Today'}
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