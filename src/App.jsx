import React from "react";
import { Toaster } from "react-hot-toast";
import useStore from "./store/useStore";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";

const App = () => {
  const { isAuthenticated, isLoading } = useStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? <Dashboard /> : <AuthForm />}
      <Toaster position="top-right" />
    </>
  );
};

export default App;
