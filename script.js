/* ================================================================
   script.js — منطق تعاملی کامل سایت نلا
   ----------------------------------------------------------------
   این فایل با جاوااسکریپت خالص (Vanilla JS) نوشته شده، بدون هیچ
   کتابخانه‌ی خارجی. ساختار فایل:

   بخش ۱:  داده‌ی محصولات و وضعیت سبد خرید (State)
   بخش ۲:  توابع سبد خرید (افزودن، حذف، تغییر تعداد، رندر کردن)
   بخش ۳:  باز/بسته کردن پنل سبد خرید
   بخش ۴:  پنجره‌ی تسویه‌حساب و اعتبارسنجی فرم سفارش
   بخش ۵:  فرم تماس با ما
   بخش ۶:  فرم خبرنامه‌ی فوتر
   بخش ۷:  منوی موبایل (همبرگری)
   بخش ۸:  افکت تغییر ظاهر هدر هنگام اسکرول
   بخش ۹:  انیمیشن ورود عناصر هنگام اسکرول
   بخش ۱۰: بخش «طرز تهیه‌ی هفته» (چرخش خودکار هفتگی)
   بخش ۱۱: نوتیفیکیشن Toast
   ================================================================ */


/* ================================================================
   بخش ۱: داده‌ی محصولات و وضعیت سبد خرید
   ----------------------------------------------------------------
   PRODUCTS منبع اصلیِ قیمت‌هاست (همان چیزی که در HTML هم روی
   دکمه‌های «افزودن به سبد» به‌صورت data-* نوشته شده، اما اینجا
   دوباره نگه‌داری می‌شود تا محاسبه‌ی مبلغ همیشه قابل‌اعتماد باشد).

   cart آرایه‌ای از اشیاست: { id, name, price, qty }
   این آرایه در حافظه (RAM) نگه‌داری می‌شود، یعنی با رفرش صفحه
   خالی می‌شود (بدون localStorage — مطابق محدودیت‌های پیش‌نمایش).
   ================================================================ */
/* ================================================================
   بخش ۱: داده‌ی محصولات و وضعیت سبد خرید
   ----------------------------------------------------------------
   برخلاف نسخه‌ی قبلی که هر محصول یک قیمت ثابت داشت، این‌جا قیمت هر
   محصول به‌صورت «تومان به ازای هر کیلوگرم» (pricePerKg) نگه‌داری
   می‌شود؛ چون این یک شیرینی‌فروشی است و مشتری باید بتواند بر حسب
   وزن (۲۵۰ گرم / ۵۰۰ گرم / ۱ کیلوگرم) سفارش بدهد، نه فقط «یک عدد».

   قیمت نهایی هر بسته با تابع calcPackagePrice محاسبه می‌شود.

   cart آرایه‌ای از اشیاست: { id, name, price, qty }
   نکته‌ی مهم: چون یک محصول می‌تواند با چند وزن مختلف در سبد باشد
   (مثلاً هم ۵۰۰ گرم باقلوا و هم ۱ کیلو باقلوا)، شناسه‌ی هر ردیف
   سبد خرید ترکیبی از «شناسه‌ی محصول + وزن» است، نه فقط شناسه‌ی محصول.
   این آرایه در حافظه (RAM) نگه‌داری می‌شود، یعنی با رفرش صفحه
   خالی می‌شود (بدون localStorage — مطابق محدودیت‌های پیش‌نمایش).
   ================================================================ */
const PRODUCTS = {
  'baklava-pesteh':    { name: 'باقلوای پسته',        pricePerKg: 370000 },
  'sohan-ghom':        { name: 'سوهان زعفرانی قم',    pricePerKg: 280000 },
  'ghotab-yazdi':      { name: 'قطاب یزدی',            pricePerKg: 320000 },
  'gaz-esfahan':       { name: 'گز اصفهان',            pricePerKg: 240000 },
  'zoolbia-bamie':     { name: 'زولبیا و بامیه',       pricePerKg: 190000 },
  'koloocheh-fouman':  { name: 'کلوچه فومنی',          pricePerKg: 220000 },
};

let cart = []; // { id, name, price, qty }  — id شامل وزن انتخابی هم هست


/* ================================================================
   بخش ۲: توابع سبد خرید
   ================================================================ */

