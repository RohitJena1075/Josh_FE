window.onload = function() {
  window.scrollTo(0, 0);
  document.documentElement.style.scrollBehavior = 'auto';
  setTimeout(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
  }, 100);
};


const navMap = {
  'menu': '#kitchen-section',
  'about': '.landing-section',
  'contact': '.contact-section'
};

document.querySelectorAll('nav a').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const text = this.textContent.trim().toLowerCase();
    if (navMap[text]) {
      e.preventDefault();
      const targetId = navMap[text];
      const el = document.querySelector(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  });
});


// --- CORE DOM ---
const searchBtn = document.getElementById('searchBtn');
const cartBtn = document.getElementById('cartBtn');
const searchBox = document.getElementById('searchBox');
const cartBox = document.getElementById('cartBox');
const searchInput = document.getElementById('searchInput');
const headerSearchInput = document.getElementById('headerSearchInput');
const cartBadge = document.getElementById('cartBadge');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const carouselTrack = document.getElementById("popularTrack");
const leftBtn = document.getElementById("popularLeft");
const rightBtn = document.getElementById("popularRight");
let cart = [];
let carouselIndex = 0; // left card index

// -- Modal --
const requestBtn = document.getElementById('requestDishBtn');
const requestModal = document.getElementById('requestDishModal');
const closeModal = document.getElementById('closeRequestModal');
const cancelBtn = document.getElementById('cancelRequestBtn');
const submitBtn = document.getElementById('submitRequestBtn');

// --- BODY-NOSCROLL & PANEL HANDLING ---
function lockBodyScroll(lock) {
  if (lock) document.body.classList.add('body-noscroll');
  else      document.body.classList.remove('body-noscroll');
}
function toggleBox(box) { box.classList.toggle('show'); }
function closeBox(box)  { box.classList.remove('show'); }
function closeRequestModal() {
  if (requestModal) requestModal.classList.remove('show');
  lockBodyScroll(false);
}
searchBtn.addEventListener('click', () => { toggleBox(searchBox); closeBox(cartBox); });
cartBtn.addEventListener('click', () => { toggleBox(cartBox); closeBox(searchBox); updateCartDisplay(); });
document.addEventListener('click', (e) => {
  if (
    !e.target.closest('.icon-btn') &&
    !e.target.closest('.search-bar') &&
    !e.target.closest('.cart-box') &&
    !e.target.closest('.request-dish-modal') &&
    !e.target.closest('.request-dish-btn')
  ) {
    closeBox(searchBox); closeBox(cartBox); closeRequestModal();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeBox(searchBox); closeBox(cartBox); closeRequestModal();}
});
if (requestBtn && requestModal) {
  requestBtn.onclick = () => { requestModal.classList.add('show'); lockBodyScroll(true); };
  if(closeModal) closeModal.onclick = closeRequestModal;
  if(cancelBtn) cancelBtn.onclick = closeRequestModal;
  if(submitBtn) submitBtn.onclick = () => {
    const name = document.getElementById('dishName').value.trim();
    const desc = document.getElementById('dishDesc').value.trim();
    const email = document.getElementById('dishEmail').value.trim();
    if(!name || !desc || !email) { alert('Please fill all fields.'); return; }
    alert(`Thanks for your request!\n\nDish: ${name}\nEmail: ${email}\nWe will try to add this dish soon.`);
    closeRequestModal();
    document.getElementById('dishName').value = "";
    document.getElementById('dishDesc').value = "";
    document.getElementById('dishEmail').value = "";
  };
}
if (requestModal) {
  const observer = new MutationObserver( () => {
    if (requestModal.classList.contains('show'))
      lockBodyScroll(true);
    else
      lockBodyScroll(false);
  });
  observer.observe(requestModal, { attributes:true, attributeFilter:['class'] });
}

