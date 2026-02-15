import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, addDoc, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyASO-AN5XaSGn4SaCZ8VlHr6zsFCIxPCzs",
    authDomain: "ahmed-shoes.firebaseapp.com",
    projectId: "ahmed-shoes",
    storageBucket: "ahmed-shoes.firebasestorage.app",
    messagingSenderId: "172928088473",
    appId: "1:172928088473:web:100f543fd097a8d5c33b08",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    user: null,
    profile: null,
    currentProduct: null,
    selection: { color: null, size: null },
    tempSignupData: null, // لتخزين البيانات مؤقتاً لحد ما يأكد الكود
    otpCode: null         // الكود العشوائي
};

// --- AUTH SYSTEM ---

onAuthStateChanged(auth, async (user) => {
    const overlay = document.getElementById('auth-overlay');
    const app = document.getElementById('main-app');

    if (user) {
        state.user = user;
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
            state.profile = docSnap.data();
            document.getElementById('nav-user-name').innerText = state.profile.name.split(' ')[0];
            
            // Open Gate
            overlay.classList.add('opacity-0', 'pointer-events-none');
            app.classList.remove('filter', 'blur-md', 'pointer-events-none');
        }
    } else {
        // Close Gate
        state.user = null;
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        app.classList.add('filter', 'blur-md', 'pointer-events-none');
    }
});

// --- Tabs Switching ---
window.switchAuth = (tab) => {
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
    
    const active = ['bg-white', 'shadow', 'text-[#4b5f28]'];
    const inactive = ['text-gray-500'];
    
    if(tab==='login') {
        document.getElementById('btn-tab-login').classList.add(...active);
        document.getElementById('btn-tab-login').classList.remove(...inactive);
        document.getElementById('btn-tab-signup').classList.remove(...active);
    } else {
        document.getElementById('btn-tab-signup').classList.add(...active);
        document.getElementById('btn-tab-signup').classList.remove(...inactive);
        document.getElementById('btn-tab-login').classList.remove(...active);
    }
};

// --- OTP Logic (The Magic) ---

window.handleSignupInitiate = (e) => {
    e.preventDefault();
    const name = document.getElementById('s-name').value;
    const phone = document.getElementById('s-phone').value;
    const address = document.getElementById('s-address').value;
    const email = document.getElementById('s-email').value;
    const pass = document.getElementById('s-pass').value;

    if(email && email.trim() !== "") {
        // لو كتب إيميل -> تسجيل عادي
        registerWithEmail(name, phone, address, email, pass);
    } else {
        // لو مكتبش إيميل -> شغل الـ OTP
        state.tempSignupData = { name, phone, address, pass };
        // 1. توليد كود عشوائي من 4 أرقام
        state.otpCode = Math.floor(1000 + Math.random() * 9000);
        
        // 2. إظهار شاشة الـ OTP
        document.getElementById('signup-form').classList.add('hidden');
        document.getElementById('otp-screen').classList.remove('hidden');
        document.getElementById('otp-phone-display').innerText = phone;
        
        // 3. محاكاة إرسال الرسالة (في الحقيقة بتحتاج خدمة مدفوعة)
        // هنا هنظهرها في Alert عشان التجربة
        setTimeout(() => {
            alert(`💬 رسالة من أحمد الشيخ:\nرمز التحقق الخاص بك هو: ${state.otpCode}`);
        }, 1000);
    }
};

window.verifyOTP = async () => {
    const inputCode = document.getElementById('otp-code-input').value;
    
    if(parseInt(inputCode) === state.otpCode) {
        // الكود صح -> سجل الحساب فوراً
        const d = state.tempSignupData;
        // بنعمل إيميل وهمي بالرقم عشان Firebase يقبله
        const fakeEmail = `${d.phone}@ahmedshoes.com`;
        
        try {
            const cred = await createUserWithEmailAndPassword(auth, fakeEmail, d.pass);
            await setDoc(doc(db, "users", cred.user.uid), {
                name: d.name, phone: d.phone, address: d.address, email: fakeEmail,
                isRealEmail: false, createdAt: Date.now()
            });
            showToast('تم تفعيل الحساب بنجاح! 🎉', 'success');
            // onAuthStateChanged هتدخله تلقائي
        } catch(e) {
            showToast('حدث خطأ في التسجيل', 'error');
        }
    } else {
        showToast('رمز التحقق غير صحيح ❌', 'error');
    }
};

