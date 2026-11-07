import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm";

const SUPABASE_URL = "https://lopbzmpnyicvaxfyekbz.supabase.co";
const SUPABASE_KEY = "sb_publishable_idhYO5dmjg5HmC6GBKdvbw_u0UmW2gd";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById("auth-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submit-button");
const switchButton = document.getElementById("switch-mode");
const title = document.getElementById("form-title");
const intro = document.getElementById("form-intro");
const message = document.getElementById("message");
const leaderList = document.getElementById("leader-list");

let mode = "register";
let busy = false;

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === "register";
  title.textContent = registering ? "Create your account" : "Welcome back";
  intro.textContent = registering
    ? "Choose a username and password to start rolling."
    : "Log in to continue rolling on this device.";
  submitButton.textContent = registering ? "Create account" : "Log in";
  passwordInput.autocomplete = registering ? "new-password" : "current-password";
  switchButton.textContent = registering
    ? "Already have an account? Log in"
    : "New here? Create an account";
  message.textContent = "";
}

function showError(text) {
  message.textContent = text || "Something went wrong. Please try again.";
}

async function loadLeaderboard() {
  const { data, error } = await supabase
    .from("rng_leaderboard")
    .select("username, rolls")
    .order("rolls", { ascending: false })
    .limit(10);

  if (error) {
    leaderList.innerHTML = '<li class="loading">Leaderboard unavailable.</li>';
    return;
  }

  leaderList.replaceChildren();
  if (!data || data.length === 0) {
    const empty = document.createElement("li");
    empty.className = "loading";
    empty.textContent = "No rolls recorded yet.";
    leaderList.append(empty);
    return;
  }

  data.forEach((player, index) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const rank = document.createElement("span");
    const rolls = document.createElement("span");

    rank.className = "rank";
    rank.textContent = String(index + 1).padStart(2, "0");
    name.className = "player";
    name.append(rank, document.createTextNode(player.username));
    rolls.className = "rolls";
    rolls.textContent = Number(player.rolls).toLocaleString() + " rolls";

    item.append(name, rolls);
    leaderList.append(item);
  });
}

async function invokeRng(body) {
  const { data, error } = await supabase.functions.invoke("rng", { body });
  if (error) {
    let detail = data?.error;
    if (!detail) {
      try {
        const response = await error.context?.json?.();
        detail = response?.error;
      } catch {}
    }
    throw new Error(detail || "Could not contact the RNG server.");
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

async function rollAndRedirect() {
  const result = await invokeRng({ action: "roll" });
  if (!result?.destination || !result.destination.startsWith("https://infinitehomepage.com/_")) {
    throw new Error("The RNG returned an invalid destination.");
  }
  window.location.replace(result.destination);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    showError("Username must be 3-20 characters and use only letters, numbers, or underscores.");
    return;
  }
  if (password.length < 8 || password.length > 72) {
    showError("Password must be between 8 and 72 characters.");
    return;
  }

  busy = true;
  submitButton.disabled = true;
  submitButton.textContent = mode === "register" ? "Creating account..." : "Logging in...";
  message.textContent = "";

  try {
    const result = await invokeRng({ action: mode, username, password });
    const { error: sessionError } = await supabase.auth.setSession(result.session);
    if (sessionError) throw sessionError;

    submitButton.textContent = "Rolling...";
    await rollAndRedirect();
  } catch (error) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setMode("login");
      usernameInput.value = username;
      passwordInput.value = "";
    }
    showError(error.message);
    busy = false;
    submitButton.disabled = false;
    submitButton.textContent = mode === "register" ? "Create account" : "Log in";
  }
});

switchButton.addEventListener("click", () => {
  setMode(mode === "register" ? "login" : "register");
});

async function start() {
  loadLeaderboard();

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    await supabase.auth.signOut();
    return;
  }

  if (data.session) {
    title.textContent = "Rolling...";
    intro.textContent = "Taking you to your result.";
    form.hidden = true;
    switchButton.hidden = true;
    try {
      await rollAndRedirect();
    } catch (rollError) {
      await supabase.auth.signOut();
      form.hidden = false;
      switchButton.hidden = false;
      setMode("login");
      showError(rollError.message);
    }
  }
}

start();