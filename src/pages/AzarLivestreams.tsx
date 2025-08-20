import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AzarLivestream } from '@/components/AzarLivestream';
import { LivestreamDiscovery } from '@/components/LivestreamDiscovery';
import { LiveStream } from '@/services/livestreamService';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type PageMode = 'discovery' | 'broadcast' | 'view';

export default function AzarLivestreams() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const [pageMode, setPageMode] = useState<PageMode>(
    streamId ? 'view' : 'discovery'
  );
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

  const handleStreamSelect = (stream: LiveStream) => {
    setSelectedStream(stream);
    setPageMode('view');
    navigate(`/azar-livestreams/${stream.id}`);
  };

  const handleStartBroadcast = () => {
    setPageMode('broadcast');
    navigate('/azar-livestreams/broadcast');
  };

  const handleBack = () => {
    setPageMode('discovery');
    setSelectedStream(null);
    navigate('/azar-livestreams');
  };

  const renderContent = () => {
    switch (pageMode) {
      case 'discovery':
        return (
          <LivestreamDiscovery
            onStreamSelect={handleStreamSelect}
            onStartBroadcast={handleStartBroadcast}
          />
        );
      
      case 'broadcast':
        return (
          <div className="relative">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="absolute top-4 left-4 z-50 bg-black/50 text-white hover:bg-black/70"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <AzarLivestream
              mode="broadcast"
              onBack={handleBack}
            />
          </div>
        );
      
      case 'view':
        return (
          <div className="relative">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="absolute top-4 left-4 z-50 bg-black/50 text-white hover:bg-black/70"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <AzarLivestream
              mode="view"
              stream={selectedStream || undefined}
              onBack={handleBack}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {renderContent()}
    </div>
  );
}