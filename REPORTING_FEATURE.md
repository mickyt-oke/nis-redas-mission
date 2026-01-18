# Reporting Feature Documentation

## Overview
The Reporting feature allows users to submit passport and visa return reports on daily, monthly, and quarterly intervals. The system implements a three-tier approval workflow:
1. **Users** submit reports
2. **Supervisors** vet reports
3. **Admins** approve reports

## Features

### User Capabilities
- Submit new reports with passport/visa return counts
- Choose reporting intervals (daily, monthly, quarterly)
- Edit pending reports
- Delete pending reports
- View own reports and their status
- Track report progress through the approval workflow

### Supervisor Capabilities
- View all submitted reports
- Vet pending reports with comments
- Reject reports with required comments
- View reports they have vetted
- Filter and search reports

### Admin Capabilities
- View all reports in the system
- Approve vetted reports with optional comments
- Reject vetted reports with required comments
- View complete report history
- Access comprehensive statistics

## Technical Implementation

### Backend (Laravel)

#### Database Schema
**Table: `reports`**
- `id` - Primary key
- `user_id` - Foreign key to users table
- `report_type` - Enum: 'passport_returns', 'visa_returns'
- `interval_type` - Enum: 'daily', 'monthly', 'quarterly'
- `report_date` - Date of the report
- `passport_count` - Integer (nullable)
- `visa_count` - Integer (nullable)
- `remarks` - Text (nullable)
- `status` - Enum: 'pending', 'vetted', 'approved', 'rejected'
- `vetted_by` - Foreign key to users (nullable)
- `vetted_at` - Timestamp (nullable)
- `vet_comments` - Text (nullable)
- `approved_by` - Foreign key to users (nullable)
- `approved_at` - Timestamp (nullable)
- `approval_comments` - Text (nullable)
- `timestamps` - created_at, updated_at
- `deleted_at` - Soft delete timestamp

#### Models
**Report Model** (`app/Models/Report.php`)
- Relationships: `user()`, `vetter()`, `approver()`
- Scopes: `forUser()`, `status()`, `intervalType()`, `reportType()`, `dateRange()`
- Helper methods: `isPending()`, `isVetted()`, `isApproved()`, `canBeVetted()`, `canBeApproved()`
- Accessors: `status_label`, `interval_label`, `report_type_label`

**User Model Updates** (`app/Models/User.php`)
- Added relationships: `reports()`, `vettedReports()`, `approvedReports()`

#### Controller
**ReportController** (`app/Http/Controllers/ReportController.php`)

Endpoints:
- `GET /api/reports` - List reports (role-based filtering)
- `GET /api/reports/statistics` - Get report statistics
- `GET /api/reports/{report}` - View single report
- `POST /api/reports` - Create new report (users only)
- `PUT /api/reports/{report}` - Update pending report (owner only)
- `POST /api/reports/{report}/vet` - Vet report (supervisors only)
- `POST /api/reports/{report}/approve` - Approve report (admins only)
- `POST /api/reports/{report}/reject` - Reject report (supervisors/admins)
- `DELETE /api/reports/{report}` - Delete report

#### Validation Rules
**Create/Update Report:**
- `report_type`: required, in:passport_returns,visa_returns
- `interval_type`: required, in:daily,monthly,quarterly
- `report_date`: required, date, before_or_equal:today
- `passport_count`: nullable, integer, min:0
- `visa_count`: nullable, integer, min:0
- `remarks`: nullable, string, max:2000
- At least one count (passport or visa) must be provided

**Vet/Approve:**
- `comments`: nullable, string, max:2000

**Reject:**
- `comments`: required, string, max:2000

### Frontend (Next.js + TypeScript)

#### Components
**ReportingPage** (`components/pages/ReportingPage.tsx`)
- Comprehensive reporting interface
- Role-based UI rendering
- Statistics dashboard
- Advanced filtering (status, interval, type, search)
- Report submission form with validation
- Edit functionality for pending reports
- Review modals for vetting/approving
- Detailed report view modal

#### Features
1. **Statistics Cards**
   - Total reports
   - Pending count
   - Vetted count
   - Approved count
   - Rejected count

2. **Filters**
   - Search by remarks
   - Filter by status
   - Filter by interval type
   - Filter by report type

3. **Report List**
   - Card-based layout
   - Status badges
   - Action buttons based on role
   - Inline comments display
   - Responsive design

4. **Modals**
   - Submit/Edit form
   - Vet/Approve/Reject review
   - Detailed view

#### Routes
- `/reporting` - Main reporting page (accessible to all authenticated users)

#### Navigation
- Added "Reporting" link in Header for all authenticated users
- Positioned between "Archiving" and "Documents Review"

## Workflow

### 1. Report Submission (User)
1. User clicks "New Report" button
2. Fills out form:
   - Report type (Passport/Visa Returns)
   - Interval (Daily/Monthly/Quarterly)
   - Report date
   - Passport count (optional)
   - Visa count (optional)
   - Remarks (optional)
