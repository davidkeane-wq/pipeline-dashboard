terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "pipeline-dashboard-tfstate"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_artifact_registry_repository" "app" {
  location      = var.region
  repository_id = "pipeline-dashboard"
  format        = "DOCKER"
}

resource "google_storage_bucket" "tfstate" {
  name          = "pipeline-dashboard-tfstate"
  location      = var.region
  force_destroy = false
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

resource "google_storage_bucket" "scan_results" {
  name          = "pipeline-dashboard-scan-results"
  location      = var.region
  force_destroy = false
  uniform_bucket_level_access = true
}
resource "google_cloud_run_v2_service" "app" {
  name     = "pipeline-dashboard"
  location = var.region

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/pipeline-dashboard/pipeline-dashboard-app:latest"

      env {
        name  = "GITHUB_TOKEN"
        value = var.github_token
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}