/** عدد را با جداکننده‌ی هزارگان فارسی و کلمه‌ی «تومان» نمایش می‌دهد */
function formatPrice(num){
  return num.toLocaleString('fa-IR') + ' تومان';
}

/** برچسب فارسیِ خوانا برای هر مقدار وزن (بر حسب گرم) */
function weightLabel(grams){
  if (grams === 1000) return '۱ کیلوگرم';
  if (grams === 500)  return '۵۰۰ گرم';
  if (grams === 250)  return '۲۵۰ گرم';
  return grams + ' گرم';
}

/** قیمت یک بسته با وزنِ مشخص را از روی قیمتِ هر کیلوگرم محاسبه می‌کند */
function calcPackagePrice(pricePerKg, grams){
  return Math.round(pricePerKg * grams / 1000);
}

/**
 * برای یک کارت محصول، وزنِ انتخاب‌شده در کشوی «weight-select» را
 * می‌خواند، قیمتِ همان مقدار را حساب می‌کند، در عنصر «unit-price»
 * نمایش می‌دهد، و مقدار محاسبه‌شده را برمی‌گرداند (تا هنگام افزودن
 * به سبد هم از همین مقدار استفاده شود و دو جا دوبار حساب نشود).
 */
function updateCardPrice(card){
  const btn = card.querySelector('.btn-add');
  const select = card.querySelector('.weight-select');
  const priceEl = card.querySelector('.unit-price');
  const product = PRODUCTS[btn.dataset.id];

  const grams = parseInt(select.value, 10);
  const price = calcPackagePrice(product.pricePerKg, grams);
  priceEl.textContent = formatPrice(price);
  return price;
}

/*
  به محض بارگذاری صفحه، روی تمام کارت‌های محصول قیمتِ پیش‌فرض (۵۰۰
  گرم) را نمایش می‌دهیم، و برای هر کدام گوش می‌دهیم که اگر کاربر
  وزن دیگری انتخاب کرد (مثلاً ۱ کیلوگرم)، قیمت بلافاصله به‌روز شود.
*/
document.querySelectorAll('.product-card').forEach(card => {
  updateCardPrice(card);
  card.querySelector('.weight-select').addEventListener('change', () => {
    updateCardPrice(card);
  });
});

/**
 * یک کالا را با وزنِ مشخص به سبد اضافه می‌کند.
 * اگر همان محصول با همان وزن قبلاً در سبد بود، فقط تعدادش (تعداد
 * بسته) زیاد می‌شود؛ وگرنه یک ردیف تازه ساخته می‌شود.
 */
function addToCart(productId, grams, unitPrice){
  const product = PRODUCTS[productId];
  if (!product) return;

  const cartId = `${productId}-${grams}`; // مثال: baklava-pesteh-1000
  const displayName = `${product.name} (${weightLabel(grams)})`;

  const existing = cart.find(item => item.id === cartId);
  if (existing){
    existing.qty += 1;
  } else {
    cart.push({ id: cartId, name: displayName, price: unitPrice, qty: 1 });
  }
  renderCart();
  showToast(`«${displayName}» به سبد خرید اضافه شد`);
}

/** تعداد یک ردیفِ سبد را کم/زیاد می‌کند؛ اگر تعداد به صفر برسد، حذف می‌شود */
function changeQty(id, delta){
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0){
    cart = cart.filter(i => i.id !== id);
  }
  renderCart();
}

