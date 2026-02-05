/* ================= CART CORE (FINAL) ================= */
window.cart = [];
try {
  const raw = JSON.parse(localStorage.getItem("cart") || "[]");
  window.cart = Array.isArray(raw) ? raw : [];
} catch { window.cart = []; }

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(window.cart));
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  const count = window.cart.reduce((s, i) => s + (i.qty || 1), 0);
  badge.textContent = count;
  badge.classList.toggle("hidden", count === 0);
  badge.classList.toggle("flex", count > 0);
}

/* =============== ADD TO CART ================= */
window.addToCart = function () {
  if (!window.currentSize) return toast("اختر المقاس", "error");

  const color = window.currentColor || "افتراضي";
  const idx = window.cart.findIndex(
    i =>
      i.productId === window.currentProd.id &&
      i.size === window.currentSize &&
      i.color === color
  );

  if (idx > -1) {
    window.cart[idx].qty++;
  } else {
    window.cart.push({
      productId: window.currentProd.id,
      productName: window.currentProd.name,
      price: Number(window.currentProd.price),
      size: window.currentSize,
      color,
      image: window.currentProd.images?.[0],
      qty: 1
    });
  }

  saveCart();
  updateCartBadge();
  renderCart();
  toast("تمت الإضافة للسلة");
  closeModal();
};

/* =============== RENDER CART ================= */
function renderCart() {
  const wrap = document.getElementById("cart-items");
  const empty = document.getElementById("cart-empty");

  if (!window.cart.length) {
    wrap.innerHTML = "";
    empty.classList.remove("hidden");
    document.getElementById("cart-total-confirm").innerText = "0 ج.م";
    return;
  }

  empty.classList.add("hidden");
  let total = 0;

  wrap.innerHTML = window.cart.map((item, idx) => {
    total += item.price * item.qty;
    return `
    <div class="cart-item-big mb-3 rounded-xl border p-3 relative">
      <img src="${item.image}" class="w-24 h-24 rounded-xl object-cover">
      <div class="flex-1">
        <p class="font-black">${item.productName}</p>
        <p class="text-sm">${item.color} | ${item.size}</p>
        <p class="font-black text-brand">${item.price * item.qty} ج.م</p>
      </div>
      <div class="flex gap-2">
        <button onclick="updateQty(${idx},-1)">−</button>
        <span>${item.qty}</span>
        <button onclick="updateQty(${idx},1)">+</button>
      </div>
      <button onclick="removeItem(${idx})" class="absolute top-2 left-2">✕</button>
    </div>`;
  }).join("");

  document.getElementById("cart-total-confirm").innerText = total + " ج.م";
}

/* =============== ACTIONS ================= */
window.updateQty = function (idx, d) {
  window.cart[idx].qty += d;
  if (window.cart[idx].qty <= 0) window.cart.splice(idx, 1);
  saveCart();
  renderCart();
  updateCartBadge();
};

window.removeItem = function (idx) {
  window.cart.splice(idx, 1);
  saveCart();
  renderCart();
  updateCartBadge();
};

window.clearCart = function () {
  if (!confirm("مسح السلة؟")) return;
  window.cart = [];
  saveCart();
  renderCart();
  updateCartBadge();
};
