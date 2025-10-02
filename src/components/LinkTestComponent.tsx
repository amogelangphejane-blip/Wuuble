/**
 * Link Test Component
 * 
 * This is a diagnostic component to test if links are working properly.
 * Add this to your page temporarily to debug link issues.
 * 
 * Usage:
 * import { LinkTestComponent } from '@/components/LinkTestComponent';
 * <LinkTestComponent />
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

export const LinkTestComponent = () => {
  const [testUrl, setTestUrl] = useState('https://google.com');
  const [testResults, setTestResults] = useState<{
    anchorTag: string;
    windowOpen: string;
    normalized: string;
  } | null>(null);

  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return 'https://' + trimmed;
    }
    return trimmed;
  };

  const testAnchorTag = () => {
    const normalized = normalizeUrl(testUrl);
    console.log('Testing anchor tag with URL:', normalized);
    
    // Create a temporary anchor element
    const anchor = document.createElement('a');
    anchor.href = normalized;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
    
    setTestResults(prev => ({
      ...prev!,
      anchorTag: '✅ Attempted - Check if new tab opened',
      normalized
    }));
  };

  const testWindowOpen = () => {
    const normalized = normalizeUrl(testUrl);
    console.log('Testing window.open with URL:', normalized);
    
    try {
      const newWindow = window.open(normalized, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        setTestResults(prev => ({
          ...prev!,
          windowOpen: '✅ Success - New window opened',
          normalized
        }));
      } else {
        setTestResults(prev => ({
          ...prev!,
          windowOpen: '⚠️ Blocked - Check pop-up blocker',
          normalized
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev!,
        windowOpen: `❌ Error: ${error}`,
        normalized
      }));
    }
  };

  const testNormalization = () => {
    const normalized = normalizeUrl(testUrl);
    console.log('Original URL:', testUrl);
    console.log('Normalized URL:', normalized);
    
    const hasProtocol = normalized.startsWith('http://') || normalized.startsWith('https://');
    
    setTestResults({
      normalized: hasProtocol 
        ? `✅ Valid: ${normalized}` 
        : `❌ Invalid: ${normalized}`,
      anchorTag: '',
      windowOpen: ''
    });
  };

  return (
    <Card className="max-w-2xl mx-auto my-8 border-4 border-yellow-500">
      <CardHeader className="bg-yellow-50">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-yellow-600" />
          Link Diagnostic Tool
        </CardTitle>
        <p className="text-sm text-gray-600">
          Use this to test if links are working properly in your browser
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Test URL:</label>
          <Input
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Enter a URL to test"
            className="font-mono"
          />
          <p className="text-xs text-gray-500">
            Try: google.com, https://github.com, or any URL
          </p>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={testNormalization}
            variant="outline"
            className="w-full"
          >
            1. Test Normalization
          </Button>
          
          <Button
            onClick={testAnchorTag}
            variant="outline"
            className="w-full"
          >
            2. Test Anchor Tag
          </Button>
          
          <Button
            onClick={testWindowOpen}
            variant="outline"
            className="w-full"
          >
            3. Test window.open
          </Button>
        </div>

        {/* Direct Test Links */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="font-semibold text-sm">Direct Test Links:</h4>
          
          <div className="space-y-2">
            <a
              href="https://google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Simple Anchor - Google</span>
                <ExternalLink className="h-4 w-4" />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                If this works, anchor tags are fine
              </p>
            </a>
            
            <button
              onClick={() => window.open('https://github.com', '_blank', 'noopener,noreferrer')}
              className="w-full p-3 bg-green-50 rounded border border-green-200 hover:bg-green-100 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">window.open - GitHub</span>
                <ExternalLink className="h-4 w-4" />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                If this works, window.open is fine
              </p>
            </button>

            <div
              onClick={() => {
                const url = normalizeUrl('example.com');
                console.log('Styled div click test:', url);
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className="p-3 bg-purple-50 rounded border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Styled Div - Example</span>
                <ExternalLink className="h-4 w-4" />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Tests styled div with click handler (like link cards)
              </p>
            </div>
          </div>
        </div>

        {/* Results */}
        {testResults && (
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-3">Test Results:</h4>
            <div className="space-y-2 font-mono text-sm">
              {testResults.normalized && (
                <div className="p-2 bg-gray-50 rounded">
                  <strong>Normalized URL:</strong> {testResults.normalized}
                </div>
              )}
              {testResults.anchorTag && (
                <div className="p-2 bg-gray-50 rounded">
                  <strong>Anchor Tag:</strong> {testResults.anchorTag}
                </div>
              )}
              {testResults.windowOpen && (
                <div className="p-2 bg-gray-50 rounded">
                  <strong>window.open:</strong> {testResults.windowOpen}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="border-t pt-4 text-sm space-y-2">
          <h4 className="font-semibold">What to Check:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>✅ If direct test links work → Issue is with your link card styling</li>
            <li>⚠️ If window.open blocked → Check pop-up blocker in browser</li>
            <li>❌ If nothing works → Browser security settings or extensions blocking</li>
            <li>🔍 Check browser console (F12) for error messages</li>
          </ul>
        </div>

        {/* Console Check */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Check Browser Console:</p>
              <p className="text-blue-700 mt-1">
                Press F12 and look at the Console tab. All test attempts are logged there 
                with the URLs being used.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LinkTestComponent;
