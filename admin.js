const ADMIN_SITE_CONFIG = window.PRISM_SITE_CONFIG || {
  brandPrimary: "PRISM",
  brandSecondary: "quant framework",
  pageTitle: "PRISM Quant Framework Waitlist",
  supabase: {
    url: "",
    anonKey: "",
    table: "waitlist",
    adminCheckFunction: "is_waitlist_admin"
  }
};

const ADMIN_LOCAL_WAITLIST_KEY = "prism-waitlist";
const ADMIN_PAGE_SIZE = 50;

const useCaseLabels = {
  strategy_research: "Strategy research",
  portfolio_validation: "Portfolio validation",
  parameter_optimization: "Parameter optimization",
  live_monitoring: "Live monitoring"
};

const planLabels = {
  waitlist: "Waitlist only",
  researcher: "Researcher",
  operator: "Operator",
  custom: "Custom or team"
};

const brandPrimaryNodes = document.querySelectorAll("[data-brand-primary]");
const brandSecondaryNodes = document.querySelectorAll("[data-brand-secondary]");
const countFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

brandPrimaryNodes.forEach((node) => {
  node.textContent = ADMIN_SITE_CONFIG.brandPrimary;
});

brandSecondaryNodes.forEach((node) => {
  node.textContent = ADMIN_SITE_CONFIG.brandSecondary;
});

const adminClient = getAdminSupabaseClient();
const adminState = {
  session: null,
  isAdmin: false,
  rows: [],
  totalCount: 0,
  page: 0,
  search: "",
  useCase: "",
  plan: "",
  searchTimer: null
};

const elements = {
  authPanel: document.getElementById("adminAuthPanel"),
  authForm: document.getElementById("adminAuthForm"),
  authStatus: document.getElementById("adminAuthStatus"),
  email: document.getElementById("adminEmail"),
  dashboard: document.getElementById("adminDashboard"),
  identity: document.getElementById("adminIdentity"),
  refreshButton: document.getElementById("adminRefreshButton"),
  signOutButton: document.getElementById("adminSignOutButton"),
  search: document.getElementById("adminSearch"),
  useCaseFilter: document.getElementById("adminUseCaseFilter"),
  planFilter: document.getElementById("adminPlanFilter"),
  exportButton: document.getElementById("adminExportButton"),
  totalCount: document.getElementById("adminTotalCount"),
  todayCount: document.getElementById("adminTodayCount"),
  researcherCount: document.getElementById("adminResearcherCount"),
  operatorCount: document.getElementById("adminOperatorCount"),
  resultSummary: document.getElementById("adminResultSummary"),
  pageLabel: document.getElementById("adminPageLabel"),
  prevPage: document.getElementById("adminPrevPage"),
  nextPage: document.getElementById("adminNextPage"),
  rows: document.getElementById("adminRows")
};

function hasAdminSupabaseConfig() {
  const config = ADMIN_SITE_CONFIG.supabase || {};
  return Boolean(
    config.url &&
      config.anonKey &&
      !config.url.includes("YOUR-PROJECT") &&
      !config.anonKey.includes("YOUR-SUPABASE")
  );
}

function getAdminSupabaseClient() {
  if (!hasAdminSupabaseConfig() || !window.supabase) {
    return null;
  }

  return window.supabase.createClient(
    ADMIN_SITE_CONFIG.supabase.url,
    ADMIN_SITE_CONFIG.supabase.anonKey
  );
}

function setAuthStatus(message, state = "idle") {
  if (!elements.authStatus) return;
  elements.authStatus.textContent = message;
  elements.authStatus.dataset.state = state;
}

function formatCount(value) {
  return Number.isFinite(value) ? countFormatter.format(value) : "-";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateFormatter.format(date);
}

function formatLocation(row) {
  const state = String(row.state_region || "").trim();
  const country = String(row.country || "").trim();
  return [state, country].filter(Boolean).join(", ") || "-";
}

function formatSource(row) {
  return String(row.source_path || "").trim() || "-";
}

