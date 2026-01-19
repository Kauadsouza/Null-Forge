type Provider = "email" | "google" | "facebook";

type Session = {
  provider: Provider;
  email: string;
  name: string;
  avatarLetter: string;
  createdAt: number;
};

const LS_SESSION = "nf_session_v1";
const LS_THEME = "nf_theme_v1";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

function setAriaHidden(el: HTMLElement, hidden: boolean) {
  el.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function nowYear() {
  const y = new Date().getFullYear();
  const el = $("year");
  if (el) el.textContent = String(y);
}

function sanitizeNameFromEmail(email: string): string {
  const left = email.split("@")[0] ?? "Usuário";
  const parts = left.replace(/[._-]+/g, " ").trim().split(" ").filter(Boolean);
  const pretty = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  return pretty || "Usuário";
}

function firstLetter(nameOrEmail: string): string {
  const s = (nameOrEmail || "").trim();
  return (s[0] ? s[0].toUpperCase() : "U");
}

function saveSession(session: Session, remember: boolean) {
  if (!remember) {
    // Se não "lembrar", guarda só em memória (não salva)
    // (aqui optamos por salvar mesmo assim com expiração curta? não. Melhor: não salva.)
    return;
  }
  localStorage.setItem(LS_SESSION, JSON.stringify(session));
}

function loadSession(): Session | null {
  const raw = localStorage.getItem(LS_SESSION);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (!s?.email || !s?.provider) return null;
    return s;
  } catch {
    return null;
  }
}

function clearSessionEverywhere() {
  localStorage.removeItem(LS_SESSION);
}

function setTheme(theme: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(LS_THEME, theme);
  updateThemeIcons(theme);
}

function getTheme(): "dark" | "light" {
  const saved = localStorage.getItem(LS_THEME);
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

function toggleTheme() {
  const current = getTheme();
  setTheme(current === "dark" ? "light" : "dark");
}

function updateThemeIcons(theme: "dark" | "light") {
  const iconClass = theme === "dark" ? "fa-moon" : "fa-sun";
  const removeClass = theme === "dark" ? "fa-sun" : "fa-moon";

  const swap = (btnId: string) => {
    const btn = $(btnId);
    if (!btn) return;
    const icon = btn.querySelector("i");
    if (!icon) return;
    icon.classList.remove(removeClass);
    icon.classList.add(iconClass);
  };

  swap("themeBtn");
  swap("themeBtn2");
}

function showStatus(msg: string, kind: "ok" | "err" | "idle" = "idle") {
  const el = $("authStatus");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("ok", "err");
  if (kind === "ok") el.classList.add("ok");
  if (kind === "err") el.classList.add("err");
}

function openApp(session: Session) {
  const authRoot = $("authRoot");
  const appRoot = $("appRoot");
  if (!authRoot || !appRoot) return;

  setAriaHidden(authRoot, true);
  setAriaHidden(appRoot, false);

  const userName = $("userName");
  const userEmail = $("userEmail");
  const avatar = $("avatar");

  if (userName) userName.textContent = session.name;
  if (userEmail) userEmail.textContent = session.email;
  if (avatar) avatar.textContent = session.avatarLetter;

  // Fecha menus ao entrar
  closeUserMenu();
}

function backToAuth() {
  const authRoot = $("authRoot");
  const appRoot = $("appRoot");
  if (!authRoot || !appRoot) return;

  setAriaHidden(appRoot, true);
  setAriaHidden(authRoot, false);

  showStatus("Sessão encerrada.", "ok");
}

function loginAs(provider: Provider, email: string, remember: boolean) {
  const name = provider === "email" ? sanitizeNameFromEmail(email) : sanitizeNameFromEmail(email);
  const session: Session = {
    provider,
    email,
    name,
    avatarLetter: firstLetter(name),
    createdAt: Date.now(),
  };

  // Se remember estiver marcado, salva no localStorage
  if (remember) saveSession(session, true);

  openApp(session);
}

function validateEmailPass(email: string, pass: string) {
  if (!email.includes("@") || email.length < 6) return "Digite um e-mail válido.";
  if (pass.length < 4) return "Senha muito curta (mínimo 4).";
  return null;
}

/* Tabs */
function setActiveTab(tabKey: string) {
  // nav items
  document.querySelectorAll<HTMLButtonElement>(".nav-item").forEach(btn => {
    const key = btn.getAttribute("data-tab");
    btn.classList.toggle("active", key === tabKey);
  });

  // sections
  document.querySelectorAll<HTMLElement>(".tab").forEach(sec => {
    sec.classList.remove("active");
  });
  const target = document.getElementById(`tab-${tabKey}`);
  if (target) target.classList.add("active");
}

/* Sidebar */
function toggleSidebar() {
  const sidebar = $("sidebar");
  if (!sidebar) return;
  sidebar.classList.toggle("is-collapsed");
}

/* User menu */
function openUserMenu() {
  const menu = $("userMenu");
  if (!menu) return;
  menu.setAttribute("aria-hidden", "false");
}

function closeUserMenu() {
  const menu = $("userMenu");
  if (!menu) return;
  menu.setAttribute("aria-hidden", "true");
}

function isUserMenuOpen(): boolean {
  const menu = $("userMenu");
  if (!menu) return false;
  return menu.getAttribute("aria-hidden") === "false";
}

function toggleUserMenu() {
  if (isUserMenuOpen()) closeUserMenu();
  else openUserMenu();
}

/* Password toggle */
function togglePasswordVisibility() {
  const pass = $("password") as HTMLInputElement | null;
  const btn = $("togglePassword");
  if (!pass || !btn) return;

  const icon = btn.querySelector("i");
  const isHidden = pass.type === "password";
  pass.type = isHidden ? "text" : "password";

  if (icon) {
    icon.classList.toggle("fa-eye", !isHidden);
    icon.classList.toggle("fa-eye-slash", isHidden);
  }
}

/* Search (demo) */
function wireGlobalSearch() {
  const search = $("globalSearch") as HTMLInputElement | null;
  if (!search) return;

  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = search.value.trim();
      if (!q) return;
      // demo: só dá feedback visual
      // você pode trocar por fetch no futuro
      alert(`Busca (demo): "${q}"`);
    }
  });
}