/** یک ردیف را کامل از سبد حذف می‌کند */
function removeFromCart(id){
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

/** مجموع مبلغ سبد خرید را محاسبه می‌کند */
function getCartTotal(){
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/** تعداد کل بسته‌های داخل سبد را محاسبه می‌کند (برای نشان روی آیکون سبد) */
function getCartCount(){
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

/**
 * قلب سیستم سبد خرید: هر تغییری در آرایه‌ی cart رخ دهد، این تابع
 * صدا زده می‌شود تا کل رابط کاربری (نشان تعداد، لیست کالاها، جمع کل،
 * فعال/غیرفعال بودن دکمه‌ی تسویه‌حساب) با وضعیت فعلی هماهنگ شود.
 */
function renderCart(){
  // ۱. به‌روزرسانی نشان تعداد روی آیکون سبد در هدر
  const countEl = document.getElementById('cartCount');
  countEl.textContent = getCartCount();

  // ۲. ساخت لیست کالاها در پنل سبد خرید (نام هر ردیف شامل وزن هم هست)
  const itemsEl = document.getElementById('cartItems');

  if (cart.length === 0){
    itemsEl.innerHTML = '<p class="cart-empty">سبد خرید شما خالی است.</p>';
  } else {
    itemsEl.innerHTML = cart.map(item => `
      <div class="cart-row" data-id="${item.id}">
        <div class="cart-row-info">
          <h5>${item.name}</h5>
          <span>${formatPrice(item.price)}</span>
        </div>
        <div class="qty-control">
          <button type="button" class="qty-minus" aria-label="کم کردن تعداد">−</button>
          <span>${item.qty}</span>
          <button type="button" class="qty-plus" aria-label="زیاد کردن تعداد">+</button>
        </div>
        <button type="button" class="cart-row-remove" aria-label="حذف از سبد">حذف</button>
      </div>
    `).join('');
  }

  // ۳. به‌روزرسانی جمع کل و فعال/غیرفعال کردن دکمه‌ی تسویه‌حساب
  document.getElementById('cartTotal').textContent = formatPrice(getCartTotal());
  document.getElementById('goToCheckoutBtn').disabled = cart.length === 0;
}

/*
  به‌جای گذاشتن یک addEventListener روی هر دکمه‌ی +/−/حذف (که چون این
  دکمه‌ها هر بار با renderCart از نو ساخته می‌شوند باید هر بار هم
  دوباره وصل شوند)، از «Event Delegation» استفاده می‌کنیم: یک شنونده
  روی کل ظرف #cartItems می‌گذاریم و بر اساس کلاس دکمه‌ای که کلیک شده
  تصمیم می‌گیریم. این روش تمیزتر و کم‌هزینه‌تر است.
*/
document.getElementById('cartItems').addEventListener('click', (e) => {
  const row = e.target.closest('.cart-row');
  if (!row) return;
  const id = row.dataset.id;

  if (e.target.classList.contains('qty-plus')) changeQty(id, 1);
  if (e.target.classList.contains('qty-minus')) changeQty(id, -1);
  if (e.target.classList.contains('cart-row-remove')) removeFromCart(id);
});

/* اتصال دکمه‌ی «افزودن به سبد» تمام کارت‌های محصول.
   هنگام کلیک، ابتدا وزنِ فعلاً انتخاب‌شده در همان کارت را می‌خوانیم،
   قیمتِ متناظرش را حساب می‌کنیم، و بعد به سبد اضافه می‌کنیم. */
document.querySelectorAll('.btn-add').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product-card');
    const grams = parseInt(card.querySelector('.weight-select').value, 10);
    const price = updateCardPrice(card);

    addToCart(btn.dataset.id, grams, price);

    // یک بازخورد بصری کوتاه روی خودِ دکمه (تغییر رنگ و متن برای ۱ ثانیه)
    const originalText = btn.textContent;
    btn.textContent = 'اضافه شد ✓';
    btn.classList.add('added');
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('added');
    }, 1000);
  });
});


/* ================================================================
   بخش ۳: باز/بسته کردن پنل سبد خرید
   ================================================================ */
const cartDrawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('overlay');

function openCart(){
  cartDrawer.classList.add('open');
  overlay.classList.add('open');
}
function closeCart(){
  cartDrawer.classList.remove('open');
  overlay.classList.remove('open');
}

document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('closeCartBtn').addEventListener('click', closeCart);
overlay.addEventListener('click', () => {
  // پرده‌ی پس‌زمینه هم برای سبد خرید و هم برای مودال تسویه‌حساب استفاده می‌شود
  closeCart();
  closeCheckout();
});


/* ================================================================
   بخش ۴: پنجره‌ی تسویه‌حساب (Checkout) و اعتبارسنجی فرم سفارش
   ================================================================ */
const checkoutModal = document.getElementById('checkoutModal');

