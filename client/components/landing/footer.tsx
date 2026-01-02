"use client";

export function Footer() {
  return (
    <footer className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 pt-20 pb-12 border-t border-white/10 mt-20">
      <p className="mb-8">Questions? Contact us.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-white/70">
        <ul className="space-y-4">
          <li className="hover:underline cursor-pointer">FAQ</li>
          <li className="hover:underline cursor-pointer">Investor Relations</li>
          <li className="hover:underline cursor-pointer">Privacy</li>
          <li className="hover:underline cursor-pointer">Speed Test</li>
        </ul>
        <ul className="space-y-4">
          <li className="hover:underline cursor-pointer">Help Center</li>
          <li className="hover:underline cursor-pointer">Jobs</li>
          <li className="hover:underline cursor-pointer">Cookie Preferences</li>
          <li className="hover:underline cursor-pointer">Legal Notices</li>
        </ul>
        <ul className="space-y-4">
          <li className="hover:underline cursor-pointer">Account</li>
          <li className="hover:underline cursor-pointer">Ways to Watch</li>
          <li className="hover:underline cursor-pointer">
            Corporate Information
          </li>
          <li className="hover:underline cursor-pointer">Only on HEYPERFLIX</li>
        </ul>
        <ul className="space-y-4">
          <li className="hover:underline cursor-pointer">Media Center</li>
          <li className="hover:underline cursor-pointer">Terms of Use</li>
          <li className="hover:underline cursor-pointer">Contact Us</li>
        </ul>
      </div>

      <div className="mt-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/30 rounded text-sm text-white/60">
          English
        </div>
        <p className="mt-6 text-xs text-white/60">HEYPERFLIX Morocco</p>
      </div>
    </footer>
  );
}
