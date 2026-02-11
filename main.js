// --- REPUESTOSPOS MANAGEMENT LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    // --- Data Management ---
    let inventory = JSON.parse(localStorage.getItem('repuestospos_inventory')) || [
        { id: 1, code: 'FIL-1040', name: 'Filtro de Aceite', brand: 'Bosch', category: 'Lubricantes', price: 4500, stock: 25 },
        { id: 2, code: 'SERV-001', name: 'Cambio de Aceite', brand: 'Servicio', category: 'Mano de Obra', price: 15000, stock: 999 },
        { id: 3, code: 'GOM-PARCHE', name: 'Parche Común', brand: 'Gomería', category: 'Gomeria', price: 5000, stock: 100 },
        { id: 4, code: 'ACE-5W30', name: 'Aceite 5W30 (1L)', brand: 'Castrol', category: 'Lubricantes', price: 8500, stock: 10 },
        { id: 5, code: 'REV-GRAL', name: 'Revisión General', brand: 'Taller', category: 'Taller', price: 10000, stock: 999 },
        { id: 6, code: 'ALIN-BAL', name: 'Alineación y Balanceo Completa', brand: 'Taller', category: 'Alineacion - Balanceo', price: 12000, stock: 999 }
    ];

    let sales = JSON.parse(localStorage.getItem('repuestospos_sales')) || [];
    let clients = JSON.parse(localStorage.getItem('repuestospos_clients')) || [
        { id: 1, name: 'Taller El Rayo', taxId: '20-30456789-2', phone: '11-4567-8910', email: 'elrayo@taller.mapo' },
        { id: 2, name: 'Juan Repuestos', taxId: '27-12345678-5', phone: '11-2233-4455', email: 'juan@repuestos.com' }
    ];

    let employees = JSON.parse(localStorage.getItem('repuestospos_employees')) || [];

    // --- REPAIRS DATA (GOMERIA) ---
    let repairs = JSON.parse(localStorage.getItem('gomeria_repairs')) || [];
    let currentRepairId = null;
    const GOMERIA_STORE_KEY = 'gomeria_repairs';

    // --- TURNOS DATA (GOMERIA) ---
    let turnos = JSON.parse(localStorage.getItem('gomeria_turnos')) || [];
    let currentTurnoId = null;
    const GOMERIA_TURNOS_KEY = 'gomeria_turnos';

    let config = JSON.parse(localStorage.getItem('repuestospos_config')) || {
        storeName: 'Gomeria Tres Isletas',
        storeSlogan: 'Gestión Inteligente',
        taxId: '',
        address: '',
        taxPercent: 21
    };
    let cart = [];
    let selectedPaymentMethod = 'Efectivo';

    function saveData() {
        localStorage.setItem('repuestospos_inventory', JSON.stringify(inventory));
        localStorage.setItem('repuestospos_sales', JSON.stringify(sales));
        localStorage.setItem('repuestospos_clients', JSON.stringify(clients));
        localStorage.setItem('repuestospos_employees', JSON.stringify(employees));
        localStorage.setItem('repuestospos_config', JSON.stringify(config));
        localStorage.setItem(GOMERIA_STORE_KEY, JSON.stringify(repairs));
        localStorage.setItem(GOMERIA_TURNOS_KEY, JSON.stringify(turnos));
        updateStats();
        applyBranding();
    }

    // --- DOM Elements ---
    const dashboardView = document.getElementById('dashboard-view');
    const repairsView = document.getElementById('repairs-view');
    const repairDetailView = document.getElementById('repair-detail-view');
    const newRepairView = document.getElementById('new-repair-view');
    const turnosView = document.getElementById('turnos-view');
    const turnoDetailView = document.getElementById('turno-detail-view');
    const newTurnoView = document.getElementById('new-turno-view');
    const clientView = document.getElementById('client-view');
    const inventoryView = document.getElementById('inventory-view');
    const saleView = document.getElementById('sale-view');
    const reportsView = document.getElementById('reports-view');
    const clientsView = document.getElementById('clients-view');
    const employeesView = document.getElementById('employees-view');
    const settingsView = document.getElementById('settings-view');
    const navLinks = document.querySelectorAll('.nav-links li');

    const inventoryTableBody = document.querySelector('#inventory-table tbody');
    const clientsTableBody = document.querySelector('#clients-table tbody');
    const employeesTableBody = document.querySelector('#employees-table tbody');

    const productModal = document.getElementById('product-modal');
    const clientModal = document.getElementById('client-modal');
    const employeeModal = document.getElementById('employee-modal');

    const productForm = document.getElementById('product-form');
    const clientForm = document.getElementById('client-form');
    const employeeForm = document.getElementById('employee-form');

    const posProductsList = document.getElementById('pos-products-list');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalEl = document.getElementById('cart-total');
    const cartSubtotalEl = document.getElementById('cart-subtotal');

    // --- View Navigation ---
    function switchView(viewName) {
        dashboardView.style.display = 'none';
        repairsView.style.display = 'none';
        repairDetailView.style.display = 'none';
        newRepairView.style.display = 'none';
        if (turnosView) turnosView.style.display = 'none';
        if (turnoDetailView) turnoDetailView.style.display = 'none';
        if (newTurnoView) newTurnoView.style.display = 'none';
        clientView.style.display = 'none';
        inventoryView.style.display = 'none';
        saleView.style.display = 'none';
        reportsView.style.display = 'none';
        clientsView.style.display = 'none';
        employeesView.style.display = 'none';
        settingsView.style.display = 'none';

        if (viewName === 'Dashboard' || viewName === 'Panel') {
            dashboardView.style.display = 'block';
            updateDashboard();
        } else if (viewName === 'Reparaciones') {
            repairsView.style.display = 'block';
            renderRepairs();
        } else if (viewName === 'Turnos') {
            if (turnosView) turnosView.style.display = 'block';
            initTurnosView();
        } else if (viewName === 'Inventario') {
            inventoryView.style.display = 'block';
            renderInventory();
        } else if (viewName.startsWith('Venta ') || viewName === 'Nueva Venta' || viewName === 'Ventas') {
            saleView.style.display = 'grid'; // Note: grid for pos layout

            // Validate title exists before setting
            const manualTitle = document.getElementById('manual-entry-title');
            if (manualTitle) {
                // Keep the icon but change the text
                manualTitle.innerHTML = `<i class='bx bx-edit'></i> ${viewName === 'Ventas' || viewName === 'Nueva Venta' ? 'Venta normal' : viewName}`;
            }

            renderPOSProducts();
            refreshCartUI();
            populateEmployeeSelect();
        } else if (viewName === 'Reportes') {
            reportsView.style.display = 'block';
            updateReports();
        } else if (viewName === 'Clientes') {
            clientsView.style.display = 'block';
            renderClients();
        } else if (viewName === 'Empleados') {
            employeesView.style.display = 'block';
            renderEmployees();
        } else if (viewName === 'Respaldo' || viewName === 'Configuración') {
            settingsView.style.display = 'block';
            loadSettings();
        }

        // Update Sidebar Active state
        // Update Sidebar Active state
        navLinks.forEach(li => {
            const span = li.querySelector('span');
            if (!span) return;
            const text = span.textContent;

            // Check for match
            let isActive = text === viewName;

            // Dashboard Alias
            if (viewName === 'Dashboard' && text === 'Panel') isActive = true;

            // Ventas Parent Active State
            if (text === 'Ventas' && (viewName.startsWith('Venta ') || viewName === 'Nueva Venta')) {
                isActive = true;
                li.classList.add('open'); // Keep menu open
            }

            if (isActive) {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        });
    }

    // Repairs-specific view switcher
    function switchRepairView(viewName) {
        if (viewName === 'Reparaciones') {
            repairDetailView.style.display = 'none';
            newRepairView.style.display = 'none';
            repairsView.style.display = 'block';
            renderRepairs();
        } else if (viewName === 'Detail') {
            repairsView.style.display = 'none';
            newRepairView.style.display = 'none';
            repairDetailView.style.display = 'block';
        } else if (viewName === 'NewRepair') {
            repairsView.style.display = 'none';
            repairDetailView.style.display = 'none';
            newRepairView.style.display = 'block';
        }
    }

    function switchTurnoView(viewName) {
        if (!turnosView || !turnoDetailView || !newTurnoView) return;

        if (viewName === 'Turnos') {
            turnoDetailView.style.display = 'none';
            newTurnoView.style.display = 'none';
            turnosView.style.display = 'block';
            initTurnosView();
        } else if (viewName === 'Detail') {
            turnosView.style.display = 'none';
            newTurnoView.style.display = 'none';
            turnoDetailView.style.display = 'block';
        } else if (viewName === 'NewTurno') {
            turnosView.style.display = 'none';
            turnoDetailView.style.display = 'none';
            newTurnoView.style.display = 'block';
        }
    }

    // --- REPAIRS FUNCTIONS (GOMERIA) ---
    function renderRepairs(filterText = '') {
        const listEl = document.getElementById('repair-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        if (repairs.length === 0) {
            listEl.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding:2rem;">No hay reparaciones registradas.</p>';
            return;
        }

        const filtered = repairs.filter(r => {
            const searchTerm = filterText.toLowerCase();
            return r.deviceModel.toLowerCase().includes(searchTerm) ||
                r.clientName.toLowerCase().includes(searchTerm);
        });

        if (filtered.length === 0) {
            listEl.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding:2rem;">No hay reparaciones que coincidan con la búsqueda.</p>';
            return;
        }

        filtered.forEach(r => {
            const div = document.createElement('div');
            div.className = 'repair-item';
            div.onclick = () => loadRepairDetail(r.id);
            const costLabel = r.estimatedCost ? ` - $${r.estimatedCost}` : "";
            div.innerHTML = `
                <div class="repair-info">
                    <h3>${r.deviceModel}</h3>
                    <p>${r.clientName}${costLabel}</p>
                </div>
                <span class="status-badge ${r.status}">${getRepairStatusLabel(r.status)}</span>
            `;
            listEl.appendChild(div);
        });
    }

    function loadRepairDetail(id) {
        currentRepairId = id;
        const r = repairs.find(item => item.id === id);
        if (!r) return;

        document.getElementById('detail-device').textContent = r.deviceModel;
        document.getElementById('detail-client').textContent = r.clientName;
        document.getElementById('detail-cost-input').value = r.estimatedCost || "";

        const badge = document.getElementById('detail-status');
        badge.textContent = getRepairStatusLabel(r.status);
        badge.className = `status-badge ${r.status}`;

        updateRepairShareLink(r);
        switchRepairView('Detail');
    }

    function updateRepairPrice() {
        const newPrice = document.getElementById('detail-cost-input').value;
        const idx = repairs.findIndex(r => r.id === currentRepairId);
        if (idx !== -1) {
            repairs[idx].estimatedCost = newPrice;
            saveData();
            updateRepairShareLink(repairs[idx]);
            showToast('Precio actualizado');
        }
    }

    function updateRepairStatus(newStatus) {
        const idx = repairs.findIndex(r => r.id === currentRepairId);
        if (idx !== -1) {
            repairs[idx].status = newStatus;
            saveData();
            loadRepairDetail(currentRepairId);
        }
    }

    function updateRepairShareLink(repair) {
        const link = window.location.href.split('#')[0] + '#v=' + safeEncode(repair);
        document.getElementById('share-link').value = link;
    }

    function safeEncode(obj) {
        const cleanObj = { ...obj };
        if (cleanObj.estimatedCost === undefined) cleanObj.estimatedCost = "";
        const str = JSON.stringify(cleanObj);
        return btoa(encodeURI(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode('0x' + p1);
        }));
    }

    function getTodayDateISO() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function formatTurnoDateLabel(isoDate) {
        if (!isoDate) return '';
        const parts = isoDate.split('-');
        if (parts.length !== 3) return isoDate;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // --- TURNOS FUNCTIONS ---
    function initTurnosView() {
        const dateInput = document.getElementById('turnos-date');
        if (dateInput && !dateInput.value) dateInput.value = getTodayDateISO();
        renderTurnos();
    }

    function renderTurnos() {
        const listEl = document.getElementById('turnos-list');
        const summaryEl = document.getElementById('turnos-day-summary');
        const dateInput = document.getElementById('turnos-date');
        if (!listEl || !dateInput) return;

        const day = dateInput.value || getTodayDateISO();
        const dayTurnos = turnos.filter(t => (t.date || '') === day);

        if (summaryEl) {
            const count = dayTurnos.length;
            summaryEl.textContent = `${formatTurnoDateLabel(day)} - ${count} turno${count === 1 ? '' : 's'}`;
        }

        listEl.innerHTML = '';

        if (dayTurnos.length === 0) {
            listEl.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding:2rem;">No hay turnos para este día.</p>';
            return;
        }

        const ordered = [...dayTurnos].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        ordered.forEach(t => {
            const div = document.createElement('div');
            div.className = 'repair-item';
            div.onclick = () => loadTurnoDetail(t.id);
            const timeLabel = t.time ? ` - ${t.time}` : '';
            div.innerHTML = `
                <div class="repair-info">
                    <h3>${t.service || 'TURNO'}</h3>
                    <p>${t.clientName || ''}${timeLabel}</p>
                </div>
                <span class="status-badge ready">REALIZADO</span>
            `;
            listEl.appendChild(div);
        });
    }

    function loadTurnoDetail(id) {
        currentTurnoId = id;
        const t = turnos.find(item => item.id === id);
        if (!t) return;

        const titleEl = document.getElementById('turno-detail-title');
        const badgeEl = document.getElementById('turno-detail-badge');
        const clientEl = document.getElementById('turno-detail-client');

        if (titleEl) titleEl.textContent = t.service || 'Turno';
        if (badgeEl) {
            badgeEl.textContent = 'REALIZADO';
            badgeEl.className = 'status-badge ready';
        }
        if (clientEl) clientEl.textContent = `${t.clientName || ''} ${t.clientPhone ? '- ' + t.clientPhone : ''}`;

        const dateEl = document.getElementById('turno-detail-date');
        const timeEl = document.getElementById('turno-detail-time');
        const serviceEl = document.getElementById('turno-detail-service');
        const notesEl = document.getElementById('turno-detail-notes');

        if (dateEl) dateEl.value = t.date || '';
        if (timeEl) timeEl.value = t.time || '';
        if (serviceEl) serviceEl.value = t.service || '';
        if (notesEl) notesEl.value = t.notes || '';

        updateTurnoShareLink(t);
        switchTurnoView('Detail');
    }

    function saveTurnoDetail() {
        if (!currentTurnoId) return;
        const idx = turnos.findIndex(t => t.id === currentTurnoId);
        if (idx === -1) return;

        const dateEl = document.getElementById('turno-detail-date');
        const timeEl = document.getElementById('turno-detail-time');
        const serviceEl = document.getElementById('turno-detail-service');
        const notesEl = document.getElementById('turno-detail-notes');

        turnos[idx].date = dateEl ? dateEl.value : turnos[idx].date;
        turnos[idx].time = timeEl ? timeEl.value : turnos[idx].time;
        turnos[idx].service = serviceEl ? serviceEl.value.trim() : turnos[idx].service;
        turnos[idx].notes = notesEl ? notesEl.value.trim() : turnos[idx].notes;

        saveData();
        updateTurnoShareLink(turnos[idx]);
        showToast('Turno actualizado');
    }

    function updateTurnoShareLink(turno) {
        const link = window.location.href.split('#')[0] + '#t=' + safeEncode({ ...turno, kind: 'turno' });
        const input = document.getElementById('turno-share-link');
        if (input) input.value = link;
    }

    function copyTurnoLink() {
        const input = document.getElementById('turno-share-link');
        if (!input) return;
        const linkText = input.value;

        navigator.clipboard.writeText(linkText).then(() => {
            showToast('Enlace copiado');
        }).catch(err => {
            const textArea = document.createElement("textarea");
            textArea.value = linkText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Enlace copiado');
        });
    }

    function sendTurnoWhatsApp() {
        const input = document.getElementById('turno-share-link');
        const link = input ? input.value : '';
        const t = turnos.find(i => i.id === currentTurnoId);
        if (t && t.clientPhone) {
            let phone = t.clientPhone.replace(/[^0-9]/g, '');
            if (phone.length === 10) {
                phone = '549' + phone;
            } else if (phone.length === 11 && phone.startsWith('0')) {
                phone = '549' + phone.substring(1);
            }

            const fecha = t.date ? formatTurnoDateLabel(t.date) : '';
            const hora = t.time ? ` ${t.time}` : '';
            const msg = `Hola ${t.clientName || ''}, tu turno de ${t.service || 'servicio'} fue realizado el ${fecha}${hora}. Detalle: ${link}`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            showToast('Número de teléfono no disponible', 'error');
        }
    }

    function downloadTurnoStatusImage() {
        const t = turnos.find(i => i.id === currentTurnoId);
        if (!t) return;

        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1000, 1000);

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 40;
        ctx.strokeRect(50, 50, 900, 900);

        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GOMERIA / LUBRICENTRO', 500, 110);
        ctx.fillText('TRES ISLETAS', 500, 155);

        ctx.font = 'bold 35px Arial';
        ctx.fillText('COMPROBANTE DE TURNO', 500, 210);

        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.fillText(`TURNO #${(t.id || '').slice(-6)}`, 500, 255);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(150, 300); ctx.lineTo(850, 300); ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 70px Arial';
        ctx.fillText((t.service || 'TURNO').toUpperCase(), 500, 410);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '38px Arial';
        ctx.fillText(`CLIENTE: ${(t.clientName || '').toUpperCase()}`, 500, 470);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(150, 560, 700, 190);

        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 65px Arial';
        ctx.fillText('REALIZADO', 500, 650);

        const fecha = t.date ? formatTurnoDateLabel(t.date) : '-';
        const hora = t.time ? t.time : '-';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 45px Arial';
        ctx.fillText(`${fecha}  ${hora}`, 500, 835);

        ctx.fillStyle = '#475569';
        ctx.font = '25px Arial';
        ctx.fillText('Gomeria / Lubricentro Tres Isletas', 500, 920);

        const dlink = document.createElement('a');
        dlink.download = `TURNO_${(t.id || '').slice(-6)}.png`;
        dlink.href = canvas.toDataURL('image/png');
        dlink.click();
    }

    function deleteTurnoRecord() {
        if (!currentTurnoId) return;
        if (confirm('¿Eliminar este turno?')) {
            turnos = turnos.filter(i => i.id !== currentTurnoId);
            saveData();
            switchTurnoView('Turnos');
        }
    }

    function copyRepairLink() {
        const linkText = document.getElementById('share-link').value;
        navigator.clipboard.writeText(linkText).then(() => {
            showToast('Enlace copiado');
        }).catch(err => {
            const textArea = document.createElement("textarea");
            textArea.value = linkText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Enlace copiado');
        });
    }

    function sendRepairWhatsApp() {
        const link = document.getElementById('share-link').value;
        const r = repairs.find(i => i.id === currentRepairId);
        if (r && r.clientPhone) {
            let phone = r.clientPhone.replace(/[^0-9]/g, '');
            if (phone.length === 10) {
                phone = '549' + phone;
            } else if (phone.length === 11 && phone.startsWith('0')) {
                phone = '549' + phone.substring(1);
            }
            const msg = `Hola ${r.clientName}, ya puedes ver el estado de tu ${r.deviceModel} aqui: ${link}`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            showToast('Número de teléfono no disponible', 'error');
        }
    }

    function downloadRepairStatusImage() {
        const r = repairs.find(i => i.id === currentRepairId);
        if (!r) return;

        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1000, 1000);

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 40;
        ctx.strokeRect(50, 50, 900, 900);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GOMERIA / LUBRICENTRO', 500, 110);
        ctx.fillText('TRES ISLETAS', 500, 155);

        ctx.font = 'bold 35px Arial';
        ctx.fillText('REPORTE DE ESTADO', 500, 200);

        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.fillText(`ORDEN #${r.id.slice(-6)}`, 500, 245);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(150, 290); ctx.lineTo(850, 290); ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px Arial';
        ctx.fillText(r.deviceModel.toUpperCase(), 500, 400);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '40px Arial';
        ctx.fillText(`CLIENTE: ${r.clientName.toUpperCase()}`, 500, 470);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(150, 550, 700, 180);

        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 70px Arial';
        ctx.fillText(getRepairStatusLabel(r.status).toUpperCase(), 500, 660);

        const precioTxt = r.estimatedCost ? `$${r.estimatedCost}` : "PENDIENTE";
        ctx.fillStyle = 'white';
        ctx.font = 'bold 50px Arial';
        ctx.fillText(`PRECIO: ${precioTxt}`, 500, 830);

        ctx.fillStyle = '#475569';
        ctx.font = '25px Arial';
        ctx.fillText('Gomeria / Lubricentro Tres Isletas', 500, 920);

        const dlink = document.createElement('a');
        dlink.download = `ORDEN_${r.id.slice(-6)}.png`;
        dlink.href = canvas.toDataURL('image/png');
        dlink.click();
    }

    function deleteRepairRecord() {
        if (!currentRepairId) return;
        if (confirm('¿Eliminar esta reparación?')) {
            repairs = repairs.filter(i => i.id !== currentRepairId);
            saveData();
            switchRepairView('Reparaciones');
        }
    }

    function getRepairStatusLabel(s) {
        const labels = {
            pending: 'EN ESPERA',
            working: 'EN TALLER',
            waiting_parts: 'REPUESTOS',
            ready: '¡LISTO!',
            delivered: 'ENTREGADO'
        };
        return labels[s] || s;
    }

    // New repair form handler
    document.getElementById('new-repair-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('clientName').value.trim();
        const phone = document.getElementById('clientPhone').value.trim();
        const model = document.getElementById('deviceModel').value.trim();
        const cost = document.getElementById('estimatedCost').value;

        if (!name || !model) {
            showToast('Completa nombre y modelo del equipo', 'error');
            return;
        }

        const newRepair = {
            id: Date.now().toString(),
            clientName: name,
            clientPhone: phone,
            deviceModel: model,
            status: 'pending',
            estimatedCost: cost || ""
        };

        repairs.unshift(newRepair);
        saveData();

        document.getElementById('new-repair-form').reset();
        switchRepairView('Reparaciones');
    });

    document.getElementById('new-repair-btn').onclick = () => switchRepairView('NewRepair');

    const newTurnoBtn = document.getElementById('new-turno-btn');
    if (newTurnoBtn) newTurnoBtn.onclick = () => switchTurnoView('NewTurno');

    const turnosDateInput = document.getElementById('turnos-date');
    if (turnosDateInput) {
        turnosDateInput.addEventListener('change', () => renderTurnos());
    }

    const newTurnoForm = document.getElementById('new-turno-form');
    if (newTurnoForm) {
        newTurnoForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('turnoClientName').value.trim();
            const phone = document.getElementById('turnoClientPhone').value.trim();
            const date = document.getElementById('turnoDate').value;
            const time = document.getElementById('turnoTime').value;
            const service = document.getElementById('turnoService').value.trim();
            const notes = document.getElementById('turnoNotes').value.trim();

            if (!name || !service || !date) {
                showToast('Completa nombre, servicio y fecha', 'error');
                return;
            }

            const newTurno = {
                id: Date.now().toString(),
                clientName: name,
                clientPhone: phone,
                date,
                time: time || '',
                service,
                notes: notes || ''
            };

            turnos.unshift(newTurno);
            saveData();

            newTurnoForm.reset();
            const d = document.getElementById('turnos-date');
            if (d) d.value = date;
            switchTurnoView('Turnos');
        });
    }

    // Search functionality for repairs
    const repairsSearchInput = document.getElementById('repairs-search');
    if (repairsSearchInput) {
        repairsSearchInput.addEventListener('input', (e) => {
            renderRepairs(e.target.value);
        });
    }

    // Updated Navigation Event Listeners
    // Handle Top Level Links (excluding Ventas which is handled separately via HTML/Toggle)
    const topLevelLinks = document.querySelectorAll('.nav-links > li:not(.has-submenu)');
    topLevelLinks.forEach(li => {
        li.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = li.querySelector('span').textContent;
            switchView(viewName);
        });
    });

    // Handle Submenu Toggle
    const ventasMenu = document.getElementById('ventas-menu-item');
    if (ventasMenu) {
        const toggle = ventasMenu.querySelector('.submenu-toggle');
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            ventasMenu.classList.toggle('open');
        });

        const subItems = ventasMenu.querySelectorAll('.dropdown-menu a');
        subItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                if (view) switchView(view);
            });
        });
    }

    document.getElementById('go-to-inventory').addEventListener('click', () => switchView('Inventario'));
    document.getElementById('quick-sale-btn').addEventListener('click', () => switchView('Venta normal'));

    // Notification Bells Navigation
    const bStock = document.getElementById('bell-stock');
    if (bStock) bStock.onclick = () => switchView('Inventario');
    const bRepairs = document.getElementById('bell-repairs');
    if (bRepairs) bRepairs.onclick = () => switchView('Reparaciones');
    const bTurnos = document.getElementById('bell-turnos');
    if (bTurnos) bTurnos.onclick = () => switchView('Turnos');

    // --- Inventory CRUD ---
    function renderInventory(filterText = '', filterCat = 'all') {
        inventoryTableBody.innerHTML = '';

        const filtered = inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(filterText.toLowerCase()) ||
                item.code.toLowerCase().includes(filterText.toLowerCase()) ||
                item.brand.toLowerCase().includes(filterText.toLowerCase());
            const matchesCat = filterCat === 'all' || item.category === filterCat;
            return matchesSearch && matchesCat;
        });

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            const stockStatus = item.stock <= 5 ? (item.stock === 0 ? 'out-stock' : 'low-stock') : 'in-stock';
            const statusText = item.stock <= 5 ? (item.stock === 0 ? 'Sin Stock' : 'Bajo Stock') : 'En Stock';

            tr.innerHTML = `
                <td><strong>${item.code}</strong></td>
                <td>${item.name}</td>
                <td>${item.brand}</td>
                <td><span class="status completed" style="background: rgba(255,255,255,0.05); color: var(--text-muted);">${item.category}</span></td>
                <td>$${item.price.toLocaleString()}</td>
                <td>${item.stock} unidades</td>
                <td><span class="stock-tag ${stockStatus}">${statusText}</span></td>
                <td>
                    <button class="action-btn edit" data-id="${item.id}" title="Editar"><i class='bx bx-edit-alt'></i></button>
                    <button class="action-btn delete" data-id="${item.id}" title="Eliminar"><i class='bx bx-trash'></i></button>
                </td>
            `;
            inventoryTableBody.appendChild(tr);
        });

        document.querySelectorAll('.action-btn.edit').forEach(btn => btn.onclick = () => editProduct(btn.dataset.id));
        document.querySelectorAll('.action-btn.delete').forEach(btn => btn.onclick = () => deleteProduct(btn.dataset.id));
    }

    // --- Filter Event Listeners ---
    const invSearch = document.getElementById('inventory-search');
    const invFilter = document.getElementById('filter-category');

    function applyInventoryFilters() {
        renderInventory(invSearch.value, invFilter.value);
    }

    invSearch.addEventListener('input', applyInventoryFilters);
    invFilter.addEventListener('change', applyInventoryFilters);

    function populateEmployeeSelect() {
        const sel = document.getElementById('pos-employee-select');
        if (!sel) return;

        const currentValue = sel.value;
        sel.innerHTML = '<option value="">Sin asignar</option>';
        employees.forEach(e => {
            const opt = document.createElement('option');
            opt.value = String(e.id);
            opt.textContent = `${e.name} (${Number(e.commissionPercent || 0).toFixed(2)}%)`;
            sel.appendChild(opt);
        });
        sel.value = currentValue;
    }

    // Dashboard Search Logic
    const dashboardSearch = document.getElementById('dashboard-search');

    let dashboardSearchDebounceId = null;

    function performDashboardSearch({ clearDashboardInput = true } = {}) {
        if (!dashboardSearch) return;
        const term = dashboardSearch.value.trim();
        if (!term) return;

        switchView('Inventario');
        if (invSearch) {
            invSearch.value = term;
            invSearch.dispatchEvent(new Event('input'));
            setTimeout(() => invSearch.focus(), 100); // Focus so user can keep typing
        }

        if (clearDashboardInput) {
            dashboardSearch.value = '';
        }
    }

    if (dashboardSearch) {
        dashboardSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performDashboardSearch();
            }
        });

        // Búsqueda en vivo: al tipear, se va a Inventario y filtra la tabla
        dashboardSearch.addEventListener('input', () => {
            clearTimeout(dashboardSearchDebounceId);
            dashboardSearchDebounceId = setTimeout(() => {
                performDashboardSearch({ clearDashboardInput: false });
            }, 250);
        });

        // También permitir click en el icono del dashboard (el relativo al input)
        const icon = dashboardSearch.parentElement.querySelector('i');
        if (icon) {
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', () => performDashboardSearch());
        }
    }

    function openModal(editing = false, data = null) {
        productModal.style.display = 'flex';
        if (editing) {
            document.getElementById('modal-title').textContent = 'Editar Repuesto';
            document.getElementById('edit-id').value = data.id;
            document.getElementById('p-code').value = data.code;
            document.getElementById('p-name').value = data.name;
            document.getElementById('p-brand').value = data.brand;
            document.getElementById('p-category').value = data.category;
            document.getElementById('p-price').value = data.price;
            document.getElementById('p-stock').value = data.stock;
        } else {
            document.getElementById('modal-title').textContent = 'Añadir Nuevo Repuesto';
            productForm.reset();
            document.getElementById('edit-id').value = '';
        }
    }

    function closeModal() { productModal.style.display = 'none'; }
    document.getElementById('add-product-btn').addEventListener('click', () => openModal());
    document.querySelectorAll('.close-modal').forEach(btn => btn.onclick = closeModal);

    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const productData = {
            id: id ? parseInt(id) : Date.now(),
            code: document.getElementById('p-code').value,
            name: document.getElementById('p-name').value,
            brand: document.getElementById('p-brand').value,
            category: document.getElementById('p-category').value,
            price: parseFloat(document.getElementById('p-price').value),
            stock: parseInt(document.getElementById('p-stock').value)
        };

        if (id) {
            const index = inventory.findIndex(p => p.id === parseInt(id));
            inventory[index] = productData;
            showToast('Producto actualizado');
        } else {
            inventory.push(productData);
            showToast('Producto agregado');
        }

        saveData();
        closeModal();
        renderInventory();
    });

    function deleteProduct(id) {
        if (confirm('¿Eliminar producto?')) {
            inventory = inventory.filter(p => p.id !== parseInt(id));
            saveData();
            renderInventory();
            showToast('Producto eliminado');
        }
    }

    function editProduct(id) {
        const product = inventory.find(p => p.id === parseInt(id));
        openModal(true, product);
    }

    // --- Clients CRUD ---
    function renderClients() {
        clientsTableBody.innerHTML = '';
        clients.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.name}</strong></td>
                <td>${c.taxId}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>
                    <button class="action-btn edit" data-id="${c.id}" title="Editar"><i class='bx bx-edit-alt'></i></button>
                    <button class="action-btn delete" data-id="${c.id}" title="Eliminar"><i class='bx bx-trash'></i></button>
                </td>
            `;
            clientsTableBody.appendChild(tr);
        });

        clientsTableBody.querySelectorAll('.action-btn.edit').forEach(btn => btn.onclick = () => editClient(btn.dataset.id));
        clientsTableBody.querySelectorAll('.action-btn.delete').forEach(btn => btn.onclick = () => deleteClient(btn.dataset.id));
    }

    function openClientModal(editing = false, data = null) {
        clientModal.style.display = 'flex';
        if (editing) {
            document.getElementById('client-modal-title').textContent = 'Editar Cliente';
            document.getElementById('edit-client-id').value = data.id;
            document.getElementById('c-name').value = data.name;
            document.getElementById('c-tax-id').value = data.taxId;
            document.getElementById('c-phone').value = data.phone;
            document.getElementById('c-email').value = data.email;
        } else {
            document.getElementById('client-modal-title').textContent = 'Añadir Nuevo Cliente';
            clientForm.reset();
            document.getElementById('edit-client-id').value = '';
        }
    }

    function closeClientModal() { clientModal.style.display = 'none'; }
    document.getElementById('add-client-btn').onclick = () => openClientModal();
    document.querySelectorAll('.close-client-modal').forEach(btn => btn.onclick = closeClientModal);

    clientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-client-id').value;
        const clientData = {
            id: id ? parseInt(id) : Date.now(),
            name: document.getElementById('c-name').value,
            taxId: document.getElementById('c-tax-id').value,
            phone: document.getElementById('c-phone').value,
            email: document.getElementById('c-email').value
        };

        if (id) {
            const index = clients.findIndex(c => c.id === parseInt(id));
            clients[index] = clientData;
            showToast('Cliente actualizado');
        } else {
            clients.push(clientData);
            showToast('Cliente agregado');
        }

        saveData();
        closeClientModal();
        renderClients();
    });

    function renderEmployees() {
        if (!employeesTableBody) return;
        employeesTableBody.innerHTML = '';

        employees.forEach(e => {
            const tr = document.createElement('tr');
            const pct = Number(e.commissionPercent || 0);
            tr.innerHTML = `
                <td><strong>${e.name}</strong></td>
                <td>${pct.toFixed(2)}%</td>
                <td>
                    <button class="action-btn" data-action="sales" data-id="${e.id}" title="Ver ventas"><i class='bx bx-receipt'></i></button>
                    <button class="action-btn edit" data-id="${e.id}" title="Editar"><i class='bx bx-edit-alt'></i></button>
                    <button class="action-btn delete" data-id="${e.id}" title="Eliminar"><i class='bx bx-trash'></i></button>
                </td>
            `;
            employeesTableBody.appendChild(tr);
        });

        employeesTableBody.querySelectorAll('button[data-action="sales"]').forEach(btn => {
            btn.onclick = () => openEmployeeSalesModal(btn.dataset.id);
        });
        employeesTableBody.querySelectorAll('.action-btn.edit').forEach(btn => btn.onclick = () => editEmployee(btn.dataset.id));
        employeesTableBody.querySelectorAll('.action-btn.delete').forEach(btn => btn.onclick = () => deleteEmployee(btn.dataset.id));

        populateEmployeeSelect();
    }

    const employeeSalesModal = document.getElementById('employee-sales-modal');
    const employeeSalesHistory = document.getElementById('employee-sales-history');

    function closeEmployeeSalesModal() {
        if (!employeeSalesModal) return;
        employeeSalesModal.style.display = 'none';
    }

    function openEmployeeSalesModal(employeeId) {
        if (!employeeSalesModal || !employeeSalesHistory) return;

        const emp = employees.find(e => String(e.id) === String(employeeId));
        const empName = emp ? emp.name : 'Empleado';
        const empPct = emp ? Number(emp.commissionPercent || 0) : 0;

        const title = document.getElementById('employee-sales-modal-title');
        if (title) title.textContent = `Ventas de ${empName}`;

        employeeSalesHistory.innerHTML = '';
        const filteredSales = sales.filter(s => s && String(s.employeeId) === String(employeeId));

        if (filteredSales.length === 0) {
            employeeSalesHistory.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Sin ventas registradas</td></tr>';
        } else {
            filteredSales.forEach(s => {
                const tr = document.createElement('tr');
                const dateStr = s.date ? (new Date(s.date).toLocaleDateString() + ' ' + new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : '---';
                const clientDisplay = (s.customer || 'Desconocido') + (s.subClient ? ` (${s.subClient})` : '') + (s.vehicle ? ` - [${s.vehicle}]` : '');
                const total = Number(s.total || 0);

                const pct = Number(s.employeeCommissionPercent || empPct || 0);
                const commission = total * (pct / 100);

                tr.innerHTML = `
                    <td>${dateStr}</td>
                    <td><strong>${clientDisplay}</strong></td>
                    <td><small>${s.items || '---'}</small></td>
                    <td>$${total.toLocaleString()}</td>
                    <td>$${commission.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                `;
                employeeSalesHistory.appendChild(tr);
            });
        }

        employeeSalesModal.style.display = 'flex';
    }

    document.querySelectorAll('.close-employee-sales-modal').forEach(btn => btn.onclick = closeEmployeeSalesModal);
    if (employeeSalesModal) employeeSalesModal.addEventListener('click', (e) => {
        if (e.target === employeeSalesModal) closeEmployeeSalesModal();
    });

    function openEmployeeModal(editing = false, data = null) {
        if (!employeeModal) return;
        employeeModal.style.display = 'flex';
        if (editing) {
            document.getElementById('employee-modal-title').textContent = 'Editar Empleado';
            document.getElementById('edit-employee-id').value = data.id;
            document.getElementById('e-name').value = data.name;
            document.getElementById('e-commission').value = data.commissionPercent;
        } else {
            document.getElementById('employee-modal-title').textContent = 'Añadir Nuevo Empleado';
            employeeForm.reset();
            document.getElementById('edit-employee-id').value = '';
        }
    }

    function closeEmployeeModal() {
        if (!employeeModal) return;
        employeeModal.style.display = 'none';
    }

    if (document.getElementById('add-employee-btn')) {
        document.getElementById('add-employee-btn').onclick = () => openEmployeeModal();
    }
    document.querySelectorAll('.close-employee-modal').forEach(btn => btn.onclick = closeEmployeeModal);

    function editEmployee(id) {
        const emp = employees.find(e => String(e.id) === String(id));
        if (!emp) return;
        openEmployeeModal(true, emp);
    }

    function deleteEmployee(id) {
        if (confirm('¿Eliminar empleado?')) {
            employees = employees.filter(e => String(e.id) !== String(id));
            saveData();
            renderEmployees();
            showToast('Empleado eliminado');
        }
    }

    if (employeeForm) {
        employeeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-employee-id').value;
            const commissionPercent = parseFloat(document.getElementById('e-commission').value);
            if (isNaN(commissionPercent) || commissionPercent < 0) {
                showToast('Comisión inválida', 'error');
                return;
            }

            const employeeData = {
                id: id ? parseInt(id) : Date.now(),
                name: document.getElementById('e-name').value,
                commissionPercent: commissionPercent
            };

            if (id) {
                const index = employees.findIndex(e => e.id === parseInt(id));
                if (index >= 0) employees[index] = employeeData;
                showToast('Empleado actualizado');
            } else {
                employees.push(employeeData);
                showToast('Empleado agregado');
            }

            saveData();
            closeEmployeeModal();
            renderEmployees();
        });
    }

    function deleteClient(id) {
        if (confirm('¿Eliminar cliente?')) {
            clients = clients.filter(c => c.id !== parseInt(id));
            saveData();
            renderClients();
            showToast('Cliente eliminado');
        }
    }

    function editClient(id) {
        const client = clients.find(c => c.id === parseInt(id));
        openClientModal(true, client);
    }

    // --- POS System ---
    function renderPOSProducts(filter = '') {
        posProductsList.innerHTML = '';
        const filtered = inventory.filter(p =>
            p.name.toLowerCase().includes(filter.toLowerCase()) ||
            p.code.toLowerCase().includes(filter.toLowerCase())
        );

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'pos-product-card';
            card.innerHTML = `
                <i class='bx bxs-box'></i>
                <h4>${p.name}</h4>
                <div class="price">$${p.price.toLocaleString()}</div>
                <div class="stock">${p.stock} dispon.</div>
            `;
            card.onclick = () => addToCart(p);
            posProductsList.appendChild(card);
        });

        // Populate Client Select
        const clientSelect = document.getElementById('pos-client-select');
        clientSelect.innerHTML = '<option value="Consumidor Final">Consumidor Final</option>';
        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = c.name;
            clientSelect.appendChild(opt);
        });
    }

    function addToCart(product) {
        if (product.stock <= 0 && !product.isManual) {
            showToast('Sin stock disponible', 'error');
            return;
        }

        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            if (existing.qty < product.stock || product.isManual) {
                existing.qty++;
            } else {
                showToast('Límite de stock alcanzado');
            }
        } else {
            // For manual items, we clone specifically to avoid reference issues if added again? 
            // Actually manual items have unique IDs if generated each time, but if re-added from history or similar logic (not present here), be careful.
            // Since we generate 'manual-' + Date.now(), each click is unique unless we click fast.
            // Wait, if I type same manual item twice, I generate two different IDs.
            // That's fine, they will appear as separate lines. That's actually better for "Repair A" + "Repair B".
            // But if user wants quantity > 1 of manual item? He has to set it in cart.
            cart.push({ ...product, qty: 1 });
        }
        refreshCartUI();
    }

    function refreshCartUI() {
        cartItemsList.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            const subtotal = item.price * item.qty;
            total += subtotal;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-info">
                    <h5>${item.name}</h5>
                    <span>$${item.price.toLocaleString()} x ${item.qty}</span>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
                </div>
            `;
            cartItemsList.appendChild(div);
        });

        cartTotalEl.textContent = `$${total.toLocaleString()}`;
        cartSubtotalEl.textContent = `$${total.toLocaleString()}`;
    }

    window.updateCartQty = (id, delta) => {
        const item = cart.find(i => i.id === id);
        if (!item) return;

        // Skip stock check for manual items
        if (item.isManual) {
            item.qty += delta;
            if (item.qty <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            refreshCartUI();
            return;
        }

        const original = inventory.find(p => p.id === id);

        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        } else if (item.qty > original.stock) {
            item.qty = original.stock;
            showToast('Stock máximo superado');
        }
        refreshCartUI();
    };

    // Manual Items
    document.getElementById('add-manual-btn').addEventListener('click', () => {
        const descInput = document.getElementById('manual-desc');
        const priceInput = document.getElementById('manual-price');

        const desc = descInput.value.trim();
        const price = parseFloat(priceInput.value);

        if (!desc || isNaN(price) || price <= 0) {
            showToast('Ingresa descripción y precio válido', 'error');
            return;
        }

        const manualItem = {
            id: 'manual-' + Date.now(),
            name: desc,
            price: price,
            qty: 1,
            stock: 999999, // Infinite stock for manual items
            isManual: true
        };

        addToCart(manualItem);

        // Clear inputs
        descInput.value = '';
        priceInput.value = '';
        descInput.focus();
    });

    document.getElementById('pos-search').addEventListener('input', (e) => {
        renderPOSProducts(e.target.value);
    });

    document.getElementById('clear-cart').onclick = () => {
        cart = [];
        refreshCartUI();
    };

    // Payment method selection
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPaymentMethod = btn.dataset.method;
        };
    });

    let lastFinishedSale = null;
    let lastFinishedItems = [];

    document.getElementById('finalize-sale').onclick = () => {
        const btn = document.getElementById('finalize-sale');
        if (cart.length === 0) {
            showToast('El carrito está vacío', 'error');
            return;
        }

        // Just a brief visual feedback
        btn.style.background = 'var(--success)';
        btn.style.transform = 'scale(0.95)';

        const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const selectedClientName = document.getElementById('pos-client-select').value;
        const selectedEmployeeId = document.getElementById('pos-employee-select') ? document.getElementById('pos-employee-select').value : '';
        const selectedEmployee = selectedEmployeeId ? employees.find(e => String(e.id) === String(selectedEmployeeId)) : null;
        const subClient = document.getElementById('pos-sub-client').value || '';
        const vehiclePlate = document.getElementById('pos-vehicle-plate').value || '';
        const cartForTicket = [...cart];

        // Find client phone if registered
        const registeredClient = clients.find(c => c.name === selectedClientName);
        const clientPhone = registeredClient ? registeredClient.phone : '';

        const newSale = {
            id: `TRX-${Date.now()}`,
            customer: selectedClientName,
            employeeId: selectedEmployee ? selectedEmployee.id : null,
            employeeName: selectedEmployee ? selectedEmployee.name : '',
            employeeCommissionPercent: selectedEmployee ? Number(selectedEmployee.commissionPercent || 0) : 0,
            subClient: subClient,
            vehicle: vehiclePlate,
            clientPhone: clientPhone,
            items: cart.map(i => i.name).join(', '),
            total: total,
            method: selectedPaymentMethod,
            date: new Date().toISOString()
        };

        sales.unshift(newSale);

        // Update Stock
        cart.forEach(cartItem => {
            if (!cartItem.isManual) {
                const invProduct = inventory.find(p => p.id === cartItem.id);
                if (invProduct) invProduct.stock -= cartItem.qty;
            }
        });

        // Store for printing
        lastFinishedSale = newSale;
        lastFinishedItems = cartForTicket;

        // Clear State
        cart = [];
        saveData();
        document.getElementById('pos-sub-client').value = '';
        document.getElementById('pos-vehicle-plate').value = '';
        if (document.getElementById('pos-employee-select')) document.getElementById('pos-employee-select').value = '';
        refreshCartUI();

        // Show Success Modal
        document.getElementById('success-modal').style.display = 'flex';

        // Reset button style after a short delay
        setTimeout(() => {
            btn.style.background = '';
            btn.style.transform = '';
        }, 500);
    };

    // Success Modal Handlers
    document.getElementById('print-ticket-success').onclick = () => {
        printTicket(lastFinishedSale, lastFinishedItems);
    };

    document.getElementById('close-success-modal').onclick = () => {
        document.getElementById('success-modal').style.display = 'none';
        switchView('Dashboard');
    };

    document.getElementById('whatsapp-share-success').onclick = () => {
        sendToWhatsApp(lastFinishedSale);
    };

    function sendToWhatsApp(sale) {
        if (!sale) return;

        // Construct the message
        let message = `*Hola ${sale.customer || ''}!*\n`;
        message += `Aquí tienes el detalle de tu servicio:\n\n`;
        message += `📅 Fecha: ${new Date(sale.date).toLocaleDateString()}\n`;
        if (sale.vehicle) message += `🚗 Vehículo: ${sale.vehicle}\n`;
        message += `📋 Trabajo/Repuestos: ${sale.items}\n`;
        message += `💰 *Total: $${sale.total.toLocaleString()}*\n\n`;
        message += `Gracias por confiar en ${config.storeName}!`;

        const encodedMessage = encodeURIComponent(message);

        // Use client phone if available, otherwise open blank WhatsApp to let user choose contact
        let url = `https://wa.me/`;
        if (sale.clientPhone) {
            // Clean phone number
            const cleanPhone = sale.clientPhone.replace(/\D/g, '');
            url += cleanPhone;
        }
        url += `?text=${encodedMessage}`;

        window.open(url, '_blank');
    }

    function printTicket(sale, items) {
        const ticketArea = document.getElementById('ticket-print-area');
        if (!sale) return;

        const dateStr = new Date(sale.date).toLocaleString();
        let itemsHtml = '';

        if (items && items.length > 0) {
            items.forEach(item => {
                itemsHtml += `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span style="flex: 1;">${item.name} x${item.qty}</span>
                        <span style="width: 80px; text-align: right;">$${(item.price * item.qty).toLocaleString()}</span>
                    </div>
                `;
            });
        } else {
            itemsHtml = `<div style="margin-bottom: 5px; font-size: 11px;">${sale.items}</div>`;
        }

        ticketArea.innerHTML = `
            <div style="width: 100%; max-width: 80mm; background: #fff; color: #000; padding: 10px; font-family: monospace;">
                <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
                    <h2 style="margin: 0; font-size: 18px;">${config.storeName}</h2>
                    <p style="margin: 3px 0; font-size: 12px;">${config.storeSlogan}</p>
                    <p style="margin: 0; font-size: 10px;">${config.address || ''}</p>
                    <p style="margin: 0; font-size: 10px;">${config.taxId || ''}</p>
                </div>
                    <p style="margin: 2px 0;"><b>FECHA:</b> ${dateStr}</p>
                    <p style="margin: 2px 0;"><b>TICKET:</b> ${sale.id.split('-')[1] || sale.id}</p>
                    <p style="margin: 2px 0;"><b>CLIENTE:</b> ${sale.customer}</p>
                    ${sale.subClient ? `<p style="margin: 2px 0;"><b>REF:</b> ${sale.subClient}</p>` : ''}
                    ${sale.vehicle ? `<p style="margin: 2px 0;"><b>PATENTE:</b> ${sale.vehicle}</p>` : ''}
                </div>
                <div style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px;">
                    <div style="display:flex; justify-content: space-between; font-weight: bold; font-size: 10px; border-bottom: 1px solid #000; margin-bottom: 5px;">
                        <span>DESCRIPCION</span>
                        <span>TOTAL</span>
                    </div>
                    ${itemsHtml}
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-bottom: 10px;">
                    <span>TOTAL:</span>
                    <span>$${sale.total.toLocaleString()}</span>
                </div>
                <div style="margin-top: 5px; font-size: 11px; border-top: 1px dashed #000; padding-top: 5px;">
                    <p style="margin: 2px 0;"><b>PAGO:</b> ${sale.method}</p>
                </div>
                <div style="text-align: center; margin-top: 30px; border-top: 1px solid #000; padding-top: 10px; font-size: 11px;">
                    <p>GRACIAS POR SU COMPRA</p>
                    <p>RepuestosPOS</p>
                </div>
            </div>
        `;

        setTimeout(() => {
            window.print();
        }, 500);
    }

    // --- Dashboard logic ---
    function updateStats() {
        const lowStockCount = inventory.filter(p => p.stock <= 5).length;
        document.getElementById('stat-total-products').textContent = inventory.length;
        document.getElementById('stat-low-stock').textContent = lowStockCount;

        // --- Update Notification Badges ---
        const badgeStock = document.getElementById('badge-stock');
        if (badgeStock) badgeStock.textContent = lowStockCount;

        const pendingRepairs = repairs.filter(r => r.status === 'pending').length;
        const badgeRepairs = document.getElementById('badge-repairs');
        if (badgeRepairs) badgeRepairs.textContent = pendingRepairs;

        const today = new Date().toISOString().split('T')[0];
        const todayTurnos = turnos.filter(t => t.date === today).length;
        const badgeTurnos = document.getElementById('badge-turnos');
        if (badgeTurnos) badgeTurnos.textContent = todayTurnos;

        const todaySales = sales.filter(s => s && s.date && s.date.startsWith(today));
        const totalSalesVal = todaySales.reduce((acc, s) => acc + (s.total || 0), 0);

        document.getElementById('stat-sales').textContent = `$${totalSalesVal.toLocaleString()}`;
        document.getElementById('stat-orders').textContent = todaySales.length;

        // Render Recent Sales Table
        const table = document.getElementById('recent-sales-table');
        table.innerHTML = '';
        if (sales.length === 0) {
            table.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No hay ventas</td></tr>';
        } else {
            sales.slice(0, 5).forEach(s => {
                if (!s) return;
                const tr = document.createElement('tr');
                const clientName = (s.customer || 'Desconocido') + (s.subClient ? ` <br><small style="color: var(--accent)">Ref: ${s.subClient}</small>` : '') + (s.vehicle ? ` <br><small style="color: var(--text-muted)">${s.vehicle}</small>` : '');
                const statusClass = s.method === 'A Cuenta' ? 'pending' : 'completed';
                const saleId = s.id ? (s.id.includes('-') ? s.id.split('-')[1].slice(-5) : s.id.slice(-5)) : '?????';

                tr.innerHTML = `
                    <td>#${saleId}</td>
                    <td>${clientName}</td>
                    <td><small>${s.items || 'Sin items'}</small></td>
                    <td>$${(s.total || 0).toLocaleString()}</td>
                    <td><span class="status ${statusClass}">${s.method || 'Efectivo'}</span></td>
                    <td>
                        <button class="action-btn share-whatsapp" data-id="${s.id}" title="Enviar WhatsApp" style="color: #25D366;">
                            <i class='bx bxl-whatsapp'></i>
                        </button>
                        <button class="action-btn print-past-sale" data-id="${s.id}" title="Reimprimir">
                            <i class='bx bx-printer'></i>
                        </button>
                    </td>
                `;
                table.appendChild(tr);
            });
            // Re-bind buttons after rendering dashboard
            document.querySelectorAll('.print-past-sale').forEach(btn => {
                btn.onclick = (e) => {
                    const sale = sales.find(s => s.id === btn.dataset.id);
                    printTicket(sale, []);
                };
            });
            document.querySelectorAll('.share-whatsapp').forEach(btn => {
                btn.onclick = (e) => {
                    const sale = sales.find(s => s.id === btn.dataset.id);
                    sendToWhatsApp(sale);
                };
            });
        }
    }

    function updateDashboard() {
        updateStats();
    }

    function updateReports() {
        const totalRev = sales.reduce((acc, s) => acc + (s ? (s.total || 0) : 0), 0);
        const avg = sales.length > 0 ? totalRev / sales.length : 0;

        document.getElementById('report-total-revenue').textContent = `$${totalRev.toLocaleString()}`;
        document.getElementById('report-avg-sale').textContent = `$${avg.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

        const table = document.getElementById('full-sales-history');
        table.innerHTML = '';
        sales.forEach(s => {
            if (!s) return;
            const dateStr = s.date ? (new Date(s.date).toLocaleDateString() + ' ' + new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : '---';
            const tr = document.createElement('tr');
            const clientDisplay = (s.customer || 'Desconocido') + (s.subClient ? ` (${s.subClient})` : '') + (s.vehicle ? ` - [${s.vehicle}]` : '');
            const statusClass = s.method === 'A Cuenta' ? 'pending' : 'completed';

            const employeeDisplay = s.employeeName ? s.employeeName : 'Sin asignar';

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><strong>${clientDisplay}</strong></td>
                <td>${employeeDisplay}</td>
                <td><small>${s.items || '---'}</small></td>
                <td><span class="status ${statusClass}">${s.method || 'Efectivo'}</span></td>
                <td>$${(s.total || 0).toLocaleString()}</td>
                <td>
                    <button class="action-btn share-whatsapp" data-id="${s.id}" title="Enviar WhatsApp" style="color: #25D366;">
                        <i class='bx bxl-whatsapp'></i>
                    </button>
                    <button class="action-btn print-past-sale" data-id="${s.id}" title="Reimprimir Ticket">
                        <i class='bx bx-printer'></i>
                    </button>
                    <button class="action-btn delete delete-sale" data-id="${s.id}" title="Eliminar Venta">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            `;
            table.appendChild(tr);
        });

        const summaryBody = document.getElementById('employee-sales-summary');
        if (summaryBody) {
            summaryBody.innerHTML = '';

            const totalsByEmployeeKey = new Map();
            sales.forEach(s => {
                if (!s) return;
                const key = s.employeeId ? String(s.employeeId) : '__unassigned__';
                const prev = totalsByEmployeeKey.get(key) || { total: 0, commission: 0, count: 0 };
                const total = Number(s.total || 0);
                const pct = Number(s.employeeCommissionPercent || 0);
                prev.total += total;
                prev.commission += total * (pct / 100);
                prev.count += 1;
                totalsByEmployeeKey.set(key, prev);
            });

            const rows = [];
            totalsByEmployeeKey.forEach((v, key) => {
                let name = 'Sin asignar';
                let pct = 0;
                if (key !== '__unassigned__') {
                    const emp = employees.find(e => String(e.id) === String(key));
                    if (emp) {
                        name = emp.name;
                        pct = Number(emp.commissionPercent || 0);
                    } else {
                        name = 'Empleado eliminado';
                        pct = 0;
                    }
                }
                rows.push({ key, name, pct, total: v.total, commission: v.commission, count: v.count });
            });

            rows.sort((a, b) => b.total - a.total);

            if (rows.length === 0) {
                summaryBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Sin ventas</td></tr>';
            } else {
                rows.forEach(r => {
                    const tr = document.createElement('tr');
                    const label = r.key === '__unassigned__' ? r.name : `${r.name} (${r.pct.toFixed(2)}%)`;
                    tr.innerHTML = `
                        <td><strong>${label}</strong></td>
                        <td>${r.count || 0}</td>
                        <td>$${Number(r.total || 0).toLocaleString()}</td>
                        <td>$${Number(r.commission || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                        <td>
                             <button class="action-btn delete clear-employee-sales" data-key="${r.key}" title="Eliminar registro de ventas">
                                <i class='bx bx-trash'></i>
                            </button>
                        </td>
                    `;
                    summaryBody.appendChild(tr);
                });
            }
        }

        document.querySelectorAll('.print-past-sale').forEach(btn => {
            btn.onclick = () => {
                const sale = sales.find(s => s.id === btn.dataset.id);
                // We need the items as an array for printTicket
                // In our current sale object they are stored as a string "Item1, Item2"
                // For a proper reprint, we'll format them slightly different or accept the string
                printTicket(sale, []); // Items list is empty because items are currently stored as string in sale history
            };
        });

        document.querySelectorAll('.share-whatsapp').forEach(btn => {
            btn.onclick = (e) => {
                const sale = sales.find(s => s.id === btn.dataset.id);
                sendToWhatsApp(sale);
            };
        });

        // Delete Sale Handler
        document.querySelectorAll('.delete-sale').forEach(btn => {
            btn.onclick = () => {
                if (confirm('¿Seguro que deseas eliminar esta venta permanentemente?')) {
                    sales = sales.filter(s => s.id !== btn.dataset.id);
                    saveData();
                    updateReports();
                    showToast('Venta eliminada');
                }
            };
        });

        // Clear Employee Sales Handler
        document.querySelectorAll('.clear-employee-sales').forEach(btn => {
            btn.onclick = () => {
                const key = btn.dataset.key;
                if (confirm('¿ATENCIÓN: Esto eliminará TODAS las ventas registradas para este empleado. ¿Continuar?')) {
                    const beforeCount = sales.length;
                    if (key === '__unassigned__') {
                        sales = sales.filter(s => s.employeeId);
                    } else {
                        sales = sales.filter(s => String(s.employeeId) !== String(key));
                    }
                    const deletedCount = beforeCount - sales.length;
                    saveData();
                    updateReports();
                    showToast(`${deletedCount} registros eliminados`);
                }
            };
        });
    }

    // --- Data Export/Import Logic ---

    function downloadFile(content, fileName, contentType) {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    document.getElementById('export-json').onclick = () => {
        const fullData = {
            inventory: inventory,
            sales: sales,
            clients: clients,
            repairs: repairs,
            turnos: turnos,
            employees: employees,
            exportDate: new Date().toISOString()
        };
        downloadFile(JSON.stringify(fullData, null, 2), `RepuestosPOS_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        showToast('Backup JSON descargado');
    };

    document.getElementById('export-excel').onclick = () => {
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Inventory
        const invSheet = XLSX.utils.json_to_sheet(inventory);
        XLSX.utils.book_append_sheet(workbook, invSheet, "Inventario");

        // Sheet 2: Sales
        const salesSheet = XLSX.utils.json_to_sheet(sales);
        XLSX.utils.book_append_sheet(workbook, salesSheet, "Ventas");

        // Sheet 3: Clients
        const clientsSheet = XLSX.utils.json_to_sheet(clients);
        XLSX.utils.book_append_sheet(workbook, clientsSheet, "Clientes");

        // Sheet 4: Employees
        const employeesSheet = XLSX.utils.json_to_sheet(employees);
        XLSX.utils.book_append_sheet(workbook, employeesSheet, "Empleados");

        // Sheet 5: Repairs
        const repairsSheet = XLSX.utils.json_to_sheet(repairs);
        XLSX.utils.book_append_sheet(workbook, repairsSheet, "Reparaciones");

        // Sheet 6: Turnos
        const turnosSheet = XLSX.utils.json_to_sheet(turnos);
        XLSX.utils.book_append_sheet(workbook, turnosSheet, "Turnos");

        XLSX.writeFile(workbook, `RepuestosPOS_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast('Backup Excel generado');
    };

    const importInput = document.getElementById('import-input');
    document.getElementById('import-btn').onclick = () => importInput.click();

    importInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const isExcel = file.name.endsWith('.xlsx');

        reader.onload = (event) => {
            try {
                let importedData;
                if (isExcel) {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    importedData = {
                        inventory: XLSX.utils.sheet_to_json(workbook.Sheets["Inventario"]),
                        sales: XLSX.utils.sheet_to_json(workbook.Sheets["Ventas"]),
                        clients: XLSX.utils.sheet_to_json(workbook.Sheets["Clientes"]),
                        employees: workbook.Sheets["Empleados"] ? XLSX.utils.sheet_to_json(workbook.Sheets["Empleados"]) : [],
                        repairs: workbook.Sheets["Reparaciones"] ? XLSX.utils.sheet_to_json(workbook.Sheets["Reparaciones"]) : [],
                        turnos: workbook.Sheets["Turnos"] ? XLSX.utils.sheet_to_json(workbook.Sheets["Turnos"]) : []
                    };
                } else {
                    importedData = JSON.parse(event.target.result);
                }

                if (importedData.inventory && importedData.sales && importedData.clients) {
                    if (confirm('¿Reemplazar datos actuales con el archivo seleccionado?')) {
                        inventory = importedData.inventory;
                        sales = importedData.sales;
                        clients = importedData.clients;
                        employees = importedData.employees || [];
                        repairs = importedData.repairs || [];
                        turnos = importedData.turnos || [];
                        saveData();
                        showToast('Datos cargados con éxito');
                        location.reload();
                    }
                } else {
                    showToast('Formato de archivo incorrecto', 'error');
                }
            } catch (err) {
                showToast('Error al procesar el archivo', 'error');
                console.error(err);
            }
        };

        if (isExcel) reader.readAsArrayBuffer(file);
        else reader.readAsText(file);
        importInput.value = '';
    };

    // --- Daily Report Logic ---
    function openDailyReportModal() {
        const today = new Date().toISOString().split('T')[0];
        const todaySales = sales.filter(s => s && s.date && s.date.startsWith(today));
        
        const total = todaySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        const count = todaySales.length;
        
        const byMethod = todaySales.reduce((acc, s) => {
            const method = s.method || 'Efectivo';
            acc[method] = (acc[method] || 0) + (Number(s.total) || 0);
            return acc;
        }, {});

        // Fill modal with data
        const dateEl = document.getElementById('daily-report-date');
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        const totalEl = document.getElementById('daily-total-sales');
        if (totalEl) totalEl.textContent = `$${total.toLocaleString()}`;
        
        const countEl = document.getElementById('daily-sales-count');
        if (countEl) countEl.textContent = count;
        
        // Detailed methods
        const methodsContainer = document.getElementById('daily-methods-list');
        if (methodsContainer) {
            methodsContainer.innerHTML = '';
            const methods = ['Efectivo', 'Tarjeta', 'Transferencia', 'A Cuenta'];
            methods.forEach(m => {
                const amount = byMethod[m] || 0;
                const div = document.createElement('div');
                div.className = 'daily-method-item';
                div.innerHTML = `
                    <span>${m}</span>
                    <strong>$${amount.toLocaleString()}</strong>
                `;
                methodsContainer.appendChild(div);
            });
        }

        const modal = document.getElementById('daily-report-modal');
        if (modal) modal.style.display = 'flex';
    }

    function closeDailyReportModal() {
        const modal = document.getElementById('daily-report-modal');
        if (modal) modal.style.display = 'none';
    }

    function printDailyReport() {
        const today = new Date().toISOString().split('T')[0];
        const todaySales = sales.filter(s => s && s.date && s.date.startsWith(today));
        
        const total = todaySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
        const byMethod = todaySales.reduce((acc, s) => {
            const method = s.method || 'Efectivo';
            acc[method] = (acc[method] || 0) + (Number(s.total) || 0);
            return acc;
        }, {});

        const ticketArea = document.getElementById('ticket-print-area');
        const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        
        let methodsHtml = '';
        ['Efectivo', 'Tarjeta', 'Transferencia', 'A Cuenta'].forEach(m => {
            methodsHtml += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${m}:</span>
                    <span>$${(byMethod[m] || 0).toLocaleString()}</span>
                </div>
            `;
        });

        ticketArea.innerHTML = `
            <div style="width: 100%; max-width: 80mm; background: #fff; color: #000; padding: 10px; font-family: monospace;">
                <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
                    <h2 style="margin: 0; font-size: 18px;">${config.storeName}</h2>
                    <h3 style="margin: 5px 0; font-size: 14px;">CIERRE DE CAJA DIARIO</h3>
                    <p style="margin: 3px 0; font-size: 12px;">FECHA: ${dateStr}</p>
                </div>
                
                <div style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 12px; text-align: center;">RESUMEN POR METODO</h4>
                    ${methodsHtml}
                </div>

                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-bottom: 15px; border-top: 1px solid #000; padding-top: 5px;">
                    <span>TOTAL DEL DIA:</span>
                    <span>$${total.toLocaleString()}</span>
                </div>

                <div style="text-align: center; margin-top: 30px; border-top: 1px solid #000; padding-top: 10px; font-size: 10px;">
                    <p>REPORTE GENERADO EL ${new Date().toLocaleString()}</p>
                    <p>RepuestosPOS Management</p>
                </div>
            </div>
        `;

        setTimeout(() => {
            window.print();
        }, 500);
    }

    const dailyReportBtn = document.getElementById('daily-report-btn');
    if (dailyReportBtn) dailyReportBtn.onclick = openDailyReportModal;
    
    document.querySelectorAll('.close-daily-modal').forEach(btn => btn.onclick = closeDailyReportModal);
    
    const printDailyBtn = document.getElementById('print-daily-report');
    if (printDailyBtn) printDailyBtn.onclick = printDailyReport;

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        if (type === 'error') toast.style.background = '#ef4444';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // --- CLIENT VIEW FUNCTIONS (SHARED STATUS VIEW) ---
    function flexibleDecode(encoded) {
        let clean = encoded.trim().split('&')[0].replace(/ /g, '+');
        try {
            const bin = atob(clean);
            const decoded = decodeURIComponent(Array.prototype.map.call(bin, (c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(decoded);
        } catch (e) {
            return JSON.parse(atob(clean));
        }
    }

    function renderClientView(data) {
        if (!clientView) return;
        clientView.style.display = 'block';
        dashboardView.style.display = 'none';
        repairsView.style.display = 'none';
        repairDetailView.style.display = 'none';
        newRepairView.style.display = 'none';
        if (turnosView) turnosView.style.display = 'none';
        if (turnoDetailView) turnoDetailView.style.display = 'none';
        if (newTurnoView) newTurnoView.style.display = 'none';
        inventoryView.style.display = 'none';
        saleView.style.display = 'none';
        reportsView.style.display = 'none';
        clientsView.style.display = 'none';
        settingsView.style.display = 'none';

        const isTurno = data && (data.kind === 'turno' || data.service !== undefined);

        if (isTurno) {
            document.getElementById('client-order-id').textContent = `TURNO #${(data.id || "").slice(-6)}`;
            document.getElementById('client-device-model').textContent = data.service || "TURNO";
            document.getElementById('client-name-display').textContent = `CLIENTE: ${data.clientName || ""}`;
            document.getElementById('client-cost').textContent = data.date ? `${formatTurnoDateLabel(data.date)}${data.time ? ' ' + data.time : ''}` : "";

            const container = document.getElementById('client-progress');
            if (container) {
                const fecha = data.date ? formatTurnoDateLabel(data.date) : '-';
                const hora = data.time ? data.time : '-';
                const notas = data.notes ? data.notes : '-';

                container.innerHTML = '';
                const items = [
                    { l: `FECHA: ${fecha}` },
                    { l: `HORA: ${hora}` },
                    { l: `NOTAS: ${notas}` }
                ];
                items.forEach((it) => {
                    const div = document.createElement('div');
                    div.style.cssText = 'margin-bottom:1.25rem; display:flex; align-items:center; gap:15px;';
                    div.innerHTML = `<i class='bx bxs-check-circle' style="color:var(--accent); font-size:1.8rem;"></i> <span style="font-weight:bold; font-size:1.05rem;">${it.l}</span>`;
                    container.appendChild(div);
                });
            }
            return;
        }

        document.getElementById('client-order-id').textContent = `ORDEN #${(data.id || "").slice(-6)}`;
        document.getElementById('client-device-model').textContent = data.deviceModel || "EQUIPO";
        document.getElementById('client-name-display').textContent = `CLIENTE: ${data.clientName || ""}`;

        const cost = data.estimatedCost;
        const displayCost = (cost && cost !== "" && cost !== "0") ? `$ ${cost}` : "$ -";
        document.getElementById('client-cost').textContent = displayCost;

        const steps = [
            { k: 'pending', l: 'RECIBIDO' },
            { k: 'working', l: 'EN REPARACION' },
            { k: 'waiting_parts', l: 'REPUESTOS' },
            { k: 'ready', l: '¡LISTO PARA RETIRAR!' },
            { k: 'delivered', l: 'ENTREGADO' }
        ];

        const currentIdx = steps.findIndex(s => s.k === data.status);
        const container = document.getElementById('client-progress');
        if (container) {
            container.innerHTML = '';
            steps.forEach((s, i) => {
                const active = i <= currentIdx;
                const div = document.createElement('div');
                div.style.cssText = `margin-bottom:1.5rem; display:flex; align-items:center; gap:15px; opacity:${active ? '1' : '0.15'}`;
                div.innerHTML = `<i class='bx ${active ? 'bxs-check-circle' : 'bx-circle'}' style="color:${active ? 'var(--accent)' : '#64748b'}; font-size:1.8rem;"></i> <span style="font-weight:bold; font-size:1.1rem;">${s.l}</span>`;
                container.appendChild(div);
            });
        }
    }

    // Check for hash parameters on page load for client view
    window.addEventListener('hashchange', () => location.reload());

    const hash = window.location.hash;
    let dataParam = null;
    if (hash.includes('v=')) dataParam = hash.split('v=')[1];
    if (hash.includes('t=')) dataParam = hash.split('t=')[1];

    if (dataParam) {
        try {
            const data = flexibleDecode(dataParam);
            renderClientView(data);
        } catch (e) {
            console.error('Error decoding client view:', e);
            switchView('Panel');
        }
    }

    // Expose repair functions to global scope for onclick handlers
    window.switchRepairView = switchRepairView;
    window.renderRepairs = renderRepairs;
    window.loadRepairDetail = loadRepairDetail;
    window.updateRepairPrice = updateRepairPrice;
    window.updateRepairStatus = updateRepairStatus;
    window.copyRepairLink = copyRepairLink;
    window.sendRepairWhatsApp = sendRepairWhatsApp;
    window.downloadRepairStatusImage = downloadRepairStatusImage;
    window.deleteRepairRecord = deleteRepairRecord;
    window.getRepairStatusLabel = getRepairStatusLabel;

    window.switchTurnoView = switchTurnoView;
    window.renderTurnos = renderTurnos;
    window.loadTurnoDetail = loadTurnoDetail;
    window.saveTurnoDetail = saveTurnoDetail;
    window.copyTurnoLink = copyTurnoLink;
    window.sendTurnoWhatsApp = sendTurnoWhatsApp;
    window.downloadTurnoStatusImage = downloadTurnoStatusImage;
    window.deleteTurnoRecord = deleteTurnoRecord;

    // Expose inventory and client functions to global scope
    window.switchView = switchView;
    window.renderInventory = renderInventory;
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.editClient = editClient;
    window.deleteClient = deleteClient;
    window.openClientModal = openClientModal;
    window.closeClientModal = closeClientModal;
    window.renderClients = renderClients;
    window.showToast = showToast;

    // --- Settings Logic ---
    function loadSettings() {
        // Business Profile inputs removed
        document.getElementById('set-tax-percent').value = config.taxPercent;
    }

    document.getElementById('settings-form').onsubmit = (e) => {
        e.preventDefault();
        // Business Profile is now read-only/developer managed
        // config.storeName = ... (Removed)
        // config.storeSlogan = ... (Removed)
        // config.taxId = ... (Removed)
        // config.address = ... (Removed)

        config.taxPercent = parseFloat(document.getElementById('set-tax-percent').value);

        saveData();
        showToast('Configuración guardada');
    };

    document.getElementById('clear-db-btn').onclick = () => {
        if (confirm('¿ESTÁS SEGURO? Esta acción borrará TODO: Inventario, Ventas y Clientes. No se puede deshacer.')) {
            localStorage.clear();
            location.reload();
        }
    };

    function applyBranding() {
        // Update Page Title
        document.title = `${config.storeName} - ${config.storeSlogan}`;

        // Update Sidebar branding
        const sidebarBrand = document.querySelector('.logo-name');
        if (sidebarBrand) sidebarBrand.textContent = config.storeName;

        // Update POS/Reports/Inventory headers if they are active
        const headerTitle = document.querySelector('.header-title h1');
        const headerP = document.querySelector('.header-title p');

        if (dashboardView.style.display !== 'none') {
            if (headerTitle) headerTitle.textContent = `Panel de ${config.storeName}`;
            if (headerP) headerP.textContent = config.storeSlogan;
        }
    }

    // --- Mobile Menu Logic ---
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuOpenBtns = [
        document.getElementById('menu-open'),
        document.getElementById('menu-open-repairs'),
        document.getElementById('menu-open-repair-detail'),
        document.getElementById('menu-open-new-repair'),
        document.getElementById('menu-open-turnos'),
        document.getElementById('menu-open-turno-detail'),
        document.getElementById('menu-open-new-turno'),
        document.getElementById('menu-open-employees'),
        document.getElementById('menu-open-inv'),
        document.getElementById('menu-open-sale'),
        document.getElementById('menu-open-clients'),
        document.getElementById('menu-open-reports'),
        document.getElementById('menu-open-settings')
    ];
    const menuCloseBtn = document.getElementById('menu-close');

    function toggleSidebar(show) {
        if (show) {
            sidebar.classList.add('active');
            overlay.style.display = 'block';
        } else {
            sidebar.classList.remove('active');
            overlay.style.display = 'none';
        }
    }

    menuOpenBtns.forEach(btn => {
        if (btn) btn.onclick = () => toggleSidebar(true);
    });

    if (menuCloseBtn) menuCloseBtn.onclick = () => toggleSidebar(false);
    if (overlay) overlay.onclick = () => toggleSidebar(false);

    // Close sidebar when clicking a nav link (mobile)
    navLinks.forEach(li => {
        // Only close if it's not a submenu parent
        if (!li.classList.contains('has-submenu')) {
            li.addEventListener('click', () => {
                if (window.innerWidth <= 1024) toggleSidebar(false);
            });
        } else {
            // For submenu parents, only close if a child link is clicked
            const childLinks = li.querySelectorAll('.dropdown-menu a');
            childLinks.forEach(child => {
                child.addEventListener('click', () => {
                    if (window.innerWidth <= 1024) toggleSidebar(false);
                });
            });
        }
    });

    // Init
    applyBranding();
    updateDashboard();

    // Expose functions to window for HTML onclick access
    window.switchRepairView = switchRepairView;
    window.deleteRepairRecord = deleteRepairRecord;
    window.updateRepairPrice = updateRepairPrice;
    window.updateRepairStatus = updateRepairStatus;
    window.copyRepairLink = copyRepairLink;
    window.sendRepairWhatsApp = sendRepairWhatsApp;
    window.downloadRepairStatusImage = downloadRepairStatusImage;
});