function openCheckout(){
  if (cart.length === 0) return;

  // پر کردن خلاصه‌ی سفارش داخل مودال بر اساس محتوای فعلی سبد
  const summaryEl = document.getElementById('checkoutSummary');
  summaryEl.innerHTML = cart.map(item => `
    <div class="checkout-summary-row">
      <span>${item.name} × ${item.qty}</span>
      <span>${formatPrice(item.price * item.qty)}</span>
    </div>
  `).join('') + `
    <div class="checkout-summary-total">
      <span>جمع کل</span>
      <span>${formatPrice(getCartTotal())}</span>
    </div>
  `;

  // اطمینان از این‌که همیشه با فرمِ سفارش (نه پیام موفقیت) شروع شود
  document.getElementById('checkoutFormView').hidden = false;
  document.getElementById('checkoutSuccessView').hidden = true;

  closeCart();
  checkoutModal.classList.add('open');
  overlay.classList.add('open');
}

function closeCheckout(){
  checkoutModal.classList.remove('open');
  overlay.classList.remove('open');
}

document.getElementById('goToCheckoutBtn').addEventListener('click', openCheckout);
document.getElementById('closeCheckoutBtn').addEventListener('click', closeCheckout);

/** یک عدد موبایل ایرانی معتبر است اگر با ۰۹ شروع شود و ۱۱ رقم باشد */
function isValidIranPhone(value){
  return /^09\d{9}$/.test(value.trim());
}

/**
 * اعتبارسنجی فرم تسویه‌حساب.
 * برای هر فیلد خالی یا نامعتبر، کلاس invalid و پیام خطا نمایش داده
 * می‌شود؛ در صورت معتبر بودن همه‌ی فیلدها true برمی‌گرداند.
 */
function validateCheckoutForm(){
  let valid = true;

  const name = document.getElementById('oName');
  const phone = document.getElementById('oPhone');
  const address = document.getElementById('oAddress');

  // ریست کردن پیام‌های خطای قبلی
  [name, phone, address].forEach(el => el.classList.remove('invalid'));
  document.getElementById('oNameError').textContent = '';
  document.getElementById('oPhoneError').textContent = '';
  document.getElementById('oAddressError').textContent = '';

  if (name.value.trim().length < 3){
    name.classList.add('invalid');
    document.getElementById('oNameError').textContent = 'نام باید حداقل ۳ حرف باشد.';
    valid = false;
  }
  if (!isValidIranPhone(phone.value)){
    phone.classList.add('invalid');
    document.getElementById('oPhoneError').textContent = 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.';
    valid = false;
  }
  if (address.value.trim().length < 10){
    address.classList.add('invalid');
    document.getElementById('oAddressError').textContent = 'لطفاً آدرس کامل‌تری وارد کنید.';
    valid = false;
  }

  return valid;
}

/** یک شماره‌ی پیگیری تصادفی برای نمایش به کاربر می‌سازد (فقط جنبه‌ی نمایشی دارد) */
function generateOrderNumber(){
  return 'NL-' + Math.floor(100000 + Math.random() * 900000);
}

document.getElementById('checkoutForm').addEventListener('submit', (e) => {
  e.preventDefault(); // جلوگیری از رفرش شدن صفحه (چون بک‌اند واقعی نداریم)

  if (!validateCheckoutForm()) return;

  // نمایش صفحه‌ی موفقیت به‌جای فرم
  document.getElementById('orderNumber').textContent = generateOrderNumber();
  document.getElementById('checkoutFormView').hidden = true;
  document.getElementById('checkoutSuccessView').hidden = false;

  // خالی کردن سبد خرید چون سفارش «ثبت» شد
  cart = [];
  renderCart();

  // ریست کردن خودِ فرم برای سفارش بعدی
  e.target.reset();
});

document.getElementById('closeSuccessBtn').addEventListener('click', closeCheckout);


/* ================================================================
   بخش ۵: فرم تماس با ما
   ================================================================ */
function validateContactForm(){
  let valid = true;
  const name = document.getElementById('cName');
  const phone = document.getElementById('cPhone');
  const message = document.getElementById('cMessage');

  [name, phone, message].forEach(el => el.classList.remove('invalid'));
  document.getElementById('cNameError').textContent = '';
  document.getElementById('cPhoneError').textContent = '';
  document.getElementById('cMessageError').textContent = '';

  if (name.value.trim().length < 3){
    name.classList.add('invalid');
    document.getElementById('cNameError').textContent = 'نام باید حداقل ۳ حرف باشد.';
    valid = false;
  }
  if (!isValidIranPhone(phone.value)){
    phone.classList.add('invalid');
    document.getElementById('cPhoneError').textContent = 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).';
    valid = false;
  }
  if (message.value.trim().length < 5){
    message.classList.add('invalid');
    document.getElementById('cMessageError').textContent = 'پیام خیلی کوتاه است.';
    valid = false;
  }

  return valid;
}

