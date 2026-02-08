"use client"

import { useState, useEffect } from "react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { useAuth } from "@/components/contexts/AuthContext"
import { getApiUrl } from "@/lib/api-config"
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
  Printer,
  Download,
  Book,
  Users as UsersIcon, // Renamed to avoid conflict with User from lucide-react
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"

export type ReportType = "passport_returns" | "visa_returns" | "staff_nominal_roll"
export type PassportType = "32pages" | "64pages"
export type VisaType = "diplomatic" | "business" | "str" | "tourist" | "official" | "transit" | "twp"

export interface Report {
  id: number
  report_type: ReportType
  interval_type: "daily" | "monthly" | "quarterly"
  report_date: string
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

  // Passport Returns Fields
  passport_32_issued?: number | null
  passport_32_damaged?: number | null
  passport_32_revenue?: number | null
  passport_32_balance?: number | null
  passport_64_issued?: number | null
  passport_64_damaged?: number | null
  passport_64_revenue?: number | null
  passport_64_balance?: number | null

  // Visa Returns Fields
  visa_diplomatic_issued?: number | null
  visa_diplomatic_damaged?: number | null
  visa_diplomatic_revenue?: number | null
  visa_diplomatic_balance?: number | null
  visa_business_issued?: number | null
  visa_business_damaged?: number | null
  visa_business_revenue?: number | null
  visa_business_balance?: number | null
  visa_str_issued?: number | null
  visa_str_damaged?: number | null
  visa_str_revenue?: number | null
  visa_str_balance?: number | null
  visa_tourist_issued?: number | null
  visa_tourist_damaged?: number | null
  visa_tourist_revenue?: number | null
  visa_tourist_balance?: number | null
  visa_official_issued?: number | null
  visa_official_damaged?: number | null
  visa_official_revenue?: number | null
  visa_official_balance?: number | null
  visa_transit_issued?: number | null
  visa_transit_damaged?: number | null
  visa_transit_revenue?: number | null
  visa_transit_balance?: number | null
  visa_twp_issued?: number | null
  visa_twp_damaged?: number | null
  visa_twp_revenue?: number | null
  visa_twp_balance?: number | null

