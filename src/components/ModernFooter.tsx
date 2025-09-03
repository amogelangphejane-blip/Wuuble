import { Mail, MapPin, Phone, Twitter, Github, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ModernFooter = () => {
  const navigate = useNavigate();
  
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'Communities', href: '/communities' },
      { label: 'Courses', href: '#courses' },
      { label: 'Pricing', href: '#pricing' }
    ],
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Careers', href: '#careers' },
      { label: 'Blog', href: '#blog' },
      { label: 'Press', href: '#press' }
    ],
    support: [
      { label: 'Help Center', href: '#help' },
      { label: 'Contact Us', href: '#contact' },
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' }
    ]
  };

  const socialLinks = [
    { icon: Twitter, href: '#twitter', label: 'Twitter' },
    { icon: Github, href: '#github', label: 'GitHub' },
    { icon: Linkedin, href: '#linkedin', label: 'LinkedIn' }
  ];

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div 
                className="flex items-center space-x-2 cursor-pointer group mb-4"
                onClick={() => navigate('/')}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform duration-200 drop-shadow-sm">
                  W
                </div>
                <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Wuuble
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Building meaningful connections and fostering personal growth through exclusive social communities and collaborative experiences.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>wuuble@gmail.com</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>+27 67 161 4671</span>
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        if (link.href.startsWith('/')) {
                          navigate(link.href);
                        }
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        if (link.href.startsWith('/')) {
                          navigate(link.href);
                        }
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        if (link.href.startsWith('/')) {
                          navigate(link.href);
                        }
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © {currentYear} Wuuble. All rights reserved.
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-secondary rounded-lg"
                  aria-label={social.label}
                  onClick={(e) => e.preventDefault()}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};