document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const successEl = document.getElementById('contactSuccess');

  if (!validateContactForm()){
    successEl.hidden = true;
    return;
  }

  successEl.hidden = false;
  e.target.reset();
  showToast('پیام شما ارسال شد');
});


/* ================================================================
   بخش ۶: فرم خبرنامه‌ی فوتر
   ================================================================ */
document.getElementById('newsletterForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const emailInput = document.getElementById('newsletterEmail');
  const errorEl = document.getElementById('newsletterError');
  const successEl = document.getElementById('newsletterSuccess');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(emailInput.value.trim())){
    emailInput.classList.add('invalid');
    errorEl.textContent = 'لطفاً یک ایمیل معتبر وارد کنید.';
    successEl.hidden = true;
    return;
  }

  emailInput.classList.remove('invalid');
  errorEl.textContent = '';
  successEl.hidden = false;
  e.target.reset();
});


/* ================================================================
   بخش ۷: منوی موبایل (همبرگری)
   ================================================================ */
const burgerBtn = document.getElementById('burgerBtn');
const navLinks = document.getElementById('navLinks');

burgerBtn.addEventListener('click', () => {
  const isOpen = burgerBtn.classList.toggle('open');
  if (isOpen){
    // نمایش لینک‌های منو به‌صورت یک پنل کشویی زیر هدر
    navLinks.style.cssText = `
      display:flex; flex-direction:column; gap:6px;
      position:fixed; top:76px; right:20px; left:20px;
      background:rgba(251,245,236,.98); padding:20px;
      border-radius:16px; border:1px solid rgba(169,120,46,.2);
      box-shadow:0 20px 50px rgba(90,60,20,0.15); z-index:150;
    `;
  } else {
    navLinks.removeAttribute('style');
  }
});

// با کلیک روی هرکدام از لینک‌های منو (در حالت موبایل)، منو بسته شود
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burgerBtn.classList.remove('open');
    navLinks.removeAttribute('style');
  });
});


/* ================================================================
   بخش ۸: افکت تغییر ظاهر هدر هنگام اسکرول
   وقتی کاربر کمی به پایین اسکرول کند، کلاس scrolled اضافه می‌شود
   و در style.css پس‌زمینه‌ی هدر شیشه‌ای و تیره‌تر می‌شود.
   ================================================================ */
const siteNav = document.getElementById('siteNav');
window.addEventListener('scroll', () => {
  siteNav.classList.toggle('scrolled', window.scrollY > 40);
});


/* ================================================================
   بخش ۹: انیمیشن ورود عناصر هنگام اسکرول
   هر عنصری با کلاس reveal، وقتی وارد دید کاربر شود، کلاس in
   می‌گیرد و طبق استایل CSS به آرامی ظاهر می‌شود.
   ================================================================ */
const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

revealItems.forEach(el => revealObserver.observe(el));


/* ================================================================
   بخش ۱۰: بخش «طرز تهیه‌ی هفته»
   بر اساس شماره‌ی هفته‌ی جاری سال (استاندارد ISO)، یکی از ۴ دستور
   زیر به‌صورت خودکار انتخاب و نمایش داده می‌شود. هر بازدیدکننده،
   بسته به هفته‌ی جاری، همان دستور را می‌بیند و هفته‌ی بعد عوض می‌شود.
   ================================================================ */
