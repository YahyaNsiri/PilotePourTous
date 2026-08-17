(() => {
  if (window.__PPT_SITE_INITIALIZED__) return;
  window.__PPT_SITE_INITIALIZED__ = true;

  function init() {
    const menu = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".nav");

    if (menu && nav) {
      const closeMenu = () => {
        nav.classList.remove("open");
        menu.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-label", "Ouvrir le menu");
      };

      menu.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = nav.classList.toggle("open");
        menu.setAttribute("aria-expanded", String(open));
        menu.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      });

      nav.querySelectorAll("a").forEach(a => {
        a.addEventListener("click", closeMenu);
      });

      document.addEventListener("click", (event) => {
        if (nav.classList.contains("open") && !nav.contains(event.target) && event.target !== menu) {
          closeMenu();
        }
      });
    }

    // Matières filters
    const levelButtons = [...document.querySelectorAll(".level")];
    const branchButtons = [...document.querySelectorAll(".branch")];
    const optionButtons = [...document.querySelectorAll(".option")];
    const branchSection = document.querySelector("#branchSection");
    const optionSection = document.querySelector("#optionSection");
    const subjectGrid = document.querySelector("#subjectGrid");
    const resultsCount = document.querySelector("#resultsCount");

    if (levelButtons.length && subjectGrid) {
      let selectedLevel = "7eme";
      let selectedBranch = "math";
      let selectedOption = null;
      const branchLevels = new Set(["3eme", "bac"]);

      const optionData = {
        espagnol: {title:"Espagnol", icon:"🇪🇸", description:"Cours, vocabulaire & exercices d'espagnol"},
        italien: {title:"Italien", icon:"🇮🇹", description:"Cours, vocabulaire & exercices d'italien"},
        allemand: {title:"Allemand", icon:"🇩🇪", description:"Cours, vocabulaire & exercices d'allemand"},
        musique: {title:"Musique", icon:"♫", description:"Cours & ressources musicales"}
      };

      function createOptionCard(key) {
        subjectGrid.querySelector(".option-subject-card")?.remove();
        const d = optionData[key];
        if (!d) return;
        const card = document.createElement("a");
        card.className = "subject-card subject-link reveal option-subject-card";
        card.href = `./cours-${key}.html`;
        card.innerHTML = `<div class="subject-icon">${d.icon}</div><div><h3>${d.title}</h3><p>${d.description}</p></div><span class="soon">Bientôt disponible</span>`;
        subjectGrid.prepend(card);
      }

      function update() {
        const cards = [...subjectGrid.querySelectorAll(".subject-card")];
        const advanced = branchLevels.has(selectedLevel);

        if (branchSection) branchSection.hidden = !advanced;
        if (optionSection) optionSection.hidden = !advanced;

        if (!advanced) {
          selectedBranch = "math";
          selectedOption = null;
          optionButtons.forEach(b => b.classList.remove("active"));
          subjectGrid.querySelector(".option-subject-card")?.remove();
          branchButtons.forEach(b => b.classList.toggle("active", b.dataset.branch === "math"));
        }

        let count = 0;
        cards.forEach(card => {
          if (card.classList.contains("option-subject-card")) {
            card.hidden = !advanced || !selectedOption;
            if (!card.hidden) count++;
            return;
          }
          const levels = (card.dataset.levels || "").split(" ");
          const branches = (card.dataset.branch || "").split(" ");
          const show = levels.includes(selectedLevel) &&
            (!advanced || branches.includes(selectedBranch));
          card.hidden = !show;
          if (show) count++;
        });

        if (resultsCount) {
          const names = {math:"Maths","sc-exp":"Sciences Exp.","sc-tech":"Sciences Tech."};
          resultsCount.textContent = advanced
            ? `${count} matières disponibles pour la branche ${names[selectedBranch]}`
            : `${count} matière${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""}`;
        }
      }

      levelButtons.forEach(b => b.addEventListener("click", () => {
        levelButtons.forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        selectedLevel = b.dataset.level;
        if (branchLevels.has(selectedLevel)) {
          selectedBranch = "math";
          branchButtons.forEach(x => x.classList.toggle("active", x.dataset.branch === "math"));
        }
        update();
      }));

      branchButtons.forEach(b => b.addEventListener("click", () => {
        branchButtons.forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        selectedBranch = b.dataset.branch;
        update();
      }));

      optionButtons.forEach(b => b.addEventListener("click", () => {
        const key = b.dataset.option;
        if (selectedOption === key) {
          selectedOption = null;
          b.classList.remove("active");
          subjectGrid.querySelector(".option-subject-card")?.remove();
        } else {
          selectedOption = key;
          optionButtons.forEach(x => x.classList.remove("active"));
          b.classList.add("active");
          createOptionCard(key);
        }
        update();
      }));

      update();
    }


    // Global signup modal: hidden until the user explicitly chooses Inscription.
    const signupModal = document.querySelector("#signupModal");
    const signupClose = document.querySelector("#signupClose");
    const signupTriggers = document.querySelectorAll('a[href="#inscription"]');

    if (signupModal) {
      const openSignup = (event) => {
        event?.preventDefault();
        signupModal.classList.add("open");
        signupModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        document.querySelector("#signupFirstNameHome")?.focus();
      };
      const closeSignup = () => {
        signupModal.classList.remove("open");
        signupModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
      };

      signupTriggers.forEach(trigger => {
        if (trigger.dataset.signupBound === "1") return;
        trigger.dataset.signupBound = "1";
        trigger.addEventListener("click", openSignup);
      });
      signupClose?.addEventListener("click", closeSignup);
      signupModal.addEventListener("click", event => {
        if (event.target === signupModal) closeSignup();
      });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape" && signupModal.classList.contains("open")) closeSignup();
      });
    }

    // Sign-up page UI: client-side validation only; no password is stored.
    const signupForm = document.querySelector("#signupForm");
    if (signupForm) {
      const password = document.querySelector("#signupPassword");
      const confirm = document.querySelector("#signupConfirm");
      const strength = document.querySelector("#passwordStrength");
      const message = document.querySelector("#signupMessage");
      const toggleButtons = document.querySelectorAll("[data-password-toggle]");

      toggleButtons.forEach(btn => btn.addEventListener("click", () => {
        const target = document.querySelector(btn.dataset.passwordToggle);
        if (!target) return;
        target.type = target.type === "password" ? "text" : "password";
        btn.textContent = target.type === "password" ? "Afficher" : "Masquer";
      }));

      password?.addEventListener("input", () => {
        const value = password.value;
        let score = 0;
        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[a-z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;
        const labels = ["", "Très faible", "Faible", "Moyen", "Bon", "Très bon"];
        if (strength) {
          strength.textContent = value ? `Sécurité du mot de passe : ${labels[score]}` : "";
          strength.dataset.score = String(score);
        }
      });

      signupForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = document.querySelector("#signupEmail")?.value.trim() || "";
        const terms = document.querySelector("#signupTerms")?.checked;
        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!validEmail) {
          message.textContent = "Entre une adresse e-mail valide.";
          message.className = "form-message error";
          return;
        }
        if (!password || password.value.length < 8) {
          message.textContent = "Le mot de passe doit contenir au moins 8 caractères.";
          message.className = "form-message error";
          return;
        }
        if (password.value !== confirm.value) {
          message.textContent = "Les deux mots de passe ne correspondent pas.";
          message.className = "form-message error";
          return;
        }
        if (!terms) {
          message.textContent = "Accepte les conditions pour continuer.";
          message.className = "form-message error";
          return;
        }

        // Do not save passwords in localStorage. A real account backend is required.
        message.textContent = "Formulaire validé. La création réelle du compte sera activée avec le service d'authentification du site.";
        message.className = "form-message success";
      });

      document.querySelector("#googleSignup")?.addEventListener("click", () => {
        message.textContent = "La connexion Google est prête côté interface. Elle nécessite encore la configuration OAuth de ton projet Google.";
        message.className = "form-message info";
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once:true});
  } else {
    init();
  }
})();