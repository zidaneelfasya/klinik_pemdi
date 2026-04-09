"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="images/klinik_logo.svg" alt="" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-foreground">Klinik Pemerintah Digital</p>
            <p className="text-xs text-muted-foreground">Konsultasi Digital</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#beranda" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Beranda
          </a>
          <a href="#fitur" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Fitur
          </a>
          <a href="#cara-kerja" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Cara Kerja
          </a>
          <a href="#spbe" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            SPBE
          </a>
          <a href="/ticket" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Cek Status Ticket
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="outline" className="hidden md:inline-flex text-sm bg-transparent" asChild>
            <Link href="/auth/login">
              Masuk sebagai Admin
            </Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm" asChild>
            <Link href="/konsultasi-form">Mulai Konsultasi</Link>
          </Button>
          <button 
            className="md:hidden w-10 h-10 flex items-center justify-center bg-white border border-border text-foreground rounded-full transition-colors" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t border-border bg-background overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-4">
              <a href="#beranda" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Beranda
              </a>
              <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Fitur
              </a>
              <a href="#cara-kerja" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Cara Kerja
              </a>
              <a href="#spbe" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                SPBE
              </a>
              <Link 
                href="/ticket" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-foreground hover:text-primary py-2 transition-colors"
              >
                Cek Status Ticket
              </Link>
              <Button variant="outline" className="w-full text-sm bg-transparent" asChild>
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  Masuk sebagai Admin
                </Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
