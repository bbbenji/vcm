interface CookieConsentAPI {
  run: (config: Record<string, unknown>) => void;
  acceptedCategory: (category: string) => boolean;
}

let CookieConsent: CookieConsentAPI | null = null;

export const trackEvent = (eventName: string, eventParams: Record<string, unknown> = {}) => {
  if (window.dataLayer && CookieConsent && CookieConsent.acceptedCategory("analytics")) {
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });
  }
};

export const initAnalytics = async () => {
  try {
    // Dynamically import CSS and JS to prevent ad-blockers from crashing the entire app
    await import("vanilla-cookieconsent/dist/cookieconsent.css");
    const module = await import("vanilla-cookieconsent");
    CookieConsent = module as unknown as CookieConsentAPI;

    CookieConsent?.run({
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          enabled: false,
          autoClear: {
            cookies: [{ name: /^_ga/ }, { name: "_gid" }],
          },
        },
      },
      language: {
        default: "pl",
        translations: {
          pl: {
            consentModal: {
              title: "Używamy plików cookie",
              description:
                "Używamy analitycznych plików cookie, aby zrozumieć, jak korzystasz z Wirtualnej Maty i pomóc nam ją ulepszać.",
              acceptAllBtn: "Akceptuj wszystkie",
              acceptNecessaryBtn: "Odrzuć",
              showPreferencesBtn: "Zarządzaj preferencjami",
            },
            preferencesModal: {
              title: "Preferencje plików cookie",
              acceptAllBtn: "Akceptuj wszystkie",
              acceptNecessaryBtn: "Tylko niezbędne",
              savePreferencesBtn: "Zapisz preferencje",
              closeIconLabel: "Zamknij",
              sections: [
                {
                  title: "Niezbędne pliki cookie",
                  description:
                    "Te pliki są wymagane do prawidłowego działania strony i nie mogą zostać wyłączone.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analityczne pliki cookie",
                  description:
                    "Pomagają nam zrozumieć, w jaki sposób użytkownicy korzystają ze strony, co pozwala na jej ulepszanie. Używamy Google Analytics zanonimizowanych danych.",
                  linkedCategory: "analytics",
                },
              ],
            },
          },
        },
      },
      onConsent: () => {
        if (CookieConsent?.acceptedCategory("analytics")) {
          loadGA();
        }
      },
      onChange: ({ changedCategories }: { changedCategories: string[] }) => {
        if (changedCategories.includes("analytics")) {
          if (CookieConsent?.acceptedCategory("analytics")) {
            loadGA();
          }
        }
      },
    });
  } catch (error) {
    console.warn("Analytics and Cookie Consent blocked by client or failed to load.", error);
  }
};

let gaLoaded = false;
const loadGA = () => {
  if (gaLoaded) return;
  gaLoaded = true;

  try {
    const script1 = document.createElement("script");
    script1.type = "text/partytown";
    script1.src = "https://www.googletagmanager.com/gtag/js?id=G-KY9YBMGWE5";
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.type = "text/partytown";
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-KY9YBMGWE5');
    `;
    document.head.appendChild(script2);

    window.dispatchEvent(new CustomEvent("ptupdate"));
  } catch (err) {
    console.warn("Failed to inject GA scripts", err);
  }
};

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    partytown: Record<string, unknown>;
  }
}