// --- Search logic ---
function performSearch()   { filterCards(searchInput.value.trim().toLowerCase()); }
function performHeaderSearch() {
  if (!headerSearchInput) return;
  filterCards(headerSearchInput.value.trim().toLowerCase()); closeBox(searchBox);
}
function filterCards(query) {
  const allCards = document.querySelectorAll('.kitchen-card');
  if (!query) { allCards.forEach(card => card.style.display = 'block'); return;}
  let found = false;
  allCards.forEach(card => {
    const title = card.querySelector('h3').innerText.toLowerCase();
    const show = title.includes(query);
    card.style.display = show ? 'block' : 'none';
    if (show) found = true;
  });
  if (!found) alert(`No dishes found for "${query}". Try searching for pizza, paneer, biryani, etc.`);
}
if (searchInput)        searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
if (headerSearchInput)  headerSearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performHeaderSearch(); });

// --- QTY TO CART ---
function initKitchenCardQuantityControls() {
  document.querySelectorAll('.kitchen-card').forEach(card => {
    card.dataset.qty = card.dataset.qty || "0";
    renderQtyUI(card, Number(card.dataset.qty));
  });
}
function renderQtyUI(card, qty) {
  const actionEl = card.querySelector('.card-action');
  while (actionEl.firstChild) actionEl.removeChild(actionEl.firstChild);
  if (qty < 1) {
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn fade-in-btn';
    addBtn.textContent = '+';
    addBtn.onclick = () => {
      card.dataset.qty = "1";
      renderQtyUI(card, 1);
      updateCardItemInCart(card, 1);
    };
    actionEl.appendChild(addBtn);
  } else {
    const qtyWrap = document.createElement('div');
    qtyWrap.className = 'qty-controls fade-in-qty';
    const minusBtn = document.createElement('button');
    minusBtn.className = 'qty-btn';
    minusBtn.textContent = '−';
    minusBtn.onclick = () => {
      const newQty = qty - 1;
      card.dataset.qty = newQty;
      renderQtyUI(card, newQty);
      updateCardItemInCart(card, newQty);
    };
    const amt = document.createElement('span');
    amt.className = 'qty-amount';
    amt.textContent = qty;
    const plusBtn = document.createElement('button');
    plusBtn.className = 'qty-btn';
    plusBtn.textContent = '+';
    plusBtn.onclick = () => {
      const newQty = qty + 1;
      card.dataset.qty = newQty;
      renderQtyUI(card, newQty);
      updateCardItemInCart(card, newQty);
    };
    qtyWrap.appendChild(minusBtn); qtyWrap.appendChild(amt); qtyWrap.appendChild(plusBtn);
    actionEl.appendChild(qtyWrap);
  }
}
function updateCardItemInCart(card, qty) {
  const name = card.dataset.name;
  const price = parseInt(card.dataset.price);
  const image = card.dataset.image;
  let cartItem = cart.find(item => item.name === name);
  if (qty < 1) {
    cart = cart.filter(item => item.name !== name);
  } else if (cartItem) {
    cartItem.quantity = qty;
  } else {
    cart.push({ name: name, price: price, image: image, quantity: qty });
  }
  updateCartBadge();
  updateCartDisplay();
}
function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.textContent = totalItems;
  cartBadge.classList.toggle('hidden', totalItems === 0);
}
function updateCartDisplay() {
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    cartTotal.textContent = '₹0';
    return;
  }
  const cartHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price}</div>
      </div>
      <div class="quantity-controls">
        <button class="qty-btn" onclick="cartChangeQty('${item.name}', -1)">−</button>
        <span class="quantity">${item.quantity}</span>
        <button class="qty-btn" onclick="cartChangeQty('${item.name}', 1)">+</button>
      </div>
    </div>
  `).join('');
  cartItems.innerHTML = cartHTML;
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cartTotal.textContent = `₹${total}`;
}
window.cartChangeQty = function(name, change) {
  const item = cart.find(item => item.name === name);
  if (item) {
    const newQty = item.quantity + change;
    if (newQty < 1) {
      cart = cart.filter(cartItem => cartItem.name !== name);
    } else {
      item.quantity = newQty;
    }
    document.querySelectorAll('.kitchen-card').forEach(card => {
      if (card.dataset.name === name) {
        card.dataset.qty = item ? item.quantity : 0;
        renderQtyUI(card, item ? item.quantity : 0);
      }
    });
  }
  updateCartBadge();
  updateCartDisplay();
};
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Your cart is empty! Add some delicious items first.');
      return;
    }
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemsList = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
    alert(
      `Order Placed Successfully!\n\nOrder Summary:\n${itemsList}\n\nTotal Amount: ₹${total}\n\nYour delicious food will be delivered within 30-45 minutes.\n\nThank you for choosing JTGeats!\nEnjoy your authentic home-cooked meal!`
    );
    cart = [];
    updateCartBadge();
    updateCartDisplay();
    closeBox(cartBox);
    document.querySelectorAll('.kitchen-card').forEach(card => {
      card.dataset.qty = "0";
      renderQtyUI(card, 0);
    });
  });
}

// --- POPULAR ITEMS SLIDER ---

let SLIDES_VISIBLE = 3;
function updatePopularSlider() {
  const track = document.getElementById('popularTrack');
  const cards = [...track.querySelectorAll('.kitchen-card')];
  if (carouselIndex < 0) carouselIndex = 0;
  if (carouselIndex > cards.length - SLIDES_VISIBLE) carouselIndex = Math.max(0, cards.length - SLIDES_VISIBLE);
  const cardW = 277 + 24;
  track.style.transform = `translateX(${-carouselIndex * cardW}px)`;
  cards.forEach(c => c.classList.remove('active'));
  const visible = cards.slice(carouselIndex, carouselIndex + SLIDES_VISIBLE);
  if (visible.length) visible[(visible.length<3)?0:1].classList.add('active');
  if (carouselIndex > 0)   leftBtn.classList.add('arrow-hover'); else leftBtn.classList.remove('arrow-hover');
  if (carouselIndex < cards.length - SLIDES_VISIBLE) rightBtn.classList.add('arrow-hover'); else rightBtn.classList.remove('arrow-hover');
}
if (leftBtn && rightBtn) {
  leftBtn.addEventListener('click', () => {
    if (carouselIndex > 0) { carouselIndex--; updatePopularSlider(); }
  });
  rightBtn.addEventListener('click', () => {
    const cLen = carouselTrack.querySelectorAll('.kitchen-card').length;
    if (carouselIndex < cLen - SLIDES_VISIBLE) { carouselIndex++; updatePopularSlider(); }
  });
  leftBtn.addEventListener('mouseenter', ()=>leftBtn.classList.add('arrow-hover'));
  leftBtn.addEventListener('mouseleave', ()=>updatePopularSlider());
  rightBtn.addEventListener('mouseenter', ()=>rightBtn.classList.add('arrow-hover'));
  rightBtn.addEventListener('mouseleave', ()=>updatePopularSlider());
}
window.addEventListener('resize', updatePopularSlider);

document.addEventListener("DOMContentLoaded", function() {
  initKitchenCardQuantityControls();
  updateCartBadge();
  updatePopularSlider();
});

// Play/Pause Overlay Button for Video Section
document.addEventListener("DOMContentLoaded", function() {
  const video = document.getElementById("homepageVideo");
  const playBtn = document.getElementById("customPlayBtn");
  const playIcon = playBtn.querySelector(".play-icon");
  const pauseIcon = playBtn.querySelector(".pause-icon");
  function updateBtn() {
    if (video.paused) {
      playIcon.style.display = "block";
      pauseIcon.style.display = "none";
      playBtn.style.opacity = "1";
      video.classList.remove("playing");
    } else {
      playIcon.style.display = "none";
      pauseIcon.style.display = "block";
      playBtn.style.opacity = "0";
      video.classList.add("playing");
    }
  }
  // On click button or video
  playBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    if (video.paused) { video.play(); } else { video.pause(); }
    updateBtn();
  });
  video.addEventListener("click", function() {
    if (video.paused) { video.play(); } else { video.pause(); }
    updateBtn();
  });
  video.addEventListener("play", updateBtn);
  video.addEventListener("pause", updateBtn);
  updateBtn();

  // Keyboard spacebar play/pause if in view
  document.addEventListener("keydown", function(e) {
    if ((e.code === "Space" || e.key === " ") && document.activeElement === document.body) {
      const rect = video.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        e.preventDefault();
        if (video.paused) video.play();
        else video.pause();
        updateBtn();
      }
    }
  });
});
