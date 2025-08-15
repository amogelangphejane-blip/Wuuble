import React from 'react';
import { useParams } from 'react-router-dom';

console.log('🧪 TestGroupCall component loaded');

const TestGroupCall: React.FC = () => {
  console.log('🧪 TestGroupCall component rendering');
  
  const { id: communityId, callId } = useParams<{ id: string; callId?: string }>();
  
  console.log('🧪 TestGroupCall params:', { communityId, callId, pathname: window.location.pathname });
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: 'green' }}>✅ Test Group Call Page Working!</h1>
      <div style={{ marginTop: '20px' }}>
        <p><strong>Community ID:</strong> {communityId || 'Not found'}</p>
        <p><strong>Call ID:</strong> {callId || 'Not provided'}</p>
        <p><strong>Current URL:</strong> {window.location.pathname}</p>
        <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f5e8', border: '1px solid #4caf50' }}>
        <h3>🎉 If you see this page, routing is working!</h3>
        <p>This means the issue is likely in the GroupVideoChat component or its dependencies.</p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.history.back()}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default TestGroupCall;