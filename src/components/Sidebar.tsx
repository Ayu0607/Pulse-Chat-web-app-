"use client";
import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { Search, MessageSquarePlus, X, Trash2 } from "lucide-react";
import { formatConversationTime } from "@/lib/utils";

interface SidebarProps {
  currentUser: Doc<"users">;
  selectedConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
  onDeleteConversation: () => void;
}

export default function Sidebar({ currentUser, selectedConversationId, onSelectConversation, onDeleteConversation }: SidebarProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<Id<"conversations"> | null>(null);

  const conversations = useQuery(api.conversations.getUserConversations, { userId: currentUser._id });
  const allUsers = useQuery(api.users.getAllUsers, { currentClerkId: user?.id ?? "" });
  const searchResults = useQuery(api.users.searchUsers, searchQuery.trim() ? { query: searchQuery, currentClerkId: user?.id ?? "" } : "skip");
  const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);
  const deleteConversation = useMutation(api.conversations.deleteConversation);

  const handleUserClick = async (otherUser: Doc<"users">) => {
    const convId = await getOrCreateConversation({ currentUserId: currentUser._id, otherUserId: otherUser._id });
    onSelectConversation(convId);
    setShowUserSearch(false);
    setSearchQuery("");
  };

  const handleDelete = async (e: React.MouseEvent, convId: Id<"conversations">) => {
    e.stopPropagation();
    setConfirmDeleteId(convId);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    await deleteConversation({ conversationId: confirmDeleteId });
    if (selectedConversationId === confirmDeleteId) onDeleteConversation();
    setConfirmDeleteId(null);
  };

  const displayedUsers = searchQuery.trim() ? searchResults : allUsers;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#16161f] border border-[#2a2a38] rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <div className="text-2xl mb-3">🗑️</div>
            <h3 className="text-white font-semibold text-lg mb-1">Delete conversation?</h3>
            <p className="text-[#8888a8] text-sm mb-5">This will permanently delete all messages. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#2a2a38] text-[#8888a8] hover:text-white hover:bg-[#1a1a24] transition-all text-sm font-medium">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-b border-[#2a2a38]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white tracking-tight">Pulse<span className="text-indigo-400">.</span></h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowUserSearch(!showUserSearch)}
              className={`p-2 rounded-xl transition-all ${showUserSearch ? "bg-indigo-500/20 text-indigo-400" : "text-[#8888a8] hover:text-white hover:bg-[#1a1a24]"}`}>
              {showUserSearch ? <X size={18}/> : <MessageSquarePlus size={18}/>}
            </button>
            <UserButton afterSignOutUrl="/sign-in"/>
          </div>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888a8]"/>
          <input type="text" placeholder={showUserSearch ? "Search users..." : "Search conversations..."}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setShowUserSearch(true)}
            className="w-full bg-[#1a1a24] border border-[#2a2a38] rounded-xl py-2 pl-9 pr-3 text-sm text-[#f0f0f8] placeholder:text-[#8888a8] focus:outline-none focus:border-indigo-500/50 transition-all"/>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showUserSearch ? (
          <div className="p-2">
            <p className="text-xs text-[#8888a8] px-3 py-2 uppercase tracking-wider font-medium">{searchQuery ? "Results" : "All users"}</p>
            {displayedUsers === undefined ? (
              <div className="flex justify-center py-8"><div className="flex gap-1"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div></div>
            ) : displayedUsers.length === 0 ? (
              <div className="text-center py-12 px-4"><div className="text-3xl mb-3">🔍</div><p className="text-sm text-[#8888a8]">{searchQuery ? "No users found" : "No other users yet"}</p></div>
            ) : displayedUsers.map((u) => (
              <button key={u._id} onClick={() => handleUserClick(u)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1a1a24] transition-all text-left">
                <div className="relative flex-shrink-0">
                  {u.imageUrl ? <img src={u.imageUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover"/>
                    : <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-semibold">{u.name.charAt(0).toUpperCase()}</div>}
                  {u.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f]"/>}
                </div>
                <div><p className="text-sm font-medium text-[#f0f0f8]">{u.name}</p><p className="text-xs text-[#8888a8]">{u.isOnline ? "Online" : "Offline"}</p></div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-2">
            {conversations === undefined ? (
              <div className="flex justify-center py-8"><div className="flex gap-1"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-sm font-medium text-[#f0f0f8] mb-1">No conversations yet</p>
                <p className="text-xs text-[#8888a8]">Click the icon above to start chatting</p>
              </div>
            ) : conversations.map((conv) => {
              const other = conv.otherUser;
              if (!other) return null;
              return (
                <div key={conv._id} className="relative group">
                  <button onClick={() => onSelectConversation(conv._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left border ${conv._id === selectedConversationId ? "bg-indigo-500/15 border-indigo-500/20" : "hover:bg-[#1a1a24] border-transparent"}`}>
                    <div className="relative flex-shrink-0">
                      {other.imageUrl ? <img src={other.imageUrl} alt={other.name} className="w-11 h-11 rounded-full object-cover"/>
                        : <div className="w-11 h-11 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold">{other.name.charAt(0).toUpperCase()}</div>}
                      {other.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f]"/>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-medium text-[#f0f0f8] truncate">{other.name}</p>
                        {conv.lastMessageTime && <span className="text-xs text-[#8888a8] flex-shrink-0 ml-2">{formatConversationTime(conv.lastMessageTime)}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[#8888a8] truncate flex-1">{conv.lastMessagePreview ?? "No messages yet"}</p>
                        {conv.unreadCount > 0 && <span className="ml-2 flex-shrink-0 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">{conv.unreadCount > 9 ? "9+" : conv.unreadCount}</span>}
                      </div>
                    </div>
                  </button>

                  {/* Delete button - appears on hover */}
                  <button
                    onClick={(e) => handleDelete(e, conv._id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#8888a8] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete conversation">
                    <Trash2 size={14}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}