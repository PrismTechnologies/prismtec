const SITE_CONFIG = {
  productName: "Quant Framework",
  pageTitle: "Quant Framework Waitlist",
  pricing: {
    waitlist: "Free",
    researcher: "$49/mo",
    operator: "$149/mo"
  },
  supabase: {
    url: "https://YOUR-PROJECT.supabase.co",
    anonKey: "YOUR-SUPABASE-ANON-KEY",
    table: "waitlist"
  }
};

const productNameNodes = document.querySelectorAll("[data-product-name]");
const pageTitleNode = document.querySelector("[data-config-title]");
const priceNodes = document.querySelectorAll("[data-price-plan]");

productNameNodes.forEach((node) => {
  node.textContent = SITE_CONFIG.productName;
});

if (pageTitleNode) {
  pageTitleNode.textContent = SITE_CONFIG.pageTitle;
}

document.title = SITE_CONFIG.pageTitle;

priceNodes.forEach((node) => {
  const plan = node.dataset.pricePlan;
  node.textContent = SITE_CONFIG.pricing[plan] || node.textContent;
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function drawHeroChart() {
  const canvas = document.getElementById("heroChart");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 28;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const points = 150;
  const values = [];
  let value = 0.38;

  for (let index = 0; index < points; index += 1) {
    const trend = index > 44 ? 0.004 : index > 18 ? 0.011 : -0.0015;
    const wave = Math.sin(index / 5) * 0.012 + Math.cos(index / 11) * 0.009;
    const noise = ((index * 9301 + 49297) % 233280) / 233280 - 0.5;
    value += trend + wave + noise * 0.018;
    value = Math.max(0.12, Math.min(0.88, value));
    values.push(value);
  }

  context.clearRect(0, 0, width, height);
  context.lineWidth = 1;

  for (let x = padding; x <= width - padding; x += 28) {
    context.beginPath();
    context.strokeStyle = "rgba(143, 217, 255, 0.09)";
    context.moveTo(x, padding);
    context.lineTo(x, height - padding);
    context.stroke();
  }

  for (let y = padding; y <= height - padding; y += 34) {
    context.beginPath();
    context.strokeStyle = "rgba(143, 217, 255, 0.1)";
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  const gradient = context.createLinearGradient(0, padding, 0, height - padding);
  gradient.addColorStop(0, "rgba(0, 208, 168, 0.44)");
  gradient.addColorStop(1, "rgba(0, 208, 168, 0.04)");

  context.beginPath();
  values.forEach((point, index) => {
    const x = padding + (index / (points - 1)) * chartWidth;
    const y = padding + (1 - point) * chartHeight;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.lineTo(width - padding, height - padding);
  context.lineTo(padding, height - padding);
  context.closePath();
  context.fillStyle = gradient;
  context.fill();

  context.beginPath();
  values.forEach((point, index) => {
    const x = padding + (index / (points - 1)) * chartWidth;
    const y = padding + (1 - point) * chartHeight;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.strokeStyle = "#00d0a8";
  context.lineWidth = 4;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();
}

drawHeroChart();

if (!prefersReducedMotion) {
  window.addEventListener("resize", drawHeroChart);
}

function hasSupabaseConfig() {
  return Boolean(
    SITE_CONFIG.supabase.url &&
      SITE_CONFIG.supabase.anonKey &&
      !SITE_CONFIG.supabase.url.includes("YOUR-PROJECT") &&
      !SITE_CONFIG.supabase.anonKey.includes("YOUR-SUPABASE")
  );
}

function getSupabaseClient() {
  if (!hasSupabaseConfig() || !window.supabase) {
    return null;
  }

  return window.supabase.createClient(
    SITE_CONFIG.supabase.url,
    SITE_CONFIG.supabase.anonKey
  );
}

const form = document.getElementById("waitlistForm");
const formStatus = document.getElementById("formStatus");

function setStatus(message, state = "idle") {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.dataset.state = state;
}

function storeLocalLead(payload) {
  const key = "quant-framework-waitlist";
  const existing = JSON.parse(window.localStorage.getItem(key) || "[]");
  if (existing.some((lead) => lead.email === payload.email)) {
    return false;
  }
  existing.push(payload);
  window.localStorage.setItem(key, JSON.stringify(existing));
  return true;
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") || "").trim().toLowerCase(),
      use_case: String(formData.get("use_case") || ""),
      plan_interest: String(formData.get("plan_interest") || ""),
      source_path: window.location.pathname,
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    };

    if (!payload.email || !payload.use_case || !payload.plan_interest) {
      setStatus("Please complete each field before joining.", "error");
      return;
    }

    submitButton.disabled = true;
    setStatus("Saving your spot...");

    try {
      const client = getSupabaseClient();

      if (client) {
        const { error } = await client.from(SITE_CONFIG.supabase.table).insert(payload);
        if (error) {
          if (error.code === "23505") {
            setStatus("You are already on the list. Thanks for checking back.");
            form.reset();
            return;
          }

          throw error;
        }
        setStatus("You are on the list. Thanks for helping validate the launch.");
      } else {
        const saved = storeLocalLead(payload);
        setStatus(
          saved
            ? "Saved locally. Add Supabase credentials in app.js before publishing."
            : "You are already saved locally."
        );
      }

      form.reset();
    } catch (error) {
      setStatus(error.message || "Something went wrong. Please try again.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}
