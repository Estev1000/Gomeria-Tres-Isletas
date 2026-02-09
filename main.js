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

    // --- REPAIRS DATA (GOMERIA) ---
    let repairs = JSON.parse(localStorage.getItem('gomeria_repairs')) || [];
    let currentRepairId = null;
    const GOMERIA_STORE_KEY = 'gomeria_repairs';

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
        localStorage.setItem('repuestospos_config', JSON.stringify(config));
        localStorage.setItem(GOMERIA_STORE_KEY, JSON.stringify(repairs));
        updateStats();
        applyBranding();
    }

    // --- DOM Elements ---
    const dashboardView = document.getElementById('dashboard-view');
    const repairsView = document.getElementById('repairs-view');
    const repairDetailView = document.getElementById('repair-detail-view');
    const newRepairView = document.getElementById('new-repair-view');
    const clientView = document.getElementById('client-view');
    const inventoryView = document.getElementById('inventory-view');
    const saleView = document.getElementById('sale-view');
    const reportsView = document.getElementById('reports-view');
    const clientsView = document.getElementById('clients-view');
    const settingsView = document.getElementById('settings-view');
    const navLinks = document.querySelectorAll('.nav-links li');

    const inventoryTableBody = document.querySelector('#inventory-table tbody');
    const clientsTableBody = document.querySelector('#clients-table tbody');

    const productModal = document.getElementById('product-modal');
    const clientModal = document.getElementById('client-modal');

    const productForm = document.getElementById('product-form');
    const clientForm = document.getElementById('client-form');

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
        clientView.style.display = 'none';
        inventoryView.style.display = 'none';
        saleView.style.display = 'none';
        reportsView.style.display = 'none';
        clientsView.style.display = 'none';
        settingsView.style.display = 'none';

        if (viewName === 'Dashboard' || viewName === 'Panel') {
            dashboardView.style.display = 'block';
            updateDashboard();
        } else if (viewName === 'Reparaciones') {
            repairsView.style.display = 'block';
            renderRepairs();
        } else if (viewName === 'Inventario') {
            inventoryView.style.display = 'block';
            renderInventory();
        } else if (viewName === 'Nuevo Ingreso' || viewName === 'Nueva Venta') {
            saleView.style.display = 'grid'; // Note: grid for pos layout
            renderPOSProducts();
            refreshCartUI();
        } else if (viewName === 'Reportes') {
            reportsView.style.display = 'block';
            updateReports();
        } else if (viewName === 'Clientes') {
            clientsView.style.display = 'block';
            renderClients();
        } else if (viewName === 'Respaldo' || viewName === 'Configuración') {
            settingsView.style.display = 'block';
            loadSettings();
        }

        // Update Sidebar Active state
        navLinks.forEach(li => {
            const text = li.querySelector('span').textContent;
            if (text === viewName || (viewName === 'Dashboard' && text === 'Panel')) {
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

    // Search functionality for repairs
    const repairsSearchInput = document.getElementById('repairs-search');
    if (repairsSearchInput) {
        repairsSearchInput.addEventListener('input', (e) => {
            renderRepairs(e.target.value);
        });
    }

    navLinks.forEach(li => {
        li.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = li.querySelector('span').textContent;
            switchView(viewName);
        });
    });

    document.getElementById('go-to-inventory').addEventListener('click', () => switchView('Inventario'));
    document.getElementById('quick-sale-btn').addEventListener('click', () => switchView('Nuevo Ingreso'));

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
        if (product.stock <= 0) {
            showToast('Sin stock disponible', 'error');
            return;
        }

        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            if (existing.qty < product.stock) {
                existing.qty++;
            } else {
                showToast('Límite de stock alcanzado');
            }
        } else {
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
        const subClient = document.getElementById('pos-sub-client').value || '';
        const vehiclePlate = document.getElementById('pos-vehicle-plate').value || '';
        const cartForTicket = [...cart];

        // Find client phone if registered
        const registeredClient = clients.find(c => c.name === selectedClientName);
        const clientPhone = registeredClient ? registeredClient.phone : '';

        const newSale = {
            id: `TRX-${Date.now()}`,
            customer: selectedClientName,
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
            const invProduct = inventory.find(p => p.id === cartItem.id);
            if (invProduct) invProduct.stock -= cartItem.qty;
        });

        // Store for printing
        lastFinishedSale = newSale;
        lastFinishedItems = cartForTicket;

        // Clear State
        cart = [];
        saveData();
        document.getElementById('pos-sub-client').value = '';
        document.getElementById('pos-vehicle-plate').value = '';
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
        document.getElementById('stat-total-products').textContent = inventory.length;
        document.getElementById('stat-low-stock').textContent = inventory.filter(p => p.stock <= 5).length;

        const today = new Date().toISOString().split('T')[0];
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

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><strong>${clientDisplay}</strong></td>
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
                </td>
            `;
            table.appendChild(tr);
        });

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
                        clients: XLSX.utils.sheet_to_json(workbook.Sheets["Clientes"])
                    };
                } else {
                    importedData = JSON.parse(event.target.result);
                }

                if (importedData.inventory && importedData.sales && importedData.clients) {
                    if (confirm('¿Reemplazar datos actuales con el archivo seleccionado?')) {
                        inventory = importedData.inventory;
                        sales = importedData.sales;
                        clients = importedData.clients;
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
        inventoryView.style.display = 'none';
        saleView.style.display = 'none';
        reportsView.style.display = 'none';
        clientsView.style.display = 'none';
        settingsView.style.display = 'none';

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
        li.addEventListener('click', () => {
            if (window.innerWidth <= 1024) toggleSidebar(false);
        });
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
