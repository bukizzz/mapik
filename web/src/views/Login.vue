<script setup lang="ts">
import AppFooter from "@/components/AppFooter.vue"; // Uvozi komponentu AppFooter
import { useAuthService } from "@/services/auth"; // Uvozi servis za autentifikaciju
import { GlobeOutline, LockClosedSharp } from "@vicons/ionicons5"; // Uvozi ikone iz Ionicons 5
import { NButton, NCard, NDropdown, NIcon, NInput, NSpace, useMessage } from "naive-ui"; // Uvozi komponente iz Naive UI
import { computed, ref } from "vue"; // Uvozi funkcije iz Vue
import { useI18n } from "vue-i18n"; // Uvozi useI18n za internacionalizaciju
import { useRouter } from "vue-router"; // Uvozi useRouter iz Vue Routera

const { t, locale } = useI18n(); // Inicijalizuje funkciju za prevođenje i lokalizaciju
const authKey = ref(""); // Reaktivna referenca za ključ autentifikacije
const loading = ref(false); // Reaktivna referenca za status učitavanja
const router = useRouter(); // Instanca Vue Routera
const message = useMessage(); // Instanca za poruke
const { login } = useAuthService(); // Funkcija za prijavu iz servisa za autentifikaciju

const handleLogin = async () => {
  if (!authKey.value) {
    message.error(t("login.authKeyRequired")); // Prikazuje grešku ako ključ nije unet
    return;
  }
  loading.value = true; // Postavlja status učitavanja na true
  const success = await login(authKey.value); // Pokušava prijavu
  loading.value = false; // Postavlja status učitavanja na false
  if (success) {
    router.push("/"); // Preusmerava na početnu stranicu ako je prijava uspešna
  }
};

const languageOptions = computed(() => [
  {
    label: t("languages.en"), // Opcija za engleski jezik
    key: "en",
  },
  {
    label: t("languages.zh"), // Opcija za kineski jezik
    key: "zh",
  },
  {
    label: t("languages.sr"), // Opcija za srpski jezik
    key: "sr",
  },
]);

const handleLanguageChange = (key: string) => {
  locale.value = key; // Menja lokalizaciju aplikacije
};

const currentLanguageLabel = computed(() => {
  const current = languageOptions.value.find(option => option.key === locale.value);
  return current ? current.label : ""; // Prikazuje trenutno odabrani jezik
});
</script>

<template>
  <div class="login-container">
    <div class="login-background">
      <div class="login-decoration" />
      <div class="login-decoration-2" />
    </div>

    <div class="login-content">
      <div class="login-header">
        <h1 class="login-title">MAPIK</h1>
        <p class="login-subtitle">{{ t("login.subtitle") }}</p>
      </div>

      <n-card class="login-card modern-card" :bordered="false">
        <template #header>
          <div class="card-header">
            <h2 class="card-title">{{ t("login.welcome") }}</h2>
            <p class="card-subtitle">{{ t("login.authKeyPrompt") }}</p>
          </div>
        </template>

        <n-space vertical size="large">
          <n-input
            v-model:value="authKey"
            type="password"
            size="large"
            :placeholder="t('login.authKeyPlaceholder')"
            class="modern-input"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <n-icon :component="LockClosedSharp" />
            </template>
          </n-input>

          <n-button
            class="login-btn modern-button"
            type="primary"
            size="large"
            block
            @click="handleLogin"
            :loading="loading"
            :disabled="loading"
          >
            <template v-if="!loading">
              <span>{{ t("login.loginButton") }}</span>
            </template>
          </n-button>

          <div class="language-switcher">
            <n-dropdown trigger="click" :options="languageOptions" @select="handleLanguageChange">
              <n-button text>
                <template #icon>
                  <n-icon :component="GlobeOutline" />
                </template>
                {{ currentLanguageLabel }}
              </n-button>
            </n-dropdown>
          </div>
        </n-space>
      </n-card>
    </div>
  </div>
  <app-footer />
</template>

<style scoped>
.login-container {
  min-height: calc(100vh - 52px);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 24px;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.login-decoration {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 800px;
  height: 800px;
  background: var(--primary-gradient);
  border-radius: 50%;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.login-decoration-2 {
  position: absolute;
  bottom: -50%;
  left: -20%;
  width: 600px;
  height: 600px;
  background: var(--secondary-gradient);
  border-radius: 50%;
  opacity: 0.08;
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

.login-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 0 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

.login-card {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.card-header {
  text-align: center;
  padding-bottom: 8px;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.card-subtitle {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
}

.login-btn {
  background: var(--primary-gradient);
  border: none;
  font-weight: 600;
  letter-spacing: 0.5px;
  height: 48px;
  font-size: 1rem;
}

.login-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.language-switcher {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

:deep(.n-input) {
  --n-border-radius: 12px;
  --n-height: 48px;
}

:deep(.n-input__input-el) {
  font-size: 1rem;
}

:deep(.n-input__prefix) {
  color: #64748b;
}

:deep(.n-card-header) {
  padding-bottom: 16px;
}

:deep(.n-card__content) {
  padding-top: 0;
}
</style>
