"use client";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { Home, LogOut, Settings, ChevronDown } from "lucide-react";
import { LogoutButton } from "../logout-button";

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

export default function ChatHeader() {
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
    console.log("ChatHeader: Setting up click outside listener");
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (!target.closest(".user-dropdown")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();

    // Get initial user
    console.log("ChatHeader: useEffect triggered");
    
    const getUser = async () => {
      try {
        console.log("ChatHeader: Fetching user");
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("ChatHeader: Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        setUser(user);
        console.log("ChatHeader: User data:", user);
        
        if (user) {
          // Fetch user profile data
          console.log("ChatHeader: Fetching profile for user:", user.id);
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .single();
            
          if (profileError) {
            console.error("ChatHeader: Error fetching profile:", profileError);
          } else {
            setUserProfile(profile);
            console.log("ChatHeader: Profile data:", profile);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("ChatHeader: Unexpected error in getUser:", error);
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("ChatHeader: Auth state changed:", event);
        
        try {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            // Fetch user profile data
            console.log("ChatHeader: Fetching profile on auth change for user:", currentUser.id);
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("full_name, role")
              .eq("id", currentUser.id)
              .single();
              
            if (profileError) {
              console.error("ChatHeader: Error fetching profile on auth change:", profileError);
              setUserProfile(null);
            } else {
              setUserProfile(profile);
              console.log("ChatHeader: Profile data on auth change:", profile);
            }
          } else {
            console.log("ChatHeader: No user session");
            setUserProfile(null);
          }
        } catch (error) {
          console.error("ChatHeader: Unexpected error in auth state change:", error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      console.log("ChatHeader: Cleaning up auth subscription");
      subscription.unsubscribe();
    };
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
  


  return (
    <div className="absolute top-0 right-0 z-50 p-4">
      <div className="flex items-center gap-3">
        {loading ? (
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">Loading...</div>
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        ) : user ? (
          <div className="relative user-dropdown">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">
                  {userProfile?.full_name || user.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-blue-600 rounded-full">
                {getInitials(userProfile?.full_name, user.email)}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
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
                <div 
                  className="flex items-center w-full px-4 py-3 text-sm text-left text-red-600 transition-colors duration-200 hover:bg-red-50 cursor-pointer"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  {/* <LogOut className="w-4 h-4 mr-3" /> */}
                  <LogoutButton className="text-red-600 hover:text-red-700 p-0" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:text-[#003867] hover:bg-gray-50 rounded-xl"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#003867] to-[#041A45] rounded-xl hover:shadow-lg transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}