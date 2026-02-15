// --- تعريف متغيرات السلة ---
window.cart = JSON.parse(localStorage.getItem('myCart')) || [];
window.currentProd = null;
window.selColorVar = null;
window.selSizeVar = null;

// --- إضافة للسلة ---
window.addToCart = function() {
    if(!window.selColorVar || !window.selSizeVar) {
        window.toast('يرجى اختيار اللون والمقاس', 'error');
        return;
    }
    
    const item = {
        id: window.currentProd.id,
        productName: window.currentProd.name,
        price: parseInt(window.currentProd.price),
        image: window.currentProd.images[0],
        color: window.selColorVar,
        size: window.selSizeVar,
        qty: 1
    };

    window.cart.push(item);
    window.saveCart();
    window.updateCartBadge();
    window.renderCart();
    
    window.toast('تمت الإضافة للسلة ✅');
    
    // إغلاق المودال فوراً كما طلبت
    window.closeModal(); 
};

// --- دوال مساعدة ---
window.saveCart = function() {
    localStorage.setItem('myCart', JSON.stringify(window.cart));
}

window.updateCartBadge = function() {
    const b = document.getElementById('cart-badge');
    if(window.cart.length > 0) {
        b.innerText = window.cart.length;
        b.classList.remove('hidden');
    } else {
        b.classList.add('hidden');
    }
}

window.renderCart = function() {
    const div = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    
    if(!window.cart.length) {
        div.innerHTML = '<p class="text-center text-gray-400 py-10">السلة فارغة</p>';
        if(totalEl) totalEl.innerText = '0 ج.م';
        return;
    }

    let total = 0;
    div.innerHTML = window.cart.map((i, idx) => {
        total += i.price * i.qty;
        return `<div class="flex gap-3 mb-3 bg-white p-2 rounded-lg border relative">
            <img src="${i.image}" class="w-16 h-16 rounded object-cover">
            <div>
                <p class="font-bold text-sm">${i.productName}</p>
                <p class="text-xs text-gray-500">${i.color} | ${i.size}</p>
                <p class="font-black text-[#4b5f28]">${i.price} ج.م</p>
            </div>
            <button onclick="window.delItem(${idx})" class="absolute top-2 left-2 text-red-500 text-xs font-bold border px-2 rounded">حذف</button>
        </div>`;
    }).join('');
    
    if(totalEl) totalEl.innerText = total + ' ج.م';
}

window.delItem = function(i) {
    window.cart.splice(i, 1);
    window.saveCart();
    window.renderCart();
    window.updateCartBadge();
}

window.openCart = function() {
    window.renderCart();
    document.getElementById('cart-modal').classList.remove('hidden');
}

window.closeCart = function() {
    document.getElementById('cart-modal').classList.add('hidden');
}

// تهيئة أولية
window.updateCartBadge();
