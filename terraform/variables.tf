variable "aws_region" {
  description = "AWS region for deployment (AWS Academy Learner Lab default is us-east-1)"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "production"
}

variable "instance_type" {
  description = "EC2 instance type (t3.micro is Learner Lab eligible and free-tier compliant)"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Optional EC2 Key Pair name for SSH access (leave empty if not using SSH keys)"
  type        = string
  default     = ""
}

variable "use_lab_role" {
  description = "Whether to use AWS Academy Learner Lab pre-existing LabInstanceProfile"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Optional email address to automatically subscribe to Amazon SNS SmartPantry alerts"
  type        = string
  default     = ""
}

variable "git_repo_url" {
  description = "Git repository URL to clone on EC2 instances"
  type        = string
  default     = "https://github.com/gunitchawla/SmartPantry.git"
}

variable "git_branch" {
  description = "Git branch to check out on EC2 instances"
  type        = string
  default     = "main"
}
