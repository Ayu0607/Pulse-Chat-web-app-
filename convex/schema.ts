import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  }).index("by_clerk_id", ["clerkId"]).index("by_email", ["email"]),

  conversations: defineTable({
    participantIds: v.array(v.id("users")),
    lastMessageId: v.optional(v.id("messages")),
    lastMessageTime: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    readBy: v.array(v.id("users")),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]).index("by_conversation_time", ["conversationId", "createdAt"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    updatedAt: v.number(),
  }).index("by_conversation", ["conversationId"]).index("by_user_conversation", ["userId", "conversationId"]),
});
