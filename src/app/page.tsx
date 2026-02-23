"use client";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import ChatLayout from "@/components/ChatLayout";

export default function HomePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (isLoaded && !isSignedIn) { router.push("/sign-in"); return; }
    if (isLoaded && isSignedIn && user) {
      upsertUser({
        clerkId: user.id,
        name: user.fullName ?? user.username ?? "Anonymous",
        email: user.primaryEmailAddress?.emailAddress ?? "",
        imageUrl: user.imageUrl,
      });
    }
  }, [isLoaded, isSignedIn, user, upsertUser, router]);

  if (!isLoaded) return (
    <div className="h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex gap-1">
        <div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/>
      </div>
    </div>
  );

  if (!isSignedIn) return null;
  return <ChatLayout />;
}
