"use client"; 
 
import Link from "next/link"; 
import { FormEvent, useState } from "react"; 
import { createClient } from "@/lib/supabase/client"; 
 
export default function ForgotPasswordPage() { 
  const supabase = createClient(); 
 
  const [email, setEmail] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [successMessage, setSuccessMessage] = useState(""); 
  const [errorMessage, setErrorMessage] = useState(""); 
 
  async function handleSubmit(e: FormEvent<HTMLFormElement>) { 
    e.preventDefault(); 
 
    setLoading(true); 
    setSuccessMessage(""); 
    setErrorMessage(""); 
 
    const cleanEmail = email.trim().toLowerCase(); 
 
    if (!cleanEmail) { 
      setErrorMessage("Please enter your email address."); 
      setLoading(false); 
      return; 
    } 
 
    const { error } = await supabase.auth.resetPasswordForEmail( 
      cleanEmail, 
      { 
        redirectTo: `${window.location.origin}/reset-password`, 
      } 
    ); 
 
    if (error) { 
      setErrorMessage(error.message); 
    } else { 
      setSuccessMessage( 
        "Password reset email sent. Please check your Gmail inbox." 
      ); 
    } 
 
    setLoading(false); 
  } 
 
  return ( 
    <main className="min-h-screen bg-[#000000] text-white"> 
 
      {/* TOP NAV */} 
      <header className="border-b border-white/[0.08] bg-[#1C1C1E]/80 backdrop-blur-xl"> 
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5 lg:px-8"> 
 
          <Link href="/" className="flex items-center gap-3"> 
            <div className="flex h-9 w-9 items-center justify-center border border-[#007AFF] bg-black text-sm font-bold text-[#007AFF]"> 
              ›_ 
            </div> 
 
            <span className="text-xl font-semibold tracking-wide"> 
              DATA<span className="text-[#007AFF]">VAULT</span> 
            </span> 
          </Link> 
 
          <Link 
            href="/profile" 
            className="text-[10px] uppercase tracking-[0.16em] text-white/40 transition hover:text-[#007AFF]" 
          > 
            ← Back to Profile 
          </Link> 
 
        </div> 
      </header> 
 
      {/* CONTENT */} 
      <section className="flex min-h-[calc(100vh-64px)] items-center justify-center px-5 py-12"> 
 
        <div className="w-full max-w-[480px]"> 
 
          {/* HEADER */} 
          <div className="mb-8 text-center"> 
 
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#007AFF]"> 
              DataVault Security 
            </div> 
 
            <h1 className="mt-3 text-3xl font-semibold tracking-tight"> 
              Reset Password 
            </h1> 
 
            <p className="mt-3 text-sm leading-6 text-white/40"> 
              Enter your registered email address and we will send you 
              a secure password reset link. 
            </p> 
 
          </div> 
 
          {/* CARD */} 
          <div className="rounded-2xl border border-white/[0.10] bg-[#1C1C1E] p-7"> 
 
            {successMessage && ( 
              <div className="mb-5 border border-[#0A84FF]/20 bg-[#007AFF]/[0.06] px-4 py-3 text-xs leading-5 text-[#007AFF]"> 
                {successMessage} 
              </div> 
            )} 
 
            {errorMessage && ( 
              <div className="mb-5 border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs leading-5 text-red-300"> 
                {errorMessage} 
              </div> 
            )} 
 
            <form onSubmit={handleSubmit}> 
 
              <label className="text-[10px] uppercase tracking-[0.15em] text-white/40"> 
                Registered Email 
              </label> 
 
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                autoComplete="email" 
                className="mt-2 w-full border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#007AFF]" 
              /> 
 
              <button 
                type="submit" 
                disabled={loading} 
                className="mt-5 w-full border border-[#007AFF] bg-[#000000] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#007AFF] transition hover:bg-[#007AFF] hover:text-white disabled:cursor-not-allowed disabled:opacity-50" 
              > 
                {loading ? "Sending..." : "Send Reset Link"} 
              </button> 
 
            </form> 
 
            <div className="mt-6 border-t border-white/[0.08] pt-5 text-center"> 
 
              <Link 
                href="/login" 
                className="text-[10px] uppercase tracking-[0.15em] text-white/40 transition hover:text-[#007AFF]" 
              > 
                ← Return to Login 
              </Link> 
 
            </div> 
 
          </div> 
 
          {/* SECURITY NOTE */} 
          <div className="mt-5 text-center"> 
            <p className="text-[9px] uppercase tracking-[0.12em] text-white/20"> 
              Secure authentication powered by Supabase 
            </p> 
          </div> 
 
        </div> 
 
      </section> 
 
    </main> 
  ); 
}