const STORAGE_KEY = "incident-tracker-v1";
const incidentsPage = document.getElementById("incidentList");
const formPage = document.getElementById("incidentForm");
const summaryPage = document.getElementById("categoryStats");

let incidents = loadIncidents();

function loadIncidents() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Не удалось загрузить данные:", error);
    return [];
  }
}

function saveIncidents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toLocalDateTime(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleString("ru-RU");
}

function updateStats() {
  const totalCount = document.getElementById("totalCount");
  const newCount = document.getElementById("newCount");
  const inProgressCount = document.getElementById("inProgressCount");
  const resolvedCount = document.getElementById("resolvedCount");

  if (!totalCount || !newCount || !inProgressCount || !resolvedCount) {
    return;
  }

  totalCount.textContent = String(incidents.length);
  newCount.textContent = String(incidents.filter((i) => i.status === "Новый").length);
  inProgressCount.textContent = String(incidents.filter((i) => i.status === "В работе").length);
  resolvedCount.textContent = String(incidents.filter((i) => i.status === "Решен").length);
}

function render() {
  const list = document.getElementById("incidentList");
  const emptyState = document.getElementById("emptyState");
  const template = document.getElementById("incidentTemplate");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const priorityFilter = document.getElementById("priorityFilter");

  if (!list || !emptyState || !template || !searchInput || !statusFilter || !priorityFilter) {
    return;
  }

  list.innerHTML = "";

  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const priority = priorityFilter.value;

  const filtered = incidents
    .filter((incident) => {
      const matchesQuery =
        incident.title.toLowerCase().includes(query) ||
        incident.location.toLowerCase().includes(query) ||
        incident.description.toLowerCase().includes(query);
      const matchesStatus = status === "Все" || incident.status === status;
      const matchesPriority = priority === "Все" || incident.priority === priority;
      return matchesQuery && matchesStatus && matchesPriority;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (filtered.length === 0) {
    emptyState.style.display = "block";
    emptyState.textContent = incidents.length
      ? "По текущим фильтрам инциденты не найдены."
      : "Инцидентов пока нет. Создай первый на отдельной странице.";
  } else {
    emptyState.style.display = "none";
  }

  filtered.forEach((incident) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = incident.id;

    node.querySelector(".incident-title").textContent = incident.title;
    node.querySelector(".incident-meta").textContent =
      `Место: ${incident.location} | Категория: ${incident.category} | Ответственный: ${
        incident.assignee || "не назначен"
      } | Обновлен: ${toLocalDateTime(incident.updatedAt)}`;
    node.querySelector(".incident-description").textContent = incident.description || "Описание не указано.";

    const priorityBadge = node.querySelector(".priority");
    priorityBadge.textContent = incident.priority;
    priorityBadge.dataset.value = incident.priority;

    const statusBadge = node.querySelector(".status");
    statusBadge.textContent = incident.status;
    statusBadge.dataset.value = incident.status;

    node.querySelector(".edit-btn").addEventListener("click", () => {
      window.location.href = `create.html?edit=${encodeURIComponent(incident.id)}`;
    });
    node.querySelector(".delete-btn").addEventListener("click", () => removeIncident(incident.id));

    list.appendChild(node);
  });

  updateStats();
}

function getFormValues() {
  return {
    id: document.getElementById("incidentId").value,
    title: document.getElementById("title").value.trim(),
    location: document.getElementById("location").value.trim(),
    category: document.getElementById("category").value,
    priority: document.getElementById("priority").value,
    status: document.getElementById("status").value,
    assignee: document.getElementById("assignee").value.trim(),
    description: document.getElementById("description").value.trim()
  };
}

function resetForm() {
  const form = document.getElementById("incidentForm");
  const saveBtn = document.getElementById("saveBtn");
  const formTitle = document.getElementById("formTitle");
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  if (!form || !saveBtn) {
    return;
  }
  form.reset();
  document.getElementById("incidentId").value = "";
  saveBtn.textContent = "Сохранить";
  if (formTitle) {
    formTitle.textContent = "Новый инцидент";
  }
  if (pageTitle) {
    pageTitle.textContent = "Создание инцидента";
  }
  if (pageSubtitle) {
    pageSubtitle.textContent = "Добавление инцидента";
  }
  document.title = "Создание инцидента";
}

function fillFormForEdit(id) {
  const saveBtn = document.getElementById("saveBtn");
  const formTitle = document.getElementById("formTitle");
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const incident = incidents.find((item) => item.id === id);
  if (!incident || !saveBtn) {
    return;
  }

  document.getElementById("incidentId").value = incident.id;
  document.getElementById("title").value = incident.title;
  document.getElementById("location").value = incident.location;
  document.getElementById("category").value = incident.category;
  document.getElementById("priority").value = incident.priority;
  document.getElementById("status").value = incident.status;
  document.getElementById("assignee").value = incident.assignee || "";
  document.getElementById("description").value = incident.description || "";
  saveBtn.textContent = "Обновить";
  if (formTitle) {
    formTitle.textContent = "Редактирование инцидента";
  }
  if (pageTitle) {
    pageTitle.textContent = "Редактирование инцидента";
  }
  if (pageSubtitle) {
    pageSubtitle.textContent = "Измените и сохраните данные";
  }
  document.title = "Редактирование инцидента";
}

function removeIncident(id) {
  const incident = incidents.find((item) => item.id === id);
  if (!incident) {
    return;
  }

  const confirmed = window.confirm(`Удалить инцидент "${incident.title}"?`);
  if (!confirmed) {
    return;
  }

  incidents = incidents.filter((item) => item.id !== id);
  saveIncidents();
  render();
}

function validateIncident(values) {
  if (!values.title || !values.location) {
    return "Заполните обязательные поля: название и место.";
  }
  return "";
}

function upsertIncident(values) {
  const now = new Date().toISOString();
  if (values.id) {
    incidents = incidents.map((item) =>
      item.id === values.id
        ? {
            ...item,
            ...values,
            updatedAt: now
          }
        : item
    );
  } else {
    incidents.push({
      ...values,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    });
  }
}

function exportToJson() {
  const blob = new Blob([JSON.stringify(incidents, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "incidents-export.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJson(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(String(event.target?.result || "[]"));
      if (!Array.isArray(parsed)) {
        window.alert("Некорректный формат файла: ожидается массив инцидентов.");
        return;
      }

      const normalized = parsed.map((item) => ({
        id: item.id || generateId(),
        title: String(item.title || "").trim(),
        location: String(item.location || "").trim(),
        category: String(item.category || "Нарушение порядка"),
        priority: String(item.priority || "Низкий"),
        status: String(item.status || "Новый"),
        assignee: String(item.assignee || "").trim(),
        description: String(item.description || "").trim(),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString()
      }));

      const validImported = normalized.filter((item) => item.title && item.location);
      const mergedById = new Map();

      incidents.forEach((item) => {
        if (item?.id) {
          mergedById.set(item.id, item);
        }
      });

      validImported.forEach((item) => {
        if (item?.id) {
          mergedById.set(item.id, item);
        }
      });

      incidents = Array.from(mergedById.values());
      saveIncidents();
      render();
    } catch (error) {
      console.error(error);
      window.alert("Не удалось прочитать JSON. Проверьте содержимое файла.");
    }
  };
  reader.readAsText(file);
}

function initIncidentsPage() {
  const clearAllBtn = document.getElementById("clearAllBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const priorityFilter = document.getElementById("priorityFilter");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");

  clearAllBtn?.addEventListener("click", () => {
    if (!incidents.length) {
      return;
    }
    const confirmed = window.confirm("Удалить все инциденты? Это действие нельзя отменить.");
    if (!confirmed) {
      return;
    }
    incidents = [];
    saveIncidents();
    render();
  });

  exportBtn?.addEventListener("click", exportToJson);
  importInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      importFromJson(file);
    }
    importInput.value = "";
  });

  resetFiltersBtn?.addEventListener("click", () => {
    if (searchInput) {
      searchInput.value = "";
    }
    if (statusFilter) {
      statusFilter.value = "Все";
    }
    if (priorityFilter) {
      priorityFilter.value = "Все";
    }
    render();
  });

  [searchInput, statusFilter, priorityFilter].forEach((element) => {
    element?.addEventListener("input", render);
    element?.addEventListener("change", render);
  });

  render();
}

