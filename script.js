// =======================================================
// === PickurItem Mini Commerce - script.js (FINAL REV.) ===
// =======================================================

// --- 1. DATA INITIALIZATION AND STORAGE ---
let users = JSON.parse(localStorage.getItem('users')) || [];
let allReviews = JSON.parse(localStorage.getItem('allReviews')) || {};

let products = [
    { id: 1, name: "Tote Bag Kanvas", price: 150000, category: "fashion", desc: "Tote bag kanvas berkualitas tinggi, cocok untuk kuliah dan kerja.", img: "https://tse1.mm.bing.net/th/id/OIP.afQoTBIuA2sHKHWtIzwNfAHaHa?pid=Api&P=0&h=180" },
    { id: 2, name: "Mug Custom Desain", price: 55000, category: "aksesori", desc: "Mug keramik yang bisa dicetak dengan desain, foto, atau logo sendiri.", img: "https://m.media-amazon.com/images/I/71jOQcpz0dL._AC_.jpg" },
    { id: 3, name: "Gelang Tali Handmade", price: 25000, category: "aksesori", desc: "Aksesori gelang tali unik, dibuat 100% secara handmade.", img: "https://down-id.img.susercontent.com/file/82cd48a06d1d59f0493e4d2dd8a221d3" },
    { id: 4, name: "Kaos Polo Kustom", price: 195000, category: "fashion", desc: "Kaos polo dengan bordir kustom, bahan nyaman dan adem.", img: "https://s.kaskus.id/images/2023/05/23/11076539_202305231119430768.jpg" },
    { id: 5, name: "Notebook Kulit", price: 85000, category: "lainnya", desc: "Notebook cover kulit premium untuk mencatat ide kreatif.", img: "https://www.beedigitalk.web.id/wp-content/uploads/2023/08/blocknote-map-kulit.jpg" },
    { id: 6, name: "Alat Pahat Mini", price: 120000, category: "perkakas", desc: "Set alat pahat mini, cocok untuk kerajinan kayu kecil.", img: "https://down-id.img.susercontent.com/file/eced28e974a1e45d9f5bad9212106824" },
];

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let loggedUser = JSON.parse(localStorage.getItem('loggedUser'));

// Fungsi penyimpanan data ke Local Storage
function saveUsers() { localStorage.setItem('users', JSON.stringify(users)); }
function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function saveOrders() { localStorage.setItem('orders', JSON.stringify(orders)); }
function saveLoggedUser(user) { localStorage.setItem('loggedUser', JSON.stringify(user)); loggedUser = user; }
function saveReviews() { localStorage.setItem('allReviews', JSON.stringify(allReviews)); }


// --- 2. UTILITY & FITUR WAJIB (TOAST & SKELETON) ---

function formatRupiah(number) {
    return 'Rp ' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// FITUR WAJIB: TOAST ALERT
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toastEl = document.createElement('div');
    toastEl.classList.add('toast', type);
    toastEl.textContent = message;
    
    container.appendChild(toastEl);
    
    // Tampilkan
    setTimeout(() => {
        toastEl.classList.add('show');
    }, 100);
    
    // Hilangkan
    setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => {
            container.removeChild(toastEl);
        }, 500); // Tunggu transisi selesai
    }, 3000);
}

// FITUR WAJIB: LOADING SKELETON
function simulateLoading() {
    const productListEl = document.getElementById('productList');
    let skeletonHTML = '';
    
    for (let i = 0; i < 4; i++) {
        skeletonHTML += `
            <div class="skeleton-product">
                <div class="skeleton-box skeleton-img"></div>
                <div class="skeleton-box skeleton-text-lg"></div>
                <div class="skeleton-box skeleton-text-sm"></div>
            </div>
        `;
    }
    productListEl.innerHTML = skeletonHTML;
}
function hideLoading() {
    // Dipanggil saat renderProducts selesai
}


