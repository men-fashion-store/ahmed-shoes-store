/* ================= CART CORE ================= */
window.cart = JSON.parse(localStorage.getItem('myCart')) || [];
window.currentProd = null;
window.selColorVar = null;
window.selSizeVar = null;

/* =============== ADD TO CART (مع دمج الكميات) =============== */
window.addToCart = function() {
    if(!window.selColorVar || !window.selSizeVar) {
        window.toast('من فضلك اختار اللون والمقاس', 'error');
        return;
    }
    
    const productId = window.currentProd.id;
    const color = window.selColorVar;
    const size = window.selSizeVar;
    
    // 1. نتأكد لو المنتج موجود أصلاً بنفس المواصفات
    const existingItemIndex = window.cart.findIndex(item => 
        item.id === productId && 
        item.color === color && 
        item.size === size
    );

    if (existingItemIndex > -1) {
        // لو موجود، زود العدد بس
        window.cart[existingItemIndex].qty += 1;
    } else {
        // لو جديد، ضيفه
        const item = {
            id: productId,
            productName: window.currentProd.name,
            price: parseInt(window.currentProd.price),
            image: window.currentProd.images[0],
            color: color,
            size: size,
            qty: 1
        };
        window.cart.push(item);
    }

    window.saveCart();
    window.updateCartBadge();
    window.renderCart(); // تحديث فوري للسلة لو مفتوحة
    window.toast('تمت الإضافة للسلة ✅');
    window.closeModal(); 
};

/* =============== RENDER CART (الشكل الكبير والتحكم) =============== */
window.renderCart = function() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    
    if(!window.cart.length) {
        container.innerHTML = `
            <div class="text-center py-10 opacity-50">
                <span class="text-6xl">🛒</span>
                <p class="font-bold mt-2">السلة فاضية</p>
            </div>`;
        if(totalEl) totalEl.innerText = '0 ج.م';
        return;
    }

    let total = 0;
    container.innerHTML = window.cart.map((item, idx) => {
        total += item.price * item.qty;
        
        return `
        <div class="flex gap-4 mb-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative group">
            <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-50 border">
                <img src="${item.image}" class="w-full h-full object-cover mix-blend-multiply">
            </div>
            
            <div class="flex-1 flex flex-col justify-between">
                <div>
                    <h4 class="font-bold text-gray-800 text-sm leading-tight mb-1">${item.productName}</h4>
                    <p class="text-xs text-gray-500 font-bold bg-gray-50 inline-block px-2 py-1 rounded">
                        ${item.color} | مقاس ${item.size}
                    </p>
                </div>
                
                <div class="flex items-center justify-between mt-2">
                    <p class="font-black text-[#4b5f28] text-lg">${item.price * item.qty} ج.م</p>
                    
                    <div class="flex items-center bg-gray-50 rounded-lg border border-gray-200 h-8">
                        <button onclick="window.updateQty(${idx}, -1)" class="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-red-500 font-bold transition rounded-r-lg">-</button>
                        <span class="w-8 text-center text-sm font-bold text-gray-700">${item.qty}</span>
                        <button onclick="window.updateQty(${idx}, 1)" class="w-8 h-full flex items-center justify-center text-white bg-[#4b5f28] hover:bg-[#3a4a1f] font-bold transition rounded-l-lg">+</button>
                    </div>
                </div>
            </div>

            <button onclick="window.delItem(${idx})" class="absolute top-2 left-2 text-gray-300 hover:text-red-500 p-1 transition">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        </div>`;
    }).join('');
    
    if(totalEl) totalEl.innerText = total + ' ج.م';
}

/* =============== ACTIONS =============== */
window.updateQty = function(idx, delta) {
    const item = window.cart[idx];
    item.qty += delta;
    
    if (item.qty <= 0) {
        // لو الكمية بقت صفر، نحذفه
        if(confirm('حذف المنتج من السلة؟')) {
            window.cart.splice(idx, 1);
        } else {
            item.qty = 1; // رجعه 1 لو العميل ألغى الحذف
        }
    }
    
    window.saveCart();
    window.renderCart();
    window.updateCartBadge();
};

window.delItem = function(i) {
    if(confirm('حذف المنتج؟')) {
        window.cart.splice(i, 1);
        window.saveCart();
        window.renderCart();
        window.updateCartBadge();
        window.toast('تم الحذف', 'success');
    }
};

window.saveCart = function() {
    localStorage.setItem('myCart', JSON.stringify(window.cart));
}

window.updateCartBadge = function() {
    const b = document.getElementById('cart-badge');
    // بنجمع الكميات مش بس عدد العناصر (عشان لو واخد 3 كوتشيات يبان 3)
    const count = window.cart.reduce((total, item) => total + item.qty, 0);
    
    if(count > 0) {
        b.innerText = count;
        b.classList.remove('hidden');
    } else {
        b.classList.add('hidden');
    }
}

window.openCart = function() {
    window.renderCart();
    document.getElementById('cart-modal').classList.remove('hidden');
    // Smart Fill للبيانات
    if(window.currentUser) {
        if(document.getElementById('cart-name')) document.getElementById('cart-name').value = window.currentUser.name || '';
        if(document.getElementById('cart-phone')) document.getElementById('cart-phone').value = window.currentUser.phone || '';
        if(document.getElementById('cart-address')) document.getElementById('cart-address').value = window.currentUser.address || '';
    }
}

window.closeCart = function() {
    document.getElementById('cart-modal').classList.add('hidden');
}

// تشغيل أولي
window.updateCartBadge();
