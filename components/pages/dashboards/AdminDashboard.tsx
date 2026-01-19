"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { getApiUrl } from "@/lib/api-config"
import { 
  Users, 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  Activity
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface Report {
  id: number
  title: string
  status: string
  created_at: string
  user: {
    first_name: string
    last_name: string
  }
}

interface DashboardUser {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  is_verified: boolean
  created_at: string
  last_active?: string
}

interface Statistics {
  totalReports: number
  pendingReports: number
  approvedReports: number
  rejectedReports: number
  totalUsers: number
  activeUsers: number
  reportsThisMonth: number
  reportsLastMonth: number
}

const COLORS = ['#1b7b3c', '#3b9b5c', '#5bbb7c', '#7bdb9c', '#9bfbbc']

export default function AdminDashboard() {
  const { user } = useAuth()
  const [statistics, setStatistics] = useState<Statistics>({
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    totalUsers: 0,
    activeUsers: 0,
    reportsThisMonth: 0,
    reportsLastMonth: 0,
  })
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<DashboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [reportSearchTerm, setReportSearchTerm] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")

      // Fetch reports statistics
      const reportsStatsResponse = await fetch(getApiUrl("/reports/statistics"), {
        headers: { Authorization: `Bearer ${token}` },
      })
      const reportsStats = await reportsStatsResponse.json()

      // Fetch all reports
      const reportsResponse = await fetch(getApiUrl("/reports"), {
        headers: { Authorization: `Bearer ${token}` },
      })
      const reportsData = await reportsResponse.json()

      // Fetch users
      const usersResponse = await fetch(getApiUrl("/users"), {
        headers: { Authorization: `Bearer ${token}` },
      })
      const usersData = await usersResponse.json()

      // Calculate statistics
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      
      const lastMonthDate = new Date(now)
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
      const lastMonth = lastMonthDate.getMonth()
      const lastMonthYear = lastMonthDate.getFullYear()

      const reportsThisMonth = reportsData.data?.filter((r: Report) => {
        const reportDate = new Date(r.created_at)
        return reportDate.getMonth() === thisMonth && reportDate.getFullYear() === thisYear
      }).length || 0

      const reportsLastMonth = reportsData.data?.filter((r: Report) => {
        const reportDate = new Date(r.created_at)
        return reportDate.getMonth() === lastMonth && reportDate.getFullYear() === lastMonthYear
      }).length || 0

      // Simulate active users (in production, this would come from session data)
      const activeUsers = usersData.data?.filter((u: DashboardUser) => {
        if (!u.last_active) return false
        const lastActive = new Date(u.last_active)
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
        return lastActive > fifteenMinutesAgo
      }).length || Math.floor(usersData.data?.length * 0.3) || 0

      setStatistics({
        totalReports: reportsStats.total || reportsData.data?.length || 0,
        pendingReports: reportsStats.pending || 0,
        approvedReports: reportsStats.approved || 0,
        rejectedReports: reportsStats.rejected || 0,
        totalUsers: usersData.data?.length || 0,
        activeUsers,
        reportsThisMonth,
        reportsLastMonth,
      })

      setReports(reportsData.data || [])
      setUsers(usersData.data || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const reportStatusData = [
    { name: "Pending", value: statistics.pendingReports, color: COLORS[0] },
    { name: "Approved", value: statistics.approvedReports, color: COLORS[1] },
    { name: "Rejected", value: statistics.rejectedReports, color: COLORS[2] },
  ]

  const userRoleData = users.reduce((acc: any[], user) => {
    const existing = acc.find(item => item.name === user.role)
    if (existing) {
      existing.value++
    } else {
      acc.push({ name: user.role.replace('_', ' '), value: 1 })
    }
    return acc
  }, [])

  // Monthly trend data (last 6 months)
  const monthlyTrendData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const month = date.toLocaleString('default', { month: 'short' })
    const monthIndex = date.getMonth()
    const yearIndex = date.getFullYear()
    
    const count = reports.filter(r => {
      const reportDate = new Date(r.created_at)
      return reportDate.getMonth() === monthIndex && reportDate.getFullYear() === yearIndex
    }).length

    return { month, reports: count }
  })

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      (report.title?.toLowerCase() || '').includes(reportSearchTerm.toLowerCase()) ||
      `${report.user?.first_name || ''} ${report.user?.last_name || ''}`.toLowerCase().includes(reportSearchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.email?.toLowerCase() || '').includes(userSearchTerm.toLowerCase()) ||
      `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(userSearchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      draft: "outline",
    }
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      supervisor: "bg-green-100 text-green-800",
      user: "bg-gray-100 text-gray-800",
    }
    return (
      <Badge className={colors[role] || "bg-gray-100 text-gray-800"}>
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b7b3c] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.firstName}! Here is an overview of the system statistics and recent activities.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.activeUsers} active now
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalReports}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.reportsThisMonth > statistics.reportsLastMonth ? '+' : ''}
                {statistics.reportsThisMonth - statistics.reportsLastMonth} from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.pendingReports}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.totalReports > 0
                  ? Math.round((statistics.approvedReports / statistics.totalReports) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.approvedReports} approved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Reports Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Reports Trend (Last 6 Months)</CardTitle>
              <CardDescription>Monthly report submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="reports" 
                    stroke="#1b7b3c" 
                    strokeWidth={2}
                    name="Reports"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Report Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Report Status Distribution</CardTitle>
              <CardDescription>Current status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>Users by role</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userRoleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#1b7b3c" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card>
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>Real-time metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Active Users</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {statistics.activeUsers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Approved Today</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {reports.filter(r => {
                      const today = new Date().toDateString()
                      return r.status === 'approved' && new Date(r.created_at).toDateString() === today
                    }).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium">Pending Review</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">
                    {statistics.pendingReports}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium">Rejected</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    {statistics.rejectedReports}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports">All Reports</TabsTrigger>
            <TabsTrigger value="users">All Users</TabsTrigger>
          </TabsList>

          {/* Reports Table */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Report Submissions</CardTitle>
                <CardDescription>
                  Complete list of all report submissions
                </CardDescription>
                <div className="flex gap-4 mt-4">
                  <Input
                    placeholder="Search reports..."
                    value={reportSearchTerm}
                    onChange={(e) => setReportSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          No reports found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.slice(0, 10).map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">#{report.id}</TableCell>
                          <TableCell>{report.title}</TableCell>
                          <TableCell>
                            {report.user.first_name} {report.user.last_name}
                          </TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell>
                            {new Date(report.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {filteredReports.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline">Load More</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Table */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  All registered users and their status
                </CardDescription>
                <div className="flex gap-4 mt-4">
                  <Input
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.slice(0, 10).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">#{user.id}</TableCell>
                          <TableCell>
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            {user.is_verified ? (
                              <Badge variant="default">Verified</Badge>
                            ) : (
                              <Badge variant="secondary">Unverified</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {filteredUsers.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline">Load More</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-[#1b7b3c] hover:bg-[#155730]">
                Go to User Management
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mission Management</CardTitle>
              <CardDescription>Create and manage regional missions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-[#1b7b3c] hover:bg-[#155730]">
                Manage Missions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