// --- 3. AUTHENTICATION ---
function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const pass2 = document.getElementById('regPass2').value;
    const errorEl = document.getElementById('regError');
    const successEl = document.getElementById('regSuccess');

    errorEl.textContent = '';
    successEl.textContent = '';

    if (!name || !email || pass.length < 6 || pass !== pass2) {
        errorEl.textContent = 'Data tidak valid. Pastikan semua kolom terisi, password minimal 6 karakter, dan cocok.';
        return;
    }

    if (users.some(user => user.email === email)) {
        errorEl.textContent = 'Email sudah terdaftar.';
        return;
    }

    const newUser = { id: Date.now(), name, email, pass, orders: [] };
    users.push(newUser);
    saveUsers();

    successEl.textContent = 'Pendaftaran berhasil! Silakan Login.';
    document.getElementById('regName').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPass').value = '';
    document.getElementById('regPass2').value = '';
    
    showToast('Pendaftaran berhasil! Silakan Login.', 'success');
    setTimeout(() => goto('loginPage'), 1500); 
}

function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const errorEl = document.getElementById('loginError');

    errorEl.textContent = '';

    const user = users.find(u => u.email === email && u.pass === pass);

    if (user) {
        saveLoggedUser(user);
        showToast(`Selamat datang kembali, ${user.name}!`, 'success');
        goto('homePage');
    } else {
        errorEl.textContent = 'Email atau password salah. Pastikan Anda sudah mendaftar.';
        showToast('Login gagal. Cek kembali data Anda.', 'error');
    }
}

function logout() {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('cart');
    loggedUser = null;
    cart = [];
    updateCartCount();
    showToast('Anda telah logout.', 'info');
    goto('loginPage'); 
}

// --- 4. PRODUCT RENDERING (FITUR WAJIB: FILTER, SEARCH, SORT) ---

function getProductById(id) {
    return products.find(p => p.id === id);
}

function renderProducts() {
    // 1. Ambil kriteria filter dari UI
    const keyword = document.getElementById('searchKeyword').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const sort = document.getElementById('sortOrder').value;

    // 2. Filter dan Cari
    let filteredProducts = products.filter(p => {
        const matchesCategory = category === 'all' || p.category === category;
        const matchesKeyword = p.name.toLowerCase().includes(keyword) || p.desc.toLowerCase().includes(keyword);
        return matchesCategory && matchesKeyword;
    });

    // 3. Sorting
    filteredProducts.sort((a, b) => {
        if (sort === 'price_asc') return a.price - b.price;
        if (sort === 'price_desc') return b.price - a.price;
        // Default: sort by ID (terbaru)
        return a.id - b.id;
    });

    // 4. Render ke UI
    const productListEl = document.getElementById('productList');
    
    if (filteredProducts.length === 0) {
        productListEl.innerHTML = '<p style="text-align:center; margin-top: 30px; color: white;">Produk tidak ditemukan.</p>';
        return;
    }
    
    productListEl.innerHTML = filteredProducts.map(p => {
        const reviewData = allReviews[p.id] || [];
        const averageRating = reviewData.length > 0 ? (reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length).toFixed(1) : 'N/A';

        return `
            <div class="product" onclick="viewDetail(${p.id})">
                <img src="${p.img}" alt="${p.name}">
                <h3>${p.name}</h3>
                <p>${formatRupiah(p.price)}</p>
                <div style="font-size: 0.9rem; margin-bottom: 10px; color: ${reviewData.length > 0 ? 'gold' : '#999'}">
                    ⭐️ ${averageRating} (${reviewData.length} ulasan)
                </div>
                <button onclick="event.stopPropagation(); addToCart(${p.id}, 1)">+ Keranjang</button>
            </div>
        `;
    }).join('');
    
    hideLoading(); // Hilangkan skeleton setelah render
}

function viewDetail(id) {
    const product = getProductById(id);
    if (!product) return;

    document.getElementById('detailName').textContent = product.name;
    document.getElementById('detailImg').src = product.img;
    document.getElementById('detailPrice').textContent = formatRupiah(product.price);
    document.getElementById('detailDesc').textContent = product.desc;
    document.getElementById('quantityInput').value = 1;
    
    document.getElementById('detailPage').dataset.currentProductId = id;

    renderReviews(id); // FITUR WAJIB: Render ulasan
    goto('detailPage'); 
}

function addCartFromDetail() {
    const productId = parseInt(document.getElementById('detailPage').dataset.currentProductId);
    const quantity = parseInt(document.getElementById('quantityInput').value);
    
    if (productId && quantity > 0) {
        addToCart(productId, quantity);
        showToast(`${quantity}x Item ditambahkan.`, 'success');
    }
}


