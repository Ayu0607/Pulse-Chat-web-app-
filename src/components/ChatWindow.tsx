"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { ArrowLeft, Send, ChevronDown } from "lucide-react";
import { formatMessageTime } from "@/lib/utils";

interface Props {
  conversationId: Id<"conversations">;
  currentUser: Doc<"users">;
  onBack: () => void;
}

export default function ChatWindow({ conversationId, currentUser, onBack }: Props) {
  const [messageText, setMessageText] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const prevCount = useRef(0);

  const messages = useQuery(api.messages.getMessages, { conversationId });
  const conversation = useQuery(api.conversations.getConversation, { conversationId });
  const typingUsers = useQuery(api.typing.getTypingUsers, { conversationId, currentUserId: currentUser._id });

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markAsRead);
  const setTyping = useMutation(api.typing.setTyping);

  const otherUserId = conversation?.participantIds.find((id) => id !== currentUser._id);
  const otherUser = useQuery(api.users.getUserById, otherUserId ? { userId: otherUserId } : "skip");

  useEffect(() => { markAsRead({ conversationId, userId: currentUser._id }); }, [conversationId, currentUser._id, markAsRead, messages]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => messagesEndRef.current?.scrollIntoView({ behavior });

  useEffect(() => {
    if (!messages) return;
    if (messages.length > prevCount.current) {
      if (isAtBottom) { scrollToBottom(); setHasNewMessages(false); }
      else if (prevCount.current > 0) {
        const last = messages[messages.length - 1];
        if (last?.senderId !== currentUser._id) setHasNewMessages(true);
      }
    }
    prevCount.current = messages.length;
  }, [messages, isAtBottom, currentUser._id]);

  useEffect(() => {
    if (messages && messages.length > 0 && prevCount.current === 0) scrollToBottom("instant");
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setIsAtBottom(atBottom);
    if (atBottom) setHasNewMessages(false);
  }, []);

  const handleTyping = () => {
    setTyping({ conversationId, userId: currentUser._id, isTyping: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setTyping({ conversationId, userId: currentUser._id, isTyping: false }), 2000);
  };

  const handleSend = async () => {
    const content = messageText.trim();
    if (!content) return;
    setMessageText("");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    setTyping({ conversationId, userId: currentUser._id, isTyping: false });
    await sendMessage({ conversationId, senderId: currentUser._id, content });
    setIsAtBottom(true);
    setHasNewMessages(false);
    scrollToBottom();
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a38]">
        <button onClick={onBack} className="md:hidden p-2 -ml-1 rounded-xl text-[#8888a8] hover:text-white hover:bg-[#1a1a24] transition-all"><ArrowLeft size={18}/></button>
        {otherUser ? (
          <>
            <div className="relative">
              {otherUser.imageUrl ? <img src={otherUser.imageUrl} alt={otherUser.name} className="w-9 h-9 rounded-full object-cover"/>
                : <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-semibold">{otherUser.name.charAt(0).toUpperCase()}</div>}
              {otherUser.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0a0a0f]"/>}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f0f0f8]">{otherUser.name}</p>
              <p className="text-xs text-[#8888a8]">{otherUser.isOnline ? <span className="text-green-400">Online</span> : "Offline"}</p>
            </div>
          </>
        ) : <div className="w-9 h-9 rounded-full bg-[#1a1a24] animate-pulse"/>}
      </div>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 relative">
        {messages === undefined ? (
          <div className="flex justify-center py-8"><div className="flex gap-1"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-4xl">👋</div>
            <div><p className="text-sm font-medium text-[#f0f0f8]">Start the conversation</p><p className="text-xs text-[#8888a8] mt-1">Say hello to {otherUser?.name ?? "them"}!</p></div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isOwn = msg.senderId === currentUser._id;
              const prev = messages[index - 1];
              const next = messages[index + 1];
              const isFirst = !prev || prev.senderId !== msg.senderId;
              const isLast = !next || next.senderId !== msg.senderId;
              const showDate = !prev || new Date(prev.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

              return (
                <div key={msg._id}>
                  {showDate && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-[#2a2a38]"/>
                      <span className="text-xs text-[#8888a8] px-2">{new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: new Date(msg.createdAt).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined })}</span>
                      <div className="flex-1 h-px bg-[#2a2a38]"/>
                    </div>
                  )}
                  <div className={`flex items-end gap-2 message-enter ${isOwn ? "flex-row-reverse" : "flex-row"} ${isFirst ? "mt-3" : "mt-0.5"}`}>
                    {!isOwn && (
                      <div className="w-7 h-7 flex-shrink-0 mb-1">
                        {isLast && (msg.sender?.imageUrl
                          ? <img src={msg.sender.imageUrl} alt={msg.sender.name} className="w-7 h-7 rounded-full object-cover"/>
                          : <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-semibold">{msg.sender?.name?.charAt(0) ?? "?"}</div>)}
                      </div>
                    )}
                    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[75%]`}>
                      <div className={`px-4 py-2.5 text-sm ${isOwn ? "bg-indigo-500 text-white" : "bg-[#1a1a24] border border-[#2a2a38] text-[#f0f0f8]"} ${isFirst && isLast ? "rounded-2xl" : isFirst ? isOwn ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm" : isLast ? isOwn ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm" : isOwn ? "rounded-l-2xl rounded-r-sm" : "rounded-r-2xl rounded-l-sm"}`}>
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                      </div>
                      {isLast && <p className="text-[10px] text-[#8888a8] mt-1 px-1">{formatMessageTime(msg.createdAt)}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {typingUsers && typingUsers.length > 0 && (
          <div className="flex items-end gap-2 mt-2">
            <div className="w-7 h-7 rounded-full bg-[#2a2a38] flex items-center justify-center text-xs">{typingUsers[0].user?.name?.charAt(0) ?? "?"}</div>
            <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {hasNewMessages && (
        <button onClick={() => { scrollToBottom(); setHasNewMessages(false); }}
          className="absolute bottom-24 left-1/2 bg-indigo-500 text-white text-xs px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg hover:bg-indigo-400 transition-all animate-slide-up z-10">
          <ChevronDown size={13}/> New messages
        </button>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[#2a2a38]">
        <div className="flex items-end gap-2">
          <textarea value={messageText} onChange={(e) => { setMessageText(e.target.value); handleTyping(); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message..." rows={1}
            className="flex-1 bg-[#1a1a24] border border-[#2a2a38] rounded-2xl px-4 py-3 text-sm text-[#f0f0f8] placeholder:text-[#8888a8] focus:outline-none focus:border-indigo-500/50 resize-none transition-all max-h-32 overflow-y-auto"
            style={{ minHeight: "44px" }}/>
          <button onClick={handleSend} disabled={!messageText.trim()}
            className="p-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl transition-all flex-shrink-0">
            <Send size={16}/>
          </button>
        </div>
        <p className="text-xs text-[#8888a8]/60 mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}