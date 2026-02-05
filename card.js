/* ================= CART CORE (FINAL) ================= */
window.cart = [];
try {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]');
    window.cart = Array.isArray(raw) ? raw : [];
} catch(e) { window.cart = []; }

function saveCart() {
    try {
        localStorage.setItem('cart', JSON.stringify(window.cart));
    } catch(e) {}
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if(!badge) return;
    const count = window.cart.reduce((s, i) => s + (parseInt(i.qty) || 1), 0);
    badge.textContent = count;
    if(count === 0) {
        badge.classList.add('hidden');
    } else {
        badge.classList.remove('hidden');
        badge.classList.add('flex');
    }
}

/* =============== ADD TO CART ================= */
window.addToCart = function() {
    if(!window.currentSize) {
        showToast('اختر المقاس أولاً', 'error');
        return;
    }
    
    const color = window.currentColor || 'افتراضي';
    const price = parseInt(window.currentProd.price) || 0;
    
    // البحث عن منتج مطابق
    const existingIdx = window.cart.findIndex(i => 
        i.productId === window.currentProd.id && 
        i.size === window.currentSize && 
        i.color === color
    );
    
    if(existingIdx > -1) {
        window.cart[existingIdx].qty = (parseInt(window.cart[existingIdx].qty) || 0) + 1;
    } else {
        window.cart.push({
            productId: window.currentProd.id,
            productName: window.currentProd.name,
            price: price,
            color: color,
            size: window.currentSize,
            image: (window.currentProd.images || [])[0],
            qty: 1
        });
    }
    
    saveCart();
    updateCartBadge();
    renderCart(); // إعادة رسم السلة فوراً
    showToast('تمت الإضافة للسلة ✓', 'success');
    closeModal();
};

/* =============== RENDER CART ================= */
function renderCart() {
    const wrap = document.getElementById('cart-items');
    const empty = document.getElementById('cart-empty');
    
    if(!wrap) return;
    
    if(!window.cart.length) {
        wrap.innerHTML = '';
        empty?.classList.remove('hidden');
        const totalEl = document.getElementById('cart-total-confirm');
        if(totalEl) totalEl.innerText = '0 ج.م';
        return;
    }
    
    empty?.classList.add('hidden');
    
    // حساب المجموع الكلي
    let total = 0;
    
    wrap.innerHTML = window.cart.map((item, idx) => {
        const itemPrice = parseInt(item.price) || 0;
        const itemQty = parseInt(item.qty) || 1;
        const itemTotal = itemPrice * itemQty;
        total += itemTotal;
        
        return `
            <div class="cart-item-big relative group rounded-xl mb-3 border border-gray-100 shadow-sm">
                <img src="${item.image || 'https://via.placeholder.com/150'}" class="w-32 h-32 rounded-xl object-cover shadow-sm bg-gray-100 shrink-0" onerror="this.src='https://via.placeholder.com/150'">
                
                <div class="flex-1 min-w-0 flex flex-col justify-between py-1 h-full gap-2">
                    <div>
                        <p class="font-black text-xl text-gray-800 truncate leading-tight">${item.productName}</p>
                        <p class="text-base text-gray-500 font-bold mt-1">
                           ${item.color} | مقاس <span class="text-brand bg-brand/10 px-1 rounded">${item.size}</span>
                        </p>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <p class="text-brand font-black text-2xl">${itemTotal} <span class="text-sm text-gray-400">ج.م</span></p>
                        
                        <div class="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1 border border-gray-200">
                            <button onclick="updateCartQty(${idx}, -1)" class="cart-qty-btn hover:bg-red-100 hover:text-red-500 hover:border-red-200">−</button>
                            <span class="text-xl font-black w-6 text-center text-gray-700">${itemQty}</span>
                            <button onclick="updateCartQty(${idx}, 1)" class="cart-qty-btn bg-brand text-white hover:bg-brand-accent hover:text-white border-transparent shadow-md">+</button>
                        </div>
                    </div>
                </div>

                <button onclick="removeFromCart(${idx})" class="absolute top-2 left-2 text-gray-300 hover:text-red-500 p-2 bg-white/80 rounded-full hover:bg-red-50 transition">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `;
    }).join('');
    
    const totalEl = document.getElementById('cart-total-confirm');
    if(totalEl) totalEl.innerText = total + ' ج.م';
}

/* =============== ACTIONS ================= */
window.updateCartQty = function(idx, delta) {
    if(!window.cart[idx]) return;
    
    let newQty = (parseInt(window.cart[idx].qty) || 0) + delta;
    
    if(newQty < 1) {
        window.cart.splice(idx, 1);
    } else {
        window.cart[idx].qty = newQty;
    }
    
    saveCart();
    renderCart();
    updateCartBadge();
    showToast('تم تحديث الكمية', 'success');
};

window.removeFromCart = function(idx) {
    window.cart.splice(idx, 1);
    saveCart();
    renderCart();
    updateCartBadge();
    showToast('تم الحذف من السلة', 'success');
};

window.clearCart = function() {
    if(!confirm('هل تريد مسح كل المنتجات من السلة؟')) return;
    window.cart = [];
    saveCart();
    renderCart();
    updateCartBadge();
    showToast('تم تفريغ السلة', 'success');
};

/* =============== OPEN/CLOSE CART ================= */
window.openCart = function() {
    renderCart(); // تأكيد إعادة الرسم عند الفتح
    updateCartBadge(); // تحديث العداد
    document.getElementById('cart-modal').classList.remove('hidden');
};

window.closeCart = function() {
    document.getElementById('cart-modal').classList.add('hidden');
};

/* =============== TOAST HELPER ================= */
function showToast(msg, type='success') {
    const c = document.getElementById('toast-container');
    if(!c) return;
    
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    
    setTimeout(() => {
        if(t.parentNode === c) c.removeChild(t);
    }, 3000);
}

// تهيئة السلة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    updateCartBadge();
    renderCart();
});
