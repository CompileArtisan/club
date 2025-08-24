import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import { Toaster } from "react-hot-toast";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🚀 App initializing...");

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("📋 Initial session:", !!session);
      setSession(session);
      setLoading(false);
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔄 Auth state changed:", _event, !!session);
      // Use setTimeout to prevent deadlocks
      setTimeout(() => {
        setSession(session);
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Loading...</div>
          <div className="text-sm text-gray-500">
            Checking authentication...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {session ? <Dashboard session={session} /> : <AuthForm />}
      <Toaster position="top-right" />
    </>
  );
}

export default App;
