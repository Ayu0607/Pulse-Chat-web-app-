import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: { conversationId: v.id("conversations"), senderId: v.id("users"), content: v.string() },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", { conversationId: args.conversationId, senderId: args.senderId, content: args.content, readBy: [args.senderId], createdAt: Date.now() });
    await ctx.db.patch(args.conversationId, { lastMessageId: messageId, lastMessageTime: Date.now(), lastMessagePreview: args.content.slice(0, 100) });
    return messageId;
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("messages").withIndex("by_conversation_time", (q) => q.eq("conversationId", args.conversationId)).order("asc").collect();
    return await Promise.all(messages.map(async (msg) => ({ ...msg, sender: await ctx.db.get(msg.senderId) })));
  },
});

export const markAsRead = mutation({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("messages").withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId)).collect();
    await Promise.all(messages.filter((m) => m.senderId !== args.userId && !m.readBy.includes(args.userId)).map((m) => ctx.db.patch(m._id, { readBy: [...m.readBy, args.userId] })));
  },
});