window.resendOTP = () => {
    state.otpCode = Math.floor(1000 + Math.random() * 9000);
    alert(`💬 إعادة إرسال:\nرمز التحقق الجديد هو: ${state.otpCode}`);
};

window.cancelOTP = () => {
    document.getElementById('otp-screen').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
};

async function registerWithEmail(name, phone, address, email, pass) {
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", cred.user.uid), {
            name, phone, address, email, isRealEmail: true, createdAt: Date.now()
        });
        await sendEmailVerification(cred.user);
        alert('تم التسجيل! راجع إيميلك للتفعيل.');
        window.location.reload();
    } catch(e) { showToast(e.message, 'error'); }
}

// --- Login Logic ---
window.handleLogin = async (e) => {
    e.preventDefault();
    let user = document.getElementById('l-phone').value;
    const pass = document.getElementById('l-pass').value;
    
    // لو كتب رقم تليفون، حوله للإيميل الوهمي بتاعنا
    if(!user.includes('@')) {
        user = `${user}@ahmedshoes.com`;
    }
    
    try {
        await signInWithEmailAndPassword(auth, user, pass);
        showToast('جاري الدخول...', 'success');
    } catch(e) {
        showToast('بيانات الدخول خطأ', 'error');
    }
};

window.logout = () => signOut(auth);

// --- Products & Cart Logic ---

