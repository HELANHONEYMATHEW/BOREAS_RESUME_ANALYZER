**BOREAS - ATS RESUME ANALYSER**

Resume Analyzer is a full-stack, role-based recruitment platform designed to automate and optimize the hiring process. It streamlines resume screening, candidate-job matching, and interview workflow management through an intelligent and centralized system.

Built using the MERN Stack (MongoDB, Express.js, React.js, Node.js), the platform enables Candidates, Recruiters, HR, and Administrators to efficiently manage the end-to-end recruitment lifecycle — from job applications to final hiring decisions.

🚀 **Key Features**

🔐 Authentication & Role-Based Access

Secure authentication using JWT (JSON Web Tokens).
Role-specific access control with four user roles:
Candidate
Recruiter
HR
Admin
Dedicated dashboards with customized permissions.

📄 **Intelligent Resume Parsing & Match Scoring**
Supports resume uploads in PDF, DOCX, and TXT formats.
Automatically extracts critical candidate information:
Full Name
Email Address
Contact Number
Skills
Work Experience
Education
Generates an automated Match Score based on:
Skills Compatibility (60%)
Experience Relevance (20%)
Educational Qualification (20%)
Highlights both matching and missing skills for better decision-making.

👤 **Candidate Dashboard**

Candidates can:

Browse active job listings with required skillsets.
Apply for jobs by uploading resumes.
Preview extracted resume information before submission.
Track application status:
Pending
Reviewed
Shortlisted
Rejected
Manage and update personal profile information.

👔 **Recruiter Dashboard**

Recruiters can:

Review candidate applications along with match scores.
Analyze candidate suitability instantly.
Schedule interviews with selected candidates.
Add interview details such as:
Date
Time
Notes
Forward interview requests to HR for approval.
Monitor the status of interview requests.

👩‍💼 **HR Dashboard**

HR users can:

Access a centralized dashboard with key hiring metrics.
Monitor:
Total Job Openings
Total Applications
Average Match Scores
Visualize data through interactive charts.
Manage job postings:
Create
Edit
Delete
Review applications and update statuses.
Download candidate resumes.
Approve or reject recruiter interview requests.
Bulk upload resumes for mass screening and ranking.

👑 **Admin Dashboard**

Admins have complete system control, including all HR functionalities plus:

User Management
Assign and update user roles
Delete users
System Maintenance Settings
Enable/Disable maintenance mode
Restrict system access for non-admin users during updates

📊 **Analytics & Reporting**

Real-time visual analytics using Recharts.
Candidate match score distribution analysis.
Application trend tracking over time.
Hiring pipeline insights for improved recruitment strategy.

🔒 **Security & Reliability**

Password encryption using bcrypt.
Secure JWT-based authentication and authorization.
Role-based middleware for access protection.
File upload validation with a 10MB size limit.
Sanitized file storage for security.
Maintenance mode support for safe system updates.


## 📦 Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/HELANHONEYMATHEW/resume-analyzer.git
cd resume-analyzer

2. Backend setup

'''bash
cd backend
npm install

3. Create a .env file in the backend/ folder:
PORT=5000
MONGO_URI=u ur mongodb localhost
JWT_SECRET=your_super_secret_key

4.Start the backend:

npm run dev

5.Frontend setup

cd ../frontend
npm install
npm run dev
