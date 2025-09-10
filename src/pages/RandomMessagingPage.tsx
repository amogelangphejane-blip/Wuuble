import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Users } from 'lucide-react';
import RandomMessaging from '../components/RandomMessaging';

const RandomMessagingPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Random Messaging - Wuuble</title>
        <meta name="description" content="Connect with random people through anonymous text messaging" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Random Messaging</h1>
                  <p className="text-sm text-gray-600">Connect with strangers worldwide</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '600px' }}>
            <RandomMessaging />
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Random Matching</h3>
              <p className="text-gray-600 text-sm">
                Get matched with random people from around the world.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-time Chat</h3>
              <p className="text-gray-600 text-sm">
                Enjoy seamless messaging with instant delivery.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Safe Environment</h3>
              <p className="text-gray-600 text-sm">
                Chat safely with the ability to end conversations anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RandomMessagingPage;