const recipes = [
  {
    title: 'باقلوای پسته‌ی خانگی',
    desc: 'شیرینی‌ای لایه‌لایه با مغز پسته و عطر گلاب، مناسب پذیرایی‌های رسمی.',
    ingredients: ['۲۰۰ گرم پسته خرد شده', '۱۰ ورق خمیر فیلو', '۱۵۰ گرم کره ذوب‌شده', '۲ قاشق غذاخوری گلاب', 'شربت عسل و هل'],
    steps: ['فر را روی ۱۷۰ درجه گرم کنید', 'ورق‌های خمیر را لایه‌به‌لایه با کره چرب کنید', 'مغز پسته را میان لایه‌ها بریزید', 'به مدت ۳۵ دقیقه بپزید و شربت داغ روی آن بریزید'],
    iconPath: 'M24 4 L44 24 L24 44 L4 24 Z'
  },
  {
    title: 'کلوچه‌ی نارگیلی',
    desc: 'کوکی‌های نرم با روکش نارگیل، مناسب عصرانه با چای دم‌کرده.',
    ingredients: ['۲ عدد تخم‌مرغ', '۱۵۰ گرم شکر', '۱۰۰ گرم نارگیل رنده', '۲۰۰ گرم آرد', 'کمی وانیل'],
    steps: ['تخم‌مرغ و شکر را هم بزنید', 'نارگیل و آرد را اضافه کنید', 'خمیر را به شکل توپ درآورده و روی سینی بچینید', 'به مدت ۱۸ دقیقه در فر ۱۸۰ درجه بپزید'],
    iconPath: 'M24 6 A18 18 0 1 1 23.9 6Z'
  },
  {
    title: 'کیک زعفرانی نلا',
    desc: 'کیکی لطیف و معطر با رشته‌های زعفران، ایده‌آل برای مهمانی‌های عصرگاهی.',
    ingredients: ['۳ عدد تخم‌مرغ', '۱۸۰ گرم شکر', '۱ قاشق چای‌خوری زعفران دم‌کرده', '۲۲۰ گرم آرد', '۱۰۰ میلی‌لیتر روغن'],
    steps: ['زعفران را در ۲ قاشق آب داغ دم کنید', 'مواد مرطوب و خشک را جداگانه مخلوط کنید', 'ترکیب را در قالب بریزید', 'به مدت ۴۰ دقیقه در دمای ۱۷۵ درجه بپزید'],
    iconPath: 'M12 30 Q24 8 36 30 Q24 42 12 30Z'
  },
  {
    title: 'رولت خرمایی و گردو',
    desc: 'دسری سنتی و مقوی با مغز خرما و گردو، بدون نیاز به فر.',
    ingredients: ['۳۰۰ گرم خرمای بدون هسته', '۱۰۰ گرم گردوی خرد شده', '۲ قاشق غذاخوری کره', 'خلال پسته برای تزیین'],
    steps: ['خرما و کره را روی حرارت ملایم له کنید', 'گردو را اضافه کرده و خمیر را یکدست کنید', 'به شکل استوانه درآورده و در خلال پسته بغلتانید', 'قبل از سرو، یک ساعت در یخچال بگذارید'],
    iconPath: 'M10 24 h28 M10 18 h28 M10 30 h28'
  }
];

/** شماره‌ی هفته‌ی جاری سال را طبق استاندارد ISO 8601 محاسبه می‌کند */
function isoWeekNumber(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const currentWeek = isoWeekNumber(new Date());
const activeRecipe = recipes[currentWeek % recipes.length];

document.getElementById('weekNumber').textContent = currentWeek;
document.getElementById('recipeTitle').textContent = activeRecipe.title;
document.getElementById('recipeDesc').textContent = activeRecipe.desc;
document.getElementById('recipeIngredients').innerHTML =
  activeRecipe.ingredients.map(i => `<li>${i}</li>`).join('');
document.getElementById('recipeSteps').innerHTML =
  activeRecipe.steps.map(s => `<li>${s}</li>`).join('');
document.getElementById('recipeIcon').innerHTML =
  `<path d="${activeRecipe.iconPath}" stroke="currentColor" stroke-width="1.4" fill="none"/>`;


/* ================================================================
   بخش ۱۱: نوتیفیکیشن Toast
   یک پیام کوچک که برای ۲.۵ ثانیه پایین صفحه ظاهر می‌شود و بعد
   خودش محو می‌شود. برای تأیید «افزودن به سبد» استفاده می‌شود.
   ================================================================ */
let toastTimer = null;

function showToast(message){
  const toastEl = document.getElementById('toast');
  toastEl.textContent = message;
  toastEl.classList.add('show');

  // اگر toast قبلی هنوز در حال نمایش بود، تایمرش را پاک می‌کنیم
  // تا زمان‌بندی‌ها با هم تداخل نکنند
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2500);
}


/* ================================================================
   مقداردهی اولیه: در همان لحظه‌ی بارگذاری صفحه، سبد خرید (که در
   ابتدا خالی است) یک‌بار رندر می‌شود تا وضعیت اولیه‌ی رابط کاربری
   درست نمایش داده شود.
   ================================================================ */
renderCart();
