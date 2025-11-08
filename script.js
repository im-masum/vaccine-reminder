// Constants and State Management
const STATE_KEY = "vaccineReminderState";
let state = {
  babies: [],
  vaccines: [],
  darkMode: false,
};

// Vaccine Templates
const vaccineTemplates = {
  standard: [
    { name: "BCG", weeks: 0 },
    { name: "Hepatitis B", weeks: 0 },
    { name: "DPT 1", weeks: 6 },
    { name: "Polio 1", weeks: 6 },
    { name: "DPT 2", weeks: 10 },
    { name: "Polio 2", weeks: 10 },
    { name: "DPT 3", weeks: 14 },
    { name: "Polio 3", weeks: 14 },
    { name: "Measles", weeks: 36 },
  ],
  bangladesh: [
    { name: "BCG", weeks: 0 },
    { name: "Pentavalent 1", weeks: 6 },
    { name: "PCV 1", weeks: 6 },
    { name: "OPV 1", weeks: 6 },
    { name: "Pentavalent 2", weeks: 10 },
    { name: "PCV 2", weeks: 10 },
    { name: "OPV 2", weeks: 10 },
    { name: "Pentavalent 3", weeks: 14 },
    { name: "PCV 3", weeks: 14 },
    { name: "OPV 3", weeks: 14 },
    { name: "IPV", weeks: 14 },
    { name: "MR 1", weeks: 38 },
    { name: "MR 2", weeks: 65 },
  ],
};

// DOM Elements
const elements = {
  darkModeBtn: document.getElementById("darkModeBtn"),
  babyName: document.getElementById("babyName"),
  babyDob: document.getElementById("babyDob"),
  babyGender: document.getElementById("babyGender"),
  addBaby: document.getElementById("addBaby"),
  clearAll: document.getElementById("clearAll"),
  babyList: document.getElementById("babyList"),
  templateSelect: document.getElementById("templateSelect"),
  customVaccineName: document.getElementById("customVaccineName"),
  customVaccineWeeks: document.getElementById("customVaccineWeeks"),
  addCustomVaccine: document.getElementById("addCustomVaccine"),
  notifyPerm: document.getElementById("notifyPerm"),
  exportCsv: document.getElementById("exportCsv"),
  vaccineList: document.getElementById("vaccineList"),
};

// Dark mode toggle
  const darkBtn = document.getElementById("darkModeBtn");
  darkBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    darkBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });


// Baby Management
function addBaby() {
  const name = elements.babyName.value.trim();
  const dob = elements.babyDob.value;
  const gender = elements.babyGender.value;

  if (!name || !dob) {
    alert("শিশুর নাম এবং জন্ম তারিখ দিন");
    return;
  }

  const baby = {
    id: Date.now(),
    name,
    dob,
    gender,
    vaccines: [...state.vaccines],
  };

  state.babies.push(baby);
  saveState();
  renderBabyList();
  clearBabyForm();
}

function clearBabyForm() {
  elements.babyName.value = "";
  elements.babyDob.value = "";
  elements.babyGender.value = "";
}

function clearAll() {
  if (confirm("সব তথ্য মুছে ফেলতে চান?")) {
    state.babies = [];
    saveState();
    renderBabyList();
  }
}

// Vaccine Management
function loadVaccineTemplate() {
  const template = elements.templateSelect.value;
  state.vaccines = [...vaccineTemplates[template]];
  saveState();
  renderVaccineList();
}

function addCustomVaccine() {
  const name = elements.customVaccineName.value.trim();
  const weeks = parseInt(elements.customVaccineWeeks.value);

  if (!name || isNaN(weeks)) {
    alert("টিকার নাম এবং সপ্তাহ সংখ্যা দিন");
    return;
  }

  state.vaccines.push({ name, weeks });
  state.vaccines.sort((a, b) => a.weeks - b.weeks);
  saveState();
  renderVaccineList();

  elements.customVaccineName.value = "";
  elements.customVaccineWeeks.value = "";
}

// Rendering Functions
function renderBabyList() {
  elements.babyList.innerHTML = state.babies
    .map(
      (baby) => `
        <div class="baby-card">
            <h3>${baby.name}</h3>
            <p>জন্ম: ${new Date(baby.dob).toLocaleDateString("bn-BD")}</p>
            ${
              baby.gender
                ? `<p>লিঙ্গ: ${baby.gender === "male" ? "ছেলে" : "মেয়ে"}</p>`
                : ""
            }
            <button onclick="removeBaby(${
              baby.id
            })" class="btn ghost small">মুছুন</button>
            ${renderVaccineSchedule(baby)}
        </div>
    `
    )
    .join("");
}

