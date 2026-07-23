#!/usr/bin/env bash
# One-time GCP project bootstrap for Varnarc.
set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
GCP_REGION="${GCP_REGION:-asia-southeast1}"
AR_REPO="${AR_REPO:-varnarc}"

echo "Project: $GCP_PROJECT_ID  Region: $GCP_REGION"

gcloud config set project "$GCP_PROJECT_ID"

APIS=(
  run.googleapis.com
  artifactregistry.googleapis.com
  secretmanager.googleapis.com
  cloudbuild.googleapis.com
  iam.googleapis.com
  iamcredentials.googleapis.com
  monitoring.googleapis.com
  logging.googleapis.com
  pubsub.googleapis.com
  cloudresourcemanager.googleapis.com
)

for api in "${APIS[@]}"; do
  gcloud services enable "$api" --quiet
done

if ! gcloud artifacts repositories describe "$AR_REPO" --location="$GCP_REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$GCP_REGION" \
    --description="Varnarc container images"
fi

SA_NAME="varnarc-deploy"
SA_EMAIL="${SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="Varnarc deploy (CI/CD)"
fi

ROLES=(
  roles/run.admin
  roles/artifactregistry.writer
  roles/iam.serviceAccountUser
  roles/secretmanager.secretAccessor
)

for role in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$role" \
    --quiet >/dev/null
done

echo ""
echo "Done. Artifact Registry: ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}"
echo "Deploy service account: ${SA_EMAIL}"
echo "Next: ./deploy/gcp/setup-workload-identity.sh"