  // Staff Nominal Roll Fields
  staff_total?: number | null
  staff_male?: number | null
  staff_female?: number | null
  staff_on_leave?: number | null
  staff_on_secondment?: number | null
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
    staff_nominal_roll: number
  }
  // Add specific counters for passport and visa types if needed for dashboard
  passport_32_total_issued?: number
  passport_64_total_issued?: number
  visa_diplomatic_total_issued?: number
  visa_business_total_issued?: number
  // ... other specific counters
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
  const [filterType, setFilterType] = useState<ReportType | "all">("all")
  
  // Pagination for admin view
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [activeTab, setActiveTab] = useState<ReportType>("passport_returns") // For new report form tabs

  const [formData, setFormData] = useState<Partial<Report>>({
    report_type: "passport_returns",
    interval_type: "daily",
    report_date: new Date().toISOString().split("T")[0],
    remarks: "",
    // Passport fields
    passport_32_issued: null,
    passport_32_damaged: null,
    passport_32_revenue: null,
    passport_32_balance: null,
    passport_64_issued: null,
    passport_64_damaged: null,
    passport_64_revenue: null,
    passport_64_balance: null,
    // Visa fields
    visa_diplomatic_issued: null,
    visa_diplomatic_damaged: null,
    visa_diplomatic_revenue: null,
    visa_diplomatic_balance: null,
    visa_business_issued: null,
    visa_business_damaged: null,
    visa_business_revenue: null,
    visa_business_balance: null,
    visa_str_issued: null,
    visa_str_damaged: null,
    visa_str_revenue: null,
    visa_str_balance: null,
    visa_tourist_issued: null,
    visa_tourist_damaged: null,
    visa_tourist_revenue: null,
    visa_tourist_balance: null,
    visa_official_issued: null,
    visa_official_damaged: null,
    visa_official_revenue: null,
    visa_official_balance: null,
    visa_transit_issued: null,
    visa_transit_damaged: null,
    visa_transit_revenue: null,
    visa_transit_balance: null,
    visa_twp_issued: null,
    visa_twp_damaged: null,
    visa_twp_revenue: null,
    visa_twp_balance: null,
    // Staff Nominal Roll fields
    staff_total: null,
    staff_male: null,
    staff_female: null,
    staff_on_leave: null,
    staff_on_secondment: null,
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
      const response = await fetch(getApiUrl("/reports/statistics"), {
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
      let url = getApiUrl("/reports")

      const params = new URLSearchParams()
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterInterval !== "all") params.append("interval_type", filterInterval)
      if (filterType !== "all") params.append("report_type", filterType)
      if (searchTerm) params.append("search", searchTerm)
      // Add pagination parameters for admin view if needed
      if (isAdmin) {
        params.append("page", currentPage.toString())
        params.append("limit", itemsPerPage.toString())
      }

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
        ? getApiUrl(`/reports/${editingReport.id}`)
        : getApiUrl("/reports")

      const response = await fetch(url, {
        method: editingReport ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // formData now directly matches the Report interface structure
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
      const response = await fetch(getApiUrl(`/reports/${reportId}`), {
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
        getApiUrl(`/reports/${reviewingReport.id}/${reviewAction}`),
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
    setActiveTab(report.report_type) // Set active tab for editing
    setFormData({
      report_type: report.report_type,
      interval_type: report.interval_type,
      report_date: report.report_date,
      remarks: report.remarks || "",
      // Passport fields
      passport_32_issued: report.passport_32_issued,
      passport_32_damaged: report.passport_32_damaged,
      passport_32_revenue: report.passport_32_revenue,
      passport_32_balance: report.passport_32_balance,
      passport_64_issued: report.passport_64_issued,
      passport_64_damaged: report.passport_64_damaged,
      passport_64_revenue: report.passport_64_revenue,
      passport_64_balance: report.passport_64_balance,
      // Visa fields
      visa_diplomatic_issued: report.visa_diplomatic_issued,
      visa_diplomatic_damaged: report.visa_diplomatic_damaged,
      visa_diplomatic_revenue: report.visa_diplomatic_revenue,
      visa_diplomatic_balance: report.visa_diplomatic_balance,
      visa_business_issued: report.visa_business_issued,
      visa_business_damaged: report.visa_business_damaged,
      visa_business_revenue: report.visa_business_revenue,
      visa_business_balance: report.visa_business_balance,
      visa_str_issued: report.visa_str_issued,
      visa_str_damaged: report.visa_str_damaged,
      visa_str_revenue: report.visa_str_revenue,
      visa_str_balance: report.visa_str_balance,
      visa_tourist_issued: report.visa_tourist_issued,
      visa_tourist_damaged: report.visa_tourist_damaged,
      visa_tourist_revenue: report.visa_tourist_revenue,
      visa_tourist_balance: report.visa_tourist_balance,
      visa_official_issued: report.visa_official_issued,
      visa_official_damaged: report.visa_official_damaged,
      visa_official_revenue: report.visa_official_revenue,
      visa_official_balance: report.visa_official_balance,
      visa_transit_issued: report.visa_transit_issued,
      visa_transit_damaged: report.visa_transit_damaged,
      visa_transit_revenue: report.visa_transit_revenue,
      visa_transit_balance: report.visa_transit_balance,
      visa_twp_issued: report.visa_twp_issued,
      visa_twp_damaged: report.visa_twp_damaged,
      visa_twp_revenue: report.visa_twp_revenue,
      visa_twp_balance: report.visa_twp_balance,
      // Staff Nominal Roll fields
      staff_total: report.staff_total,
      staff_male: report.staff_male,
      staff_female: report.staff_female,
      staff_on_leave: report.staff_on_leave,
      staff_on_secondment: report.staff_on_secondment,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      report_type: "passport_returns",
      interval_type: "daily",
      report_date: new Date().toISOString().split("T")[0],
      remarks: "",
      passport_32_issued: null,
      passport_32_damaged: null,
      passport_32_revenue: null,
      passport_32_balance: null,
      passport_64_issued: null,
      passport_64_damaged: null,
      passport_64_revenue: null,
      passport_64_balance: null,
      visa_diplomatic_issued: null,
      visa_diplomatic_damaged: null,
      visa_diplomatic_revenue: null,
      visa_diplomatic_balance: null,
      visa_business_issued: null,
      visa_business_damaged: null,
      visa_business_revenue: null,
      visa_business_balance: null,
      visa_str_issued: null,
      visa_str_damaged: null,
      visa_str_revenue: null,
      visa_str_balance: null,
      visa_tourist_issued: null,
      visa_tourist_damaged: null,
      visa_tourist_revenue: null,
      visa_tourist_balance: null,
      visa_official_issued: null,
      visa_official_damaged: null,
      visa_official_revenue: null,
      visa_official_balance: null,
      visa_transit_issued: null,
      visa_transit_damaged: null,
      visa_transit_revenue: null,
      visa_transit_balance: null,
      visa_twp_issued: null,
      visa_twp_damaged: null,
      visa_twp_revenue: null,
      visa_twp_balance: null,
      staff_total: null,
      staff_male: null,
      staff_female: null,
      staff_on_leave: null,
      staff_on_secondment: null,
    })
    setEditingReport(null)
    setActiveTab("passport_returns") // Reset to default tab
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

  const handlePrintReport = () => {
    window.print()
  }

  const handleGenerateReport = () => {
    // Generate CSV export
  const headers = [
    "ID", "Type", "Interval", "Date", "Status", "Submitted By", "Remarks",
    // Passport Fields
    "Passport 32 Issued", "Passport 32 Damaged", "Passport 32 Revenue", "Passport 32 Balance",
    "Passport 64 Issued", "Passport 64 Damaged", "Passport 64 Revenue", "Passport 64 Balance",
    // Visa Fields
    "Visa Diplomatic Issued", "Visa Diplomatic Damaged", "Visa Diplomatic Revenue", "Visa Diplomatic Balance",
    "Visa Business Issued", "Visa Business Damaged", "Visa Business Revenue", "Visa Business Balance",
    "Visa STR Issued", "Visa STR Damaged", "Visa STR Revenue", "Visa STR Balance",
    "Visa Tourist Issued", "Visa Tourist Damaged", "Visa Tourist Revenue", "Visa Tourist Balance",
    "Visa Official Issued", "Visa Official Damaged", "Visa Official Revenue", "Visa Official Balance",
    "Visa Transit Issued", "Visa Transit Damaged", "Visa Transit Revenue", "Visa Transit Balance",
    "Visa TWP Issued", "Visa TWP Damaged", "Visa TWP Revenue", "Visa TWP Balance",
    // Staff Nominal Roll Fields
    "Staff Total", "Staff Male", "Staff Female", "Staff On Leave", "Staff On Secondment",
  ]
  const csvData = reports.map(report => [
    report.id,
    report.report_type_label,
    report.interval_label,
    new Date(report.report_date).toLocaleDateString(),
    report.status_label,
    `${report.user.first_name} ${report.user.last_name}`,
    report.remarks || "N/A",
    // Passport Fields
    report.passport_32_issued || "N/A",
    report.passport_32_damaged || "N/A",
    report.passport_32_revenue || "N/A",
    report.passport_32_balance || "N/A",
    report.passport_64_issued || "N/A",
    report.passport_64_damaged || "N/A",
    report.passport_64_revenue || "N/A",
    report.passport_64_balance || "N/A",
    // Visa Fields
    report.visa_diplomatic_issued || "N/A",
    report.visa_diplomatic_damaged || "N/A",
    report.visa_diplomatic_revenue || "N/A",
    report.visa_diplomatic_balance || "N/A",
    report.visa_business_issued || "N/A",
    report.visa_business_damaged || "N/A",
    report.visa_business_revenue || "N/A",
    report.visa_business_balance || "N/A",
    report.visa_str_issued || "N/A",
    report.visa_str_damaged || "N/A",
    report.visa_str_revenue || "N/A",
    report.visa_str_balance || "N/A",
    report.visa_tourist_issued || "N/A",
    report.visa_tourist_damaged || "N/A",
    report.visa_tourist_revenue || "N/A",
    report.visa_tourist_balance || "N/A",
    report.visa_official_issued || "N/A",
    report.visa_official_damaged || "N/A",
    report.visa_official_revenue || "N/A",
    report.visa_official_balance || "N/A",
    report.visa_transit_issued || "N/A",
    report.visa_transit_damaged || "N/A",
    report.visa_transit_revenue || "N/A",
    report.visa_transit_balance || "N/A",
    report.visa_twp_issued || "N/A",
    report.visa_twp_damaged || "N/A",
    report.visa_twp_revenue || "N/A",
    report.visa_twp_balance || "N/A",
    // Staff Nominal Roll Fields
    report.staff_total || "N/A",
    report.staff_male || "N/A",
    report.staff_female || "N/A",
    report.staff_on_leave || "N/A",
    report.staff_on_secondment || "N/A",
  ])

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reports_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentReports = reports.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(reports.length / itemsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  if (!user) {
    return null
  }

  const isUser = user.role === "user"
  const isSupervisor = user.role === "supervisor"
  const isAdmin = ["admin", "super_admin"].includes(user.role)

  // Render Admin Datatable View
  const renderAdminView = () => (
    <>
      {/* Admin Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-4 py-2 bg-[#1b7b3c] text-white rounded-lg hover:bg-[#155730] transition"
          >
            <Download size={20} />
            Generate Report
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Printer size={20} />
            Print Report
          </button>
        </div>
        <div className="text-sm text-gray-600">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, reports.length)} of {reports.length} reports
        </div>
      </div>

      {/* Admin Datatable */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b7b3c]"></div>
          <p className="text-gray-600 mt-4">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-600">No reports match your current filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Passport 32</TableHead>
                  <TableHead className="text-center">Passport 64</TableHead>
                  <TableHead className="text-center">Visa Diplomatic</TableHead>
                  <TableHead className="text-center">Visa Business</TableHead>
                  <TableHead className="text-center">Staff Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead className="text-right print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">#{report.id}</TableCell>
                    <TableCell>{report.report_type_label}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {report.interval_label}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(report.report_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">
                      {report.passport_32_issued !== null ? report.passport_32_issued : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {report.passport_64_issued !== null ? report.passport_64_issued : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {report.visa_diplomatic_issued !== null ? report.visa_diplomatic_issued : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {report.visa_business_issued !== null ? report.visa_business_issued : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {report.staff_total !== null ? report.staff_total : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {report.user.first_name} {report.user.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{report.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right print:hidden">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingReport(report)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {report.status === "vetted" && (
                          <>
                            <button
                              onClick={() => openReviewModal(report, "approve")}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openReviewModal(report, "reject")}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between print:hidden">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{" "}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-[#1b7b3c] border-[#1b7b3c] text-white"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )

  // Render Default Card View (Users & Supervisors)
  const renderDefaultView = () => (
    <>
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
                    {report.report_type === "passport_returns" && (
                      <>
                        {report.passport_32_issued !== null && (
                          <div>
                            <p className="text-xs text-gray-500">Passport 32 Issued</p>
                            <p className="text-sm font-medium text-gray-900">{report.passport_32_issued}</p>
                          </div>
                        )}
                        {report.passport_64_issued !== null && (
                          <div>
                            <p className="text-xs text-gray-500">Passport 64 Issued</p>
                            <p className="text-sm font-medium text-gray-900">{report.passport_64_issued}</p>
                          </div>
                        )}
                      </>
                    )}
                    {report.report_type === "visa_returns" && (
                      <>
                        {report.visa_diplomatic_issued !== null && (
                          <div>
                            <p className="text-xs text-gray-500">Visa Diplomatic Issued</p>
                            <p className="text-sm font-medium text-gray-900">{report.visa_diplomatic_issued}</p>
                          </div>
                        )}
                        {report.visa_business_issued !== null && (
                          <div>
                            <p className="text-xs text-gray-500">Visa Business Issued</p>
                            <p className="text-sm font-medium text-gray-900">{report.visa_business_issued}</p>
                          </div>
                        )}
                      </>
                    )}
                    {report.report_type === "staff_nominal_roll" && (
                      <>
                        {report.staff_total !== null && (
                          <div>
                            <p className="text-xs text-gray-500">Total Staff</p>
                            <p className="text-sm font-medium text-gray-900">{report.staff_total}</p>
                          </div>
                        )}
                        {report.staff_male !== null && (
                          <div>
                            <p className="text-xs text-gray-500">Male Staff</p>
                            <p className="text-sm font-medium text-gray-900">{report.staff_male}</p>
                          </div>
                        )}
                      </>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between print:mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporting</h1>
            <p className="text-gray-600 mt-1">
              {isUser && "Submit passport and visa return reports"}
              {isSupervisor && "Review and vet submitted reports"}
              {isAdmin && "Approve vetted reports and manage reporting"}
            </p>
          </div>
          {isUser && (
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#1b7b3c] text-white rounded-lg hover:bg-[#155730] transition print:hidden"
            >
              <Plus size={20} />
              New Report
            </button>
          )}
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{statistics.total}</p>
                </div>
                <FileText className="text-gray-400" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{statistics.pending}</p>
                </div>
                <Clock className="text-yellow-400" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vetted</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{statistics.vetted}</p>
                </div>
                <Eye className="text-blue-400" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{statistics.approved}</p>
                </div>
                <CheckCircle className="text-green-400" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{statistics.rejected}</p>
                </div>
                <XCircle className="text-red-400" size={40} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="mb-2">
                <Search size={16} className="inline mr-1" />
                Search
              </Label>
              <Input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search remarks..."
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>

            <div>
              <Label htmlFor="status-filter" className="mb-2">
                <Filter size={16} className="inline mr-1" />
                Status
              </Label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                aria-label="Filter by Status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="vetted">Vetted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <Label htmlFor="interval-filter" className="mb-2">
                <Filter size={16} className="inline mr-1" />
                Interval
              </Label>
              <select
                id="interval-filter"
                value={filterInterval}
                onChange={(e) => setFilterInterval(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                aria-label="Filter by Interval"
              >
                <option value="all">All Intervals</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div>
              <Label htmlFor="type-filter" className="mb-2">
                <Filter size={16} className="inline mr-1" />
                Type
              </Label>
              <select
                id="type-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ReportType | "all")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                aria-label="Filter by Report Type"
              >
                <option value="all">All Types</option>
                <option value="passport_returns">Passport Returns</option>
                <option value="visa_returns">Visa Returns</option>
                <option value="staff_nominal_roll">Staff Nominal Roll</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conditional Rendering Based on Role */}
        {isAdmin ? renderAdminView() : renderDefaultView()}
      </div>

      {/* Submit/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingReport ? "Edit Report" : "Submit New Report"}
            </h2>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="passport_returns">Passport Returns</TabsTrigger>
                <TabsTrigger value="visa_returns">Visa Returns</TabsTrigger>
                <TabsTrigger value="staff_nominal_roll">Staff Nominal Roll</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmitReport}>
                <TabsContent value="passport_returns" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="report_date_passport">Report Date <span className="text-red-600">*</span></Label>
                        <Input
                          id="report_date_passport"
                          type="date"
                          value={formData.report_date}
                          onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                          max={new Date().toISOString().split("T")[0]}
                          required
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="interval_type_passport">Interval <span className="text-red-600">*</span></Label>
                        <select
                          id="interval_type_passport"
                          value={formData.interval_type}
                          onChange={(e) => setFormData({ ...formData, interval_type: e.target.value as "daily" | "monthly" | "quarterly" })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          required
                          aria-label="Report Interval Type"
                        >
                          <option value="daily">Daily</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                        </select>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">32 Pages Passport</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="passport_32_issued">Total Issued</Label>
                        <Input
                          id="passport_32_issued"
                          type="number"
                          min="0"
                          value={formData.passport_32_issued ?? ""}
                          onChange={(e) => setFormData({ ...formData, passport_32_issued: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="passport_32_damaged">Total Damaged</Label>
                        <Input
                          id="passport_32_damaged"
                          type="number"
                          min="0"
                          value={formData.passport_32_damaged ?? ""}
                          onChange={(e) => setFormData({ ...formData, passport_32_damaged: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="passport_32_revenue">Total Revenue</Label>
                        <Input
                          id="passport_32_revenue"
                          type="number"
                          min="0"
                          value={formData.passport_32_revenue ?? ""}
                          onChange={(e) => setFormData({ ...formData, passport_32_revenue: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="passport_32_balance">Balance in Stock</Label>
                        <Input
                          id="passport_32_balance"
                          type="number"
                          min="0"
                          value={formData.passport_32_balance ?? ""}
                          onChange={(e) => setFormData({ ...formData, passport_32_balance: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">64 Pages Passport</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="passport_64_issued">Total Issued</Label>
                        <Input
                          id="passport_64_issued"
                          type="number"
                          min="0"
                          value={formData.passport_64_issued ?? ""}
                          onChange={(e) => setFormData({ ...formData, passport_64_issued: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="passport_64_damaged">Total Damaged</Label>
                        <Input
                          id="passport_64_damaged"
                          type="number"
                          min="0"
                          value={formData.passport_64_damaged ?? ""}
                          onChange={(e) => setFormData({ ...formData, passport_64_damaged: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="passport_64_revenue">Total Revenue</Label>
                        <Input
                          id="passport_64_revenue"
                          type="number"
                          min="0"
                          value={formData.passport_64_revenue ?? ""}
                          onChange={(e) => setFormData({ ...formData, passport_64_revenue: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="passport_64_balance">Balance in Stock</Label>
                        <Input
                          id="passport_64_balance"
                          type="number"
                          min="0"
                          value={formData.passport_64_balance ?? ""}
                          onChange={(e) => setFormData({ ...formData, passport_64_balance: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2 dark:bg-yellow-950 dark:border-yellow-700 mt-6">
                      <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        At least one passport field must be provided.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="remarks_passport" className="mt-4">Remarks</Label>
                      <Textarea
                        id="remarks_passport"
                        value={formData.remarks ?? ""}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        rows={4}
                        placeholder="Add any additional remarks or notes..."
                        className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="visa_returns" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="report_date_visa">Report Date <span className="text-red-600">*</span></Label>
                        <Input
                          id="report_date_visa"
                          type="date"
                          value={formData.report_date}
                          onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                          max={new Date().toISOString().split("T")[0]}
                          required
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="interval_type_visa">Interval <span className="text-red-600">*</span></Label>
                        <select
                          id="interval_type_visa"
                          value={formData.interval_type}
                          onChange={(e) => setFormData({ ...formData, interval_type: e.target.value as "daily" | "monthly" | "quarterly" })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          required
                          aria-label="Report Interval Type"
                        >
                          <option value="daily">Daily</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                        </select>
                      </div>
                    </div>

                    {/* Diplomatic Visa */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Diplomatic Visa</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="visa_diplomatic_issued">Total Issued</Label>
                        <Input id="visa_diplomatic_issued" type="number" min="0" value={formData.visa_diplomatic_issued ?? ""} onChange={(e) => setFormData({ ...formData, visa_diplomatic_issued: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_diplomatic_damaged">Total Damaged</Label>
                        <Input id="visa_diplomatic_damaged" type="number" min="0" value={formData.visa_diplomatic_damaged ?? ""} onChange={(e) => setFormData({ ...formData, visa_diplomatic_damaged: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_diplomatic_revenue">Total Revenue</Label>
                        <Input id="visa_diplomatic_revenue" type="number" min="0" value={formData.visa_diplomatic_revenue ?? ""} onChange={(e) => setFormData({ ...formData, visa_diplomatic_revenue: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_diplomatic_balance">Balance in Stock</Label>
                        <Input id="visa_diplomatic_balance" type="number" min="0" value={formData.visa_diplomatic_balance ?? ""} onChange={(e) => setFormData({ ...formData, visa_diplomatic_balance: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                    </div>

                    {/* Business Visa */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Business Visa</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="visa_business_issued">Total Issued</Label>
                        <Input id="visa_business_issued" type="number" min="0" value={formData.visa_business_issued ?? ""} onChange={(e) => setFormData({ ...formData, visa_business_issued: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_business_damaged">Total Damaged</Label>
                        <Input id="visa_business_damaged" type="number" min="0" value={formData.visa_business_damaged ?? ""} onChange={(e) => setFormData({ ...formData, visa_business_damaged: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_business_revenue">Total Revenue</Label>
                        <Input id="visa_business_revenue" type="number" min="0" value={formData.visa_business_revenue ?? ""} onChange={(e) => setFormData({ ...formData, visa_business_revenue: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_business_balance">Balance in Stock</Label>
                        <Input id="visa_business_balance" type="number" min="0" value={formData.visa_business_balance ?? ""} onChange={(e) => setFormData({ ...formData, visa_business_balance: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                    </div>

                    {/* STR Visa */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">STR Visa</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="visa_str_issued">Total Issued</Label>
                        <Input id="visa_str_issued" type="number" min="0" value={formData.visa_str_issued ?? ""} onChange={(e) => setFormData({ ...formData, visa_str_issued: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_str_damaged">Total Damaged</Label>
                        <Input id="visa_str_damaged" type="number" min="0" value={formData.visa_str_damaged ?? ""} onChange={(e) => setFormData({ ...formData, visa_str_damaged: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_str_revenue">Total Revenue</Label>
                        <Input id="visa_str_revenue" type="number" min="0" value={formData.visa_str_revenue ?? ""} onChange={(e) => setFormData({ ...formData, visa_str_revenue: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_str_balance">Balance in Stock</Label>
                        <Input id="visa_str_balance" type="number" min="0" value={formData.visa_str_balance ?? ""} onChange={(e) => setFormData({ ...formData, visa_str_balance: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                    </div>

                    {/* Tourist Visa */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Tourist Visa</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="visa_tourist_issued">Total Issued</Label>
                        <Input id="visa_tourist_issued" type="number" min="0" value={formData.visa_tourist_issued ?? ""} onChange={(e) => setFormData({ ...formData, visa_tourist_issued: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_tourist_damaged">Total Damaged</Label>
                        <Input id="visa_tourist_damaged" type="number" min="0" value={formData.visa_tourist_damaged ?? ""} onChange={(e) => setFormData({ ...formData, visa_tourist_damaged: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_tourist_revenue">Total Revenue</Label>
                        <Input id="visa_tourist_revenue" type="number" min="0" value={formData.visa_tourist_revenue ?? ""} onChange={(e) => setFormData({ ...formData, visa_tourist_revenue: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_tourist_balance">Balance in Stock</Label>
                        <Input id="visa_tourist_balance" type="number" min="0" value={formData.visa_tourist_balance ?? ""} onChange={(e) => setFormData({ ...formData, visa_tourist_balance: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                    </div>

                    {/* Official Visa */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Official Visa</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="visa_official_issued">Total Issued</Label>
                        <Input id="visa_official_issued" type="number" min="0" value={formData.visa_official_issued ?? ""} onChange={(e) => setFormData({ ...formData, visa_official_issued: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_official_damaged">Total Damaged</Label>
                        <Input id="visa_official_damaged" type="number" min="0" value={formData.visa_official_damaged ?? ""} onChange={(e) => setFormData({ ...formData, visa_official_damaged: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_official_revenue">Total Revenue</Label>
                        <Input id="visa_official_revenue" type="number" min="0" value={formData.visa_official_revenue ?? ""} onChange={(e) => setFormData({ ...formData, visa_official_revenue: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_official_balance">Balance in Stock</Label>
                        <Input id="visa_official_balance" type="number" min="0" value={formData.visa_official_balance ?? ""} onChange={(e) => setFormData({ ...formData, visa_official_balance: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                    </div>

                    {/* Transit Visa */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Transit Visa</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="visa_transit_issued">Total Issued</Label>
                        <Input id="visa_transit_issued" type="number" min="0" value={formData.visa_transit_issued ?? ""} onChange={(e) => setFormData({ ...formData, visa_transit_issued: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_transit_damaged">Total Damaged</Label>
                        <Input id="visa_transit_damaged" type="number" min="0" value={formData.visa_transit_damaged ?? ""} onChange={(e) => setFormData({ ...formData, visa_transit_damaged: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_transit_revenue">Total Revenue</Label>
                        <Input id="visa_transit_revenue" type="number" min="0" value={formData.visa_transit_revenue ?? ""} onChange={(e) => setFormData({ ...formData, visa_transit_revenue: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_transit_balance">Balance in Stock</Label>
                        <Input id="visa_transit_balance" type="number" min="0" value={formData.visa_transit_balance ?? ""} onChange={(e) => setFormData({ ...formData, visa_transit_balance: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                    </div>

                    {/* TWP Visa */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">TWP Visa</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="visa_twp_issued">Total Issued</Label>
                        <Input id="visa_twp_issued" type="number" min="0" value={formData.visa_twp_issued ?? ""} onChange={(e) => setFormData({ ...formData, visa_twp_issued: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_twp_damaged">Total Damaged</Label>
                        <Input id="visa_twp_damaged" type="number" min="0" value={formData.visa_twp_damaged ?? ""} onChange={(e) => setFormData({ ...formData, visa_twp_damaged: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_twp_revenue">Total Revenue</Label>
                        <Input id="visa_twp_revenue" type="number" min="0" value={formData.visa_twp_revenue ?? ""} onChange={(e) => setFormData({ ...formData, visa_twp_revenue: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                      <div>
                        <Label htmlFor="visa_twp_balance">Balance in Stock</Label>
                        <Input id="visa_twp_balance" type="number" min="0" value={formData.visa_twp_balance ?? ""} onChange={(e) => setFormData({ ...formData, visa_twp_balance: parseInt(e.target.value) || null })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2 dark:bg-yellow-950 dark:border-yellow-700 mt-6">
                      <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        At least one visa field must be provided.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="remarks_visa" className="mt-4">Remarks</Label>
                      <Textarea
                        id="remarks_visa"
                        value={formData.remarks ?? ""}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        rows={4}
                        placeholder="Add any additional remarks or notes..."
                        className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="staff_nominal_roll" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="report_date_staff">Report Date <span className="text-red-600">*</span></Label>
                        <Input
                          id="report_date_staff"
                          type="date"
                          value={formData.report_date}
                          onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                          max={new Date().toISOString().split("T")[0]}
                          required
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="interval_type_staff">Interval <span className="text-red-600">*</span></Label>
                        <select
                          id="interval_type_staff"
                          value={formData.interval_type}
                          onChange={(e) => setFormData({ ...formData, interval_type: e.target.value as "daily" | "monthly" | "quarterly" })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          required
                          aria-label="Report Interval Type"
                        >
                          <option value="daily">Daily</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                        </select>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Staff Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="staff_total">Total Staff</Label>
                        <Input
                          id="staff_total"
                          type="number"
                          min="0"
                          value={formData.staff_total ?? ""}
                          onChange={(e) => setFormData({ ...formData, staff_total: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="staff_male">Total Male Staff</Label>
                        <Input
                          id="staff_male"
                          type="number"
                          min="0"
                          value={formData.staff_male ?? ""}
                          onChange={(e) => setFormData({ ...formData, staff_male: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="staff_female">Total Female Staff</Label>
                        <Input
                          id="staff_female"
                          type="number"
                          min="0"
                          value={formData.staff_female ?? ""}
                          onChange={(e) => setFormData({ ...formData, staff_female: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="staff_on_leave">Staff On Leave</Label>
                        <Input
                          id="staff_on_leave"
                          type="number"
                          min="0"
                          value={formData.staff_on_leave ?? ""}
                          onChange={(e) => setFormData({ ...formData, staff_on_leave: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="staff_on_secondment">Staff On Secondment</Label>
                        <Input
                          id="staff_on_secondment"
                          type="number"
                          min="0"
                          value={formData.staff_on_secondment ?? ""}
                          onChange={(e) => setFormData({ ...formData, staff_on_secondment: parseInt(e.target.value) || null })}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2 dark:bg-yellow-950 dark:border-yellow-700 mt-6">
                      <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        At least one staff field must be provided.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="remarks_staff" className="mt-4">Remarks</Label>
                      <Textarea
                        id="remarks_staff"
                        value={formData.remarks ?? ""}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        rows={4}
                        placeholder="Add any additional remarks or notes..."
                        className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                      />
                    </div>
                  </div>
                </TabsContent>

                <div className="flex gap-4 mt-6">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-[#1b7b3c] text-white rounded-lg font-semibold hover:bg-[#155730] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : editingReport ? "Update Report" : "Submit Report"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                    disabled={submitting}
                    variant="outline"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Tabs>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Report Type</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.report_type_label}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Interval</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.interval_label}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Report Date</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {new Date(viewingReport.report_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(viewingReport.status)}</div>
                </div>
              </div>

              {viewingReport.report_type === "passport_returns" && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">32 Pages Passport</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Issued</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.passport_32_issued ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Damaged</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.passport_32_damaged ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.passport_32_revenue ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance in Stock</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.passport_32_balance ?? "-"}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">64 Pages Passport</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Issued</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.passport_64_issued ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Damaged</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.passport_64_damaged ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.passport_64_revenue ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance in Stock</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.passport_64_balance ?? "-"}</p>
                    </div>
                  </div>
                </>
              )}

              {viewingReport.report_type === "visa_returns" && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Diplomatic Visa</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Issued</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_diplomatic_issued ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Damaged</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_diplomatic_damaged ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_diplomatic_revenue ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance in Stock</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_diplomatic_balance ?? "-"}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Business Visa</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Issued</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_business_issued ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Damaged</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_business_damaged ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_business_revenue ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance in Stock</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_business_balance ?? "-"}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">STR Visa</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Issued</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_str_issued ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Damaged</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_str_damaged ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_str_revenue ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance in Stock</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_str_balance ?? "-"}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Tourist Visa</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Issued</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_tourist_issued ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Damaged</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_tourist_damaged ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_tourist_revenue ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance in Stock</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_tourist_balance ?? "-"}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Official Visa</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Issued</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_official_issued ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Damaged</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_official_damaged ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_official_revenue ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance in Stock</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_official_balance ?? "-"}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Transit Visa</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Issued</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_transit_issued ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Damaged</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_transit_damaged ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_transit_revenue ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance in Stock</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_transit_balance ?? "-"}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">TWP Visa</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Issued</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_twp_issued ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Damaged</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_twp_damaged ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_twp_revenue ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance in Stock</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.visa_twp_balance ?? "-"}</p>
                    </div>
                  </div>
                </>
              )}

              {viewingReport.report_type === "staff_nominal_roll" && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-4">Staff Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Staff</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.staff_total ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Male Staff</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.staff_male ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Female Staff</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.staff_female ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Staff On Leave</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.staff_on_leave ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Staff On Secondment</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">{viewingReport.staff_on_secondment ?? "-"}</p>
                    </div>
                  </div>
                </>
              )}

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
                title="Close"
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
