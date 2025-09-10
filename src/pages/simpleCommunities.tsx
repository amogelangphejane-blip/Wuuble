import React from 'react';

const SimpleCommunities: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
            <p className="mt-2 text-gray-600">
              Discover and join communities that match your interests
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Sample Community Cards */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              General Discussion
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Chat about anything and everything with the community
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">1,234 members</span>
              <button className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600">
                Join
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎮</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gaming Hub
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Connect with fellow gamers and discuss your favorite games
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">856 members</span>
              <button className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600">
                Join
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Creative Arts
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Share your artwork and get inspired by others
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">642 members</span>
              <button className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600">
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Create Community Button */}
        <div className="mt-8 text-center">
          <button className="bg-green-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors">
            + Create New Community
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleCommunities;