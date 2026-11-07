import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm";

const supabase = createClient(
  "https://lopbzmpnyicvaxfyekbz.supabase.co",
  "sb_publishable_idhYO5dmjg5HmC6GBKdvbw_u0UmW2gd"
);

const form = document.getElementById("auth-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submit-button");
const skipButton = document.getElementById("skip-button");
const switchButton = document.getElementById("switch-mode");
const intro = document.getElementById("form-intro");
const message = document.getElementById("message");

let mode = "register";
let busy = false;

function showError(error) {
  message.textContent = error || "Something went wrong. Try again.";
}

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === "register";
  intro.textContent = registering
    ? "Choose a username and password, or just skip."
    : "Enter your username and password.";
  submitButton.textContent = registering ? "Continue" : "Log in";
  passwordInput.autocomplete = registering ? "new-password" : "current-password";
  skipButton.hidden = !registering;
  switchButton.textContent = registering
    ? "Already have an account? Log in"
    : "Need an account? Sign up";
  message.textContent = "";
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
    throw new Error(detail || "Could not contact the server.");
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

async function rollAndRedirect() {
  const result = await invokeRng({ action: "roll" });
  if (!result?.destination || !result.destination.startsWith("https://infinitehomepage.com/_")) {
    throw new Error("Invalid roll destination.");
  }
  window.location.replace(result.destination);
}

function randomPassword() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function randomGuestName() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return "Guest" + String(bytes[0] % 100000000).padStart(8, "0");
}

async function continueAsGuest() {
  if (busy) return;
  busy = true;
  skipButton.disabled = true;
  submitButton.disabled = true;
  skipButton.textContent = "Loading...";
  message.textContent = "";

  try {
    let account;
    for (let attempt = 0; attempt < 8; attempt++) {
      account = await invokeRng({
        action: "register",
        username: randomGuestName(),
        password: randomPassword()
      });
      if (account?.session) break;
      throw new Error("Could not create a guest account.");
    }

    const { error } = await supabase.auth.setSession(account.session);
    if (error) throw error;
    await rollAndRedirect();
  } catch (error) {
    showError(error.message);
    busy = false;
    skipButton.disabled = false;
    submitButton.disabled = false;
    skipButton.textContent = "Skip";
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (busy) return;

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    showError("Use 3-20 letters, numbers, or underscores for your username.");
    return;
  }
  if (password.length < 8 || password.length > 72) {
    showError("Password must be 8-72 characters.");
    return;
  }

  busy = true;
  submitButton.disabled = true;
  skipButton.disabled = true;
  submitButton.textContent = mode === "register" ? "Loading..." : "Logging in...";
  message.textContent = "";

  try {
    const result = await invokeRng({ action: mode, username, password });
    const { error } = await supabase.auth.setSession(result.session);
    if (error) throw error;
    await rollAndRedirect();
  } catch (error) {
    showError(error.message);
    busy = false;
    submitButton.disabled = false;
    skipButton.disabled = false;
    submitButton.textContent = mode === "register" ? "Continue" : "Log in";
  }
});

skipButton.addEventListener("click", continueAsGuest);
switchButton.addEventListener("click", () => setMode(mode === "register" ? "login" : "register"));

async function start() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    await supabase.auth.signOut();
    return;
  }
  if (data.session) {
    document.querySelector("main").innerHTML = "<h1>Loading...</h1>";
    try {
      await rollAndRedirect();
    } catch (error) {
      await supabase.auth.signOut();
      document.querySelector("main").innerHTML = '<h1>Infinite RNG</h1><p>Session expired. Please continue again.</p><button onclick="location.reload()">Continue</button>';
    }
  }
}

start();