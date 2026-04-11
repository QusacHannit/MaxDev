import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar } from './ui/Avatar';

interface ChatProps {
  jobId: string;
}

const Chat: React.FC<ChatProps> = ({ jobId }) => {
  const { currentUser, sendMessage, getJobMessages, getUserById, refreshMessages } = useApp();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = getJobMessages(jobId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загружаем сообщения сразу и затем обновляем по polling.
  useEffect(() => {
    refreshMessages(jobId);
    const timer = setInterval(() => {
      refreshMessages(jobId);
    }, 2000);
    return () => clearInterval(timer);
  }, [jobId, refreshMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || !currentUser || sending) return;
    setSending(true);
    await sendMessage(jobId, text.trim(), selectedFile || undefined);
    setText('');
    setSelectedFile(null);
    setSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-slate-500 text-sm">Начните переписку</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const sender = getUserById(msg.senderId);
            const isMe = msg.senderId === currentUser?.id;

            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar alt={sender?.name || 'Пользователь'} role={sender?.role} size="sm" className="!w-7 !h-7 !text-[11px] !ring-1 !ring-white shadow-sm shrink-0" />
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMe
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'
                  }`}>
                    {msg.text}
                    {msg.file && msg.fileName && (
                      <a
                        href={msg.file.startsWith('/') ? msg.file : `/api/files/${msg.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${
                          isMe ? 'bg-white/20 text-white' : 'bg-violet-50 text-violet-700'
                        } text-xs hover:opacity-80 transition-opacity`}
                        download={msg.fileName}
                      >
                        <Paperclip size={12} />
                        <span className="underline">{msg.fileName}</span>
                      </a>
                    )}
                  </div>
                  <div className={`text-xs text-slate-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    {!isMe && <span className="font-medium text-slate-600">{sender?.name} · </span>}
                    {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input — скрываем для администратора (режим наблюдения) */}
      {currentUser?.role === 'administrator' ? (
        <div className="border-t border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-400 text-center">
            👁 Режим наблюдения — администратор не может отправлять сообщения
          </p>
        </div>
      ) : (
        <div className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-violet-600 transition-colors rounded-xl hover:bg-violet-50"
            >
              <Paperclip size={18} />
            </button>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение... (Enter — отправить)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent max-h-24 min-h-[38px]"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 96) + 'px';
              }}
            />
            {selectedFile && (
              <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 rounded-xl border border-violet-200">
                <Paperclip size={14} className="text-violet-600" />
                <span className="text-xs text-violet-700 truncate max-w-[150px]">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-violet-400 hover:text-violet-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <button
              onClick={handleSend}
              disabled={(!text.trim() && !selectedFile) || sending}
              className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-violet-200"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
