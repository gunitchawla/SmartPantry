output "frontend_url" {
  description = "Public URL for SmartPantry Web Dashboard"
  value       = "http://${aws_instance.frontend.public_ip}"
}

output "backend_api_url" {
  description = "Public URL for SmartPantry Backend REST API"
  value       = "http://${aws_instance.backend.public_ip}:5000"
}

output "backend_health_url" {
  description = "Automated Health & Cloud Services Status Endpoint"
  value       = "http://${aws_instance.backend.public_ip}:5000/health"
}

output "dynamodb_table" {
  description = "Managed Storage: Amazon DynamoDB Table Name"
  value       = aws_dynamodb_table.inventory.name
}

output "sns_topic_arn" {
  description = "Managed Messaging: Amazon SNS Topic ARN"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_alarm" {
  description = "CloudWatch Alarm Name"
  value       = aws_cloudwatch_metric_alarm.backend_cpu.alarm_name
}

output "ssh_frontend" {
  description = "SSH command to connect to Frontend EC2 instance"
  value       = var.key_name != "" ? "ssh -i <your-key.pem> ubuntu@${aws_instance.frontend.public_ip}" : "SSH requires key_name variable configured"
}

output "ssh_backend" {
  description = "SSH command to connect to Backend EC2 instance"
  value       = var.key_name != "" ? "ssh -i <your-key.pem> ubuntu@${aws_instance.backend.public_ip}" : "SSH requires key_name variable configured"
}
