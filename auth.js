import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const configured = Object.values(firebaseConfig).every(value =>
  value && !String(value).includes("REPLACE_ME")
);

function setMessage(element, text, type = "info") {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`;
}

function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use": "Cette adresse e-mail possède déjà un compte.",
    "auth/invalid-email": "Cette adresse e-mail n'est pas valide.",
    "auth/weak-password": "Le mot de passe doit contenir au moins 8 caractères.",
    "auth/popup-closed-by-user": "La fenêtre Google a été fermée avant la connexion.",
    "auth/popup-blocked": "Le navigateur a bloqué la fenêtre Google. Autorise les fenêtres pour ce site puis réessaie.",
    "auth/operation-not-allowed": "Cette méthode de connexion n'est pas encore activée dans Firebase.",
    "auth/unauthorized-domain": "Ce domaine n'est pas encore autorisé dans Firebase Authentication.",
    "auth/network-request-failed": "Problème de connexion réseau. Vérifie ta connexion puis réessaie."
  };
  return messages[error?.code] || "Une erreur s'est produite. Vérifie la configuration Firebase puis réessaie.";
}

function showWelcome(user) {
  const name = user?.displayName || user?.email?.split("@")[0] || "utilisateur";
  const bar = document.getElementById("welcomeUserBar");
  const text = document.getElementById("welcomeUserText");
  if (!bar || !text) return;
  text.textContent = `Bonjour ${name} 👋`;
  bar.classList.add("visible");
}

function bindPasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach(button => {
    if (button.dataset.bound === "1") return;
    button.dataset.bound = "1";
    button.addEventListener("click", () => {
      const input = document.querySelector(button.dataset.passwordToggle);
      if (!input) return;
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.textContent = showing ? "Afficher" : "Masquer";
      button.setAttribute("aria-label", showing ? "Afficher le mot de passe" : "Masquer le mot de passe");
    });
  });
}

function getForm(prefix = "") {
  return {
    form: document.querySelector(`#signupForm${prefix}`),
    firstName: document.querySelector(`#signupFirstName${prefix}`),
    lastName: document.querySelector(`#signupLastName${prefix}`),
    email: document.querySelector(`#signupEmail${prefix}`),
    password: document.querySelector(`#signupPassword${prefix}`),
    confirm: document.querySelector(`#signupConfirm${prefix}`),
    terms: document.querySelector(`#signupTerms${prefix}`),
    submit: document.querySelector(`#signupForm${prefix} .auth-submit`),
    message: document.querySelector(`#signupMessage${prefix}`),
    google: document.querySelector(`#googleSignup${prefix}`)
  };
}

function bindForm(ui, auth, provider) {
  if (!ui.form || ui.form.dataset.authBound === "1") return;
  ui.form.dataset.authBound = "1";

  ui.google?.addEventListener("click", async () => {
    ui.google.disabled = true;
    setMessage(ui.message, "Connexion à Google…");
    try {
      const result = await signInWithPopup(auth, provider);
      setMessage(ui.message, `Bienvenue ${result.user.displayName || result.user.email} !`, "success");
      showWelcome(result.user);
    } catch (error) {
      setMessage(ui.message, friendlyError(error), "error");
    } finally {
      ui.google.disabled = false;
    }
  });

  ui.form.addEventListener("submit", async event => {
    event.preventDefault();

    const firstName = ui.firstName?.value.trim() || "";
    const lastName = ui.lastName?.value.trim() || "";
    const email = ui.email?.value.trim() || "";
    const password = ui.password?.value || "";
    const confirm = ui.confirm?.value || "";

    if (!firstName || !lastName) return setMessage(ui.message, "Remplis ton prénom et ton nom.", "error");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessage(ui.message, "Entre une adresse e-mail valide.", "error");
    if (password.length < 8) return setMessage(ui.message, "Le mot de passe doit contenir au moins 8 caractères.", "error");
    if (password !== confirm) return setMessage(ui.message, "Les deux mots de passe ne correspondent pas.", "error");
    if (!ui.terms?.checked) return setMessage(ui.message, "Accepte les conditions pour continuer.", "error");

    ui.submit.disabled = true;
    setMessage(ui.message, "Création de ton compte…");

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: `${firstName} ${lastName}` });
      ui.form.reset();
      setMessage(ui.message, "Compte créé avec succès. Tu es maintenant connecté.", "success");
      showWelcome(credential.user);
    } catch (error) {
      setMessage(ui.message, friendlyError(error), "error");
    } finally {
      ui.submit.disabled = false;
    }
  });
}

bindPasswordToggles();

const forms = [getForm(""), getForm("Home")].filter(ui => ui.form);

if (!configured) {
  forms.forEach(ui => setMessage(
    ui.message,
    "Le formulaire est prêt, mais Firebase n'est pas encore configuré. Consulte CONFIG_AUTH.txt.",
    "info"
  ));
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  forms.forEach(ui => bindForm(ui, auth, provider));

  onAuthStateChanged(auth, user => {
    if (!user) return;
    forms.forEach(ui => setMessage(ui.message, `Compte connecté : ${user.email || "compte Google"}`, "success"));
    showWelcome(user);
  });
}