async function fetchProducts() {
    try {
        const q = query(collection(db, "products"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        state.products = snap.docs.map(d => ({id: d.id, ...d.data()}));
    } catch(e) {}
}

window.loadProducts = async (cat) => {
    if(!state.products.length) await fetchProducts();
    const list = state.products.filter(p => p.category === cat);
    
    document.getElementById('home-view').classList.add('hidden');
    document.getElementById('products-view').classList.remove('hidden');
    document.getElementById('grid-container').innerHTML = list.map(p => `
        <div onclick="openProd('${p.id}')" class="bg-white rounded-2xl p-2 shadow-sm cursor-pointer">
            <img src="${p.images[0]}" class="rounded-xl h-40 w-full object-cover mb-2">
            <h3 class="font-bold text-sm truncate">${p.name}</h3>
            <p class="text-[#4b5f28] font-black">${p.price} ج.م</p>
        </div>
    `).join('');
};

window.renderHome = () => {
    document.getElementById('products-view').classList.add('hidden');
    document.getElementById('home-view').classList.remove('hidden');
};

window.openProd = (id) => {
    const p = state.products.find(x => x.id === id);
    state.currentProduct = p;
    state.selection = { color: null, size: null };
    
    document.getElementById('modal-name').innerText = p.name;
    document.getElementById('modal-price').innerText = p.price + ' ج.م';
    document.getElementById('modal-img').src = p.images[0];
    
    const cWrap = document.getElementById('modal-colors');
    if(p.colors) {
        cWrap.innerHTML = p.colors.map(c => 
            `<button onclick="selColor('${c.name}', this)" class="c-btn border px-3 py-1 rounded-lg text-sm">${c.name}</button>`
        ).join('');
        document.getElementById('modal-sizes').innerHTML = '<span class="text-xs text-gray-400">اختر اللون</span>';
    }
    document.getElementById('product-modal').classList.remove('hidden');
    setTimeout(()=> document.getElementById('modal-content').classList.remove('translate-y-full'), 10);
};

window.selColor = (n, btn) => {
    document.querySelectorAll('.c-btn').forEach(b => b.className='c-btn border px-3 py-1 rounded-lg text-sm');
    btn.className = 'c-btn bg-[#4b5f28] text-white px-3 py-1 rounded-lg text-sm shadow';
    state.selection.color = n;
    const sizes = state.currentProduct.colors.find(c=>c.name===n).sizes;
    document.getElementById('modal-sizes').innerHTML = sizes.map(s => 
        `<button onclick="selSize('${s}', this)" class="s-btn bg-gray-100 w-8 h-8 rounded font-bold hover:bg-gray-200">${s}</button>`
    ).join('');
};

window.selSize = (s, btn) => {
    document.querySelectorAll('.s-btn').forEach(b => b.classList.remove('bg-[#4b5f28]', 'text-white'));
    btn.classList.add('bg-[#4b5f28]', 'text-white');
    state.selection.size = s;
};

window.addToCartLogic = () => {
    if(!state.selection.color || !state.selection.size) return showToast('اختار تفاصيل المنتج', 'error');
    state.cart.push({...state.currentProduct, ...state.selection, qty: 1});
    updateCart();
    closeModal();
    showToast('تمت الإضافة', 'success');
};

function updateCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
    document.getElementById('cart-badge').innerText = state.cart.length;
    document.getElementById('cart-badge').style.transform = state.cart.length ? 'scale(1)' : 'scale(0)';
    
    let total = 0;
    document.getElementById('cart-items-container').innerHTML = state.cart.map((i, idx) => {
        total += parseInt(i.price);
        return `
        <div class="flex gap-3 bg-white p-3 rounded-xl border relative">
            <img src="${i.images[0]}" class="w-16 h-16 rounded-lg object-cover">
            <div>
                <h4 class="font-bold text-sm">${i.name}</h4>
                <p class="text-xs text-gray-500">${i.selectedColor} | ${i.selectedSize}</p>
                <p class="font-bold text-[#4b5f28]">${i.price} ج.م</p>
            </div>
            <button onclick="state.cart.splice(${idx},1); updateCart()" class="absolute top-2 left-2 text-red-400">✕</button>
        </div>`;
    }).join('');
    document.getElementById('cart-total').innerText = total + ' ج.م';
}

window.openCart = () => {
    document.getElementById('cart-modal').classList.remove('hidden');
    setTimeout(()=> document.getElementById('cart-content').classList.remove('translate-x-full'), 10);
    if(state.profile) {
        document.getElementById('checkout-name').value = state.profile.name;
        document.getElementById('checkout-phone').value = state.profile.phone;
        document.getElementById('checkout-address').value = state.profile.address;
    }
};

window.closeCart = () => {
    document.getElementById('cart-content').classList.add('translate-x-full');
    setTimeout(()=> document.getElementById('cart-modal').classList.add('hidden'), 300);
};

window.closeModal = () => {
    document.getElementById('modal-content').classList.add('translate-y-full');
    setTimeout(()=> document.getElementById('product-modal').classList.add('hidden'), 300);
};

window.checkout = async () => {
    if(!state.cart.length) return;
    const name = document.getElementById('checkout-name').value;
    const phone = document.getElementById('checkout-phone').value;
    const address = document.getElementById('checkout-address').value;
    const total = document.getElementById('cart-total').innerText;
    
    try {
        await addDoc(collection(db, "orders"), {
            customer: { uid: state.user.uid, name, phone, address },
            items: state.cart, total: parseInt(total), timestamp: Date.now()
        });
        
        if(address !== state.profile.address) {
            updateDoc(doc(db, "users", state.user.uid), { address });
        }

        const msgItems = state.cart.map(i => `${i.name} (${i.selectedColor}/${i.selectedSize})`).join('%0a');
        const msg = `*طلب جديد*%0a${msgItems}%0a*الإجمالي: ${total}*%0a👤 ${name}%0a📞 ${phone}%0a📍 ${address}`;
        window.open(`https://wa.me/201020468021?text=${msg}`, '_blank');
        
        state.cart = []; updateCart(); closeCart();
        showToast('تم الطلب بنجاح', 'success');
    } catch(e) { console.log(e); }
};

function showToast(msg, type) {
    const t = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `bg-[#4b5f28] text-white px-6 py-3 rounded-full font-bold shadow-xl mb-2 animate-bounce`;
    if(type==='error') el.className = `bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-xl mb-2`;
    el.innerText = msg;
    t.appendChild(el);
    setTimeout(()=> el.remove(), 3000);
}

// Init
updateCart();