function getSessionEmail() {
  return adminState.session?.user?.email || "";
}

function getLocalLeads() {
  try {
    return JSON.parse(window.localStorage.getItem(ADMIN_LOCAL_WAITLIST_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function sanitizeSearch(value) {
  return String(value || "")
    .trim()
    .replace(/[%*,()]/g, " ")
    .replace(/\s+/g, "%")
    .slice(0, 80);
}

function matchesLocalFilters(row) {
  if (adminState.useCase && row.use_case !== adminState.useCase) {
    return false;
  }

  if (adminState.plan && row.plan_interest !== adminState.plan) {
    return false;
  }

  const search = String(adminState.search || "").trim().toLowerCase();
  if (!search) return true;

  const haystack = [
    row.email,
    row.country,
    row.state_region,
    row.source_path,
    useCaseLabels[row.use_case],
    planLabels[row.plan_interest]
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

function setLoadingState(isLoading) {
  [
    elements.refreshButton,
    elements.exportButton,
    elements.prevPage,
    elements.nextPage
  ].forEach((button) => {
    if (button) button.disabled = isLoading;
  });

  if (isLoading && elements.resultSummary) {
    elements.resultSummary.textContent = "Loading signups...";
  }
}

function createCell(text, className) {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) {
    cell.className = className;
  }
  return cell;
}

function renderRows() {
  if (!elements.rows) return;
  elements.rows.replaceChildren();

  if (adminState.rows.length === 0) {
    const row = document.createElement("tr");
    const cell = createCell("No signups match the current view.");
    cell.colSpan = 6;
    row.append(cell);
    elements.rows.append(row);
    return;
  }

  adminState.rows.forEach((item) => {
    const row = document.createElement("tr");
    row.append(
      createCell(formatDate(item.created_at), "admin-nowrap"),
      createCell(item.email || "-", "admin-email-cell"),
      createCell(useCaseLabels[item.use_case] || item.use_case || "-"),
      createCell(planLabels[item.plan_interest] || item.plan_interest || "-"),
      createCell(formatLocation(item)),
      createCell(formatSource(item))
    );
    elements.rows.append(row);
  });
}

function renderPagination() {
  const currentPage = adminState.page + 1;
  const pageCount = Math.max(1, Math.ceil(adminState.totalCount / ADMIN_PAGE_SIZE));
  const start = adminState.totalCount === 0 ? 0 : adminState.page * ADMIN_PAGE_SIZE + 1;
  const end = Math.min(adminState.totalCount, (adminState.page + 1) * ADMIN_PAGE_SIZE);

  if (elements.resultSummary) {
    elements.resultSummary.textContent =
      adminState.totalCount === 0
        ? "0 signups"
        : `${formatCount(start)}-${formatCount(end)} of ${formatCount(adminState.totalCount)} signups`;
  }

  if (elements.pageLabel) {
    elements.pageLabel.textContent = `Page ${currentPage} of ${pageCount}`;
  }

  if (elements.prevPage) {
    elements.prevPage.disabled = adminState.page === 0;
  }

  if (elements.nextPage) {
    elements.nextPage.disabled = currentPage >= pageCount;
  }
}

function renderDashboard() {
  renderRows();
  renderPagination();
}

function renderMetrics(metrics) {
  if (elements.totalCount) elements.totalCount.textContent = formatCount(metrics.total);
  if (elements.todayCount) elements.todayCount.textContent = formatCount(metrics.today);
  if (elements.researcherCount) elements.researcherCount.textContent = formatCount(metrics.researcher);
  if (elements.operatorCount) elements.operatorCount.textContent = formatCount(metrics.operator);
}

function getStartOfTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

async function getCountFromQuery(query) {
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function loadAdminMetrics() {
  if (!adminClient) {
    const rows = getLocalLeads();
    renderMetrics({
      total: rows.length,
      today: rows.filter((row) => new Date(row.created_at || 0) >= new Date(getStartOfTodayIso())).length,
      researcher: rows.filter((row) => row.plan_interest === "researcher").length,
      operator: rows.filter((row) => row.plan_interest === "operator").length
    });
    return;
  }

  const table = ADMIN_SITE_CONFIG.supabase.table;
  const [total, today, researcher, operator] = await Promise.all([
    getCountFromQuery(adminClient.from(table).select("id", { count: "exact", head: true })),
    getCountFromQuery(adminClient.from(table).select("id", { count: "exact", head: true }).gte("created_at", getStartOfTodayIso())),
    getCountFromQuery(adminClient.from(table).select("id", { count: "exact", head: true }).eq("plan_interest", "researcher")),
    getCountFromQuery(adminClient.from(table).select("id", { count: "exact", head: true }).eq("plan_interest", "operator"))
  ]);

  renderMetrics({ total, today, researcher, operator });
}

function applyRemoteFilters(query) {
  if (adminState.useCase) {
    query = query.eq("use_case", adminState.useCase);
  }

  if (adminState.plan) {
    query = query.eq("plan_interest", adminState.plan);
  }

  const search = sanitizeSearch(adminState.search);
  if (search) {
    query = query.or(
      [
        `email.ilike.%${search}%`,
        `country.ilike.%${search}%`,
        `state_region.ilike.%${search}%`,
        `source_path.ilike.%${search}%`
      ].join(",")
    );
  }

  return query;
}

async function loadRemoteRows() {
  const from = adminState.page * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;
  const table = ADMIN_SITE_CONFIG.supabase.table;

  let query = adminClient
    .from(table)
    .select("id,email,use_case,country,state_region,plan_interest,source_path,user_agent,created_at", {
      count: "exact"
    })
    .order("created_at", { ascending: false });

  query = applyRemoteFilters(query).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  adminState.rows = Array.isArray(data) ? data : [];
  adminState.totalCount = count || 0;
}

function loadLocalRows() {
  const rows = getLocalLeads()
    .filter(matchesLocalFilters)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const from = adminState.page * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE;

  adminState.totalCount = rows.length;
  adminState.rows = rows.slice(from, to);
}

async function loadRows() {
  try {
    setLoadingState(true);

    if (adminClient) {
      await loadRemoteRows();
    } else {
      loadLocalRows();
    }

    await loadAdminMetrics();
    renderDashboard();
  } catch (error) {
    adminState.rows = [];
    adminState.totalCount = 0;
    renderDashboard();
    if (elements.resultSummary) {
      elements.resultSummary.textContent =
        error.message || "Unable to load waitlist signups.";
    }
  } finally {
    setLoadingState(false);
  }
}

function showLoggedOut() {
  adminState.isAdmin = false;
  if (elements.authPanel) elements.authPanel.hidden = false;
  if (elements.dashboard) elements.dashboard.hidden = true;
  if (elements.refreshButton) elements.refreshButton.hidden = true;
  if (elements.signOutButton) elements.signOutButton.hidden = true;
  if (elements.identity) elements.identity.textContent = "";
}

function showDashboard() {
  if (elements.authPanel) elements.authPanel.hidden = true;
  if (elements.dashboard) elements.dashboard.hidden = false;
  if (elements.refreshButton) elements.refreshButton.hidden = false;
  if (elements.signOutButton) elements.signOutButton.hidden = !adminClient;

  const email = getSessionEmail();
  if (elements.identity) {
    elements.identity.textContent = email
      ? `Signed in as ${email}`
      : "Local preview mode";
  }
}

async function authorizeAndLoad() {
  if (!adminClient) {
    showDashboard();
    setAuthStatus("");
    await loadRows();
    return;
  }

  try {
    const functionName = ADMIN_SITE_CONFIG.supabase.adminCheckFunction || "is_waitlist_admin";
    const { data, error } = await adminClient.rpc(functionName);
    if (error) throw error;

    adminState.isAdmin = data === true;
    if (!adminState.isAdmin) {
      showLoggedOut();
      if (elements.signOutButton) elements.signOutButton.hidden = false;
      if (elements.identity) elements.identity.textContent = `Signed in as ${getSessionEmail()}`;
      setAuthStatus("This email is signed in but is not on the waitlist admin allowlist.", "error");
      return;
    }

    showDashboard();
    setAuthStatus("");
    await loadRows();
  } catch (error) {
    showLoggedOut();
    if (elements.signOutButton) elements.signOutButton.hidden = false;
    if (elements.identity && getSessionEmail()) {
      elements.identity.textContent = `Signed in as ${getSessionEmail()}`;
    }
    setAuthStatus(
      error.message || "Unable to verify admin access. Run the updated Supabase schema.",
      "error"
    );
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  if (!adminClient) {
    showDashboard();
    await loadRows();
    return;
  }

  const email = String(new FormData(elements.authForm).get("email") || "")
    .trim()
    .toLowerCase();
  if (!email) {
    setAuthStatus("Enter an email address.", "error");
    return;
  }

  const password = String(new FormData(elements.authForm).get("password") || "");
  if (!password) {
    setAuthStatus("Enter your password.", "error");
    return;
  }

  const submitButton = elements.authForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  setAuthStatus("Signing in...");

  try {
    const { data, error } = await adminClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    adminState.session = data.session;
    setAuthStatus("Signed in. Loading dashboard...");
    await authorizeAndLoad();
  } catch (error) {
    setAuthStatus(error.message || "Unable to sign in.", "error");
  } finally {
    submitButton.disabled = false;
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function exportVisibleRows() {
  if (adminState.rows.length === 0) {
    return;
  }

  const headers = [
    "created_at",
    "email",
    "use_case",
    "plan_interest",
    "country",
    "state_region",
    "source_path",
    "user_agent"
  ];
  const csv = [
    headers.join(","),
    ...adminState.rows.map((row) =>
      headers.map((header) => csvEscape(row[header])).join(",")
    )
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `prism-waitlist-${date}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function bindAdminEvents() {
  if (elements.authForm) {
    elements.authForm.addEventListener("submit", handleAuthSubmit);
  }

  if (elements.refreshButton) {
    elements.refreshButton.addEventListener("click", loadRows);
  }

  if (elements.signOutButton) {
    elements.signOutButton.addEventListener("click", async () => {
      if (adminClient) {
        await adminClient.auth.signOut();
      }
      adminState.session = null;
      showLoggedOut();
      setAuthStatus("Signed out.");
    });
  }

  if (elements.search) {
    elements.search.addEventListener("input", () => {
      window.clearTimeout(adminState.searchTimer);
      adminState.searchTimer = window.setTimeout(() => {
        adminState.search = elements.search.value;
        adminState.page = 0;
        loadRows();
      }, 220);
    });
  }

  if (elements.useCaseFilter) {
    elements.useCaseFilter.addEventListener("change", () => {
      adminState.useCase = elements.useCaseFilter.value;
      adminState.page = 0;
      loadRows();
    });
  }

  if (elements.planFilter) {
    elements.planFilter.addEventListener("change", () => {
      adminState.plan = elements.planFilter.value;
      adminState.page = 0;
      loadRows();
    });
  }

  if (elements.prevPage) {
    elements.prevPage.addEventListener("click", () => {
      adminState.page = Math.max(0, adminState.page - 1);
      loadRows();
    });
  }

  if (elements.nextPage) {
    elements.nextPage.addEventListener("click", () => {
      adminState.page += 1;
      loadRows();
    });
  }

  if (elements.exportButton) {
    elements.exportButton.addEventListener("click", exportVisibleRows);
  }
}

async function initAdmin() {
  bindAdminEvents();

  if (!adminClient) {
    showDashboard();
    await loadRows();
    return;
  }

  const { data } = await adminClient.auth.getSession();
  adminState.session = data.session;

  if (adminState.session) {
    await authorizeAndLoad();
  } else {
    showLoggedOut();
  }

  adminClient.auth.onAuthStateChange(async (_event, session) => {
    adminState.session = session;
    if (session) {
      await authorizeAndLoad();
    } else {
      showLoggedOut();
    }
  });
}

initAdmin();
