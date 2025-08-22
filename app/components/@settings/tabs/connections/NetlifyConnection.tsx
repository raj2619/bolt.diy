import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { netlifyConnection, updateNetlifyConnection } from '~/lib/stores/netlify';

export default function NetlifyConnection() {
  const connection = useStore(netlifyConnection);
  const [tokenInput, setTokenInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const tokenFromEnv = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN;

    if (tokenFromEnv && !connection?.user) {
      connectWithToken(tokenFromEnv);
    }
  }, [connection?.user]);

  const connectWithToken = async (token: string) => {
    setIsConnecting(true);

    try {
      const response = await fetch('https://api.netlify.com/api/v1/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      const user = await response.json();
      updateNetlifyConnection({ user: user as any, token });
      toast.success('Auto-connected to Netlify');
    } catch (err) {
      console.error('Netlify connection failed', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    if (!tokenInput) {
      return;
    }

    connectWithToken(tokenInput);
    setTokenInput('');
  };

  const handleDisconnect = () => {
    updateNetlifyConnection({ user: null, token: '' });
    toast.success('Disconnected from Netlify');
  };

  if (connection?.user && import.meta.env.VITE_NETLIFY_ACCESS_TOKEN) {
    return (
      <div>
        <p>Connected as {connection.user.email}</p>
        <button onClick={handleDisconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      <h3>Netlify Connection</h3>
      {!connection?.user ? (
        <div>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Enter your Netlify token"
          />
          <button onClick={handleConnect} disabled={!tokenInput || isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      ) : (
        <div>
          <p>Connected as {connection.user.email}</p>
          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
