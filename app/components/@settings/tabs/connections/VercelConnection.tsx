import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { logStore } from '~/lib/stores/logs';
import { vercelConnection, isConnecting, updateVercelConnection, fetchVercelStats } from '~/lib/stores/vercel';

export default function VercelConnection() {
  const connection = useStore(vercelConnection);
  const connecting = useStore(isConnecting);

  /*
   * const fetchingStats = useStore(isFetchingStats); // ❌ Unused
   * const [isProjectsExpanded, setIsProjectsExpanded] = useState(false); // ❌ Unused
   */

  // Auto connect using env var
  useEffect(() => {
    const tokenFromEnv = import.meta.env.VITE_VERCEL_TOKEN;

    if (tokenFromEnv && !connection.user && !connection.token) {
      updateVercelConnection({ user: null, token: tokenFromEnv });
      handleConnect(new Event('submit') as any);
    }
  }, []);

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    isConnecting.set(true);

    try {
      const response = await fetch('https://api.vercel.com/v2/user', {
        headers: {
          Authorization: `Bearer ${connection.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token or unauthorized');
      }

      const userData = (await response.json()) as any;
      updateVercelConnection({
        user: userData.user || userData,
        token: connection.token,
      });

      await fetchVercelStats(connection.token);
      toast.success('Successfully connected to Vercel');
    } catch (error) {
      console.error('Auth error:', error);
      logStore.logError('Failed to authenticate with Vercel', { error });
      toast.error('Failed to connect to Vercel');
      updateVercelConnection({ user: null, token: '' });
    } finally {
      isConnecting.set(false);
    }
  };

  const handleDisconnect = () => {
    updateVercelConnection({ user: null, token: '' });
    toast.success('Disconnected from Vercel');
  };

  return (
    <motion.div
      className="bg-[#FFFFFF] dark:bg-[#0A0A0A] rounded-lg border border-[#E5E5E5] dark:border-[#1A1A1A]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              className="w-5 h-5 dark:invert"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src={`https://cdn.simpleicons.org/vercel/black`}
            />
            <h3 className="text-base font-medium text-bolt-elements-textPrimary">Vercel Connection</h3>
          </div>
        </div>

        {!connection.user ? (
          <div className="space-y-4">
            {!import.meta.env.VITE_VERCEL_TOKEN && (
              <div>
                <label className="block text-sm text-bolt-elements-textSecondary mb-2">Personal Access Token</label>
                <input
                  type="password"
                  value={connection.token}
                  onChange={(e) => updateVercelConnection({ ...connection, token: e.target.value })}
                  disabled={connecting}
                  placeholder="Enter your Vercel personal access token"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8F8F8] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#333333] text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-1 focus:ring-bolt-elements-borderColorActive disabled:opacity-50"
                />
                <div className="mt-2 text-sm text-bolt-elements-textSecondary">
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bolt-elements-borderColorActive hover:underline inline-flex items-center gap-1"
                  >
                    Get your token
                    <div className="i-ph:arrow-square-out w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={connecting || !connection.token}
              className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 bg-[#303030] text-white hover:bg-[#5E41D0] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-95"
            >
              {connecting ? (
                <>
                  <div className="i-ph:spinner-gap animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <div className="i-ph:plug-charging w-4 h-4" />
                  Connect
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-[#E53E3E] text-white rounded-lg text-sm hover:bg-[#C53030]"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
