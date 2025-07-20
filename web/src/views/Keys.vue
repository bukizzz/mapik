<script setup lang="ts">
import { keysApi } from "@/api/keys"; // Uvozi API za ključeve
import GroupInfoCard from "@/components/keys/GroupInfoCard.vue"; // Uvozi GroupInfoCard komponentu
import GroupList from "@/components/keys/GroupList.vue"; // Uvozi GroupList komponentu
import KeyTable from "@/components/keys/KeyTable.vue"; // Uvozi KeyTable komponentu
import type { Group } from "@/types/models"; // Uvozi tip Group
import { onMounted, ref } from "vue"; // Uvozi funkcije onMounted i ref iz Vue
import { useRoute, useRouter } from "vue-router"; // Uvozi useRoute i useRouter iz Vue Routera

const groups = ref<Group[]>([]); // Reaktivna referenca za listu grupa
const loading = ref(false); // Reaktivna referenca za status učitavanja
const selectedGroup = ref<Group | null>(null); // Reaktivna referenca za odabranu grupu
const router = useRouter(); // Instanca Vue Routera
const route = useRoute(); // Trenutna ruta

onMounted(async () => {
  await loadGroups(); // Učitava grupe kada se komponenta montira
});

async function loadGroups() {
  try {
    loading.value = true; // Postavlja status učitavanja na true
    groups.value = await keysApi.getGroups(); // Dohvata grupe putem API-ja
    // Odabira podrazumevanu grupu.
    if (groups.value.length > 0 && !selectedGroup.value) {
      const groupId = route.query.groupId; // Dohvata groupId iz query parametara rute
      const found = groups.value.find(g => String(g.id) === String(groupId)); // Pronalazi grupu po ID-u
      if (found) {
        selectedGroup.value = found; // Postavlja pronađenu grupu kao odabranu
      } else {
        handleGroupSelect(groups.value[0]); // Odabira prvu grupu ako nema pronađene
      }
    }
  } finally {
    loading.value = false; // Postavlja status učitavanja na false
  }
}

function handleGroupSelect(group: Group | null) {
  selectedGroup.value = group || null; // Postavlja odabranu grupu
  if (String(group?.id) !== String(route.query.groupId)) {
    router.push({ name: "keys", query: { groupId: group?.id || "" } }); // Ažurira rutu sa ID-em grupe
  }
}

async function handleGroupRefresh() {
  await loadGroups(); // Ponovo učitava grupe
  if (selectedGroup.value) {
    // Ponovo učitava informacije o trenutno odabranoj grupi.
    handleGroupSelect(groups.value.find(g => g.id === selectedGroup.value?.id) || null);
  }
}

function handleGroupDelete(deletedGroup: Group) {
  // Uklanja obrisanu grupu sa liste grupa.
  groups.value = groups.value.filter(g => g.id !== deletedGroup.id);

  // Ako je obrisana grupa bila trenutno odabrana, prebacuje se na prvu grupu.
  if (selectedGroup.value?.id === deletedGroup.id) {
    handleGroupSelect(groups.value.length > 0 ? groups.value[0] : null);
  }
}
</script>

<template>
  <div class="keys-container">
    <div class="sidebar">
      <group-list
        :groups="groups"
        :selected-group="selectedGroup"
        :loading="loading"
        @group-select="handleGroupSelect"
        @refresh="handleGroupRefresh"
      />
    </div>

    <!-- Right main content area, occupying 80% -->
    <div class="main-content">
      <!-- Group info card, more compact -->
      <div class="group-info">
        <group-info-card
          :group="selectedGroup"
          @refresh="handleGroupRefresh"
          @delete="handleGroupDelete"
        />
      </div>

      <!-- Key table area, occupying main space -->
      <div class="key-table-section">
        <key-table :selected-group="selectedGroup" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.keys-container {
  display: flex;
  gap: 8px;
  width: 100%;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  height: calc(100vh - 159px);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-info {
  flex-shrink: 0;
}

.key-table-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
