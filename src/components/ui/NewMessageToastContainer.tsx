import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, User } from 'lucide-react';
import { newMessageNotifications, type NewMessageNotification } from '../../lib/newMessageNotifications';

export function NewMessageToastContainer() {
  const [notifications, setNotifications] = useState<NewMessageNotification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    return newMessageNotifications.subscribe(setNotifications);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {notifications.map((notif) => (
        <NewMessageToast
          key={notif.id}
          notification={notif}
          onDismiss={() => newMessageNotifications.dismiss(notif.id)}
          onOpen={() => {
            newMessageNotifications.dismiss(notif.id);
            navigate(`/inbox/${notif.chat.fourbased_id}/chat/${notif.chat.chat_id}`);
          }}
        />
      ))}
    </div>
  );
}

interface NewMessageToastProps {
  notification: NewMessageNotification;
  onDismiss: () => void;
  onOpen: () => void;
}

function NewMessageToast({ notification, onDismiss, onOpen }: NewMessageToastProps) {
  const { chat, newCount } = notification;

  return (
    <div
      className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden animate-slide-in"
      style={{ borderLeft: '3px solid #ED4C27' }}
    >
      {/* Header: which 4based account */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border-b border-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          <AccountAvatar src={chat.account_img_url} name={chat.account_name ?? 'Account'} />
          <span className="text-[11px] text-gray-400 truncate font-medium">
            {chat.account_name ?? 'Unbekanntes Profil'}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors ml-2"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body: customer + message preview */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start gap-2.5">
          <CustomerAvatar
            src={chat.customer_avatar_url ?? undefined}
            name={chat.customer_name}
            isOnline={chat.customer_is_online}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-100 truncate">
                {chat.customer_name}
              </span>
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                style={{ background: 'rgba(237,76,39,0.15)', color: '#ED4C27' }}
              >
                {newCount} neu
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
              {chat.last_message_preview || 'Neue Nachricht'}
            </p>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="px-3 pb-3">
        <button
          onClick={onOpen}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#ED4C27] hover:bg-[#D8431F] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <MessageSquare size={13} />
          Chat öffnen
        </button>
      </div>
    </div>
  );
}

function AccountAvatar({ src, name }: { src?: string; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-4 h-4 rounded-full object-cover shrink-0"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center shrink-0 text-[8px] font-semibold text-gray-400">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CustomerAvatar({ src, name, isOnline }: { src?: string; name: string; isOnline?: boolean }) {
  const avatar = src ? (
    <img
      src={src}
      alt={name}
      className="w-9 h-9 rounded-full object-cover shrink-0"
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  ) : (
    <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 text-sm font-semibold text-gray-300">
      {(name ?? '').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || <User size={14} />}
    </div>
  );

  if (!isOnline) return avatar;

  return (
    <div className="relative shrink-0">
      {avatar}
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-slate-800" />
    </div>
  );
}
