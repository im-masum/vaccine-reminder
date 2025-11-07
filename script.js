

// Dark mode toggle
  const darkBtn = document.getElementById("darkModeBtn");
  darkBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    darkBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });
        const STORAGE_KEY = 'bv_app_v1';
        const THEME_KEY = 'bv_theme';

        const defaultTemplates = {
            standard: [
                { name: 'BCG', weeks: 0 },
                { name: 'Hepatitis B (1st)', weeks: 0 },
                { name: 'OPV (0)', weeks: 0 },
                { name: 'DPT/DTaP (1st)', weeks: 6 },
                { name: 'OPV (1)', weeks: 6 },
                { name: 'Hep B (2nd)', weeks: 6 },
                { name: 'DPT/DTaP (2nd)', weeks: 10 },
                { name: 'OPV (2)', weeks: 10 },
                { name: 'DPT/DTaP (3rd)', weeks: 14 },
                { name: 'OPV (3)', weeks: 14 },
                { name: 'Measles', weeks: 39 }
            ],
            bangladesh: [
                { name: 'BCG', weeks: 0 },
                { name: 'Hepatitis B (1st)', weeks: 0 },
                { name: 'OPV (0)', weeks: 0 },
                { name: 'Penta (1)', weeks: 6 },
                { name: 'OPV (1)', weeks: 6 },
                { name: 'Penta (2)', weeks: 10 },
                { name: 'OPV (2)', weeks: 10 },
                { name: 'Penta (3)', weeks: 14 },
                { name: 'OPV (3)', weeks: 14 },
                { name: 'Measles (1st)', weeks: 39 }
            ]
        }

        let state = {
            babies: [],
            selectedBabyId: null,
            template: 'standard',
            customVaccines: []
        }

        const $ = id => document.getElementById(id);
        function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
        function load() { const s = localStorage.getItem(STORAGE_KEY); if (s) state = JSON.parse(s); renderAll(); }
        function uid() { return 'b' + Math.random().toString(36).slice(2, 9) }

        function addWeeks(date, weeks) { const d = new Date(date); d.setDate(d.getDate() + weeks * 7); return d; }
        function formatDate(d) { const dt = new Date(d); if (isNaN(dt)) return '-'; return dt.toLocaleDateString('bn-BD'); }

        function renderAll() { renderBabies(); renderVaccines(); }

        function renderBabies() {
            const list = $('babyList'); list.innerHTML = '';
            state.babies.forEach(b => {
                const el = document.createElement('div'); el.className = 'baby-item';
                el.innerHTML = `<div><strong>${escapeHtml(b.name)}</strong><div class="small" style="color:var(--muted)">জন্ম: ${b.dob ? formatDate(b.dob) : '-'} ${b.gender ? ' • ' + (b.gender === 'male' ? 'ছেলে' : 'মেয়ে') : ''}</div></div>
          <div style="display:flex;gap:8px">
            <button class="btn ghost" onclick="selectBaby('${b.id}')">বেছে নিন</button>
            <button class="btn" onclick="deleteBaby('${b.id}')">মুছুন</button>
          </div>`;
                list.appendChild(el);
            })
        }

        function renderVaccines() {
            const section = $('vaccineList'); section.innerHTML = '';
            const baby = state.babies.find(b => b.id === state.selectedBabyId);
            if (!baby) { section.innerHTML = '<div class="small" style="color:var(--muted)">দয়া করে বাম থেকে একজন শিশু যোগ করে নির্বাচন করুন।</div>'; return }

            const template = defaultTemplates[state.template] || defaultTemplates.standard;
            const vaccineList = [...template, ...state.customVaccines].map(v => ({
                id: 'v' + Math.random().toString(36).slice(2, 8),
                name: v.name,
                due: addWeeks(baby.dob, Number(v.weeks)),
                weeks: v.weeks
            })).sort((a, b) => new Date(a.due) - new Date(b.due));

            vaccineList.forEach(v => {
                const today = new Date();
                const dueDate = new Date(v.due);
                const doneKey = `done_${state.selectedBabyId}_${v.name}_${formatDate(dueDate)}`;
                const done = localStorage.getItem(doneKey) === '1';

                const el = document.createElement('div'); el.className = 'v-item';
                if (done) el.classList.add('done');
                const isDueSoon = (dueDate - today) <= (7 * 24 * 60 * 60 * 1000) && (dueDate - today) >= 0;
                el.innerHTML = `<div>
            <div style="font-weight:600">${escapeHtml(v.name)}</div>
            <div class="small" style="color:var(--muted)">নির্ধারিত: ${formatDate(dueDate)} • জন্মের ${v.weeks} সপ্তাহ পরে</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
            <div style="font-size:.9rem;color:${isDueSoon ? 'crimson' : 'var(--muted)'}">${isDueSoon ? 'শীঘ্রই' : 'পরবর্তী'}</div>
            <div style="display:flex;gap:8px">
              <button class="btn ghost" onclick="markDone('${doneKey}', this)">${done ? 'অনমার্ক' : 'মার্ক সম্পন্ন'}</button>
              <button class="btn" onclick="snooze('${state.selectedBabyId}','${v.name}','${formatDate(dueDate)}')">স্মরণ করুন</button>
            </div>
          </div>`;
                section.appendChild(el);

                if (isDueSoon && Notification && Notification.permission === 'granted') {
                    notify(`${baby.name} - ${v.name} টিকা শীঘ্রই`, `নির্ধারিত: ${formatDate(dueDate)}`);
                }
            })
        }

        function selectBaby(id) { state.selectedBabyId = id; save(); renderAll(); }
        function deleteBaby(id) { state.babies = state.babies.filter(b => b.id !== id); if (state.selectedBabyId === id) state.selectedBabyId = null; save(); renderAll(); }

        function addBaby() {
            const name = $('babyName').value.trim(); const dob = $('babyDob').value; const gender = $('babyGender').value;
            if (!name || !dob) { alert('নাম এবং জন্মতারিখ দিন'); return }
            const newB = { id: uid(), name, dob, gender }; state.babies.push(newB); state.selectedBabyId = newB.id; save(); $('babyName').value = ''; $('babyDob').value = ''; $('babyGender').value = ''; renderAll();
        }

        function clearAll() {
            if (!confirm('সব তথ্য মুছে ফেলা হবে — আপনি কি নিশ্চিত?')) return; localStorage.removeItem(STORAGE_KEY);
            Object.keys(localStorage).forEach(k => { if (k.startsWith('done_')) localStorage.removeItem(k) }); state = { babies: [], selectedBabyId: null, template: 'standard', customVaccines: [] }; renderAll();
        }

        function addCustomVaccine() {
            const name = $('customVaccineName').value.trim(); const weeks = $('customVaccineWeeks').value; if (!name || weeks === '') { alert('টিকা নাম ও সপ্তাহ দিন'); return }
            state.customVaccines.push({ name, weeks }); save(); $('customVaccineName').value = ''; $('customVaccineWeeks').value = ''; renderAll();
        }

        function markDone(key, btn) { if (localStorage.getItem(key) === '1') { localStorage.removeItem(key); btn.textContent = 'মার্ক সম্পন্ন'; } else { localStorage.setItem(key, '1'); btn.textContent = 'অনমার্ক'; } renderAll(); }

        function snooze(babyId, vname, vdate) {
            const t = prompt('কত মিনিট পরে স্মরণ করবেন?', '60'); const min = Number(t); if (!min || min <= 0) return; setTimeout(() => { notify(`${vname} টিকা - ${vdate}`, 'সময় হয়েছে — টিকা দেয়া প্রয়োজন।'); alert(`${vname} টিকা - সময় হয়েছে (${vdate})`); }, min * 60 * 1000); alert('স্মরণ নির্ধারিত — অ্যাপ খুলে থাকলে কাজ করবে।');
        }

        function notify(title, body) { try { new Notification(title, { body }); } catch (e) { console.warn('notify failed', e); } }

        function requestNotification() {
            if (!('Notification' in window)) { alert('আপনার ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই'); return }
            Notification.requestPermission().then(p => { if (p === 'granted') alert('নোটিফিকেশন অনুমোদন দেওয়া হয়েছে'); else alert('অনুমোদন দেওয়া হয়নি'); });
        }

        function changeTemplate() {
            const t = $('templateSelect').value; state.template = t; save(); renderAll();
        }
        