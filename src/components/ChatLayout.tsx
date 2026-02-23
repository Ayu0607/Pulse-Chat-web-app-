"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";

export default function ChatLayout() {
  const { user } = useUser();
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const currentUser = useQuery(api.users.getCurrentUser, user ? { clerkId: user.id } : "skip");
  const setOnlineStatus = useMutation(api.users.setOnlineStatus);

  useEffect(() => {
    if (!user) return;
    setOnlineStatus({ clerkId: user.id, isOnline: true });

    const handleVisibility = () => setOnlineStatus({ clerkId: user.id, isOnline: document.visibilityState === "visible" });
    const handleUnload = () => setOnlineStatus({ clerkId: user.id, isOnline: false });

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
      setOnlineStatus({ clerkId: user.id, isOnline: false });
    };
  }, [user, setOnlineStatus]);

  const handleSelectConversation = (id: Id<"conversations">) => {
    setSelectedConversationId(id);
    setShowSidebar(false);
  };

  const handleBack = () => {
    setShowSidebar(true);
    setSelectedConversationId(null);
  };

  if (!currentUser) return (
    <div className="h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex gap-1"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div>
    </div>
  );

  return (
    <div className="h-screen flex bg-[#0a0a0f] overflow-hidden">
      <div className={`${showSidebar ? "flex" : "hidden"} md:flex w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-[#2a2a38] flex-col`}>
        <Sidebar currentUser={currentUser} selectedConversationId={selectedConversationId} onSelectConversation={handleSelectConversation} />
      </div>
      <div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0`}>
        {selectedConversationId && currentUser ? (
          <ChatWindow conversationId={selectedConversationId} currentUser={currentUser} onBack={handleBack} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1a24] flex items-center justify-center text-2xl">💬</div>
            <div>
              <h2 className="text-lg font-semibold text-[#f0f0f8]">Select a conversation</h2>
              <p className="text-sm text-[#8888a8] mt-1">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}