function renderVaccineList() {
  elements.vaccineList.innerHTML = state.vaccines
    .map(
      (vaccine, index) => `
        <div class="vaccine-item">
            <span>${vaccine.name}</span>
            <span>${vaccine.weeks} সপ্তাহ</span>
            <button onclick="removeVaccine(${index})" class="btn ghost small">✕</button>
        </div>
    `
    )
    .join("");
}

function renderVaccineSchedule(baby) {
  const birthDate = new Date(baby.dob);
  return `
        <div class="vaccine-schedule">
            ${baby.vaccines
              .map((vaccine) => {
                const dueDate = new Date(
                  birthDate.getTime() + vaccine.weeks * 7 * 24 * 60 * 60 * 1000
                );
                const isPast = dueDate < new Date();
                return `
                    <div class="vaccine-date ${isPast ? "past" : ""}">
                        <span>${vaccine.name}</span>
                        <span>${dueDate.toLocaleDateString("bn-BD")}</span>
                    </div>
                `;
              })
              .join("")}
        </div>
    `;
}

// Notification Management
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      elements.notifyPerm.textContent = "নোটিফিকেশন চালু আছে";
      elements.notifyPerm.disabled = true;
      checkVaccineSchedule();
    }
  } catch (error) {
    console.error("Notification error:", error);
  }
}

function checkVaccineSchedule() {
  setInterval(() => {
    const today = new Date();
    state.babies.forEach((baby) => {
      baby.vaccines.forEach((vaccine) => {
        const dueDate = new Date(
          new Date(baby.dob).getTime() + vaccine.weeks * 7 * 24 * 60 * 60 * 1000
        );
        if (
          dueDate.toDateString() === today.toDateString() &&
          Notification.permission === "granted"
        ) {
          new Notification(`টিকা রিমাইন্ডার: ${baby.name}`, {
            body: `আজ ${vaccine.name} টিকার দিন`,
          });
        }
      });
    });
  }, 1000 * 60 * 60); // Check every hour
}

// CSV Export
function exportToCsv() {
  let csv = "শিশুর নাম,জন্ম তারিখ,টিকার নাম,টিকার তারিখ\n";

  state.babies.forEach((baby) => {
    const birthDate = new Date(baby.dob);
    baby.vaccines.forEach((vaccine) => {
      const dueDate = new Date(
        birthDate.getTime() + vaccine.weeks * 7 * 24 * 60 * 60 * 1000
      );
      csv += `${baby.name},${birthDate.toLocaleDateString("bn-BD")},${
        vaccine.name
      },${dueDate.toLocaleDateString("bn-BD")}\n`;
    });
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "vaccine-schedule.csv";
  link.click();
}

// State Management
function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadState() {
  const savedState = localStorage.getItem(STATE_KEY);
  if (savedState) {
    state = JSON.parse(savedState);
    document.body.classList.toggle("dark-mode", state.darkMode);
    elements.darkModeBtn.textContent = state.darkMode ? "☀️" : "🌙";
    renderBabyList();
    renderVaccineList();
  } else {
    state.vaccines = [...vaccineTemplates.standard];
    renderVaccineList();
  }
}

// Event Listeners
elements.darkModeBtn.addEventListener("click", toggleDarkMode);
elements.addBaby.addEventListener("click", addBaby);
elements.clearAll.addEventListener("click", clearAll);
elements.templateSelect.addEventListener("change", loadVaccineTemplate);
elements.addCustomVaccine.addEventListener("click", addCustomVaccine);
elements.notifyPerm.addEventListener("click", requestNotificationPermission);
elements.exportCsv.addEventListener("click", exportToCsv);

// Helper Functions
function removeBaby(id) {
  if (confirm("এই শিশুর তথ্য মুছে ফেলতে চান?")) {
    state.babies = state.babies.filter((baby) => baby.id !== id);
    saveState();
    renderBabyList();
  }
}

function removeVaccine(index) {
  if (confirm("এই টিকা মুছে ফেলতে চান?")) {
    state.vaccines.splice(index, 1);
    saveState();
    renderVaccineList();
  }
}

// Initialize
loadState();
