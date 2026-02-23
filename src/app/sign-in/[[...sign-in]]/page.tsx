import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"/>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"/>
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">Pulse<span className="text-indigo-400">.</span></h1>
          <p className="text-[#8888a8] mt-2 text-sm">Real-time conversations</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}