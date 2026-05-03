/* ============================================================
   script.js — Smart Portfolio Hub
   Features: GitHub API, Gemini AI Chatbot, PWA, Animations
   ============================================================ */

const GITHUB_USERNAME = "shundaof09";

// Get one at https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = "AIzaSyDSa8iuuWpadV8ALSf-m0hyXHwrc55ZrOc";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const CHATBOT_CONTEXT = `You are a friendly, concise AI assistant on Rashunda's personal portfolio website. 
Answer visitor questions based on the following profile:
- Name: Rashunda
- Currently studying Data Science Technology at FSCJ (Florida State College at Jacksonville)
- Professional background in customer success and data strategy, with experience in fintech and SaaS
- Skills: HTML, CSS, JavaScript, responsive web design, data strategy, workflow optimization
- Interests: web development, fintech, clean UI design, building efficient workflows, coffee, mechanical keyboards, exploring historical sites
- Design style: rose-gold aesthetics, minimal layouts, polished branding
- Location: Jacksonville, FL
- This portfolio integrates AI (Google Gemini API), the GitHub REST API, and PWA features
Keep answers helpful, warm, and 2-3 sentences max.`;

// ── Initialize on page load ───────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Hamburger menu
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navLinks.classList.toggle("open");
    });
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navLinks.classList.remove("open");
      });
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Fade-in on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

  loadGitHubProjects();
  initChatbot();
  registerServiceWorker();
});

// ══ GITHUB API ════════════════════════════════════════════════
async function loadGitHubProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`
    );
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    const repos = await response.json();

    grid.innerHTML = "";
    if (repos.length === 0) {
      grid.innerHTML = '<p class="no-projects">No public repositories found.</p>';
      return;
    }

    const langColors = {
      HTML: "#e34c26", CSS: "#563d7c", JavaScript: "#f1e05a",
      Python: "#3572A5", Java: "#b07219", TypeScript: "#2b7489",
    };

    repos.forEach((repo) => {
      const card = document.createElement("div");
      card.className = "project-card";
      const langColor = langColors[repo.language] || "#999";
      card.innerHTML = `
        <h3 class="project-title">
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
        </h3>
        <p class="project-desc">${repo.description || "No description available."}</p>
        <div class="project-meta">
          ${repo.language ? `<span class="project-lang"><span class="lang-dot" style="background:${langColor}"></span>${repo.language}</span>` : ""}
          <span class="project-stars">&#11088; ${repo.stargazers_count}</span>
          <span class="project-updated">Updated ${formatDate(repo.updated_at)}</span>
        </div>`;
      grid.appendChild(card);
    });
  } catch (error) {
    console.error("Failed to load GitHub projects:", error);
    grid.innerHTML = `<div class="project-card error-card"><h3>Unable to Load Projects</h3>
      <p>Visit <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener noreferrer">my GitHub profile</a> directly.</p></div>`;
  }
}

function formatDate(dateString) {
  const diff = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 30) return `${diff} days ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ══ GEMINI AI CHATBOT ═════════════════════════════════════════
function initChatbot() {
  const toggle = document.getElementById("chatbot-toggle");
  const container = document.getElementById("chatbot-container");
  const form = document.getElementById("chatbot-form");
  const input = document.getElementById("chatbot-input");
  if (!toggle || !container || !form) return;

  toggle.addEventListener("click", () => {
    container.classList.toggle("open");
    if (container.classList.contains("open")) input.focus();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    addMessage(message, "user");
    input.value = "";
    const typingId = showTypingIndicator();
    try {
      const reply = await getGeminiResponse(message);
      removeTypingIndicator(typingId);
      addMessage(reply, "bot");
    } catch (error) {
      removeTypingIndicator(typingId);
      addMessage("Sorry, I'm having trouble connecting. Please try again!", "bot");
      console.error("Chatbot error:", error);
    }
  });
}

function addMessage(text, sender) {
  const messagesDiv = document.getElementById("chatbot-messages");
  const bubble = document.createElement("div");
  bubble.className = `message ${sender}-message`;
  bubble.innerHTML = `<p>${escapeHTML(text)}</p>`;
  messagesDiv.appendChild(bubble);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTypingIndicator() {
  const messagesDiv = document.getElementById("chatbot-messages");
  const typing = document.createElement("div");
  const id = "typing-" + Date.now();
  typing.id = id;
  typing.className = "message bot-message typing-indicator";
  typing.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  messagesDiv.appendChild(typing);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

let conversationHistory = [];

async function getGeminiResponse(userMessage) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "AIzaSyDSa8iuuWpadV8ALSf-m0hyXHwrc55ZrOc") {
    return getFallbackResponse(userMessage);
  }

  conversationHistory.push({ role: "user", parts: [{ text: userMessage }] });

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: CHATBOT_CONTEXT }] },
      contents: conversationHistory,
      generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
    }),
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "I'm not sure how to answer that. Feel free to reach out directly!";

  conversationHistory.push({ role: "model", parts: [{ text: reply }] });
  if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);
  return reply;
}

function getFallbackResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes("name") || lower.includes("who"))
    return "This is Rashunda's portfolio! She's a customer success and data strategy professional studying Data Science Technology at FSCJ.";
  if (lower.includes("skill") || lower.includes("tech"))
    return "Rashunda works with HTML, CSS, JavaScript, data strategy, and workflow optimization. She has experience in fintech and SaaS.";
  if (lower.includes("project") || lower.includes("work"))
    return "Check out the Projects section below! It pulls live data from Rashunda's GitHub repositories.";
  if (lower.includes("interest") || lower.includes("hobby"))
    return "Rashunda loves web development, fintech, clean UI design, coffee, mechanical keyboards, and exploring historical sites!";
  if (lower.includes("contact") || lower.includes("email"))
    return "You can reach Rashunda at s2563218@students.fscj.edu — scroll down to the footer!";
  if (lower.includes("school") || lower.includes("study"))
    return "Rashunda is studying Data Science Technology at Florida State College at Jacksonville (FSCJ).";
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey"))
    return "Hey there! Welcome to Rashunda's portfolio. What would you like to know?";
  return "Great question! For details, reach out to Rashunda at s2563218@students.fscj.edu I can tell you about her skills, projects, interests, or education!";
}

// ══ PWA — Service Worker ══════════════════════════════════════
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("./sw.js");
      console.log("Service Worker registered:", reg.scope);
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        const note = document.getElementById("pwa-note");
        if (note) note.textContent = "Tip: You can install this site as an app from your browser menu!";
      });
    } catch (err) {
      console.log("SW registration failed:", err);
    }
  }
}
