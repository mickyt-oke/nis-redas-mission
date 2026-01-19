"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotifications } from "../../contexts/NotificationContext"
import { getApiUrl } from "@/lib/api-config"
import { 
  ClipboardList, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { toast } from "sonner"

interface Report {
  id: number
  report_type: string
  interval_type: string
  status: string
  created_at: string
  report_date: string
  passport_count?: number
  visa_count?: number
  remarks?: string
  vet_comments?: string
  approval_comments?: string
  vetter?: {
    first_name: string
    last_name: string
  }
  approver?: {
    first_name: string
    last_name: string
  }
}

interface Statistics {
  total: number
  pending: number
  vetted: number
  approved: number
  rejected: number
  by_interval: {
    daily: number
    monthly: number
    quarterly: number
  }
  by_type: {
    passport_returns: number
    visa_returns: number
  }
}

export default function UserDashboard() {
  const { user } = useAuth()
  const { unreadCount, fetchNotifications } = useNotifications()
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    pending: 0,
    vetted: 0,
    approved: 0,
    rejected: 0,
    by_interval: { daily: 0, monthly: 0, quarterly: 0 },
    by_type: { passport_returns: 0, visa_returns: 0 },
  })
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchDashboardData()
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")

      // Fetch reports statistics
      const statsResponse = await fetch(getApiUrl("/reports/statistics"), {
        headers: { Authorization: `Bearer ${token}` },
      })
      const statsData = await statsResponse.json()

      // Fetch user's reports
      const reportsResponse = await fetch(getApiUrl("/reports"), {
        headers: { Authorization: `Bearer ${token}` },
      })
      const reportsData = await reportsResponse.json()

      setStatistics(statsData)
      setReports(reportsData.data || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data for monthly trend
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

  // Prepare data for report type distribution
  const reportTypeData = [
    { name: 'Passport Returns', value: statistics.by_type.passport_returns },
    { name: 'Visa Returns', value: statistics.by_type.visa_returns },
  ]

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      vetted: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }
    return (
      <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'vetted':
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      (report.report_type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (report.remarks?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.firstName}!</h1>
          <p className="text-gray-600 mt-2">
            Manage your reports and track their status
          </p>
          {unreadCount > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">
                All your submissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.approved}</div>
              <p className="text-xs text-muted-foreground">
                Successfully approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.total > 0
                  ? Math.round((statistics.approved / statistics.total) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Approval rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Submission Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Trend</CardTitle>
              <CardDescription>Your reports over the last 6 months</CardDescription>
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

          {/* Report Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Report Types</CardTitle>
              <CardDescription>Distribution by report type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#1b7b3c" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Clock className="h-8 w-8 text-yellow-600" />
                <span className="text-3xl font-bold text-yellow-600">{statistics.pending}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vetted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <AlertCircle className="h-8 w-8 text-blue-600" />
                <span className="text-3xl font-bold text-blue-600">{statistics.vetted}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <span className="text-3xl font-bold text-green-600">{statistics.approved}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <XCircle className="h-8 w-8 text-red-600" />
                <span className="text-3xl font-bold text-red-600">{statistics.rejected}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Reports</CardTitle>
            <CardDescription>
              All your submitted reports and their current status
            </CardDescription>
            <div className="flex gap-4 mt-4">
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="vetted">Vetted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline"
                onClick={fetchDashboardData}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Counts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      No reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">#{report.id}</TableCell>
                      <TableCell>
                        {report.report_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </TableCell>
                      <TableCell>
                        {report.interval_type?.charAt(0).toUpperCase() + report.interval_type?.slice(1)}
                      </TableCell>
                      <TableCell>
                        {new Date(report.report_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(report.status)}
                          {getStatusBadge(report.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {report.passport_count !== null && report.passport_count !== undefined && (
                            <div>Passports: {report.passport_count}</div>
                          )}
                          {report.visa_count !== null && report.visa_count !== undefined && (
                            <div>Visas: {report.visa_count}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Submit New Report</CardTitle>
              <CardDescription>Create a new passport or visa return report</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-[#1b7b3c] hover:bg-[#155730]">
                <FileText className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>View Notifications</CardTitle>
              <CardDescription>Check updates on your reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <AlertCircle className="mr-2 h-4 w-4" />
                {unreadCount > 0 ? `${unreadCount} Unread Notifications` : 'All Notifications'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
