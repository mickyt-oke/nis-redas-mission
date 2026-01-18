"use client"

import { useState, useEffect, useRef } from "react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { useAuth } from "@/components/contexts/AuthContext"
import { Upload, FileText, Download, Trash2, Search, Filter, X, CheckCircle, XCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

interface Document {
  id: number
  title: string
  description: string | null
  document_type: string
  file_name: string
  file_size: number
  file_size_formatted: string
  status: "pending" | "approved" | "rejected"
  review_comments: string | null
  reviewed_at: string | null
  created_at: string
  user: {
    first_name: string
    last_name: string
  }
  reviewer?: {
    first_name: string
    last_name: string
  }
}

export default function ArchivingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    document_type: "passport",
    file: null as File | null,
  })
  const [uploadError, setUploadError] = useState("")
  const [previewContent, setPreviewContent] = useState<React.ReactNode>(
    <p className="text-gray-500 text-sm">No file selected for preview</p>
  )

  // Check if user has the correct role
  useEffect(() => {
    if (user && user.role !== "user") {
      router.push("/")
    }
  }, [user, router])

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token")
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/documents`
      
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterType !== "all") params.append("document_type", filterType)
      if (searchTerm) params.append("search", searchTerm)
      
      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [filterStatus, filterType, searchTerm])

  // Handle file selection with preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        setUploadError("Only PDF files are allowed")
        setUploadData({ ...uploadData, file: null })
        setPreviewContent(<p className="text-gray-500 text-sm">No file selected for preview</p>)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File size must be less than 5MB")
        setUploadData({ ...uploadData, file: null })
        setPreviewContent(<p className="text-gray-500 text-sm">No file selected for preview</p>)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }

      setUploadError("")
      setUploadData({ ...uploadData, file })

      // Generate preview
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        let content: React.ReactNode = (
          <p className="text-gray-600 text-sm">
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )

        // Check if the file is a PDF
        if (file.type === "application/pdf") {
          content = (
            <div>
              <p className="text-gray-600 text-sm mb-2">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
              <iframe
                src={result}
                title="Document Preview"
                className="w-full border border-gray-300 rounded-lg mt-2"
                style={{ height: "400px" }}
              />
            </div>
          )
        } else if (file.type.startsWith("image/")) {
          // Check if the file is an image
          content = (
            <div>
              <p className="text-gray-600 text-sm mb-2">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
              <img
                src={result}
                alt="Document Preview"
                className="max-w-full h-auto rounded-lg mt-2"
              />
            </div>
          )
        } else {
          content = (
            <div>
              <p className="text-gray-600 text-sm mb-2">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
              <p className="text-gray-500 text-sm">Preview not available for this file type</p>
            </div>
          )
        }
        setPreviewContent(content)
      }
      reader.readAsDataURL(file)
    } else {
      setUploadData({ ...uploadData, file: null })
      setPreviewContent(<p className="text-gray-500 text-sm">No file selected for preview</p>)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setUploadError("Only PDF files are allowed")
        setUploadData({ ...uploadData, file: null })
        setPreviewContent(<p className="text-gray-500 text-sm">No file selected for preview</p>)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File size must be less than 5MB")
        setUploadData({ ...uploadData, file: null })
        setPreviewContent(<p className="text-gray-500 text-sm">No file selected for preview</p>)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }
      setUploadError("")
      setUploadData({ ...uploadData, file })

      // Sync with file input - create a DataTransfer object to update the input
      if (fileInputRef.current) {
        try {
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          fileInputRef.current.files = dataTransfer.files
        } catch (error) {
          // Fallback: just clear the value if DataTransfer is not supported
          console.warn("DataTransfer not supported, file input may be out of sync")
        }
      }

      // Generate preview for dropped file
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        let content: React.ReactNode = (
          <p className="text-gray-600 text-sm">
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )

        if (file.type === "application/pdf") {
          content = (
            <div>
              <p className="text-gray-600 text-sm mb-2">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
              <iframe
                src={result}
                title="Document Preview"
                className="w-full border border-gray-300 rounded-lg mt-2"
                style={{ height: "400px" }}
              />
            </div>
          )
        } else if (file.type.startsWith("image/")) {
          content = (
            <div>
              <p className="text-gray-600 text-sm mb-2">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
              <img
                src={result}
                alt="Document Preview"
                className="max-w-full h-auto rounded-lg mt-2"
              />
            </div>
          )
        }
        setPreviewContent(content)
      }
      reader.readAsDataURL(file)
    }
  }

  // Validate form before submission
  const validateForm = (): boolean => {
    if (!uploadData.title.trim()) {
      setUploadError("Title is required")
      return false
    }

    if (!uploadData.file) {
      setUploadError("Please select a file to upload")
      return false
    }

    if (!uploadData.document_type) {
      setUploadError("Please select a document type")
      return false
    }

    return true
  }

  // Handle upload with validation
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submission
    if (!validateForm()) {
      return
    }

    setUploading(true)
    setUploadError("")

    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      
      // TypeScript guard: we already validated that file exists in validateForm()
      if (uploadData.file) {
        formData.append("file", uploadData.file)
      }
      
      formData.append("title", uploadData.title)
      formData.append("document_type", uploadData.document_type)
      if (uploadData.description) {
        formData.append("description", uploadData.description)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        // Reset form
        setUploadData({
          title: "",
          description: "",
          document_type: "passport",
          file: null,
        })
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        setPreviewContent(<p className="text-gray-500 text-sm">No file selected for preview</p>)
        setShowUploadForm(false)
        // Refresh documents list
        fetchDocuments()
      } else {
        try {
          const data = await response.json()
          setUploadError(data.message || "Failed to upload document")
        } catch {
          setUploadError("Failed to upload document. Please try again.")
        }
      }
    } catch (error) {
      setUploadError("An error occurred while uploading")
    } finally {
      setUploading(false)
    }
  }

  // Handle download
  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading document:", error)
    }
  }

  // Handle delete
  const handleDelete = async (documentId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            <CheckCircle size={14} />
            Approved
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

  if (!user || user.role !== "user") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Archiving</h1>
            <p className="text-gray-600 mt-1">Upload and manage your passport and visa documents</p>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-6 py-3 bg-[#1b7b3c] text-white rounded-lg font-semibold hover:bg-[#155730] transition flex items-center gap-2"
          >
            <Upload size={20} />
            Upload Document
          </button>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upload New Document</h2>
              <button onClick={() => setShowUploadForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                <select
                  value={uploadData.document_type}
                  onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
                >
                  <option value="passport">Passport</option>
                  <option value="visa">Visa</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
                  placeholder="e.g., Nigerian Passport - John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b7b3c] focus:border-transparent"
                  rows={3}
                  placeholder="Additional details about the document..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File (PDF only, max 5MB) *</label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#1b7b3c] transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                    <p className="text-gray-600">
                      {uploadData.file ? uploadData.file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">PDF files only (max 5MB)</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Preview</label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50" style={{ minHeight: "100px" }}>
                  {previewContent}
                </div>
              </div>

              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{uploadError}</div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-[#1b7b3c] text-white rounded-lg font-semibold hover:bg-[#155730] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false)
                    setUploadData({
                      title: "",
                      description: "",
                      document_type: "passport",
                      file: null,
                    })
                    setPreviewContent(<p className="text-gray-500 text-sm">No file selected for preview</p>)
                    setUploadError("")
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search size={16} className="inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title..."
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
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
                <option value="passport">Passport</option>
                <option value="visa">Visa</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b7b3c]"></div>
            <p className="text-gray-600 mt-4">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-6">Upload your first document to get started</p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="px-6 py-3 bg-[#1b7b3c] text-white rounded-lg font-semibold hover:bg-[#155730] transition"
            >
              Upload Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="text-red-600" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{doc.title}</h3>
                        {getStatusBadge(doc.status)}
                      </div>
                      {doc.description && <p className="text-gray-600 text-sm mb-2">{doc.description}</p>}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="capitalize">{doc.document_type}</span>
                        <span>•</span>
                        <span>{doc.file_size_formatted}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                      {doc.status === "rejected" && doc.review_comments && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Rejection Reason:</strong> {doc.review_comments}
                          </p>
                        </div>
                      )}
                      {doc.status === "approved" && doc.review_comments && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Admin Comment:</strong> {doc.review_comments}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleDownload(doc.id, doc.file_name)}
                      className="p-2 text-[#1b7b3c] hover:bg-green-50 rounded-lg transition"
                      title="Download"
                    >
                      <Download size={20} />
                    </button>
                    {doc.status === "pending" && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
