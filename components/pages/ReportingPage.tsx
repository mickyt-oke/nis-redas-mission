"use client"

import { useState, useEffect } from "react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { useAuth } from "@/components/contexts/AuthContext"
import {
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  User,
  Calendar,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Report {
  id: number
  report_type: "passport_returns" | "visa_returns"
  interval_type: "daily" | "monthly" | "quarterly"
  report_date: string
  passport_count: number | null
  visa_count: number | null
  remarks: string | null
  status: "pending" | "vetted" | "approved" | "rejected"
  vet_comments: string | null
  vetted_at: string | null
  approval_comments: string | null
  approved_at: string | null
  created_at: string
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  vetter?: {
    first_name: string
    last_name: string
  }
  approver?: {
    first_name: string
    last_name: string
  }
  status_label: string
  interval_label: string
  report_type_label: string
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

export default function ReportingPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [reports, setReports] = useState<Report[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterInterval, setFilterInterval] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [formData, setFormData] = useState({
    report_type: "passport_returns",
    interval_type: "daily",
    report_date: new Date().toISOString().split("T")[0],
    passport_count: "",
    visa_count: "",
    remarks: "",
  })
  const [submitting, setSubmitting] = useState(false)

  // Review modal state
  const [reviewingReport, setReviewingReport] = useState<Report | null>(null)
  const [reviewAction, setReviewAction] = useState<"vet" | "approve" | "reject" | null>(null)
  const [reviewComments, setReviewComments] = useState("")

  // View modal state
  const [viewingReport, setViewingReport] = useState<Report | null>(null)

  useEffect(() => {
    if (user) {
      fetchStatistics()
      fetchReports()
    }
  }, [user, filterStatus, filterInterval, filterType, searchTerm])

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      }
    } catch (error) {
      console.error("Error fetching statistics:", error)
    }
  }

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token")
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/reports`

      const params = new URLSearchParams()
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterInterval !== "all") params.append("interval_type", filterInterval)
      if (filterType !== "all") params.append("report_type", filterType)
      if (searchTerm) params.append("search", searchTerm)

      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const url = editingReport
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/reports/${editingReport.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/reports`

      const response = await fetch(url, {
        method: editingReport ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          passport_count: formData.passport_count ? parseInt(formData.passport_count) : null,
          visa_count: formData.visa_count ? parseInt(formData.visa_count) : null,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setEditingReport(null)
        resetForm()
        fetchReports()
        fetchStatistics()
      } else {
        const data = await response.json()
        alert(data.message || "Failed to submit report")
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      alert("An error occurred while submitting report")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm("Are you sure you want to delete this report?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchReports()
        fetchStatistics()
      } else {
        const data = await response.json()
        alert(data.message || "Failed to delete report")
      }
    } catch (error) {
      console.error("Error deleting report:", error)
      alert("An error occurred while deleting report")
    }
  }

  const handleReviewAction = async () => {
    if (!reviewingReport || !reviewAction) return

    if (reviewAction === "reject" && !reviewComments.trim()) {
      alert("Please provide comments for rejection")
      return
    }

    setSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports/${reviewingReport.id}/${reviewAction}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comments: reviewComments,
          }),
        }
      )

      if (response.ok) {
        closeReviewModal()
        fetchReports()
        fetchStatistics()
      } else {
        const data = await response.json()
        alert(data.message || "Failed to process review")
      }
    } catch (error) {
      console.error("Error processing review:", error)
      alert("An error occurred while processing review")
    } finally {
      setSubmitting(false)
    }
  }

  const openEditForm = (report: Report) => {
    setEditingReport(report)
    setFormData({
      report_type: report.report_type,
      interval_type: report.interval_type,
      report_date: report.report_date,
      passport_count: report.passport_count?.toString() || "",
      visa_count: report.visa_count?.toString() || "",
      remarks: report.remarks || "",
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      report_type: "passport_returns",
      interval_type: "daily",
      report_date: new Date().toISOString().split("T")[0],
      passport_count: "",
      visa_count: "",
      remarks: "",
    })
    setEditingReport(null)
  }

  const openReviewModal = (report: Report, action: "vet" | "approve" | "reject") => {
    setReviewingReport(report)
    setReviewAction(action)
    setReviewComments("")
  }

  const closeReviewModal = () => {
    setReviewingReport(null)
    setReviewAction(null)
    setReviewComments("")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            <CheckCircle size={14} />
            Approved
          </span>
        )
      case "vetted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            <Eye size={14} />
            Vetted
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            <XCircle size={14} />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            <Clock size={14} />
            Pending
          </span>
        )
    }
  }

  if (!user) {
    return null
  }

  const isUser = user.role === "user"
  const isSupervisor = ["supervisor", "admin", "super_admin"].includes(user.role)
  const isAdmin = ["admin", "super_admin"].includes(user.role)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporting</h1>
            <p className="text-gray-600 mt-1">
              {isUser && "Submit passport and visa return reports"}
              {isSupervisor && !isAdmin && "Review and vet submitted reports"}
              {isAdmin && "Approve vetted reports"}
            </p>
          </div>
          {isUser && (
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#1b7b3c] text-white rounded-lg hover:bg-[#155730] transition"
            >
              <Plus size={20} />
              New Report
            </button>
          )}
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reports</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{statistics.total}</p>
                </div>
                <FileText className="text-gray-400" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{statistics.pending}</p>
                </div>
                <Clock className="text-yellow-400" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vetted</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{statistics.vetted}</p>
                </div>
                <Eye className="text-blue-400" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{statistics.approved}</p>
                </div>
                <CheckCircle className="text-green-400" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{statistics.rejected}</p>
                </div>
                <XCircle className="text-red-400" size={40} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search size={16} className="inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search remarks..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter size={16} className="inline mr-1" />
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="vetted">Vetted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter size={16} className="inline mr-1" />
                Interval
              </label>
              <select
                value={filterInterval}
                onChange={(e) => setFilterInterval(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
              >
                <option value="all">All Intervals</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter size={16} className="inline mr-1" />
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="passport_returns">Passport Returns</option>
                <option value="visa_returns">Visa Returns</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b7b3c]"></div>
            <p className="text-gray-600 mt-4">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">
              {isUser ? "Start by creating your first report" : "No reports match your current filters"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{report.report_type_label}</h3>
                      {getStatusBadge(report.status)}
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {report.interval_label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Report Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(report.report_date).toLocaleDateString()}
                        </p>
                      </div>
                      {report.passport_count !== null && (
                        <div>
                          <p className="text-xs text-gray-500">Passport Returns</p>
                          <p className="text-sm font-medium text-gray-900">{report.passport_count}</p>
                        </div>
                      )}
                      {report.visa_count !== null && (
                        <div>
                          <p className="text-xs text-gray-500">Visa Returns</p>
                          <p className="text-sm font-medium text-gray-900">{report.visa_count}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Submitted</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {report.remarks && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Remarks</p>
                        <p className="text-sm text-gray-700">{report.remarks}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User size={16} />
                      <span>
                        {report.user.first_name} {report.user.last_name}
                      </span>
                      <span className="text-gray-400">({report.user.email})</span>
                    </div>

                    {/* Review Comments */}
                    {report.vet_comments && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Vet Comments:</strong> {report.vet_comments}
                        </p>
                        {report.vetter && report.vetted_at && (
                          <p className="text-xs text-blue-700 mt-1">
                            Vetted by {report.vetter.first_name} {report.vetter.last_name} on{" "}
                            {new Date(report.vetted_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {report.approval_comments && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-900">
                          <strong>Approval Comments:</strong> {report.approval_comments}
                        </p>
                        {report.approver && report.approved_at && (
                          <p className="text-xs text-green-700 mt-1">
                            Approved by {report.approver.first_name} {report.approver.last_name} on{" "}
                            {new Date(report.approved_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setViewingReport(report)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye size={20} />
                    </button>

                    {/* User actions */}
                    {isUser && report.status === "pending" && report.user.id === parseInt(user.id) && (
                      <>
                        <button
                          onClick={() => openEditForm(report)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}

                    {/* Supervisor actions */}
                    {isSupervisor && report.status === "pending" && (
                      <>
                        <button
                          onClick={() => openReviewModal(report, "vet")}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          Vet
                        </button>
                        <button
                          onClick={() => openReviewModal(report, "reject")}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {/* Admin actions */}
                    {isAdmin && report.status === "vetted" && (
                      <>
                        <button
                          onClick={() => openReviewModal(report, "approve")}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openReviewModal(report, "reject")}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingReport ? "Edit Report" : "Submit New Report"}
            </h2>

            <form onSubmit={handleSubmitReport}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Type <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.report_type}
                      onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
                      required
                    >
                      <option value="passport_returns">Passport Returns</option>
                      <option value="visa_returns">Visa Returns</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interval <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.interval_type}
                      onChange={(e) => setFormData({ ...formData, interval_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
                      required
                    >
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.report_date}
                    onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Passport Count</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.passport_count}
                      onChange={(e) => setFormData({ ...formData, passport_count: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
                      placeholder="Enter count"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Visa Count</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.visa_count}
                      onChange={(e) => setFormData({ ...formData, visa_count: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
                      placeholder="Enter count"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-yellow-800">
                    At least one count (Passport or Visa) must be provided
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
                    rows={4}
                    placeholder="Add any additional remarks or notes..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-[#1b7b3c] text-white rounded-lg font-semibold hover:bg-[#155730] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : editingReport ? "Update Report" : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingReport && reviewAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {reviewAction === "vet" && "Vet Report"}
              {reviewAction === "approve" && "Approve Report"}
              {reviewAction === "reject" && "Reject Report"}
            </h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Report Type:</strong> {reviewingReport.report_type_label}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Interval:</strong> {reviewingReport.interval_label}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Report Date:</strong> {new Date(reviewingReport.report_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Submitted by:</strong> {reviewingReport.user.first_name} {reviewingReport.user.last_name}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments {reviewAction === "reject" && <span className="text-red-600">*</span>}
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
                rows={4}
                placeholder={
                  reviewAction === "reject"
                    ? "Required: Explain why this report is being rejected..."
                    : "Optional: Add any comments..."
                }
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReviewAction}
                disabled={submitting}
                className={`flex-1 px-6 py-3 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  reviewAction === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : reviewAction === "vet"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting
                  ? "Processing..."
                  : reviewAction === "approve"
                  ? "Approve"
                  : reviewAction === "vet"
                  ? "Vet"
                  : "Reject"}
              </button>
              <button
                onClick={closeReviewModal}
                disabled={submitting}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
              <button
                onClick={() => setViewingReport(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <XCircle size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Report Type</p>
                  <p className="text-base font-medium text-gray-900">{viewingReport.report_type_label}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Interval</p>
                  <p className="text-base font-medium text-gray-900">{viewingReport.interval_label}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Report Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(viewingReport.report_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(viewingReport.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {viewingReport.passport_count !== null && (
                  <div>
                    <p className="text-sm text-gray-500">Passport Returns</p>
                    <p className="text-2xl font-bold text-gray-900">{viewingReport.passport_count}</p>
                  </div>
                )}
                {viewingReport.visa_count !== null && (
                  <div>
                    <p className="text-sm text-gray-500">Visa Returns</p>
                    <p className="text-2xl font-bold text-gray-900">{viewingReport.visa_count}</p>
                  </div>
                )}
              </div>

              {viewingReport.remarks && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Remarks</p>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingReport.remarks}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-1">Submitted By</p>
                <p className="text-base text-gray-900">
                  {viewingReport.user.first_name} {viewingReport.user.last_name} ({viewingReport.user.email})
                </p>
                <p className="text-sm text-gray-500">
                  on {new Date(viewingReport.created_at).toLocaleString()}
                </p>
              </div>

              {viewingReport.vet_comments && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Vet Comments</p>
                  <p className="text-sm text-blue-800">{viewingReport.vet_comments}</p>
                  {viewingReport.vetter && viewingReport.vetted_at && (
                    <p className="text-xs text-blue-700 mt-2">
                      Vetted by {viewingReport.vetter.first_name} {viewingReport.vetter.last_name} on{" "}
                      {new Date(viewingReport.vetted_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {viewingReport.approval_comments && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-1">Approval Comments</p>
                  <p className="text-sm text-green-800">{viewingReport.approval_comments}</p>
                  {viewingReport.approver && viewingReport.approved_at && (
                    <p className="text-xs text-green-700 mt-2">
                      Approved by {viewingReport.approver.first_name} {viewingReport.approver.last_name} on{" "}
                      {new Date(viewingReport.approved_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setViewingReport(null)}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
