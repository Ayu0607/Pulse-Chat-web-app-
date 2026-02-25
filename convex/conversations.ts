import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateConversation = mutation({
  args: { currentUserId: v.id("users"), otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("conversations").collect();
    const existing = all.find((c) => c.participantIds.includes(args.currentUserId) && c.participantIds.includes(args.otherUserId));
    if (existing) return existing._id;
    return await ctx.db.insert("conversations", { participantIds: [args.currentUserId, args.otherUserId], lastMessageTime: Date.now() });
  },
});

export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("conversations").collect();
    const mine = all.filter((c) => c.participantIds.includes(args.userId));
    mine.sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0));
    return await Promise.all(mine.map(async (conv) => {
      const otherId = conv.participantIds.find((id) => id !== args.userId);
      const otherUser = otherId ? await ctx.db.get(otherId) : null;
      const messages = await ctx.db.query("messages").withIndex("by_conversation", (q) => q.eq("conversationId", conv._id)).collect();
      const unreadCount = messages.filter((m) => m.senderId !== args.userId && !m.readBy.includes(args.userId)).length;
      return { ...conv, otherUser, unreadCount };
    }));
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => ctx.db.get(args.conversationId),
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    await Promise.all(messages.map((m) => ctx.db.delete(m._id)));

    // Delete all typing indicators
    const typing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    await Promise.all(typing.map((t) => ctx.db.delete(t._id)));

    // Delete the conversation itself
    await ctx.db.delete(args.conversationId);
  },
});