"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

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
          <Link href="/auth/login">
            <Button variant="outline" className="hidden md:inline-flex text-sm bg-transparent">
              Masuk sebagai Admin
            </Button>
          </Link>
          <Link href="/konsultasi-form">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Mulai Konsultasi</Button>
          </Link>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 gap-4">
            <a href="#beranda" className="text-sm font-medium text-foreground hover:text-primary">
              Beranda
            </a>
            <a href="#fitur" className="text-sm font-medium text-foreground hover:text-primary">
              Fitur
            </a>
            <a href="#cara-kerja" className="text-sm font-medium text-foreground hover:text-primary">
              Cara Kerja
            </a>
            <a href="#spbe" className="text-sm font-medium text-foreground hover:text-primary">
              SPBE
            </a>
            <Link href="/ticket">
              <a className="text-sm font-medium text-foreground hover:text-primary">
                Cek Status Ticket
              </a>
            </Link>
            <Link href="/admin">
              <Button variant="outline" className="w-full text-sm bg-transparent">
                Masuk sebagai Admin
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
