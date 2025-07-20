import { keysApi } from "@/api/keys"; // Uvozi API za ključeve
import GroupInfoCard from "@/components/keys/GroupInfoCard.vue"; // Uvozi GroupInfoCard komponentu
import GroupList from "@/components/keys/GroupList.vue"; // Uvozi GroupList komponentu
import KeyTable from "@/components/keys/KeyTable.vue"; // Uvozi KeyTable komponentu
import { onMounted, ref } from "vue"; // Uvozi funkcije onMounted i ref iz Vue
import { useRoute, useRouter } from "vue-router"; // Uvozi useRoute i useRouter iz Vue Routera
const groups = ref([]); // Reaktivna referenca za listu grupa
const loading = ref(false); // Reaktivna referenca za status učitavanja
const selectedGroup = ref(null); // Reaktivna referenca za odabranu grupu
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
            }
            else {
                handleGroupSelect(groups.value[0]); // Odabira prvu grupu ako nema pronađene
            }
        }
    }
    finally {
        loading.value = false; // Postavlja status učitavanja na false
    }
}
function handleGroupSelect(group) {
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
function handleGroupDelete(deletedGroup) {
    // Uklanja obrisanu grupu sa liste grupa.
    groups.value = groups.value.filter(g => g.id !== deletedGroup.id);
    // Ako je obrisana grupa bila trenutno odabrana, prebacuje se na prvu grupu.
    if (selectedGroup.value?.id === deletedGroup.id) {
        handleGroupSelect(groups.value.length > 0 ? groups.value[0] : null);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "keys-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar" },
});
/** @type {[typeof GroupList, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(GroupList, new GroupList({
    ...{ 'onGroupSelect': {} },
    ...{ 'onRefresh': {} },
    groups: (__VLS_ctx.groups),
    selectedGroup: (__VLS_ctx.selectedGroup),
    loading: (__VLS_ctx.loading),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onGroupSelect': {} },
    ...{ 'onRefresh': {} },
    groups: (__VLS_ctx.groups),
    selectedGroup: (__VLS_ctx.selectedGroup),
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onGroupSelect: (__VLS_ctx.handleGroupSelect)
};
const __VLS_7 = {
    onRefresh: (__VLS_ctx.handleGroupRefresh)
};
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "main-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "group-info" },
});
/** @type {[typeof GroupInfoCard, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(GroupInfoCard, new GroupInfoCard({
    ...{ 'onRefresh': {} },
    ...{ 'onDelete': {} },
    group: (__VLS_ctx.selectedGroup),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onRefresh': {} },
    ...{ 'onDelete': {} },
    group: (__VLS_ctx.selectedGroup),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_11;
let __VLS_12;
let __VLS_13;
const __VLS_14 = {
    onRefresh: (__VLS_ctx.handleGroupRefresh)
};
const __VLS_15 = {
    onDelete: (__VLS_ctx.handleGroupDelete)
};
var __VLS_10;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "key-table-section" },
});
/** @type {[typeof KeyTable, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(KeyTable, new KeyTable({
    selectedGroup: (__VLS_ctx.selectedGroup),
}));
const __VLS_17 = __VLS_16({
    selectedGroup: (__VLS_ctx.selectedGroup),
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
/** @type {__VLS_StyleScopedClasses['keys-container']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['main-content']} */ ;
/** @type {__VLS_StyleScopedClasses['group-info']} */ ;
/** @type {__VLS_StyleScopedClasses['key-table-section']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            GroupInfoCard: GroupInfoCard,
            GroupList: GroupList,
            KeyTable: KeyTable,
            groups: groups,
            loading: loading,
            selectedGroup: selectedGroup,
            handleGroupSelect: handleGroupSelect,
            handleGroupRefresh: handleGroupRefresh,
            handleGroupDelete: handleGroupDelete,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
