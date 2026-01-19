"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "./contexts/AuthContext"
import { Menu, X, LogOut, User } from "lucide-react"
import { useState } from "react"
import logo from "@/public/nis.svg"

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getDashboardLink = () => {
    if (!user) return "/login"
    switch (user.role) {
      case "super_admin":
        return "/dashboard/super-admin"
      case "admin":
        return "/dashboard/admin"
      case "supervisor":
        return "/dashboard/supervisor"
      default:
        return "/dashboard/user"
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* NIS Logo and AppTitle */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#1b7b3c]">
            <Image src={logo} alt="NIS Logo" width={32} height={32} className="object-contain" />
            <span className="hidden sm:inline">REDAS | DIPLOMATIC MISSIONS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {/* <Link href="/" className="text-gray-700 hover:text-[#1b7b3c] transition">
              Home
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-[#1b7b3c] transition">
              About
            </Link>
            <Link href="/services" className="text-gray-700 hover:text-[#1b7b3c] transition">
              Services
            </Link>
            {user && (
              <>
                {(user.role === "admin" || user.role === "super_admin") && (
                  <Link href="/missions" className="text-gray-700 hover:text-[#1b7b3c] transition">
                    Missions
                  </Link>
                )}
                {user.role === "user" && (
                  <Link href="/archiving" className="text-gray-700 hover:text-[#1b7b3c] transition">
                    Archiving
                  </Link>
                )}
                <Link href="/reporting" className="text-gray-700 hover:text-[#1b7b3c] transition">
                  Reporting
                </Link>
                {(user.role === "admin" || user.role === "super_admin") && (
                  <Link href="/documents-review" className="text-gray-700 hover:text-[#1b7b3c] transition">
                    Documents Review
                  </Link>
                )}
                <Link href={getDashboardLink()} className="text-gray-700 hover:text-[#1b7b3c] transition">
                  Dashboard
                </Link>
              </>
            )} */}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  {/* display user role and mission from mission_staff table */}
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role.replace("_", " ")}
                  </p>  
                </div>
                <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <User size={20} className="text-gray-600" />
                </Link>
                <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg transition text-red-600">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-[#1b7b3c] hover:bg-[#1b7b3c] hover:text-white transition rounded-lg"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[#1b7b3c] text-white hover:bg-[#155730] transition rounded-lg"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link
              href="/"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/about"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/services"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            {user ? (
              <>
                {(user.role === "admin" || user.role === "super_admin") && (
                  <Link
                    href="/missions"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Missions
                  </Link>
                )}
                {user.role === "user" && (
                  <Link
                    href="/archiving"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Archiving
                  </Link>
                )}
                <Link
                  href="/reporting"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Reporting
                </Link>
                {(user.role === "admin" || user.role === "super_admin") && (
                  <Link
                    href="/documents-review"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Documents Review
                  </Link>
                )}
                <Link
                  href={getDashboardLink()}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 text-[#1b7b3c] hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 bg-[#1b7b3c] text-white hover:bg-[#155730] rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
