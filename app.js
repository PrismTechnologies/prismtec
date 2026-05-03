const SITE_CONFIG = {
  brandPrimary: "PRISM",
  brandSecondary: "quant framework",
  pageTitle: "PRISM Quant Framework Waitlist",
  pricing: {
    waitlist: "Free",
    researcher: "$49/mo",
    operator: "$149/mo"
  },
  supabase: {
    url: "https://avzoonoexyvfhfwlwrfz.supabase.co",
    anonKey: "sb_publishable_Kqmb8WZJ__nB-j9XGBT61A_KoRXa4Pt",
    table: "waitlist",
    statsFunction: "waitlist_public_stats"
  }
};

const LOCAL_WAITLIST_KEY = "prism-waitlist";
const DEMO_ACTIVITY_KEY = "prism-demo-activity";
const DEMO_ACTIVITY_CONFIG = {
  enabledParam: "demoActivity",
  initialCount: 33587,
  hourlyGrowthMin: 1,
  hourlyGrowthMax: 10,
  toastDelayMinMs: 30000,
  toastDelayMaxMs: 60000
};
const US_STATE_CODES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY"
];

const brandPrimaryNodes = document.querySelectorAll("[data-brand-primary]");
const brandSecondaryNodes = document.querySelectorAll("[data-brand-secondary]");
const pageTitleNode = document.querySelector("[data-config-title]");
const priceNodes = document.querySelectorAll("[data-price-plan]");

brandPrimaryNodes.forEach((node) => {
  node.textContent = SITE_CONFIG.brandPrimary;
});

