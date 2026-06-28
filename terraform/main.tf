terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4.0"
    }
  }
}

# Define a resource: a local text file
resource "local_file" "welcome_note" {
  filename = "${path.module}/welcome_terraform.txt"
  content  = "Welcome to Infrastructure as Code!\nThis file is managed entirely by Terraform.\n"
}
