# -----------------------------------------------------------------------------
# Networking Data Sources (AWS Academy Learner Lab Default VPC)
# -----------------------------------------------------------------------------
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Latest Ubuntu 24.04 LTS AMI (Noble Numbat)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# -----------------------------------------------------------------------------
# Security Groups (Decoupled Two-Tier Architecture with unique name prefixes)
# -----------------------------------------------------------------------------
resource "aws_security_group" "frontend" {
  name        = "smartpantry-frontend-sg"
  description = "Allow HTTP and SSH inbound to SmartPantry Frontend"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP web traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS web traffic (allows instant TCP RST / fallback from modern browsers)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH administrative access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "smartpantry-frontend-sg"
  }
}

resource "aws_security_group" "backend" {
  name        = "smartpantry-backend-api-sg"
  description = "Allow API traffic from Frontend and SSH to SmartPantry Backend"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "REST API access from Frontend instance"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }

  ingress {
    description = "Direct REST API testing access (for evaluators and automated checks)"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH administrative access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "smartpantry-backend-sg"
  }
}

# -----------------------------------------------------------------------------
# Managed Storage Service: Amazon DynamoDB (Primary Managed Storage)
# -----------------------------------------------------------------------------
resource "aws_dynamodb_table" "inventory" {
  name         = "smartpantry-inventory"
  billing_mode = "PAY_PER_REQUEST" # Serverless on-demand pricing (zero idle cost)
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "smartpantry-inventory"
  }
}

# -----------------------------------------------------------------------------
# Further Non-EC2 Managed Service: Amazon SNS (Messaging & Alerts)
# -----------------------------------------------------------------------------
resource "aws_sns_topic" "alerts" {
  name = "smartpantry-alerts"

  tags = {
    Name = "smartpantry-alerts"
  }
}

resource "aws_sns_topic_subscription" "email_alert" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# -----------------------------------------------------------------------------
# Telemetry & Monitoring: Amazon CloudWatch Alarm
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "backend_cpu" {
  alarm_name          = "smartpantry-backend-high-cpu"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alarm triggered when SmartPantry Backend CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.backend.id
  }

  tags = {
    Name = "smartpantry-backend-cpu-alarm"
  }
}

# -----------------------------------------------------------------------------
# Compute Tier: Two Interacting Virtual Machines (EC2)
# -----------------------------------------------------------------------------

# 1. Application Layer: Backend EC2 Instance
resource "aws_instance" "backend" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  key_name                    = var.key_name != "" ? var.key_name : null
  iam_instance_profile        = var.use_lab_role ? "LabInstanceProfile" : null
  vpc_security_group_ids      = [aws_security_group.backend.id]
  subnet_id                   = tolist(data.aws_subnets.default.ids)[0]
  associate_public_ip_address = true

  user_data = templatefile("${path.module}/user_data_backend.sh", {
    aws_region          = var.aws_region
    dynamodb_table_name = aws_dynamodb_table.inventory.name
    sns_topic_arn       = aws_sns_topic.alerts.arn
    git_repo_url        = var.git_repo_url
    git_branch          = var.git_branch
  })

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 security enforcement
    http_put_response_hop_limit = 2
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 10
  }

  tags = {
    Name = "smartpantry-backend"
    Role = "ApplicationTier"
  }

  depends_on = [
    aws_dynamodb_table.inventory,
    aws_sns_topic.alerts
  ]
}

# 2. Presentation Layer: Frontend EC2 Instance
resource "aws_instance" "frontend" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  key_name                    = var.key_name != "" ? var.key_name : null
  iam_instance_profile        = var.use_lab_role ? "LabInstanceProfile" : null
  vpc_security_group_ids      = [aws_security_group.frontend.id]
  subnet_id                   = tolist(data.aws_subnets.default.ids)[0]
  associate_public_ip_address = true

  user_data = templatefile("${path.module}/user_data_frontend.sh", {
    aws_region          = var.aws_region
    backend_ip          = aws_instance.backend.public_ip
    backend_private_ip  = aws_instance.backend.private_ip
    git_repo_url        = var.git_repo_url
    git_branch          = var.git_branch
  })

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2
    http_put_response_hop_limit = 2
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 10
  }

  tags = {
    Name = "smartpantry-frontend"
    Role = "PresentationTier"
  }

  depends_on = [
    aws_instance.backend
  ]
}
