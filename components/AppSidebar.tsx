"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "./contexts/AuthContext"
import { NotificationCenter } from "./NotificationCenter"
import {
  Home,
  Info,
  Briefcase,
  FileText,
  Archive,
  ClipboardCheck,
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Moon,
  Sun,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "./ui/sidebar"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { useTheme } from "next-themes"

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { state, fullScreen, setFullScreen, setOpen } = useSidebar()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const toggleFullScreen = () => {
    setFullScreen(!fullScreen)
    setOpen(fullScreen) // If going fullscreen, close sidebar. If exiting fullscreen, open sidebar.
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

  // Navigation items based on user role
  const getNavigationItems = () => {
    const publicItems: Array<{ title: string; icon: any; url: string }> = [
      // { title: "Home", icon: Home, url: "/" },
      // { title: "About", icon: Info, url: "/about" },
      // { title: "Services", icon: Briefcase, url: "/services" },
    ]

    if (!user) return publicItems

    const userItems = [
      { title: "Dashboard", icon: LayoutDashboard, url: getDashboardLink() },
      { title: "Reporting", icon: FileText, url: "/reporting" },
      { title: "Messages", icon: MessageSquare, url: "/messages" },
      { title: "Calendar", icon: Calendar, url: "/calendar" },
    ]

    // Add role-specific items
    if (user.role === "user") {
      userItems.splice(2, 0, { title: "Archiving", icon: Archive, url: "/archiving" })
    }

    if (user.role === "admin" || user.role === "super_admin") {
      userItems.splice(2, 0, 
        { title: "Missions", icon: Briefcase, url: "/missions" },
        { title: "Documents Review", icon: ClipboardCheck, url: "/documents-review" },
        { title: "User Management", icon: Users, url: "/user-management" }
      )
    }

    return [...publicItems, ...userItems]
  }

  const navigationItems = getNavigationItems()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#1b7b3c] text-white">
                  <span className="text-sm font-bold">NIS</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-[#1b7b3c]">
                    REDAS
                  </span>
                  <span className="truncate text-xs">Missions</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item: any) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="flex items-center">
                    <NotificationCenter />
                    <span className="ml-2 text-sm">Notifications</span>
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleFullScreen} tooltip={fullScreen ? "Exit Fullscreen" : "Fullscreen"}>
              {fullScreen ? <Minimize /> : <Maximize />}
              <span>{fullScreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem> */}
          <SidebarMenuItem>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-[#1b7b3c] text-white">
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="truncate text-xs capitalize">
                        {user.role.replace("_", " ")}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-[#1b7b3c] text-white">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === "dark" ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    Toggle Theme
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex flex-col gap-2 p-2">
                <Button asChild size="sm" className="w-full">
                  <Link href="/login">Login</Link>
                </Button>
                {/* <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href="/register">Register</Link>
                </Button> */}
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
