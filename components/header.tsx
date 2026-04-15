"use client";

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  LogOut,
  Settings,
  Home,
  Info,
  Trophy,
  Calendar,
  Briefcase,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { useRef } from "react";

interface UserProfile {
  full_name: string;
  role: string;
}

function getInitials(fullName?: string, email?: string): string {
  if (fullName) {
    const nameParts = fullName.trim().split(" ");
    if (nameParts.length >= 2) {
      return (
        nameParts[0][0] + nameParts[nameParts.length - 1][0]
      ).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  }

  if (email) {
    const name = email.split("@")[0];
    const parts = name.split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  return "U";
}

export function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 80) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);

      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY]);

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (!target.closest(".user-dropdown")) {
        setIsDropdownOpen(false);
      }
      if (!target.closest(".mobile-menu") && !target.closest(".mobile-menu-button")) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();

    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      console.log("user:",user);
      
      if (user) {
        // Fetch user profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();
        setUserProfile(profile);
        console.log(profile)
      }
      
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile data
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", session.user.id)
            .single();
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getDashboardUrl = () => {
    if (!user) return '/auth/login';
    
    if (userProfile?.role === 'admin') {
      return '/admin';
    } else if (userProfile?.role === 'user') {
      return '/user/dashboard';
    }
    
    return '/user/dashboard';
  };

  const getProfileUrl = () => {
    if (!user) return '/auth/login';
    
    if (userProfile?.role === 'admin') {
      return '/profile';
    } else if (userProfile?.role === 'user') {
      return '/user/profile';
    }
    
    return '/profile';
  };

  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-4 mt-4 lg:mx-24">
          <motion.nav
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="px-4 py-3 border shadow-xl bg-white/90 backdrop-blur-xl border-white/20 rounded-2xl lg:px-8 lg:py-4"
          >
            <div className="flex items-center justify-between">
              {/* Logo/Brand - Diubah untuk menampilkan 2 logo */}
              <Link
                href="/"
                className="flex items-center space-x-3"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center space-x-3"
                >
                  {/* Container untuk kedua logo */}
                  <div className="flex items-center space-x-2">
                    {/* Logo pertama */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-3xl">
                      <Image
                        src="/images/klinik_logo.png"
                        alt="Klinik Logo"
                        width={50}
                        height={50}
                        className="mr-2"
                      />
                    </div>
                    
                    {/* Garis pemisah */}
                    <div className="h-8 w-px bg-gray-300"></div>
                    
                    {/* Logo kedua */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-3xl">
                      <Image
                        src="/images/komdigi_logo.png" // Ganti dengan path logo kedua
                        alt="Komdigi Logo"
                        width={50}
                        height={50}
                        className="mr-2"
                      />
                    </div>
                  </div>
                  
                  <div className="hidden lg:block">
                    <div className="text-lg font-extrabold text-[#003867] leading-tight">
                      KLINIK PEMERINTAH DIGITAL
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                      by KOMDIGI
                    </div>
                  </div>
                  <div className="block lg:hidden">
                    <div className="text-base font-bold text-[#1E3A8A]">
                      IBP 2025
                    </div>
                  </div>
                </motion.div>
              </Link>

              {/* Desktop Navigation - Dihapus semua item navigasi */}

              {/* Desktop Auth Section */}
              <div className="hidden space-x-4 lg:flex lg:items-center">
                {!loading && user ? (
                  <div className="relative user-dropdown">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                    >
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-700">
                          {userProfile?.full_name || user.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-blue-600 rounded-xl">
                        {getInitials(userProfile?.full_name, user.email)}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </motion.button>

                    {/* User Dropdown Menu */}
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            scale: 0.95,
                            y: -10,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.95,
                            y: -10,
                          }}
                          transition={{
                            duration: 0.2,
                          }}
                          className="absolute right-0 z-50 w-56 py-2 mt-2 bg-white border border-gray-200 shadow-xl rounded-2xl"
                        >
                          <Link
                            href={getDashboardUrl()}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <Home className="w-4 h-4 mr-3 text-gray-500" />
                            Dashboard
                          </Link>
                          <Link
                            href={getProfileUrl()}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <Settings className="w-4 h-4 mr-3 text-gray-500" />
                            Profile Settings
                          </Link>
                          <hr className="my-2 border-gray-100" />
                          <div className="flex items-center w-full px-4 py-3 text-sm text-left text-red-600 transition-colors duration-200 hover:bg-red-50 cursor-pointer">
                            <LogOut className="w-4 h-4 mr-3" />
                            <LogoutButton className="text-red-600 hover:text-red-700" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : !loading ? (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/auth/login"
                      className="px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:text-[#003867] hover:bg-gray-50 rounded-xl"
                    >
                      Sign In
                    </Link>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href="/auth/sign-up"
                        className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#003867] to-[#041A45] rounded-xl hover:shadow-lg transition-all duration-200"
                      >
                        Sign Up
                      </Link>
                    </motion.div>
                  </div>
                ) : null}
              </div>

              {/* Mobile Menu Button */}
              <div className="flex items-center space-x-3 lg:hidden">
                {!loading && user && (
                  <div className="relative user-dropdown">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center p-1 space-x-2 transition-colors duration-200 rounded-xl hover:bg-gray-50 focus:outline-none"
                    >
                      <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-blue-600 rounded-lg">
                        {getInitials(userProfile?.full_name, user.email)}
                      </div>
                    </motion.button>

                    {/* Mobile User Dropdown */}
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            scale: 0.95,
                            y: -10,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.95,
                            y: -10,
                          }}
                          transition={{
                            duration: 0.2,
                          }}
                          className="absolute right-0 z-50 w-48 py-2 mt-2 bg-white border border-gray-200 shadow-xl rounded-2xl"
                        >
                          <div className="px-4 py-2 border-b border-gray-100">
                            <div className="text-sm font-medium text-gray-700">
                              {userProfile?.full_name || user.email}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.email}
                            </div>
                          </div>
                          <Link
                            href={getDashboardUrl()}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <Home className="w-4 h-4 mr-3 text-gray-500" />
                            Dashboard
                          </Link>
                          <Link
                            href={getProfileUrl()}
                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <Settings className="w-4 h-4 mr-3 text-gray-500" />
                            Profile
                          </Link>
                          <div className="flex items-center w-full px-4 py-3 text-sm text-left text-red-600 hover:bg-red-50 cursor-pointer">
                            <LogOut className="w-4 h-4 mr-3" />
                            <LogoutButton className="text-red-600 hover:text-red-700" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleMobileMenu}
                  className="mobile-menu-button p-2 text-gray-700 hover:text-[#1E3A8A] hover:bg-gray-50 rounded-xl transition-colors duration-200 focus:outline-none"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.nav>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu - Dihapus semua item navigasi */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed z-50 border shadow-2xl mobile-menu top-20 left-4 right-4 bg-white/95 backdrop-blur-xl border-white/20 rounded-2xl lg:hidden"
            >
              <div className="p-6">
                {/* Auth Section for Mobile */}
                {!loading && !user && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.6,
                    }}
                    className="pt-6 mt-6 border-t border-gray-100"
                  >
                    <div className="flex flex-col space-y-3">
                      <Link
                        href="/auth/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full px-4 py-3 text-center text-gray-700 hover:text-[#1E3A8A] hover:bg-gray-50 rounded-xl transition-colors duration-200"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/sign-up"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full px-4 py-3 text-center text-white bg-gradient-to-r from-[#1E3A8A] to-blue-600 rounded-xl hover:shadow-lg transition-all duration-200"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}