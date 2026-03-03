import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const FREE_LISTING_LIMIT = 3;
const USAGE_KEY = "propcraft_usage";

function getUsageCount() {
  const usage = localStorage.getItem(USAGE_KEY);
  return usage ? parseInt(usage) : 0;
}

function incrementUsage() {
  const current = getUsageCount();
  localStorage.setItem(USAGE_KEY, current + 1);
  return current + 1;
}

export default function App() {
  const [formData, setFormData] = useState({ propertyType: "House", bedrooms: "", bathrooms: "", features: "", location: "", price: "", tone: "Professional" });
  const [listing, setListing] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    setUsageCount(getUsageCount());
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      localStorage.setItem(USAGE_KEY, "999");
      setUsageCount(999);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({
        lineItems: [{ price: import.meta.env.VITE_STRIPE_PRICE_ID, quantity: 1 }],
        mode: "subscription",
        successUrl: window.location.origin + "?success=true",
        cancelUrl: window.location.origin + "?canceled=true",
      });
    } catch (err) {
      setError("Payment setup failed. Please try again.");
      setCheckoutLoading(false);
    }
  };

  const generateListing = async () => {
    if (!formData.bedrooms || !formData.bathrooms || !formData.location) {
      setError("Please fill in bedrooms, bathrooms, and location.");
      return;
    }
    const currentUsage = getUsageCount();
    if (currentUsage >= FREE_LISTING_LIMIT) {
      setShowPaywall(true);
      return;
    }
    setLoading(true);
    setError("");
    setListing("");
    const prompt = "Write a compelling real estate listing.\nType: " + formData.propertyType + "\nBeds: " + formData.bedrooms + "\nBaths: " + formData.bathrooms + "\nFeatures: " + formData.features + "\nLocation: " + formData.location + "\nPrice: " + formData.price + "\nTone: " + formData.tone + "\n\nStart with a headline. Write 2-3 paragraphs. Publication-ready copy only.";
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1024, messages: [{ role: "user", content: prompt }] }),
      });
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      setListing(data.content[0].text);
      const newCount = incrementUsage();
      setUsageCount(newCount);
    } catch (err) {
      setError("Failed to generate listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(listing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const remainingFree = Math.max(0, FREE_LISTING_LIMIT - usageCount);
  const isPro = usageCount >= 999;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #1a1208 50%, #0a0a0a 100%)", color: "#f5f0e8", fontFamily: "'DM Sans', sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "13px", letterSpacing: "4px", color: "#c9a84c", marginBottom: "16px", textTransform: "uppercase" }}>AI-Powered For Real Estate Professionals</div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: "300", margin: "0 0 16px", fontFamily: "Georgia, serif" }}>Prop<span style={{ color: "#c9a84c" }}>craft</span></h1>
          <p style={{ color: "#a09880", fontSize: "17px", margin: "0" }}>Professional property listings in seconds</p>
          {!isPro && (
            <div style={{ display: "inline-block", marginTop: "16px", padding: "8px 20px", background: remainingFree > 0 ? "rgba(201,168,76,0.1)" : "rgba(255,80,80,0.1)", border: "1px solid " + (remainingFree > 0 ? "rgba(201,168,76,0.3)" : "rgba(255,80,80,0.3)"), borderRadius: "20px", fontSize: "13px", color: remainingFree > 0 ? "#c9a84c" : "#ff8080" }}>
              {remainingFree > 0 ? remainingFree + " free listing" + (remainingFree !== 1 ? "s" : "") + " remaining" : "Free listings used — upgrade to continue"}
            </div>
          )}
          {isPro && <div style={{ display: "inline-block", marginTop: "16px", padding: "8px 20px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "20px", fontSize: "13px", color: "#c9a84c" }}>✦ Pro Member — Unlimited Listings</div>}
        </div>

        {showPaywall && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ background: "#1a1208", border: "1px solid rgba(201,168,76,0.4)", borderRadius: "16px", padding: "48px", maxWidth: "480px", width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>✦</div>
              <h2 style={{ font"Georgia, serif", fontSize: "28px", fontWeight: "300", marginBottom: "12px" }}>You have used your 3 free listings</h2>
              <p style={{ color: "#a09880", marginBottom: "32px" }}>Upgrade to Propcraft Pro for unlimited listings at $29/month.</p>
              <button onClick={handleCheckout} disabled={checkoutLoading} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #c9a84c, #e8c96d)", color: "#0a0a0a", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>
                {checkoutLoading ? "Redirecting..." : "Upgrade to Pro — $29/month"}
              </button>
              <button onClick={() => setShowPaywall(false)} style={{ background: "none", border: "none", color: "#a09880", cursor: "pointer", fontSize: "14px" }}>Maybe later</button>
            </div>
          </div>
        )}

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "16", padding: "40px", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "11px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "28px" }}>Property Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "8px" }}>Type</label>
              <select name="propertyType" value={formData.propertyType} onChange={handleChange} style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#f5f0e8", fontSize: "15px" }}>
                {["House","Apartment","Townhouse","Villa","Studio","Penthouse","Land"].map(t => <option key={t} value={t} style={{ background: "#1a1208" }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "8px" }}>Bedrooms</label>
              <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} placeholder="4" style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#f5f0e8", fontSize: "15px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "8px" }}>Bathrooms</label>
              <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} placeholder="2" style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#f5f0e8", fontSize: "15px", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "8px" }}>Key Features</label>
            <input type="text" name="features" value={formData.features} onChange={handleChange} placeholder="Ocean views, renovated kitchen, double garage..." style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#f5f0e8", fontSize: "15px", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "8px" }}>Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Bondi Beach, Sydney" style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#f5f0e8", fontSize: "15px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "8px" }}>Asking Price (optional)</label>
              <input type="text" name="price" value={formData.price} onChange={handleChange} placeholder="$1,850,000" style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#f5f0e8", fontSize: "15px", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", textTransform: "uppercase", marginBottom: "12px" }}>Tone</label>
            <div style={{ display: "flex", gap: "12px" }}>
              {["Professional","Luxury","Friendly"].map(tone => (
                <button key={tone} onClick={() => setFormData({ ...formData, tone })} style={{ flex: 1, padding: "12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", background: formData.tone === tone ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)", border: "1px solid " + (formData.tone === tone ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.15)"), color: formData.tone === tone ? "#c9a84c" : "#a09880" }}>{tone}</button>
              ))}
            </div>
          </div>
          <button onClick={generateListing} disabled={loading} style={{ width: "100%", padding: "18px", background: loading ? "rgba(201,168,76,0.3)" : "linear-gradient(135deg, #c9a84c, #e8c96d)", color: loading ? "#a09880" : "#0a0a0a", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Generating..." : "✦ Generate Listing"}
          </button>
          {error && <p style={{ color: "#ff8080", marginTop: "12px", fontSize: "14px" }}>{error}</p>}
        </div>

        {listing && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "16px", padding: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "11px", letterSpacing: "3px", color: "#c9a84c", textTransform: "uppercase", margin: 0 }}>Generated Listing</h2>
              <button onClick={copyToClipboard} style={{ padding: "8px 20px", background: copied ? "rgba(201,168,76,0.2)" : "transparent", border: "1px solid rgba(201,168,76,0.4)", borderRadius: "6px", color: "#c9a84c", cursor: "pointer", fontSize: "13px" }}>{copied ? "✓ Copied!" : "Copy"}</button>
            </div>
            <style={{ lineHeight: "1.8", fontSize: "16px", color: "#e8e0d0", whiteSpace: "pre-wrap" }}>{listing}</div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "48px", color: "#4a4035", fontSize: "13px" }}>
          <a href="https://propcraft.co" style={{ color: "#4a4035", textDecoration: "none" }}>propcraft.co</a> · Built for real estate professionals
        </div>
      </div>
    </div>
  );
}
