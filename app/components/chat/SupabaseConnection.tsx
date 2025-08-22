import { useEffect } from 'react';
import { useSupabaseConnection } from '~/lib/hooks/useSupabaseConnection';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { chatId } from '~/lib/persistence/useChatHistory';
import { fetchSupabaseStats } from '~/lib/stores/supabase';
import { Dialog, DialogRoot, DialogClose, DialogTitle, DialogButton } from '~/components/ui/Dialog';

export function SupabaseConnection() {
  const {
    connection: supabaseConn,
    connecting,
    isDropdownOpen: isDialogOpen,
    setIsDropdownOpen: setIsDialogOpen,
    handleConnect,
    handleDisconnect,
    selectProject,
    updateToken,
    isConnected,
    fetchProjectApiKeys,
  } = useSupabaseConnection();

  const currentChatId = useStore(chatId);
  const envToken = import.meta.env.VITE_SUPABASE_ACCESS_TOKEN;

  // Auto-connect using env token
  useEffect(() => {
    if (envToken && !isConnected && !supabaseConn.token) {
      console.log('[Supabase] Auto-connecting using env token');
      updateToken(envToken);

      handleConnect().then(() => {
        fetchSupabaseStats(envToken)
          .then(() => {
            const projectId = supabaseConn.stats?.projects?.[0]?.id;

            if (projectId) {
              selectProject(projectId);
              fetchProjectApiKeys(projectId).catch(console.error);
            }
          })
          .catch(console.error);
      });
    }
  }, []);

  // Trigger dialog if dispatched from outside
  useEffect(() => {
    const handleOpenConnectionDialog = () => setIsDialogOpen(true);
    document.addEventListener('open-supabase-connection', handleOpenConnectionDialog);

    return () => {
      document.removeEventListener('open-supabase-connection', handleOpenConnectionDialog);
    };
  }, [setIsDialogOpen]);

  // Load selected project from localStorage if exists
  useEffect(() => {
    if (isConnected && currentChatId) {
      const savedProjectId = localStorage.getItem(`supabase-project-${currentChatId}`);

      if (!savedProjectId && supabaseConn.selectedProjectId) {
        localStorage.setItem(`supabase-project-${currentChatId}`, supabaseConn.selectedProjectId);
      } else if (savedProjectId && savedProjectId !== supabaseConn.selectedProjectId) {
        selectProject(savedProjectId);
      }
    }
  }, [isConnected, currentChatId]);

  // Update project ID in localStorage when it changes
  useEffect(() => {
    if (currentChatId && supabaseConn.selectedProjectId) {
      localStorage.setItem(`supabase-project-${currentChatId}`, supabaseConn.selectedProjectId);
    } else if (currentChatId && !supabaseConn.selectedProjectId) {
      localStorage.removeItem(`supabase-project-${currentChatId}`);
    }
  }, [currentChatId, supabaseConn.selectedProjectId]);

  // Re-fetch stats if token changes
  useEffect(() => {
    if (isConnected && supabaseConn.token) {
      fetchSupabaseStats(supabaseConn.token).catch(console.error);
    }
  }, [isConnected, supabaseConn.token]);

  // Fetch credentials if connected + project selected
  useEffect(() => {
    if (isConnected && supabaseConn.selectedProjectId && supabaseConn.token && !supabaseConn.credentials) {
      fetchProjectApiKeys(supabaseConn.selectedProjectId).catch(console.error);
    }
  }, [isConnected, supabaseConn.selectedProjectId, supabaseConn.token, supabaseConn.credentials]);

  if (!envToken && !isConnected) {
    return (
      <div className="relative">
        <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden mr-2 text-sm">
          <Button
            active
            disabled={connecting}
            onClick={() => setIsDialogOpen(!isDialogOpen)}
            className="hover:bg-bolt-elements-item-backgroundActive !text-white flex items-center gap-2"
          >
            <img
              className="w-4 h-4"
              height="20"
              width="20"
              crossOrigin="anonymous"
              src="https://cdn.simpleicons.org/supabase"
            />
            {isConnected && supabaseConn.project && (
              <span className="ml-1 text-xs max-w-[100px] truncate">{supabaseConn.project.name}</span>
            )}
          </Button>
        </div>

        <DialogRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {isDialogOpen && (
            <Dialog className="max-w-[520px] p-6">
              <div className="space-y-4">
                <DialogTitle>
                  <img className="w-5 h-5" src="https://cdn.simpleicons.org/supabase" />
                  Connect to Supabase
                </DialogTitle>
                <div>
                  <label className="block text-sm text-bolt-elements-textSecondary mb-2">Access Token</label>
                  <input
                    type="password"
                    value={supabaseConn.token}
                    onChange={(e) => updateToken(e.target.value)}
                    disabled={connecting}
                    placeholder="Enter your Supabase access token"
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-[#F8F8F8] dark:bg-[#1A1A1A]"
                  />
                  <div className="mt-2 text-sm text-bolt-elements-textSecondary">
                    <a
                      href="https://app.supabase.com/account/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3ECF8E] hover:underline"
                    >
                      Get your token
                    </a>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <DialogClose asChild>
                    <DialogButton type="secondary">Cancel</DialogButton>
                  </DialogClose>
                  <button
                    onClick={handleConnect}
                    disabled={connecting || !supabaseConn.token}
                    className="px-4 py-2 bg-[#3ECF8E] text-white rounded-lg text-sm hover:bg-[#3BBF84]"
                  >
                    {connecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            </Dialog>
          )}
        </DialogRoot>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden mr-2 text-sm">
        <Button
          active
          disabled={connecting}
          className="hover:bg-bolt-elements-item-backgroundActive !text-white flex items-center gap-2"
        >
          <img className="w-4 h-4" src="https://cdn.simpleicons.org/supabase" />
          {isConnected && supabaseConn.project && (
            <span className="ml-1 text-xs max-w-[100px] truncate">{supabaseConn.project.name}</span>
          )}
        </Button>
      </div>

      <div className="mt-2 flex justify-end">
        {isConnected && (
          <DialogButton type="danger" onClick={handleDisconnect}>
            <div className="i-ph:plugs w-4 h-4" />
            Disconnect
          </DialogButton>
        )}
      </div>
    </div>
  );
}

interface ButtonProps {
  active?: boolean;
  disabled?: boolean;
  children?: any;
  onClick?: VoidFunction;
  className?: string;
}

function Button({ active = false, disabled = false, children, onClick, className }: ButtonProps) {
  return (
    <button
      className={classNames(
        'flex items-center p-1.5',
        {
          'bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary':
            !active,
          'bg-bolt-elements-item-backgroundDefault text-bolt-elements-item-contentAccent': active && !disabled,
          'bg-bolt-elements-item-backgroundDefault text-alpha-gray-20 dark:text-alpha-white-20 cursor-not-allowed':
            disabled,
        },
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
