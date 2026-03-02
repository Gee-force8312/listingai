import { useState } from "react";

const SYSTEM_PROMPT = `You are an elite real estate copywriter with 20 years of experience writing property listings that sell homes faster and above asking price. 

Your listings are:
- Emotionally compelling and paint a vivid picture of lifestyle
- SEO-optimised with natural keyword placement
- Professionally structured: attention-grabbing headline, immersive opening paragraph, key features, neighbourhood appeal, and a closing call to action
- Tailored to the requested tone (Luxury, Friendly/Family, or Professional/Neutral)
- Between 150-250 words — punchy, not padded

Never use clichés like "must see!", "gem", "cozy", or "motivated seller".
Never use filler phrases. Every sentence must earn its place.
Output ONLY the listing. No preamble, no explanation.`;

function buildUserPrompt(form) {
  return `Write a property listing with the following details:

Property Type: ${form.propertyType}
Bedrooms: ${form.bedrooms}
Bathrooms: ${form.bathrooms}
Key Features: ${form.features}
Location / Neighbourhood: ${form.neighbourhood}
Price (optional): ${form.price || "not disclosed"}
Tone: ${form.tone}

Generate a complete, professional real estate listing ready to publish.`;
}

export default function ListingAI() {
  const [form, setForm] = useState({
    propertyType: "House",
    bedrooms: "3",
    bathrooms: "2",
    features: "",
    neighbourhood: "",
    price: "",
    tone: "Professional",
  });
  const [listing, setListing] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateListing = async () => {
    if (!form.features || !form.neighbourhood) {
      setError("Please fill in Key Features and Neighbourhood.");
      return;
    }
    setError("");
    setLoading(true);
    setListing("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserPrompt(form) }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((c) => c.text || "").join("") || "";
      if (!text) throw new Error("No response received.");
      setListing(text);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(listing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#0f0e0c", color: "#f0ece4" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #2a2820", padding: "28px 40px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, background: "#c9a84c", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 18, color: "#0f0e0c" }}>L</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: "bold", letterSpacing: 1, color: "#f0ece4" }}>ListingAI</div>
          <div style={{ fontSize: 12, color: "#7a7060", letterSpacing: 2, textTransform: "uppercase" }}>Property Listing Generator</div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>

        {/* LEFT: Form */}
        <div>
          <h2 style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "#c9a84c", marginBottom: 28, fontFamily: "sans-serif" }}>Property Details</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Property Type */}
            <div>
              <label style={labelStyle}>Property Type</label>
              <select name="propertyType" value={form.propertyType} onChange={handleChange} style={inputStyle}>
                {["House", "Apartment", "Condo", "Townhouse", "Villa", "Studio", "Land"].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Beds / Baths */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Bedrooms</label>
                <select name="bedrooms" value={form.bedrooms} onChange={handleChange} style={inputStyle}>
                  {["Studio", "1", "2", "3", "4", "5", "6+"].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Bathrooms</label>
                <select name="bathrooms" value={form.bathrooms} onChange={handleChange} style={inputStyle}>
                  {["1", "1.5", "2", "2.5", "3", "4+"].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Features */}
            <div>
              <label style={labelStyle}>Key Features <span style={{ color: "#c9a84c" }}>*</span></label>
              <textarea
                name="features"
                value={form.features}
                onChange={handleChange}
                placeholder="e.g. Renovated kitchen, hardwood floors, rooftop terrace, city views, double garage..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {/* Neighbourhood */}
            <div>
              <label style={labelStyle}>Neighbourhood / Location <span style={{ color: "#c9a84c" }}>*</span></label>
              <input
                name="neighbourhood"
                value={form.neighbourhood}
                onChange={handleChange}
                placeholder="e.g. Paddington, Sydney — close to cafes, parks & transport"
                style={inputStyle}
              />
            </div>

            {/* Price */}
            <div>
              <label style={labelStyle}>Asking Price <span style={{ color: "#4a4840", fontSize: 11 }}>(optional)</span></label>
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. $850,000 or Offers over $1.2M"
                style={inputStyle}
              />
            </div>

            {/* Tone */}
            <div>
              <label style={labelStyle}>Tone & Style</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["Professional", "Luxury", "Friendly"].map(t => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, tone: t })}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      border: form.tone === t ? "1px solid #c9a84c" : "1px solid #2a2820",
                      background: form.tone === t ? "#1e1c18" : "transparent",
                      color: form.tone === t ? "#c9a84c" : "#7a7060",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      fontFamily: "sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={{ color: "#e07060", fontSize: 13, fontFamily: "sans-serif" }}>{error}</div>}

            {/* Generate Button */}
            <button
              onClick={generateListing}
              disabled={loading}
              style={{
                padding: "16px",
                background: loading ? "#2a2820" : "#c9a84c",
                color: loading ? "#7a7060" : "#0f0e0c",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: "bold",
                fontFamily: "sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: 1,
                transition: "all 0.2s",
                marginTop: 4,
              }}
            >
              {loading ? "✦ Generating..." : "✦ Generate Listing"}
            </button>
          </div>
        </div>

        {/* RIGHT: Output */}
        <div>
          <h2 style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "#c9a84c", marginBottom: 28, fontFamily: "sans-serif" }}>Generated Listing</h2>

          <div style={{
            minHeight: 480,
            background: "#17150f",
            border: "1px solid #2a2820",
            borderRadius: 10,
            padding: 28,
            position: "relative",
          }}>
            {!listing && !loading && (
              <div style={{ color: "#3a3830", fontSize: 15, lineHeight: 1.8, fontStyle: "italic" }}>
                Your professional property listing will appear here. Fill in the details and click Generate.
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 16 }}>
                <div style={{ width: 40, height: 40, border: "2px solid #2a2820", borderTop: "2px solid #c9a84c", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <div style={{ color: "#7a7060", fontSize: 13, fontFamily: "sans-serif", letterSpacing: 2 }}>CRAFTING YOUR LISTING...</div>
              </div>
            )}

            {listing && (
              <>
                <div style={{ fontSize: 15, lineHeight: 1.9, color: "#e0dcd4", whiteSpace: "pre-wrap" }}>
                  {listing}
                </div>
                <button
                  onClick={copyToClipboard}
                  style={{
                    marginTop: 24,
                    padding: "10px 20px",
                    background: copied ? "#2a4a2a" : "#1e1c18",
                    color: copied ? "#6abf6a" : "#c9a84c",
                    border: `1px solid ${copied ? "#6abf6a" : "#c9a84c"}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "sans-serif",
                    letterSpacing: 1,
                    transition: "all 0.3s",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy to Clipboard"}
                </button>
              </>
            )}
          </div>

          {/* Tip box */}
          <div style={{ marginTop: 20, padding: "16px 20px", background: "#17150f", border: "1px solid #2a2820", borderRadius: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#c9a84c", marginBottom: 8, fontFamily: "sans-serif" }}>Pro Tip</div>
            <div style={{ fontSize: 13, color: "#7a7060", lineHeight: 1.7, fontFamily: "sans-serif" }}>
              The more detail you add to Key Features, the better your listing. Include unique selling points, recent renovations, and lifestyle benefits.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1e1c18; color: #f0ece4; }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  letterSpacing: 2,
  textTransform: "uppercase",
  color: "#7a7060",
  marginBottom: 8,
  fontFamily: "sans-serif",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  background: "#17150f",
  border: "1px solid #2a2820",
  borderRadius: 6,
  color: "#f0ece4",
  fontSize: 14,
  fontFamily: "Georgia, serif",
  boxSizing: "border-box",
  outline: "none",
};
