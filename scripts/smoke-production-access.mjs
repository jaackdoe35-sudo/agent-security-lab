const base = (process.env.LAB_URL || "https://agent-security-lab.vercel.app").replace(/\/$/, "");
const probe = "invalid-access-probe-" + "x".repeat(32);
const response = await fetch(`${base}/api/access`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${probe}`
  },
  body: "{}"
});
const payload = await response.json().catch(() => ({}));

if (response.status === 401) {
  console.log("PASS: production access gate is configured and rejects an incorrect 32+ character token.");
} else if (response.status === 503) {
  throw new Error("Production LAB_ACCESS_TOKEN is missing or shorter than 32 characters.");
} else if (response.status === 429) {
  throw new Error("Production access gate is rate-limited; rerun after one minute.");
} else {
  throw new Error(`Unexpected production access status ${response.status}: ${JSON.stringify(payload)}`);
}