brandSecondaryNodes.forEach((node) => {
  node.textContent = SITE_CONFIG.brandSecondary;
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

function drawDashboardChart(canvas) {
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

function drawDashboardCharts() {
  document.querySelectorAll(".dashboard-chart").forEach(drawDashboardChart);
}

drawDashboardCharts();

if (!prefersReducedMotion) {
  window.addEventListener("resize", drawDashboardCharts);
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
const waitlistCountNode = document.getElementById("waitlistCount");
const waitlistCountNoteNode = document.getElementById("waitlistCountNote");
const activityToast = document.getElementById("activityToast");
const activityToastText = document.getElementById("activityToastText");
const countFormatter = new Intl.NumberFormat("en-US");
let recentActivity = [];
let toastTimer = null;
let hideToastTimer = null;
let demoGrowthTimer = null;

function isDemoActivityMode() {
  return true;//new URLSearchParams(window.location.search).get(DEMO_ACTIVITY_CONFIG.enabledParam) === "1";
}

function setStatus(message, state = "idle") {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.dataset.state = state;
}

function getLocalLeads() {
  return JSON.parse(window.localStorage.getItem(LOCAL_WAITLIST_KEY) || "[]");
}

function storeLocalLead(payload) {
  const existing = getLocalLeads();
  if (existing.some((lead) => lead.email === payload.email)) {
    return false;
  }
  existing.push(payload);
  window.localStorage.setItem(LOCAL_WAITLIST_KEY, JSON.stringify(existing));
  return true;
}

function setWaitlistCount(count, note) {
  if (waitlistCountNode) {
    waitlistCountNode.textContent = Number.isFinite(count) ? countFormatter.format(count) : "—";
  }

  if (waitlistCountNoteNode) {
    waitlistCountNoteNode.textContent = note;
  }
}

function normalizeLocation(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function formatActivityLocation(activity) {
  const state = normalizeLocation(activity.state_region).toUpperCase();
  const country = normalizeLocation(activity.country).toUpperCase();

  if (state && country && country !== "US") {
    return `${state}, ${country}`;
  }

  return state || country || "";
}

function randomDelay(minMs, maxMs) {
  return Math.floor(minMs + Math.random() * (maxMs - minMs));
}

function randomInteger(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function getRandomDemoActivity() {
  const state = US_STATE_CODES[Math.floor(Math.random() * US_STATE_CODES.length)];
  return {
    country: "US",
    state_region: state
  };
}

function showActivityToast() {
  if (!activityToast || !activityToastText || recentActivity.length === 0) {
    return;
  }

  const activity = recentActivity[Math.floor(Math.random() * recentActivity.length)];
  const location = formatActivityLocation(activity);
  if (!location) return;

  activityToastText.textContent = isDemoActivityMode()
    ? `Demo signup from ${location}`
    : `Recent waitlist signup from ${location}`;
  activityToast.hidden = false;
  window.requestAnimationFrame(() => {
    activityToast.classList.add("is-visible");
  });

  window.clearTimeout(hideToastTimer);
  hideToastTimer = window.setTimeout(() => {
    activityToast.classList.remove("is-visible");
    window.setTimeout(() => {
      activityToast.hidden = true;
    }, 220);
  }, 6200);
}

function scheduleActivityToast() {
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    showActivityToast();
    scheduleActivityToast();
  }, randomDelay(DEMO_ACTIVITY_CONFIG.toastDelayMinMs, DEMO_ACTIVITY_CONFIG.toastDelayMaxMs));
}

function setRecentActivity(items) {
  recentActivity = items
    .map((item) => ({
      country: normalizeLocation(item.country),
      state_region: normalizeLocation(item.state_region)
    }))
    .filter((item) => item.country || item.state_region);
}

function getDemoActivityState() {
  const now = Date.now();
  let state = {
    count: DEMO_ACTIVITY_CONFIG.initialCount,
    lastIncrementAt: now
  };

  try {
    const stored = JSON.parse(window.localStorage.getItem(DEMO_ACTIVITY_KEY) || "null");
    if (
      stored &&
      Number.isFinite(Number(stored.count)) &&
      Number.isFinite(Number(stored.lastIncrementAt))
    ) {
      state = {
        count: Math.max(DEMO_ACTIVITY_CONFIG.initialCount, Number(stored.count)),
        lastIncrementAt: Number(stored.lastIncrementAt)
      };
    }
  } catch (error) {
    state = {
      count: DEMO_ACTIVITY_CONFIG.initialCount,
      lastIncrementAt: now
    };
  }

  const elapsedHours = Math.floor((now - state.lastIncrementAt) / 3600000);
  for (let index = 0; index < elapsedHours; index += 1) {
    state.count += randomInteger(
      DEMO_ACTIVITY_CONFIG.hourlyGrowthMin,
      DEMO_ACTIVITY_CONFIG.hourlyGrowthMax
    );
    state.lastIncrementAt += 3600000;
  }

  window.localStorage.setItem(DEMO_ACTIVITY_KEY, JSON.stringify(state));
  return state;
}

function setDemoActivityState(state) {
  window.localStorage.setItem(DEMO_ACTIVITY_KEY, JSON.stringify(state));
}

function loadDemoActivityStats() {
  const state = getDemoActivityState();
  setWaitlistCount(state.count, "Demo activity mode. Simulated test count, not live waitlist data.");
  setRecentActivity(US_STATE_CODES.map((stateCode) => ({ country: "US", state_region: stateCode })));
  return state;
}

function scheduleDemoCountGrowth() {
  window.clearTimeout(demoGrowthTimer);
  if (!isDemoActivityMode()) return;

  const state = getDemoActivityState();
  const nextIncrementAt = state.lastIncrementAt + 3600000;
  const delay = Math.max(1000, nextIncrementAt - Date.now());

  demoGrowthTimer = window.setTimeout(() => {
    const nextState = getDemoActivityState();
    nextState.count += randomInteger(
      DEMO_ACTIVITY_CONFIG.hourlyGrowthMin,
      DEMO_ACTIVITY_CONFIG.hourlyGrowthMax
    );
    nextState.lastIncrementAt = Date.now();
    setDemoActivityState(nextState);
    setWaitlistCount(nextState.count, "Demo activity mode. Simulated test count, not live waitlist data.");
    scheduleDemoCountGrowth();
  }, delay);
}

function addDemoSignupToCount() {
  if (!isDemoActivityMode()) return;
  const state = getDemoActivityState();
  state.count += 1;
  setDemoActivityState(state);
  setWaitlistCount(state.count, "Demo activity mode. Simulated test count, not live waitlist data.");
}

async function loadWaitlistStats() {
  if (isDemoActivityMode()) {
    loadDemoActivityStats();
    return;
  }

  const client = getSupabaseClient();

  if (!client) {
    const localLeads = getLocalLeads();
    setWaitlistCount(localLeads.length, "Local preview count. Connect Supabase for live public stats.");
    setRecentActivity(localLeads);
    return;
  }

  try {
    const { data, error } = await client.rpc(SITE_CONFIG.supabase.statsFunction, {
      recent_limit: 24
    });

    if (error) throw error;

    const totalCount = Number(data?.total_count);
    setWaitlistCount(totalCount, "Live count from the PRISM waitlist.");
    setRecentActivity(Array.isArray(data?.recent) ? data.recent : []);
  } catch (error) {
    setWaitlistCount(NaN, "Apply the updated Supabase schema to enable live stats.");
  }
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") || "").trim().toLowerCase(),
      use_case: String(formData.get("use_case") || ""),
      country: normalizeLocation(formData.get("country")),
      state_region: normalizeLocation(formData.get("state_region")),
      plan_interest: String(formData.get("plan_interest") || ""),
      source_path: window.location.pathname,
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    };

    if (!payload.email || !payload.use_case || !payload.country || !payload.state_region || !payload.plan_interest) {
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
        addDemoSignupToCount();
        await loadWaitlistStats();
      } else {
        const saved = storeLocalLead(payload);
        setStatus(
          saved
            ? "Saved locally. Add Supabase credentials in app.js before publishing."
            : "You are already saved locally."
        );
        if (saved) {
          addDemoSignupToCount();
        }
        await loadWaitlistStats();
      }

      form.reset();
    } catch (error) {
      setStatus(error.message || "Something went wrong. Please try again.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

loadWaitlistStats();
window.setInterval(loadWaitlistStats, 60000);
scheduleDemoCountGrowth();
scheduleActivityToast();
