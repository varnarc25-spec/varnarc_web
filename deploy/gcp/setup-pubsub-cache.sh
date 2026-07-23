#!/usr/bin/env bash
# Pub/Sub topic for multi-region cache invalidation (regional Redis deployments).
set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"

TOPIC="${CACHE_PUBSUB_TOPIC:-varnarc-cache-invalidate}"
SUBSCRIPTION="${CACHE_PUBSUB_SUBSCRIPTION:-varnarc-cache-invalidate-sub}"

gcloud config set project "$GCP_PROJECT_ID" --quiet
gcloud services enable pubsub.googleapis.com --quiet

gcloud pubsub topics create "$TOPIC" 2>/dev/null || echo "Topic $TOPIC exists"
gcloud pubsub subscriptions create "$SUBSCRIPTION" \
  --topic="$TOPIC" \
  --ack-deadline=30 2>/dev/null || echo "Subscription $SUBSCRIPTION exists"

echo ""
echo "Set on each regional API deployment:"
echo "  CACHE_PUBSUB_TOPIC=$TOPIC"
echo "  CACHE_PUBSUB_SUBSCRIPTION=$SUBSCRIPTION"
echo "  GCP_PROJECT_ID=$GCP_PROJECT_ID"