3. Submits report
4. Report status: **Pending**

### 2. Report Vetting (Supervisor)
1. Supervisor views pending reports
2. Reviews report details
3. Options:
   - **Vet**: Marks report as vetted (optional comments)
   - **Reject**: Rejects report (required comments)
4. Report status: **Vetted** or **Rejected**

### 3. Report Approval (Admin)
1. Admin views vetted reports
2. Reviews report and vet comments
3. Options:
   - **Approve**: Approves report (optional comments)
   - **Reject**: Rejects report (required comments)
4. Report status: **Approved** or **Rejected**

## Role-Based Access Control

### User (role: 'user')
- ✅ Submit reports
- ✅ Edit own pending reports
- ✅ Delete own pending reports
- ✅ View own reports
- ❌ Vet reports
- ❌ Approve reports

### Supervisor (role: 'supervisor')
- ✅ View all reports
- ✅ Vet pending reports
- ✅ Reject pending reports
- ❌ Submit reports
- ❌ Approve reports

### Admin (role: 'admin', 'super_admin')
- ✅ View all reports
- ✅ Approve vetted reports
- ✅ Reject vetted reports
- ✅ Delete any report
- ❌ Submit reports (admins don't submit)

## API Response Examples

### List Reports
```json
{
  "data": [
    {
      "id": 1,
      "report_type": "passport_returns",
      "interval_type": "daily",
      "report_date": "2024-01-20",
      "passport_count": 15,
      "visa_count": null,
      "remarks": "Regular daily report",
      "status": "pending",
      "user": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "user@example.com"
      },
      "status_label": "Pending Review",
      "interval_label": "Daily",
      "report_type_label": "Passport Returns"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 10
  }
}
```

### Statistics
```json
{
  "total": 50,
  "pending": 10,
  "vetted": 15,
  "approved": 20,
  "rejected": 5,
  "by_interval": {
    "daily": 30,
    "monthly": 15,
    "quarterly": 5
  },
  "by_type": {
    "passport_returns": 35,
    "visa_returns": 15
  }
}
```

## Testing Checklist

### Backend Testing
- [ ] User can create report
- [ ] User can update own pending report
- [ ] User can delete own pending report
- [ ] User cannot vet/approve reports
- [ ] Supervisor can vet pending reports
- [ ] Supervisor can reject pending reports
- [ ] Supervisor cannot approve reports
- [ ] Admin can approve vetted reports
- [ ] Admin can reject vetted reports
- [ ] Validation works correctly
- [ ] Role-based filtering works
- [ ] Statistics are accurate

### Frontend Testing
- [ ] User sees submission form
- [ ] User can submit reports
- [ ] User can edit pending reports
- [ ] User can delete pending reports
- [ ] Supervisor sees vet buttons on pending reports
- [ ] Supervisor can vet reports with comments
- [ ] Admin sees approve buttons on vetted reports
- [ ] Admin can approve reports with comments
- [ ] Filters work correctly
- [ ] Search works correctly
- [ ] Statistics display correctly
- [ ] Modals open and close properly
- [ ] Form validation works
- [ ] Responsive design works on mobile

## Files Created/Modified

### Backend Files Created
1. `backend/database/migrations/2024_01_21_000001_create_reports_table.php`
2. `backend/app/Models/Report.php`
3. `backend/app/Http/Controllers/ReportController.php`

### Backend Files Modified
1. `backend/routes/api.php` - Added report routes
2. `backend/app/Models/User.php` - Added report relationships

### Frontend Files Created
1. `components/pages/ReportingPage.tsx`
2. `app/reporting/page.tsx`

### Frontend Files Modified
1. `components/Header.tsx` - Added Reporting navigation link

### Documentation Files
1. `TODO.md` - Updated with implementation progress
2. `REPORTING_FEATURE.md` - This comprehensive documentation

## Future Enhancements

### Potential Features
1. **Export Reports** - Export to PDF/Excel
2. **Report Templates** - Pre-filled templates for common reports
3. **Bulk Operations** - Approve/reject multiple reports at once
4. **Email Notifications** - Notify users of status changes
5. **Report Analytics** - Charts and graphs for trends
6. **Scheduled Reports** - Automatic report generation
7. **Report Comments** - Discussion thread on reports
8. **Audit Trail** - Complete history of all changes
9. **Custom Fields** - Configurable additional fields
10. **Report Reminders** - Remind users to submit reports

## Support

For issues or questions about the reporting feature:
1. Check this documentation
2. Review the TODO.md file for known issues
3. Test with different user roles
4. Check browser console for errors
5. Review Laravel logs in `backend/storage/logs/`

## Conclusion

The reporting feature is now fully implemented with:
- ✅ Complete backend API with role-based access control
- ✅ Comprehensive frontend interface
- ✅ Three-tier approval workflow
- ✅ Advanced filtering and search
- ✅ Statistics dashboard
- ✅ Responsive design
- ✅ Database migration completed

The system is ready for testing and deployment!
