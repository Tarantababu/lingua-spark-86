import React, { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function PocketBaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [healthData, setHealthData] = useState<any>(null);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpass123');
  const [authStatus, setAuthStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Test connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setConnectionStatus('checking');
    try {
      const response = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/api/health`);
      const data = await response.json();
      setHealthData(data);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
    }
  };

  const testAuth = async () => {
    setIsLoading(true);
    setAuthStatus('');
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      setAuthStatus(`✅ Login successful! User: ${authData.record.email}`);
      console.log('Auth data:', authData);
    } catch (error: any) {
      setAuthStatus(`❌ Login failed: ${error.message}`);
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testCollections = async () => {
    setIsLoading(true);
    setAuthStatus('');
    try {
      // Try to fetch lessons
      const lessons = await pb.collection('lessons').getList(1, 10);
      setAuthStatus(`✅ Collections accessible! Found ${lessons.items.length} lessons`);
      console.log('Lessons:', lessons);
    } catch (error: any) {
      setAuthStatus(`❌ Collection access failed: ${error.message}`);
      console.error('Collection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setAuthStatus('Logged out');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🧪 PocketBase Connection Test</h1>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {connectionStatus === 'checking' && <Loader2 className="w-5 h-5 animate-spin" />}
            {connectionStatus === 'connected' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {connectionStatus === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>PocketBase URL:</strong>{' '}
              <code className="bg-muted px-2 py-1 rounded">{import.meta.env.VITE_POCKETBASE_URL}</code>
            </p>
            <p className="text-sm">
              <strong>Status:</strong>{' '}
              <span className={connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
                {connectionStatus === 'connected' ? '✅ Connected' : connectionStatus === 'error' ? '❌ Connection Failed' : '⏳ Checking...'}
              </span>
            </p>
            {healthData && (
              <p className="text-sm">
                <strong>Health Check:</strong> {JSON.stringify(healthData)}
              </p>
            )}
            <Button onClick={testConnection} variant="outline" size="sm">
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔐 Authentication Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email:</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password:</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="testpass123"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={testAuth} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Test Login
              </Button>
              <Button onClick={testCollections} disabled={isLoading} variant="secondary">
                Test Collections
              </Button>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </div>
            {authStatus && (
              <p className="text-sm p-3 bg-muted rounded">{authStatus}</p>
            )}
            {pb.authStore.isValid && (
              <p className="text-sm text-green-600">
                ✅ Currently authenticated as: {pb.authStore.model?.email}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <h3 className="font-semibold">Before testing authentication:</h3>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Open PocketBase admin: <a href="https://linguaspark-pb.fly.dev/_/" target="_blank" className="text-blue-600 underline">https://linguaspark-pb.fly.dev/_/</a></li>
            <li>Create admin account (first time)</li>
            <li>Import schema from <code>pocketbase/pb_schema.json</code></li>
            <li>Enable realtime on: vocabulary, reading_sessions, profiles</li>
            <li>Create a test user:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Email: test@example.com</li>
                <li>Password: testpass123</li>
              </ul>
            </li>
            <li>Then return here and click "Test Login"</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="font-semibold text-yellow-800">⚠️ Important URLs:</p>
            <ul className="list-disc list-inside ml-2 text-yellow-700">
              <li>Admin Dashboard: https://linguaspark-pb.fly.dev/_/</li>
              <li>API Endpoint: https://linguaspark-pb.fly.dev/api/</li>
              <li>Health Check: https://linguaspark-pb.fly.dev/api/health</li>
            </ul>
            <p className="mt-2 text-yellow-700 text-xs">
              Note: The root URL (/) will show 404 - this is normal!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
