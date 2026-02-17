<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';

const translations = ref({});
const search = ref('');
const loading = ref(false);
const isDark = ref(localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches));

const toast = ref({ show: false, message: '' });
const showToast = (msg) => {
  toast.value.message = msg;
  toast.value.show = true;
  setTimeout(() => toast.value.show = false, 3000);
};

const isModalOpen = ref(false);
const newKeyName = ref('');
const keyInputRef = ref(null);

const openModal = () => {
  isModalOpen.value = true;
  nextTick(() => keyInputRef.value?.focus());
};

const closeModal = () => {
  isModalOpen.value = false;
  newKeyName.value = '';
};

const handleAddKey = () => {
  const key = newKeyName.value.trim();
  if (key) {
    languages.value.forEach(l => {
      if (!translations.value[l][key]) translations.value[l][key] = '';
    });
    showToast(`Key "${key}" added!`);
    closeModal();
  }
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  updateTheme();
};

const updateTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/translations');
    translations.value = await res.json();
  } catch (e) { console.error("Ошибка:", e); }
  loading.value = false;
};

const languages = computed(() => Object.keys(translations.value));
const allKeys = computed(() => {
  const keys = new Set();
  Object.values(translations.value).forEach(obj => Object.keys(obj).forEach(k => keys.add(k)));
  return Array.from(keys).filter(k => k.toLowerCase().includes(search.value.toLowerCase())).sort();
});

const save = async () => {
  try {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ translations: translations.value })
    });
    showToast('Changes saved successfully! 🚀');
  } catch (e) {
    showToast('Error saving changes...');
  }
};

onMounted(() => {
  fetchData();
  updateTheme();
});
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] text-[#1e293b] dark:bg-[#0f172a] dark:text-slate-200 transition-colors duration-300 font-sans">

    <Transition name="slide-up">
      <div v-if="toast.show" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl font-medium text-sm flex items-center gap-3 border border-white/10">
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="isModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 transform transition-all scale-100">
          <h3 class="text-xl font-bold mb-2 dark:text-white">Add New Key</h3>
          <p class="text-slate-500 text-sm mb-6">Enter a unique key name using dot notation (e.g. <code class="text-indigo-500">auth.title</code>)</p>

          <input
              ref="keyInputRef"
              v-model="newKeyName"
              @keyup.enter="handleAddKey"
              placeholder="Enter key name..."
              class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-6 dark:text-white"
          />

          <div class="flex gap-3">
            <button @click="closeModal" class="flex-1 px-4 py-3 rounded-2xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">Cancel</button>
            <button @click="handleAddKey" class="flex-1 px-4 py-3 rounded-2xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition cursor-pointer">Add Key</button>
          </div>
        </div>
      </div>
    </Transition>

    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center dark:bg-slate-900/80 dark:border-slate-800">
      <div class="flex items-center gap-3">
        <div class="size-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg flex items-center justify-center text-white font-black leading-none uppercase">TK</div>
        <h1 class="text-xl font-bold tracking-tight dark:text-white uppercase">Transkit</h1>
      </div>

      <div class="flex items-center gap-4">
        <button @click="toggleTheme" class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </button>

        <input v-model="search" placeholder="Search keys..." class="bg-slate-100 border-none rounded-xl px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all dark:bg-slate-800 dark:text-white dark:placeholder-slate-500" />
        <button @click="openModal" class="cursor-pointer hover:bg-slate-100 px-4 py-2 rounded-xl text-sm font-semibold transition dark:text-slate-300 dark:hover:bg-slate-800">Add Key</button>
        <button @click="save" class="cursor-pointer bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 shadow-xl shadow-indigo-100 dark:shadow-none dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-all active:scale-95">Save Changes</button>
      </div>
    </nav>

    <main class="p-8">
      <div v-if="!loading" class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
            <tr class="bg-slate-50/50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
              <th class="p-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] w-64">Translation Key</th>
              <th v-for="lang in languages" :key="lang" class="p-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{{ lang }}</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="key in allKeys" :key="key" class="hover:bg-slate-50/30 transition-colors dark:hover:bg-slate-800/30">
              <td class="p-6 bg-slate-50/20 border-r border-slate-100 dark:bg-slate-800/20 dark:border-slate-800">
                <span class="font-mono text-xs text-indigo-500 font-bold break-all">{{ key }}</span>
              </td>
              <td v-for="lang in languages" :key="lang" class="p-4">
                  <textarea
                      v-model="translations[lang][key]"
                      rows="1"
                      class="w-full p-2 text-sm bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg outline-hidden transition-all resize-none overflow-hidden dark:text-slate-200 dark:hover:border-slate-700 dark:focus:bg-slate-800"
                      @input="(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }"
                      :class="!translations[lang][key] ? 'bg-red-50/50 placeholder-red-300 dark:bg-red-900/10 dark:placeholder-red-900/50' : ''"
                      placeholder="Empty..."
                  ></textarea>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="flex justify-center py-20 italic text-slate-400">Loading your translations...</div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from { transform: translate(-50%, 20px); opacity: 0; }
.slide-up-leave-to { transform: translate(-50%, 10px); opacity: 0; }
</style>