// --- 5. FITUR WAJIB: REVIEW MANAGEMENT ---

function renderReviews(productId) {
    const reviewListEl = document.getElementById('reviewList');
    const reviewCountEl = document.getElementById('reviewCount');
    const productReviews = allReviews[productId] || [];
    
    reviewCountEl.textContent = productReviews.length;

    if (productReviews.length === 0) {
        reviewListEl.innerHTML = '<p>Belum ada ulasan untuk produk ini.</p>';
        return;
    }

    const reviewsHTML = productReviews.map(review => `
        <div style="border: 1px solid #eee; padding: 10px; margin-bottom: 10px; border-radius: 8px; background: #f9f9f9;">
            <p style="margin: 0 0 5px; font-weight: 600; color: var(--navy-dark);">${review.userName} (${review.date})</p>
            <p style="margin: 0 0 5px; color: gold;">⭐️ ${review.rating} / 5</p>
            <p style="margin: 0; font-style: italic;">"${review.text}"</p>
        </div>
    `).join('');

    reviewListEl.innerHTML = reviewsHTML;
}

function addReview() {
    if (!loggedUser) {
        showToast('Anda harus Login untuk memberikan ulasan.', 'error');
        return;
    }
    
    const productId = parseInt(document.getElementById('detailPage').dataset.currentProductId);
    const reviewText = document.getElementById('reviewText').value.trim();
    const errorEl = document.getElementById('reviewError');

    errorEl.textContent = '';
    
    // Simulasikan rating 5 (bisa dikembangkan menjadi input radio button)
    const rating = 5; 

    if (reviewText.length < 10) {
        errorEl.textContent = 'Ulasan minimal 10 karakter.';
        return;
    }

    const newReview = {
        userName: loggedUser.name,
        text: reviewText,
        rating: rating,
        date: new Date().toLocaleDateString('id-ID')
    };

    // Inisialisasi array jika belum ada
    if (!allReviews[productId]) {
        allReviews[productId] = [];
    }
    
    allReviews[productId].push(newReview);
    saveReviews();

    document.getElementById('reviewText').value = '';
    showToast('Ulasan Anda berhasil ditambahkan!', 'success');
    renderReviews(productId);
}


// --- 6. CART, CHECKOUT, ORDER (Sama seperti revisi sebelumnya) ---
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.qty, 0);
    const cartButton = document.getElementById('headerCartButton');
    if (cartButton) {
        cartButton.textContent = `Keranjang (${count})`;
    }
}

function addToCart(productId, quantity) {
    const product = getProductById(productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.qty += quantity;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            qty: quantity
        });
    }

    saveCart();
    updateCartCount();
    showToast(`${quantity}x ${product.name} ditambahkan ke keranjang.`, 'success');
}

function renderCart() {
    const cartListEl = document.getElementById('cartList');
    const cartTotalEl = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartListEl.innerHTML = '<p style="text-align:center;">Keranjang Anda kosong.</p>';
        cartTotalEl.textContent = 'Total: Rp 0';
        return;
    }

    let total = 0;
    const cartHTML = cart.map(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        return `
            <div class="cart-item">
                <div style="flex-grow: 1;">
                    <p style="margin: 0; font-weight: 600;">${item.name}</p>
                    <p style="margin: 0; font-size: 0.9rem;">${formatRupiah(item.price)} x ${item.qty} = ${formatRupiah(itemTotal)}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-qty-actions" style="display:flex; gap: 5px; margin-right: 10px;">
                        <button onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="secondary" onclick="removeItem(${item.id})" style="background: var(--error-color);">Hapus</button>
                </div>
            </div>
        `;
    }).join('');

    cartListEl.innerHTML = cartHTML;
    cartTotalEl.textContent = `Total: ${formatRupiah(total)}`;
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        saveCart();
        updateCartCount();
        renderCart();
    }
}

function removeItem(productId) {
    const item = cart.find(i => i.id === productId);
    if (confirm(`Yakin ingin menghapus ${item.name} dari keranjang?`)) {
        cart = cart.filter(i => i.id !== productId);
        saveCart();
        updateCartCount();
        renderCart();
        showToast('Item berhasil dihapus.', 'info');
    }
}

let selectedPaymentMethod = 'transfer';