function initFormPage() {
  const form = document.getElementById("incidentForm");
  const resetBtn = document.getElementById("resetBtn");
  if (!form) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");
  if (editId) {
    fillFormForEdit(editId);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = getFormValues();
    const validationError = validateIncident(values);
    if (validationError) {
      window.alert(validationError);
      return;
    }

    upsertIncident(values);
    saveIncidents();
    window.location.href = "index.html";
  });

  resetBtn?.addEventListener("click", resetForm);
}

function initSummaryPage() {
  updateStats();

  const categoryStats = document.getElementById("categoryStats");
  const categoryEmpty = document.getElementById("categoryEmpty");
  const priorityList = document.getElementById("priorityList");
  const priorityTemplate = document.getElementById("priorityTemplate");
  const priorityEmpty = document.getElementById("priorityEmpty");

  if (!categoryStats || !categoryEmpty || !priorityList || !priorityTemplate || !priorityEmpty) {
    return;
  }

  const byCategory = incidents.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  categoryStats.innerHTML = "";
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (!categoryEntries.length) {
    categoryEmpty.style.display = "block";
  } else {
    categoryEmpty.style.display = "none";
    categoryEntries.forEach(([name, count]) => {
      const row = document.createElement("div");
      row.className = "kv-row";
      row.innerHTML = `<span>${name}</span><strong>${count}</strong>`;
      categoryStats.appendChild(row);
    });
  }

  priorityList.innerHTML = "";
  const risky = incidents
    .filter((item) => item.priority === "Высокий" || item.priority === "Критический")
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (!risky.length) {
    priorityEmpty.style.display = "block";
  } else {
    priorityEmpty.style.display = "none";
    risky.forEach((incident) => {
      const node = priorityTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector(".incident-title").textContent = incident.title;
      node.querySelector(".incident-meta").textContent =
        `Место: ${incident.location} | Категория: ${incident.category} | Обновлен: ${toLocalDateTime(
          incident.updatedAt
        )}`;

      const priorityBadge = node.querySelector(".priority");
      priorityBadge.textContent = incident.priority;
      priorityBadge.dataset.value = incident.priority;

      const statusBadge = node.querySelector(".status");
      statusBadge.textContent = incident.status;
      statusBadge.dataset.value = incident.status;

      priorityList.appendChild(node);
    });
  }
}

if (incidentsPage) {
  initIncidentsPage();
}

if (formPage) {
  initFormPage();
}

if (summaryPage) {
  initSummaryPage();
}
