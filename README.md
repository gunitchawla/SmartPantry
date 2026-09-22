# 🥫 SmartPantry: Cloud Edition
### Scalable, Cloud-Native Pantry Inventory Management System
**COSC349: Cloud Computing Architecture — Assignment 2 (2026)**

SmartPantry is a modern, distributed cloud application designed to help households track perishable groceries, prevent food waste, monitor stock levels, and dispatch real-time expiry alerts.

Initially deployed across local virtual machines in Assignment 1, this version redesigns and extends SmartPantry into a production-grade, public cloud infrastructure deployed on **Amazon Web Services (AWS)** using **Terraform** Infrastructure as Code (IaC).

---

## 📌 Table of Contents

* [Architecture Overview](#-architecture-overview)
* [Key Cloud Features](#-key-cloud-features)
* [Cloud Services Utilized](#-cloud-services-utilized)
* [Prerequisites & Required Tool Versions](#-prerequisites--required-tool-versions)
* [AWS Academy Learner Lab Setup](#-aws-academy-learner-lab-setup)
* [Deployment Instructions](#-deployment-instructions)
* [Automated Workflow Verification](#-automated-workflow-verification)
* [Deployment Variables Reference](#-deployment-variables-reference)
* [Manual Steps Justification](#-manual-steps-justification)
* [Cost & Resource Lifecycle](#-cost--resource-lifecycle)
* [Screen Recording Demonstration](#-screen-recording-demonstration)
* [Local Development & Testing](#-local-development--testing)
* [Security & Trust Boundaries](#-security--trust-boundaries)
* [Project Structure](#-project-structure)

---

## 🏗️ Architecture Overview

SmartPantry adopts **Compute Approach 1** (two interacting virtual machines + managed services), decoupling the presentation, business logic, storage, and notification tiers.

```text
                               ┌─────────────────────────────────┐
                               │       End User / Browser        │
                               └────────────────┬────────────────┘
                                                │
                                                │ HTTP (Port 80)
                                                ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ AWS Cloud (us-east-1 / AWS Academy Learner Lab)                                        │
 │                                                                                        │
 │  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
 │  │ Virtual Private Cloud (Default VPC)                                              │  │
 │  │                                                                                  │  │
 │  │   ┌─────────────────────────────┐         ┌─────────────────────────────┐        │  │
 │  │   │ Frontend EC2 (t3.micro)     │         │ Backend EC2 (t3.micro)      │        │  │
 │  │   │ • Nginx Web Server (:80)    │  HTTP   │ • Node.js 22 LTS API (:5000)│        │  │
 │  │   │ • React + Vite SPA Bundle   ├────────►│ • IAM LabInstanceProfile    │        │  │
 │  │   │ • Reverse Proxy (/api/*)    │  :5000  │ • Auto-restart via systemd  │        │  │
 │  │   │ SG: smartpantry-frontend-sg │         │ SG: smartpantry-backend-sg  │        │  │
 │  │   └─────────────────────────────┘         └──────────────┬──────────────┘        │  │
 │  │                                                          │                       │  │
 │  └──────────────────────────────────────────────────────────┼───────────────────────┘  │
 │                                                             │                          │
 │                    ┌────────────────────────────────────────┼────────────────────┐     │
 │                    │ SigV4 Signed API Calls (HTTPS TLS 1.3) │                    │     │
 │                    ▼                                        ▼                    ▼     │
 │     ┌─────────────────────────────┐          ┌──────────────────────┐ ┌──────────────┐ │
 │     │ Managed Storage: DynamoDB   │          │ Managed Messaging:   │ │ Object Store:│ │
 │     │ Table: smartpantry-inventory│          │ Amazon SNS           │ │ Amazon S3    │ │
 │     │ • Primary Key: id (UUID)    │          │ Topic:               │ │ Bucket:      │ │
 │     │ • On-Demand (Zero Idle Cost)│          │ smartpantry-alerts   │ │ smartpantry- │ │
 │     │ • Auto-Partitioned Multi-AZ │          │ • Expiry & Stock SMS │ │ data-*       │ │
 │     └─────────────────────────────┘          └──────────────┬───────┘ └──────────────┘ │
 │                                                             │                          │
 └─────────────────────────────────────────────────────────────┼──────────────────────────┘
                                                               │ Email / SMS Notifications
                                                               ▼
                                                ┌─────────────────────────────┐
                                                │ Subscribed Users / Managers │
                                                └─────────────────────────────┘
```

---

## ✨ Key Cloud Features

* **Serverless NoSQL Storage**: Replaced self-hosted local MySQL with **Amazon DynamoDB** for sub-10ms reads and writes, multi-AZ redundancy, and zero idle cost.
* **Decoupled Alert Dispatching**: Integrates **Amazon SNS** to broadcast real-time alerts when items are expiring soon ($\le 3$ days), expired, or low in stock ($\le 2$ units).
* **Inventory Audit Sweep**: Operator-triggered or automated inventory scan publishing aggregated summary digests via Amazon SNS.
* **Email Subscription Flow**: Direct subscription to SNS topic from the web UI to receive pantry notifications.
* **Cloud Object Exports**: Backs up immutable inventory snapshots to an **Amazon S3** bucket.
* **Reverse Proxying**: Nginx securely proxies `/api/*` requests across internal VPC IP addresses, eliminating CORS issues.
* **IMDSv2 & Zero Hardcoded Secrets**: Leverages AWS EC2 Instance Metadata Service v2 (IMDSv2) and the pre-authenticated `LabInstanceProfile`. No AWS secrets or access keys are ever stored on VMs or in Git.

---

## ☁️ Cloud Services Utilized

| Service | Category | Resource Identifier | Purpose |
| :--- | :--- | :--- | :--- |
| **Amazon EC2** | Compute (Approach 1) | `smartpantry-frontend`, `smartpantry-backend` | Two interacting Ubuntu 24.04 VMs hosting Nginx/React and Node.js REST API |
| **Amazon DynamoDB** | Managed Storage Service | `smartpantry-inventory` | Fully managed NoSQL primary database storing inventory items |
| **Amazon SNS** | Managed Messaging Service | `smartpantry-alerts` | Decoupled event notification topic broadcasting expiry & low-stock alerts |
| **Amazon S3** | Managed Object Storage | `smartpantry-data-<random-id>` | Encrypted private bucket storing JSON inventory snapshot reports |
| **Amazon CloudWatch** | Monitoring & Telemetry | `smartpantry-backend-high-cpu` | Metric alarm triggering SNS alerts if backend CPU $\ge 80\%$ |
| **AWS IAM** | Identity & Security | `LabInstanceProfile` | Temporary credential resolution via IMDSv2 (zero hardcoded secrets) |

---

## 🔧 Prerequisites & Required Tool Versions

To deploy and operate SmartPantry in the cloud, ensure the following tools are installed:

* **Terraform**: Version `1.5.0` or higher ([Install Terraform](https://developer.hashicorp.com/terraform/downloads))
* **AWS CLI**: Version `2.15.0` or higher ([Install AWS CLI](https://aws.amazon.com/cli/))
* **Node.js**: Version `22 LTS` (for optional local testing)
* **cURL**: Standard on macOS/Linux (for automated workflow verification)
* **Git**: Version `2.30` or higher

---

## 🔑 AWS Academy Learner Lab Setup

When working in an AWS Academy Learner Lab session:

1. Open your **AWS Academy Learner Lab** console.
2. Click **Start Lab** and wait until the indicator turns green.
3. Click the **AWS Details** link next to the status icon.
4. Copy the temporary credentials under **AWS CLI** and paste them into your terminal:

```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
export AWS_DEFAULT_REGION="us-east-1"
```

> [!NOTE]
> AWS Academy Learner Lab sessions expire every 4 hours. If Terraform commands fail with an expired token error, simply copy fresh credentials from the Learner Lab modal.

---

## 🚀 Deployment Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/gunitchawla/SmartPantry.git
cd SmartPantry
```

### 2. Configure Deployment Variables (Optional)
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```
*You can customize `alert_email` inside `terraform.tfvars` if you wish to receive SNS alerts in your personal inbox.*

### 3. Deploy via Terraform (or use `./scripts/deploy.sh`)
```bash
# Initialize Terraform and download HashiCorp AWS provider
terraform init

# Review execution plan
terraform plan

# Apply the infrastructure deployment (~2 to 3 minutes)
terraform apply -auto-approve
```

### 4. Deployment Outputs
Upon successful application, Terraform prints the active cloud endpoints:
```text
Apply complete! Resources: 9 added, 0 changed, 0 destroyed.

Outputs:

backend_api_url = "http://54.167.34.12:5000"
backend_health_url = "http://54.167.34.12:5000/health"
dynamodb_table = "smartpantry-inventory"
frontend_url = "http://54.205.18.91"
s3_bucket = "smartpantry-data-a3b1c2d3"
sns_topic_arn = "arn:aws:sns:us-east-1:123456789012:smartpantry-alerts"
```

Open `frontend_url` in your browser to access the live dashboard!

* **Expected Deployment Time**: **2 to 3 minutes** total.
* **Region**: `us-east-1`.
* **Resource Naming Scheme**: All resources are prefixed with `smartpantry-*`.

---

## 🧪 Automated Workflow Verification

To fulfill the assignment requirement for an automated check of a cloud-hosted workflow, execute the included test script:

```bash
# Test against your deployed public backend URL:
./scripts/test-cloud-workflow.sh $(terraform -chdir=terraform output -raw backend_api_url)
```

The script automatically executes and validates 6 end-to-end cloud steps:
1. **Health Check**: Validates `GET /health` confirming backend uptime, AWS region, and cloud connection mode.
2. **Managed Storage Write**: Writes a test perishable product to **Amazon DynamoDB** (`POST /products`).
3. **Managed Storage Read**: Queries all products (`GET /products`) and verifies that the new record is present.
4. **Managed Service Alerting**: Triggers an inventory sweep (`POST /products/audit`) and confirms **Amazon SNS** dispatch.
5. **Object Storage Export**: Uploads an inventory report to **Amazon S3** (`POST /products/export`).
6. **Cleanup**: Deletes the test record from DynamoDB (`DELETE /products/:id`).

```text
=================================================================
   🥫 SmartPantry Cloud Automated Workflow Verification Check   
=================================================================
Target URL: http://54.167.34.12:5000
Execution Time: 2026-09-22 05:42:00 UTC

Step 1: Checking Backend Health & Cloud Services Status (/health)
  ✓ PASSED: Backend is healthy (HTTP 200)

Step 2: Meaningful Write to Managed Storage (POST /products)
  ✓ PASSED: Product successfully created in DynamoDB (HTTP 201)

Step 3: Meaningful Read from Managed Storage (GET /products)
  ✓ PASSED: Products list retrieved successfully (HTTP 200)
  ✓ PASSED: Verified newly inserted item is present in DynamoDB items list

Step 4: Trigger Non-EC2 Managed Service - Amazon SNS Audit Sweep (POST /products/audit)
  ✓ PASSED: Audit sweep completed and SNS alert event dispatched (HTTP 200)

Step 5: Trigger Managed Object Storage Export - Amazon S3 (POST /products/export)
  ✓ PASSED: Inventory snapshot exported to Amazon S3 (HTTP 200)

Step 6: Cleaning Up Test Item (DELETE /products/item-...)
  ✓ PASSED: Cleaned up test item from DynamoDB (HTTP 200)

=================================================================
Verification Summary: 7 passed, 0 failed
=================================================================
🎉 CLOUD WORKFLOW VERIFICATION SUCCEEDED!
```

---

## 📋 Deployment Variables Reference

The following parameters in `terraform/variables.tf` can be configured via `terraform.tfvars`:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `aws_region` | `string` | `"us-east-1"` | AWS Region for deployment |
| `environment` | `string` | `"production"` | Environment tag applied to all resources |
| `instance_type` | `string` | `"t3.micro"` | EC2 VM size (free-tier eligible) |
| `key_name` | `string` | `""` | Optional AWS SSH Key Pair name |
| `use_lab_role` | `bool` | `true` | When true, attaches pre-created `LabInstanceProfile` |
| `alert_email` | `string` | `""` | Optional email to subscribe to SNS alerts |
| `git_repo_url` | `string` | Repo URL | GitHub repository cloned during EC2 bootstrapping |
| `git_branch` | `string` | `"main"` | Branch checked out on instances |

---

## ⚖️ Manual Steps Justification

In accordance with COSC349 criteria, the following manual steps are required and justified by AWS Academy Learner Lab security constraints:

1. **Retrieving Learner Lab Session Credentials**:
   - *Justification*: AWS Academy accounts utilize short-lived STS tokens that expire every 4 hours. These cannot and must not be committed to Git. Users must paste their active session credentials into the terminal.
2. **Utilizing Pre-Existing `LabInstanceProfile`**:
   - *Justification*: AWS Academy Learner Lab prohibits IAM role/policy creation (`iam:CreateRole` is explicitly denied). Terraform is therefore configured to reference the existing `LabInstanceProfile` rather than attempting unauthorized role creation.

---

## 💰 Cost & Resource Lifecycle

### Cost Analysis (us-east-1, September 2026)

| State | Estimated Monthly Cost | Details |
| :--- | :--- | :--- |
| **Entirely Idle** | **\$23.98** | Incurs cost solely from two EC2 instances (\$14.98), attached 10GB gp3 EBS volumes (\$1.60), and allocated public IPv4 addresses (\$7.30). DynamoDB, SNS, and S3 cost **\$0.00** while idle. |
| **Lightly Used (100 hrs/month)** | **\$4.80** | Assumes VMs run only during active testing. Includes 10,000 DynamoDB operations, 500 SNS alerts, and S3 exports. |
| **With Active AWS Free Tier** | **\$0.90 / month** | 750 free t3.micro hours/month, 30GB free EBS storage, 25GB free DynamoDB storage. |

### Teardown & Lifecycle Management
* **Pause Billing without Data Loss**: Run `aws ec2 stop-instances` on the EC2 instances. This halts compute and IPv4 hourly fees while preserving EBS disks, DynamoDB items, SNS alerts, and S3 reports.
* **Complete Teardown**: To deprovision all cloud resources, run:
  ```bash
  cd terraform
  terraform destroy -auto-approve
  ```
  Terraform cleanly removes all resources in approximately **90 seconds**.
* **Data Preservation**: Prior to teardown, click **Export to Amazon S3** in the UI or run `POST /products/export` to create an immutable JSON report of the pantry inventory.

---

## 🎥 Screen Recording Demonstration

A concise screen recording under two minutes (110 seconds) demonstrates:
1. User accessing the cloud frontend and adding a near-expiry item.
2. Meaningful write and read in **Amazon DynamoDB**.
3. AWS Console proof of running EC2 instances, DynamoDB items, and **Amazon SNS** alert dispatching.
4. Execution of the automated verification script.

👉 Consult [`docs/SCREEN_RECORDING_GUIDE.md`](file:///Users/gunitchawla/SmartPantry/docs/SCREEN_RECORDING_GUIDE.md) for the exact storyboard, timestamped checklist, and narration script.

---

## 💻 Local Development & Testing

SmartPantry features an adaptive storage engine with graceful offline fallback. You can run and test both backend and frontend locally without an active AWS connection:

```bash
# 1. Run Backend locally
cd backend
npm install
npm test              # Executes local integration test suite (7 checks)
npm start             # Starts API on http://localhost:5000

# 2. Run Frontend locally
cd ../frontend
npm install
npm run dev           # Launches Vite dev server on http://localhost:5173
npm run build         # Validates production build bundle
```

---

## 🔒 Security & Trust Boundaries

* **Decoupled Security Groups**: The frontend security group permits public inbound traffic only on HTTP port 80. The backend security group accepts traffic on port 5000 strictly from the frontend security group.
* **Least Privilege Identity**: Backend EC2 instances use IMDSv2 to retrieve short-lived tokens through `LabInstanceProfile`. No AWS keys are stored on disk.
* **Protected Object Storage**: S3 public access block is enforced; all data at rest is encrypted via AES-256 (SSE-S3).

---

## 📁 Project Structure

```text
SmartPantry/
├── .gitignore                     # Rigorous exclusion of .tfstate, .env, and secrets
├── README.md                      # Primary cloud documentation
├── backend/                       # Node.js Express REST API (Application Tier)
│   ├── config/aws.js              # AWS SDK v3 client initialization
│   ├── controllers/               # Business logic & event dispatchers
│   ├── services/                  # DynamoDB, SNS, and S3 service adapters
│   ├── routes/products.js         # REST endpoints for products, audit, and export
│   ├── server.js                  # Express app & /health telemetry endpoint
│   └── package.json               # Dependencies (@aws-sdk/*, express, uuid)
├── frontend/                      # React + Vite Web Dashboard (Presentation Tier)
│   ├── src/components/            # Dashboard, AddProduct, ProductCard, CloudControls
│   ├── src/hooks/usePantry.js     # State management & cloud API hooks
│   └── package.json               # Dependencies (react, vite, axios)
├── terraform/                     # Infrastructure as Code (IaC)
│   ├── main.tf                    # Complete AWS resource definitions
│   ├── variables.tf               # Configurable deployment parameters
│   ├── outputs.tf                 # Output URLs and endpoints
│   ├── providers.tf               # HashiCorp AWS provider configuration
│   ├── user_data_frontend.sh      # Nginx & React bootstrap script
│   └── user_data_backend.sh       # Node.js backend bootstrap script
├── scripts/                       # Automation & Verification
│   ├── test-cloud-workflow.sh     # Automated cloud workflow test suite
│   ├── deploy.sh                  # Turnkey deployment helper
│   └── generate-report-pdf.sh     # Script compiling markdown report to PDF
└── docs/                          # Comprehensive Academic Documentation
    ├── REPORT.md                  # Complete Academic Project Report
    ├── COSC349_Assignment_2_Report.pdf # Submission-Ready PDF Report
    ├── ARCHITECTURE.md            # Technical Architecture Blueprint
    └── SCREEN_RECORDING_GUIDE.md  # Video recording script (< 2 minutes)
```

---

## 📄 License & Academic Attribution
Developed by Gunit Chawla for **COSC349: Cloud Computing Architecture (2026)** at the **University of Otago**. Distributed under the ISC License.
