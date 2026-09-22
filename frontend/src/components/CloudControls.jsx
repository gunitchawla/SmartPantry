import { useState } from "react";
import "./CloudControls.css";

function CloudControls({ onRunAudit, onExportToS3, onSubscribeAlerts, cloudHealth }) {
  const [email, setEmail] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showSubscribeForm, setShowSubscribeForm] = useState(false);

  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      await onRunAudit();
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportToS3();
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribing(true);
    try {
      await onSubscribeAlerts(email);
      setEmail("");
      setShowSubscribeForm(false);
    } finally {
      setIsSubscribing(false);
    }
  };

  const region = cloudHealth?.cloud_environment?.region || "us-east-1";
  const dbStatus = cloudHealth?.managed_services?.dynamodb?.mode === "dynamodb" ? "DynamoDB Active" : "Storage Online";

  return (
    <div className="cloud-controls-card">
      <div className="cloud-controls__header">
        <div className="cloud-controls__title-group">
          <span className="cloud-badge">AWS Cloud Services</span>
          <h3>Pantry Automation & Managed Services</h3>
        </div>
        <div className="cloud-status-indicators">
          <span className="cloud-pill">📍 {region}</span>
          <span className="cloud-pill">🗄️ {dbStatus}</span>
          <span className="cloud-pill">🔔 SNS Active</span>
          <span className="cloud-pill">🪣 S3 Connected</span>
        </div>
      </div>

      <div className="cloud-actions">
        <button
          type="button"
          onClick={handleAudit}
          disabled={isAuditing}
          className="cloud-btn cloud-btn--audit"
          title="Scans all inventory items and sends a comprehensive alert via Amazon SNS"
        >
          {isAuditing ? "Auditing & Alerting…" : "🔔 Run Expiry & Stock Audit"}
        </button>

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="cloud-btn cloud-btn--export"
          title="Generates a snapshot report and uploads it to Amazon S3 bucket"
        >
          {isExporting ? "Uploading to S3…" : "🪣 Export to Amazon S3"}
        </button>

        <button
          type="button"
          onClick={() => setShowSubscribeForm(!showSubscribeForm)}
          className="cloud-btn cloud-btn--subscribe"
          title="Subscribe your email to receive immediate SNS pantry alerts"
        >
          ✉️ {showSubscribeForm ? "Close Email Subscription" : "Subscribe to Alerts"}
        </button>
      </div>

      {showSubscribeForm && (
        <form onSubmit={handleSubscribe} className="cloud-subscribe-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email for Amazon SNS alerts..."
            required
            className="cloud-input"
          />
          <button type="submit" disabled={isSubscribing} className="cloud-btn cloud-btn--submit">
            {isSubscribing ? "Subscribing…" : "Confirm Subscription"}
          </button>
        </form>
      )}
    </div>
  );
}

export default CloudControls;
