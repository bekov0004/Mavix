<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import * as XLSX from 'xlsx';

const translations = ref({});
const search = ref('');
const loading = ref(false);
const isDark = ref(localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches));

const currentPage = ref(1);
const itemsPerPage = ref(50);

const pendingDelete = ref(new Set());

const fileInput = ref(null);

const exportToExcel = () => {
  const keysToExport = filteredKeys.value;
  const langs = languages.value;

  const data = keysToExport.map(key => {
    const row = { 'Translation Key': key };
    langs.forEach(lang => {
      row[lang] = translations.value[lang][key] || '';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Translations");

  XLSX.writeFile(workbook, `translations_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast('Excel exported successfully!');
};

const triggerImport = () => fileInput.value.click();

const importFromExcel = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length > 0) {
      jsonData.forEach(row => {
        const key = row['Translation Key'];
        if (!key) return;

        languages.value.forEach(lang => {
          if (row[lang] !== undefined) {
            if (!translations.value[lang]) translations.value[lang] = {};
            translations.value[lang][key] = String(row[lang]);
          }
        });
      });
      showToast('Data imported! Don\'t forget to save.');
    }
    event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
};

const toggleDelete = (key) => {
  if (pendingDelete.value.has(key)) {
    pendingDelete.value.delete(key);
  } else {
    pendingDelete.value.add(key);
  }
};

const sortKey = ref(null);
const sortOrder = ref(null);

const toggleSort = (key) => {
  if (sortKey.value !== key) {
    sortKey.value = key;
    sortOrder.value = 'asc';
  } else {
    if (sortOrder.value === 'asc') {
      sortOrder.value = 'desc';
    } else if (sortOrder.value === 'desc') {
      sortOrder.value = null;
      sortKey.value = null;
    }
  }
};

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
      if (!translations.value[l]) translations.value[l] = {};
      translations.value[l][key] = '';
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
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Server error');
    }
    translations.value = await res.json();
  } catch (e) {
    showToast(e.message);
    console.error("Ошибка:", e);
  }
  loading.value = false;
};

const languages = computed(() => Object.keys(translations.value));

const filteredKeys = computed(() => {
  const keysSet = new Set();
  Object.values(translations.value).forEach(obj => Object.keys(obj).forEach(k => keysSet.add(k)));
  const baseKeys = Array.from(keysSet);

  const query = search.value.toLowerCase();
  let filtered = baseKeys.filter(k => {
    if (k.toLowerCase().includes(query)) return true;
    return languages.value.some(lang => {
      const val = translations.value[lang][k];
      return val && val.toLowerCase().includes(query);
    });
  });

  if (!sortKey.value || !sortOrder.value) return filtered;

  return [...filtered].sort((a, b) => {
    let valA, valB;
    if (sortKey.value === 'key') {
      valA = a.toLowerCase();
      valB = b.toLowerCase();
    } else {
      valA = (translations.value[sortKey.value][a] || '').toLowerCase();
      valB = (translations.value[sortKey.value][b] || '').toLowerCase();
    }
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const paginatedKeys = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredKeys.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredKeys.value.length / itemsPerPage.value));

const displayedPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }
  for (let i of range) {
    if (l) {
      if (i - l === 2) rangeWithDots.push(l + 1);
      else if (i - l !== 1) rangeWithDots.push('...');
    }
    rangeWithDots.push(i);
    l = i;
  }
  return rangeWithDots;
});

watch([search, itemsPerPage], () => {
  currentPage.value = 1;
});

const save = async () => {
  try {
    pendingDelete.value.forEach(key => {
      languages.value.forEach(lang => {
        delete translations.value[lang][key];
      });
    });

    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ translations: translations.value })
    });

    pendingDelete.value.clear();
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
  <div class="min-h-screen bg-[#f8fafc] text-[#1e293b] dark:bg-[#0f172a] dark:text-slate-200 transition-colors duration-300 font-sans text-[14px] pb-10">

    <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="importFromExcel" />

    <Transition name="slide-up">
      <div v-if="toast.show" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl font-medium text-sm border border-white/10">
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="isModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 transform transition-all">
          <h3 class="text-xl font-bold mb-2 dark:text-white">Add New Key</h3>
          <p class="text-slate-500 text-sm mb-6">Enter a unique key name using dot notation</p>
          <input ref="keyInputRef" v-model="newKeyName" @keyup.enter="handleAddKey" placeholder="Enter key name..." class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-6 dark:text-white" />
          <div class="flex gap-3">
            <button @click="closeModal" class="flex-1 px-4 py-3 rounded-2xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">Cancel</button>
            <button @click="handleAddKey" class="flex-1 px-4 py-3 rounded-2xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer">Add Key</button>
          </div>
        </div>
      </div>
    </Transition>

    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center dark:bg-slate-900/80 dark:border-slate-800">
      <div class="flex items-center gap-3">
        <div class="size-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg flex items-center justify-center text-white font-black leading-none uppercase">M</div>
        <h1 class="text-xl font-bold tracking-tight dark:text-white uppercase">Mavix</h1>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mr-2">
          <button @click="triggerImport" title="Import from Excel" class="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </button>
          <button @click="exportToExcel" title="Export to Excel" class="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>

        <button @click="toggleTheme" class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </button>
        <input v-model="search" placeholder="Search keys or values..." class="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm w-96 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all dark:text-white dark:placeholder-slate-500" />
        <button @click="openModal" class="cursor-pointer hover:bg-slate-100 px-4 py-2 rounded-xl text-sm font-semibold transition dark:text-slate-300 dark:hover:bg-slate-800">Add Key</button>
        <button @click="save" class="cursor-pointer bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 shadow-xl shadow-indigo-100 dark:shadow-none dark:bg-indigo-600 transition-all active:scale-95">Save Changes</button>
      </div>
    </nav>

    <main class="p-8">
      <div v-if="!loading" class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800 flex flex-col">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
            <tr class="bg-slate-50/50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
              <th @click="toggleSort('key')" class="p-6 text-[10px] font-black uppercase tracking-[0.2em] w-64 cursor-pointer select-none transition-colors group">
                <div class="flex items-center gap-2" :class="sortKey === 'key' ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'">
                  Translation Key <span class="w-4 inline-block">{{ sortKey === 'key' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}</span>
                </div>
              </th>
              <th v-for="lang in languages" :key="lang" @click="toggleSort(lang)" class="p-6 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer select-none transition-colors group">
                <div class="flex items-center gap-2" :class="sortKey === lang ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'">
                  {{ lang }} <span class="w-4 inline-block">{{ sortKey === lang ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}</span>
                </div>
              </th>
              <th class="p-6 w-20 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase">Actions</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="key in paginatedKeys" :key="key"
                class="transition-colors group"
                :class="pendingDelete.has(key) ? 'bg-red-50/80 dark:bg-red-950/30' : 'hover:bg-slate-50/30 dark:hover:bg-slate-800/30'">

              <td class="p-6 bg-slate-50/20 border-r border-slate-100 dark:bg-slate-800/20 dark:border-slate-800">
                  <span class="font-mono text-xs font-bold break-all transition-colors"
                        :class="pendingDelete.has(key) ? 'text-red-600 dark:text-red-400 line-through' : 'text-indigo-500'">
                    {{ key }}
                  </span>
              </td>

              <td v-for="lang in languages" :key="lang" class="p-4">
                  <textarea
                      v-model="translations[lang][key]"
                      rows="1"
                      :disabled="pendingDelete.has(key)"
                      class="w-full p-2 text-sm bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all resize-none overflow-hidden dark:text-slate-200 dark:hover:border-slate-700 dark:focus:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                      @input="(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }"
                      :class="!translations[lang][key] && !pendingDelete.has(key) ? 'bg-red-50/50 dark:bg-red-900/10' : ''"
                  ></textarea>
              </td>

              <td class="p-4 text-center">
                <button @click="toggleDelete(key)"
                        class="p-2 rounded-xl transition-all cursor-pointer"
                        :class="pendingDelete.has(key) ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-red-900/40 dark:hover:text-red-400'">
                  <svg v-if="!pendingDelete.has(key)" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredKeys.length > itemsPerPage" class="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span>Дар саҳифа:</span>
            <select v-model="itemsPerPage" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none">
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="150">150</option>
              <option :value="200">200</option>
            </select>
            <span>аз {{ filteredKeys.length }}</span>
          </div>

          <div class="flex items-center justify-center gap-2 flex-wrap">
            <template v-for="(page, index) in displayedPages" :key="index">
              <button
                  v-if="page !== '...'"
                  @click="currentPage = page"
                  class="w-10 h-10 flex items-center justify-center rounded-lg border transition font-medium text-sm cursor-pointer"
                  :class="currentPage === page
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600'"
              >
                {{ page }}
              </button>
              <span v-else class="px-3 py-2 text-gray-400 dark:text-gray-600"> ... </span>
            </template>
          </div>
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
.line-through { text-decoration: line-through; }
</style>