function wireEvents() {
  // theme
  $("themeBtn")?.addEventListener("click", toggleTheme);
  $("themeBtn2")?.addEventListener("click", toggleTheme);

  // clear session
  $("logoutEverywhereBtn")?.addEventListener("click", () => {
    clearSessionEverywhere();
    showStatus("Sessão limpa. Faça login novamente.", "ok");
  });

  // oauth demo
  $("btnGoogle")?.addEventListener("click", () => {
    const remember = ( $("remember") as HTMLInputElement | null )?.checked ?? true;
    showStatus("Login Google (demo) realizado ✅", "ok");
    loginAs("google", "user.google@gmail.com", remember);
  });

  $("btnFacebook")?.addEventListener("click", () => {
    const remember = ( $("remember") as HTMLInputElement | null )?.checked ?? true;
    showStatus("Login Facebook (demo) realizado ✅", "ok");
    loginAs("facebook", "user.facebook@gmail.com", remember);
  });

  // email login
  const form = $("emailLoginForm") as HTMLFormElement | null;
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = ( $("email") as HTMLInputElement | null )?.value?.trim() ?? "";
    const pass = ( $("password") as HTMLInputElement | null )?.value ?? "";
    const remember = ( $("remember") as HTMLInputElement | null )?.checked ?? true;

    const err = validateEmailPass(email, pass);
    if (err) {
      showStatus(err, "err");
      return;
    }

    showStatus("Login realizado ✅", "ok");
    loginAs("email", email, remember);
  });

  // forgot
  $("forgotBtn")?.addEventListener("click", () => {
    showStatus("Recuperação de senha (demo): conecte no backend depois.", "idle");
    alert("Recuperação de senha (demo). Depois você liga no backend.");
  });

  // password toggle
  $("togglePassword")?.addEventListener("click", togglePasswordVisibility);

  // sidebar toggle
  $("menuBtn")?.addEventListener("click", toggleSidebar);

  // nav tabs
  document.querySelectorAll<HTMLButtonElement>(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-tab");
      if (!key) return;
      setActiveTab(key);
    });
  });

  // user menu toggle
  $("userMenuBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleUserMenu();
  });

  // click outside closes user menu
  document.addEventListener("click", (e) => {
    const pill = $("userPill");
    const menu = $("userMenu");
    if (!pill || !menu) return;

    const target = e.target as Node;
    const clickedInside = pill.contains(target);
    if (!clickedInside) closeUserMenu();
  });

  // menu actions
  $("goAccount")?.addEventListener("click", () => {
    setActiveTab("account");
    closeUserMenu();
  });

  $("logoutBtn")?.addEventListener("click", () => {
    clearSessionEverywhere();
    closeUserMenu();
    backToAuth();
  });

  // notifications demo
  $("notifBtn")?.addEventListener("click", () => {
    alert("Notificações (demo). Depois você liga com backend.");
  });

  // search
  wireGlobalSearch();
}

function bootstrap() {
  nowYear();

  // theme on load
  setTheme(getTheme());

  wireEvents();

  // auto-login if session exists
  const session = loadSession();
  if (session) {
    openApp(session);
  } else {
    // garante tela de login
    const authRoot = $("authRoot");
    const appRoot = $("appRoot");
    if (authRoot && appRoot) {
      setAriaHidden(authRoot, false);
      setAriaHidden(appRoot, true);
    }
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);
