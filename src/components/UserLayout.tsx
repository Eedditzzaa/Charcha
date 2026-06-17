import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ToastContainer from './ToastContainer';

interface UserLayoutProps {
  children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#E6EAF3] text-[#444D60] dark:bg-black dark:text-[#BFBFBF] transition-colors duration-300" id="user-global-layout">
      {/* Top Sticky Header */}
      <Navbar />

      {/* Toast Overlay popup alerts */}
      <ToastContainer />

      {/* Core Page Blocks container */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Dynamic footer details */}
      <Footer />
    </div>
  );
}
