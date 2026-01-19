"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotifications } from "../../contexts/NotificationContext"
import { getApiUrl } from "@/lib/api-config"
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Users,
  Clock,
  TrendingUp,
  XCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { toast } from "sonner"

interface Report {
  id: number
  title: string
  report_type: string
  interval_type: string
  status: string
  created_at: string
  report_date: string
  passport_count?: number
  visa_count?: number
  remarks?: string
  user: {
    first_name: string
    last_name: string
    email: string
  }
}

interface Statistics {
  totalReports: number
  pendingReports: number
  vettedReports: number
  approvedReports: number
  rejectedReports: number
  totalUsers: number
}

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const { unreadCount, fetchNotifications } = useNotifications()
  const [statistics, setStatistics] = useState<Statistics>({
    totalReports: 0,
    pendingReports: 0,
    vettedReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    totalUsers: 0,
  })
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")

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

      // Fetch all reports (supervisors see pending and vetted reports)
      const reportsResponse = await fetch(getApiUrl("/reports"), {
        headers: { Authorization: `Bearer ${token}` },
      })
      const reportsData = await reportsResponse.json()

      // Fetch users count
      const usersResponse = await fetch(getApiUrl("/users"), {
        headers: { Authorization: `Bearer ${token}` },
      })
      const usersData = await usersResponse.json()

      setStatistics({
        totalReports: statsData.total || 0,
        pendingReports: statsData.pending || 0,
        vettedReports: statsData.vetted || 0,
        approvedReports: statsData.approved || 0,
        rejectedReports: statsData.rejected || 0,
        totalUsers: usersData.data?.length || 0,
      })

      setReports(reportsData.data || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleVetReport = async (reportId: number, action: 'vet' | 'reject') => {
    try {
      const token = localStorage.getItem("token")
      const endpoint = action === 'vet' ? `/reports/${reportId}/vet` : `/reports/${reportId}/reject`
      
      const comments = action === 'reject' 
        ? prompt("Please provide a reason for rejection:")
        : prompt("Add comments (optional):")

      if (action === 'reject' && !comments) {
        toast.error("Rejection reason is required")
        return
      }

      const response = await fetch(getApiUrl(endpoint), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comments }),
      })

      if (response.ok) {
        toast.success(action === 'vet' ? "Report vetted successfully" : "Report rejected")
        fetchDashboardData()
        fetchNotifications()
      } else {
        const error = await response.json()
        toast.error(error.message || `Failed to ${action} report`)
      }
    } catch (error) {
      console.error(`Error ${action}ing report:`, error)
      toast.error(`Failed to ${action} report`)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      vetted: "default",
      approved: "default",
      rejected: "destructive",
    }
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

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      (report.user?.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (report.user?.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (report.report_type?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.firstName}! Review and manage user reports.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalReports}</div>
              <p className="text-xs text-muted-foreground">
                All submissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pendingReports}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting vetting
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vetted</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.vettedReports}</div>
              <p className="text-xs text-muted-foreground">
                Ready for approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Approval Rate</CardTitle>
              <CardDescription>Overall approval statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Approved</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {statistics.approvedReports}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Success Rate</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {statistics.totalReports > 0
                      ? Math.round((statistics.approvedReports / statistics.totalReports) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common supervisor tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  className="bg-[#1b7b3c] hover:bg-[#155730]"
                  onClick={() => setStatusFilter("pending")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Review Pending ({statistics.pendingReports})
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setStatusFilter("vetted")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  View Vetted ({statistics.vettedReports})
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setStatusFilter("all")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  All Reports
                </Button>
                <Button 
                  variant="outline"
                  onClick={fetchDashboardData}
                >
                  Refresh Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Report Submissions</CardTitle>
            <CardDescription>
              Review and vet submitted reports
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
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
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
                  filteredReports.slice(0, 20).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">#{report.id}</TableCell>
                      <TableCell>
                        {report.report_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </TableCell>
                      <TableCell>
                        {report.user?.first_name} {report.user?.last_name}
                      </TableCell>
                      <TableCell>
                        {new Date(report.report_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {report.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleVetReport(report.id, 'vet')}
                              >
                                Vet
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleVetReport(report.id, 'reject')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {report.status !== 'pending' && (
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {filteredReports.length > 20 && (
              <div className="mt-4 text-center">
                <Button variant="outline">Load More</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
