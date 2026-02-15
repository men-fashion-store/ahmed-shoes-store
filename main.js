import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyASO-AN5XaSGn4SaCZ8VlHr6zsFCIxPCzs",
    authDomain: "ahmed-shoes.firebaseapp.com",
    projectId: "ahmed-shoes",
    storageBucket: "ahmed-shoes.firebasestorage.app",
    messagingSenderId: "172928088473",
    appId: "1:172928088473:web:100f543fd097a8d5c33b08",
    measurementId: "G-S50TX0VMKE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. حالة التطبيق (State Management)
let state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('myCart')) || [],
    currentProduct: null,
    selection: { color: null, size: null }
};

// 3. دوال جلب البيانات (Fetching Data)
async function fetchProducts() {
    try {
        const q = query(collection(db, "products"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        state.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return state.products;
    } catch (error) {
        console.error("Error fetching products:", error);
        showToast("تأكد من الاتصال بالإنترنت", "error");
        return [];
    }
}

// 4. دوال العرض (Rendering UI)
window.loadProducts = async (category) => {
    document.getElementById('home-view').classList.add('hidden');
    document.getElementById('products-view').classList.remove('hidden');
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('grid-container').innerHTML = '';
    document.getElementById('page-title').innerText = category;
    
    // تأكد إن الداتا جات مرة واحدة بس
    if (state.products.length === 0) await fetchProducts();

    const filtered = state.products.filter(p => p.category === category);
    document.getElementById('loader').classList.add('hidden');
    
    if (filtered.length === 0) {
        document.getElementById('empty-state').classList.remove('hidden');
        return;
    }
    
    document.getElementById('empty-state').classList.add('hidden');
    const container = document.getElementById('grid-container');
    
    container.innerHTML = filtered.map(product => `
        <div onclick="openProductModal('${product.id}')" class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 group">
            <div class="h-48 overflow-hidden bg-gray-50 relative">
                <img src="${product.images[0]}" class="w-full h-full object-cover mix-blend-multiply transition duration-700 group-hover:scale-110">
                <div class="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-[#4b5f28] shadow-sm">
                    ${product.price} ج.م
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-gray-800 truncate">${product.name}</h3>
                <p class="text-xs text-gray-400 mt-1">اضغط للتفاصيل</p>
            </div>
        </div>
    `).join('');
};

window.renderHome = () => {
    document.getElementById('products-view').classList.add('hidden');
    document.getElementById('home-view').classList.remove('hidden');
    window.scrollTo({top: 0, behavior: 'smooth'});
};

// 5. منطق المنتج والمودال (Product Logic)
window.openProductModal = (id) => {
    const product = state.products.find(p => p.id === id);
    if(!product) return;
    
    state.currentProduct = product;
    state.selection = { color: null, size: null };
    
    document.getElementById('modal-name').innerText = product.name;
    document.getElementById('modal-price').innerText = product.price + ' ج.م';
    document.getElementById('modal-img').src = product.images[0];
    
    // رسم الألوان
    const colorsContainer = document.getElementById('modal-colors');
    if (product.colors && product.colors.length > 0) {
        colorsContainer.innerHTML = product.colors.map(c => 
            `<button onclick="selectColor('${c.name}', this)" class="color-btn px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-[#4b5f28] transition">${c.name}</button>`
        ).join('');
    } else {
        colorsContainer.innerHTML = '<span class="text-xs text-gray-400">لون موحد</span>';
        state.selection.color = 'افتراضي';
        renderSizes(product.sizes || []);
    }

    document.getElementById('modal-sizes').innerHTML = '<span class="text-xs text-gray-400">اختر اللون أولاً</span>';
    
    const modal = document.getElementById('product-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('modal-content').classList.remove('translate-y-full');
    }, 10);
};

window.selectColor = (colorName, btn) => {
    document.querySelectorAll('.color-btn').forEach(b => {
        b.classList.remove('bg-[#4b5f28]', 'text-white');
        b.classList.add('bg-white', 'text-gray-800');
    });
    btn.classList.remove('bg-white', 'text-gray-800');
    btn.classList.add('bg-[#4b5f28]', 'text-white');
    
    state.selection.color = colorName;
    const colorObj = state.currentProduct.colors.find(c => c.name === colorName);
    renderSizes(colorObj ? colorObj.sizes : []);
};

function renderSizes(sizes) {
    const container = document.getElementById('modal-sizes');
    container.innerHTML = sizes.map(s => 
        `<button onclick="selectSize('${s}', this)" class="size-btn w-10 h-10 rounded-lg bg-gray-50 font-bold text-gray-600 hover:bg-[#4b5f28] hover:text-white transition shadow-sm">${s}</button>`
    ).join('');
}

window.selectSize = (size, btn) => {
    document.querySelectorAll('.size-btn').forEach(b => {
        b.classList.remove('bg-[#4b5f28]', 'text-white');
        b.classList.add('bg-gray-50', 'text-gray-600');
    });
    btn.classList.remove('bg-gray-50', 'text-gray-600');
    btn.classList.add('bg-[#4b5f28]', 'text-white');
    state.selection.size = size;
};

window.closeModal = () => {
    document.getElementById('modal-content').classList.add('translate-y-full');
    setTimeout(() => {
        document.getElementById('product-modal').classList.add('hidden');
    }, 300);
};

// 6. منطق السلة (Cart Logic)
window.addToCartLogic = () => {
    if(!state.selection.color || !state.selection.size) {
        showToast('يرجى اختيار اللون والمقاس', 'error');
        return;
    }
    
    state.cart.push({
        ...state.currentProduct,
        selectedColor: state.selection.color,
        selectedSize: state.selection.size,
        qty: 1
    });
    
    updateCartUI();
    closeModal();
    showToast('تمت الإضافة للسلة بنجاح', 'success');
};

function updateCartUI() {
    localStorage.setItem('myCart', JSON.stringify(state.cart));
    
    // Update Badge
    const badge = document.getElementById('cart-badge');
    badge.innerText = state.cart.length;
    badge.style.transform = state.cart.length > 0 ? 'scale(1)' : 'scale(0)';
    
    // Render Items
    const container = document.getElementById('cart-items-container');
    let total = 0;
    
    container.innerHTML = state.cart.map((item, index) => {
        total += parseInt(item.price);
        return `
        <div class="flex gap-4 mb-4 bg-white p-2 rounded-xl border border-gray-100">
            <img src="${item.images[0]}" class="w-20 h-20 rounded-lg object-cover bg-gray-50">
            <div class="flex-1">
                <h4 class="font-bold text-sm text-gray-800">${item.name}</h4>
                <p class="text-xs text-gray-500 mt-1">اللون: ${item.selectedColor} | مقاس: ${item.selectedSize}</p>
                <div class="flex justify-between items-center mt-2">
                    <span class="font-bold text-[#4b5f28]">${item.price} ج.م</span>
                    <button onclick="removeItem(${index})" class="text-red-500 text-xs font-bold px-2 py-1 bg-red-50 rounded">حذف</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    if(state.cart.length === 0) container.innerHTML = '<p class="text-center text-gray-400 py-10">السلة فارغة</p>';
    document.getElementById('cart-total').innerText = total + ' ج.م';
}

window.removeItem = (index) => {
    state.cart.splice(index, 1);
    updateCartUI();
};

window.openCart = () => {
    document.getElementById('cart-modal').classList.remove('hidden');
    updateCartUI();
    setTimeout(() => {
        document.getElementById('cart-content').classList.remove('translate-x-full');
    }, 10);
};

window.closeCart = () => {
    document.getElementById('cart-content').classList.add('translate-x-full');
    setTimeout(() => {
        document.getElementById('cart-modal').classList.add('hidden');
    }, 300);
};

window.checkout = async () => {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;
    
    if(!name || !phone || !address || state.cart.length === 0) {
        showToast('يرجى إكمال البيانات وملء السلة', 'error');
        return;
    }
    
    const orderData = {
        customer: { name, phone, address },
        items: state.cart,
        total: state.cart.reduce((sum, item) => sum + parseInt(item.price), 0),
        timestamp: Date.now()
    };
    
    // Save to Firebase for Admin
    try {
        await addDoc(collection(db, "orders"), orderData);
    } catch(e) { console.log("Offline mode or error saving order", e); }

    // Send to WhatsApp
    const msgItems = state.cart.map((i, idx) => `${idx+1}. ${i.name} (${i.selectedColor}/${i.selectedSize}) - ${i.price} ج.م`).join('%0a');
    const msg = `*طلب جديد من الموقع*%0a------------------%0a${msgItems}%0a------------------%0a*الإجمالي: ${orderData.total} ج.م*%0a%0aالاسم: ${name}%0aالعنوان: ${address}%0aالهاتف: ${phone}`;
    
    window.open(`https://wa.me/201020468021?text=${msg}`, '_blank');
    
    // Clear Cart
    state.cart = [];
    updateCartUI();
    closeCart();
    showToast('تم إرسال الطلب بنجاح', 'success');
};

function showToast(msg, type) {
    const t = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `mb-2 px-6 py-3 rounded-full text-white font-bold shadow-lg transform transition-all duration-300 translate-y-10 opacity-0 ${type === 'error' ? 'bg-red-500' : 'bg-[#4b5f28]'}`;
    el.innerText = msg;
    t.appendChild(el);
    
    requestAnimationFrame(() => {
        el.classList.remove('translate-y-10', 'opacity-0');
    });
    
    setTimeout(() => {
        el.classList.add('opacity-0', 'translate-y-10');
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// تهيئة أولية
updateCartUI();