function selectPayment(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.payment-option input[value="${method}"]`).parentElement.classList.add('selected');
}

function calculateTotal() {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
}

function updateCheckout() {
    const total = calculateTotal();
    document.getElementById('checkoutTotal').textContent = formatRupiah(total);
    
    if (cart.length === 0) {
        showToast("Keranjang kosong. Tidak bisa checkout.", 'error');
        goto('homePage');
    }
}

function finishOrder() {
    const alamat = document.getElementById('alamat').value;
    const errorEl = document.getElementById('checkoutError');
    errorEl.textContent = '';

    if (cart.length === 0) {
        errorEl.textContent = 'Keranjang Anda kosong.';
        return;
    }
    if (!alamat || alamat.length < 10) {
        errorEl.textContent = 'Mohon isi alamat pengiriman lengkap.';
        return;
    }
    
    const total = calculateTotal();
    
    const newOrder = {
        id: Date.now(),
        userId: loggedUser.id,
        userName: loggedUser.name,
        items: cart,
        total: total,
        alamat: alamat,
        paymentMethod: selectedPaymentMethod,
        date: new Date().toLocaleDateString('id-ID'),
        status: 'Menunggu Pembayaran'
    };
    
    orders.push(newOrder);
    saveOrders();
    
    cart = [];
    saveCart();
    updateCartCount();
    
    document.getElementById('confirmUserName').textContent = loggedUser.name;
    document.getElementById('confirmOrderId').textContent = newOrder.id;
    document.getElementById('confirmTotal').textContent = formatRupiah(newOrder.total);
    document.getElementById('confirmPaymentMethod').textContent = 
        newOrder.paymentMethod === 'transfer' ? 'Transfer Bank' : 
        newOrder.paymentMethod === 'gopay' ? 'E-Wallet' : 'COD (Bayar di Tempat)';

    let instructions = '';
    if (newOrder.paymentMethod === 'transfer') {
        instructions = 'Silakan transfer total pembayaran ke Rekening BCA 1234567890 atas nama PickurItem sebelum 24 jam.';
    } else if (newOrder.paymentMethod === 'gopay') {
        instructions = 'Instruksi pembayaran E-Wallet akan dikirimkan melalui email/notifikasi aplikasi.';
    } else {
        instructions = 'Pembayaran COD: Siapkan uang tunai sejumlah total belanja Anda saat pesanan tiba.';
    }
    document.getElementById('confirmInstructions').textContent = instructions;
    
    showToast('Pesanan berhasil dibuat!', 'success');
    goto('orderConfirmationPage'); 
}

function renderOrderHistory() {
    const orderListEl = document.getElementById('orderList');
    const noOrderMessageEl = document.getElementById('noOrderMessage');
    
    if (!loggedUser) {
        orderListEl.innerHTML = '';
        noOrderMessageEl.style.display = 'block';
        return;
    }
    
    const userOrders = orders.filter(o => o.userId === loggedUser.id).reverse();

    if (userOrders.length === 0) {
        orderListEl.innerHTML = '';
        noOrderMessageEl.style.display = 'block';
        return;
    }

    noOrderMessageEl.style.display = 'none';

    const historyHTML = userOrders.map(order => `
        <div class="order-item" style="background: var(--card-background); color: #333; padding: 15px; margin: 15px 0; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p style="font-weight: 700; color: var(--navy-dark);">Order ID: #${order.id}</p>
            <p>Tanggal: ${order.date}</p>
            <p>Total: <b style="color: var(--error-color);">${formatRupiah(order.total)}</b></p>
            <p>Status: 
                <span style="font-weight: 700; color: ${order.status === 'Menunggu Pembayaran' ? 'orange' : 'green'};">
                    ${order.status}
                </span>
            </p>
            <details>
                <summary style="font-weight: 600; cursor: pointer; color: var(--primary-color);">Lihat Detail Item</summary>
                <ul style="list-style: none; padding: 0;">
                    ${order.items.map(item => `
                        <li style="border-bottom: 1px dashed #ddd; padding: 5px 0; font-size: 0.9rem;">
                            ${item.qty}x ${item.name} (${formatRupiah(item.price)})
                        </li>
                    `).join('')}
                </ul>
            </details>
        </div>
    `).join('');

    orderListEl.innerHTML = historyHTML;
}