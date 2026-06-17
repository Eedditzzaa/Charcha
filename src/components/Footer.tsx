import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#A0D2EB] text-[#444D60] dark:bg-[#2E2E2E] dark:text-[#BFBFBF] border-t border-black/5 dark:border-[#4B4B4B] py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo />
            <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] font-mono mt-1">
              "Share Ideas, Start Discussions."
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
            <a href="/blogs" className="hover:text-[#9D6DD6] dark:hover:text-[#9D6DD6] transition">Explore Blogs</a>
            <a href="/register" className="hover:text-[#9D6DD6] dark:hover:text-[#9D6DD6] transition">Join Community</a>
            <span className="text-[#444D60]/40 dark:text-[#4B4B4B]">|</span>
            <span className="text-xs font-mono text-[#444D60]/60 dark:text-[#7D7D7D]">Built with React & Node</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-black/5 dark:border-[#4B4B4B]/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#444D60]/70 dark:text-[#7D7D7D]">
          <span>&copy; {currentYear} Charcha Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">Terms of Service</span>
            <span>&bull;</span>
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
