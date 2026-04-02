const promptButtons = Array.from(document.querySelectorAll("[data-target]"));
const responseSections = Array.from(document.querySelectorAll("[data-response]"));
const promptPreview = document.getElementById("prompt-preview");
const yearNode = document.getElementById("year");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const promptLabels = {
  about: "About Me",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  contact: "Contact"
};

const responseMap = new Map(
  responseSections.map((section) => [section.dataset.response, section])
);

const typedSections = new WeakSet();
let revealQueue = Promise.resolve();

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

document.querySelectorAll(".type-line").forEach((line) => {
  line.dataset.fullText = line.textContent.replace(/\s+/g, " ").trim();
  line.textContent = "";
});

const wait = (duration) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

const updatePromptPreview = (target) => {
  if (!promptPreview) {
    return;
  }

  promptPreview.textContent = `> ${promptLabels[target] || target}`;
};

const setActiveButtons = (target) => {
  promptButtons.forEach((button) => {
    const isActive = button.dataset.target === target;
    button.classList.toggle("is-active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  });
};

const focusSection = (section) => {
  section.classList.add("is-focused");
  window.setTimeout(() => {
    section.classList.remove("is-focused");
  }, 900);
};

const typeLine = async (line) => {
  if (!line || line.classList.contains("is-complete")) {
    return;
  }

  const fullText = line.dataset.fullText || "";

  if (prefersReducedMotion) {
    line.textContent = fullText;
    line.classList.add("is-complete");
    return;
  }

  const speed = Number(line.dataset.speed || 18);
  line.classList.add("is-typing");

  for (const character of fullText) {
    line.textContent += character;
    await wait(character === " " ? speed * 0.45 : speed);
  }

  line.classList.remove("is-typing");
  line.classList.add("is-complete");
};

const revealSection = async (target) => {
  const section = responseMap.get(target);

  if (!section) {
    return;
  }

  setActiveButtons(target);
  updatePromptPreview(target);

  window.history.replaceState(null, "", `#${target}`);

  if (section.hasAttribute("hidden")) {
    section.removeAttribute("hidden");
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    section.classList.add("is-visible");
  } else {
    section.classList.add("is-visible");
  }

  section.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start"
  });

  if (typedSections.has(section)) {
    focusSection(section);
    return;
  }

  const lines = Array.from(section.querySelectorAll(".type-line"));

  for (const line of lines) {
    await typeLine(line);
    await wait(prefersReducedMotion ? 0 : 110);
  }

  typedSections.add(section);
  section.classList.add("is-typed");
  focusSection(section);
};

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.target;

    if (!target) {
      return;
    }

    setActiveButtons(target);
    updatePromptPreview(target);

    revealQueue = revealQueue.then(() => revealSection(target));
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    const visibleSections = entries
      .filter((entry) => entry.isIntersecting && !entry.target.hasAttribute("hidden"))
      .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

    if (!visibleSections.length) {
      return;
    }

    const activeTarget = visibleSections[0].target.dataset.response;
    setActiveButtons(activeTarget);
    updatePromptPreview(activeTarget);
  },
  {
    threshold: [0.35, 0.55, 0.75],
    rootMargin: "-20% 0px -35% 0px"
  }
);

responseSections.forEach((section) => {
  observer.observe(section);
});

const initialHash = window.location.hash.replace("#", "");

if (responseMap.has(initialHash)) {
  revealQueue = revealQueue.then(() => revealSection(initialHash));
}
