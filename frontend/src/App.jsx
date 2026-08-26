import React, { useState, useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import { 
  ShoppingBag, User, PhoneCall, ShieldCheck, HelpCircle, 
  WifiOff, ArrowLeft, RefreshCw, X, ChevronRight, CheckCircle, 
  Trash2, ShieldAlert, BookOpen, Layers, FileText, Heart, ShoppingCart, Star, Eye, EyeOff, Lock, Mail, Phone, Check, AlertCircle, KeyRound, CreditCard, Menu, Bell
} from 'lucide-react';
import AdminDashboard from './admin/AdminDashboard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api');

const getInitialPage = () => {
  if (typeof window === 'undefined') return 'home';
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get('page');

  if (pathname.startsWith('/admin') || pageParam === 'admin') return 'admin';
  if (pathname === '/category' || pageParam === 'category') return 'category';
  if (pathname === '/customercare' || pathname === '/customer-care' || pageParam === 'customercare') return 'customercare';
  if (pathname === '/cart' || pageParam === 'cart') return 'cart';
  if (pathname === '/login' || pathname === '/signup' || pageParam === 'login') return 'login';
  if (pathname === '/terms' || pageParam === 'terms') return 'terms';
  if (pathname === '/privacy' || pageParam === 'privacy') return 'privacy';
  if (pathname === '/refund-policy' || pageParam === 'refund-policy') return 'refund-policy';
  if (pathname === '/shipping-policy' || pageParam === 'shipping-policy') return 'shipping-policy';
  if (pathname === '/checkout' || pageParam === 'checkout') return 'checkout';
  if (pathname === '/orders' || pageParam === 'orders') return 'orders';
  if (pathname === '/order-details' || pageParam === 'order-details') return 'order-details';
  if (pathname === '/track-order' || pageParam === 'track-order') return 'track-order';
  if (pathname === '/wishlist' || pageParam === 'wishlist') return 'wishlist';
  if (pathname === '/profile' || pageParam === 'profile') return 'profile';
  if (pathname === '/addresses' || pageParam === 'addresses') return 'addresses';
  if (pathname === '/payments' || pageParam === 'payments') return 'payments';
  if (pathname === '/settings' || pageParam === 'settings') return 'settings';
  if (pathname === '/product-details' || pageParam === 'product-details') return 'product-details';

  return 'home';
};

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleClientConfigured = googleClientId && 
                                   googleClientId.trim() !== '' && 
                                   !googleClientId.includes('dummy') && 
                                   !googleClientId.includes('placeholder') && 
                                   !googleClientId.includes('your-google-client');

  const turnstileSiteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '2x00000000000000000000AB';
  const [turnstileToken, setTurnstileToken] = useState('TEST_MODE');

  const resetTurnstile = () => {
    setTurnstileToken('TEST_MODE');
    if (typeof window !== 'undefined' && window.turnstile) {
      try {
        window.turnstile.reset('#cf-turnstile-container');
      } catch (e) {
        console.warn('Turnstile reset note:', e.message);
      }
    }
  };

  const [page, setPage] = useState(getInitialPage); // 'home', 'category', 'customercare', 'cart', 'login', 'terms'
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: '✨ Welcome to Krishiv Corporation',
      message: 'Enjoy 100% pure organic skincare & botanical formulations.',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      title: '📮 India Post Dispatch Active',
      message: 'Orders now feature real-time consignment tracking via India Post.',
      time: '1 day ago',
      read: false
    },
    {
      id: 3,
      title: '🌿 Organic Chocolate Wax Restocked',
      message: 'Painless hair removal wax powder is now available!',
      time: '2 days ago',
      read: true
    }
  ]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Form States & Multi-field Auth States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'verify-otp' | 'forgot-email' | 'forgot-otp' | 'forgot-reset'
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [googleClientInput, setGoogleClientInput] = useState('');

  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountryCode, setRegCountryCode] = useState('+91');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [targetEmail, setTargetEmail] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  // Field validation error object
  const [fieldErrors, setFieldErrors] = useState({});

  // Validation & Password Strength Helpers
  const validateIndianPhone = (phone) => {
    if (!phone) return false;
    const clean = phone.replace(/[\s-]/g, '');
    return /^[6-9]\d{9}$/.test(clean);
  };

  const evaluatePasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    let label = 'Weak';
    let color = '#ef4444';
    if (score === 5) {
      label = 'Strong';
      color = '#10b981';
    } else if (score >= 3) {
      label = 'Good';
      color = '#f59e0b';
    } else if (score >= 2) {
      label = 'Fair';
      color = '#f97316';
    }
    
    return { checks, score, label, color };
  };

  // OTP Countdown Timer Effect
  useEffect(() => {
    let timerInterval = null;
    if ((authMode === 'verify-otp' || authMode === 'forgot-otp') && otpTimer > 0) {
      timerInterval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [authMode, otpTimer]);
  
  // Customer Care Form
  const [ccName, setCcName] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [ccSubject, setCcSubject] = useState('');
  const [ccMessage, setCcMessage] = useState('');
  const [ccSubmitted, setCcSubmitted] = useState(false);

  // Checkout state
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [shippingName, setShippingName] = useState('');
  const [shippingEmail, setShippingEmail] = useState(user?.email || '');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [showCodConfirmModal, setShowCodConfirmModal] = useState(false);
  const [pendingCodShipping, setPendingCodShipping] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [tosAccepted, setTosAccepted] = useState(false);
  // Store settings & Shipping calculation state
  const [storeSettings, setStoreSettings] = useState({
    gj_under299_rate: 49,
    gj_299_498_rate: 39,
    gj_499_plus_rate: 0,
    outside_under299_rate: 69,
    outside_299_498_rate: 59,
    outside_499_plus_rate: 0,
    cod_fee: 30
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/settings`)
      .then(r => r.json())
      .then(d => {
        if (d && d.settings) setStoreSettings(d.settings);
      })
      .catch(e => console.error('Settings fetch error:', e));
  }, []);

  const calculateClientShipping = (subtotal, state = shippingState, payMethod = paymentMethod, settings = storeSettings, itemsList = cart) => {
    const normState = String(state || '').trim().toLowerCase();
    const isGujarat = normState === 'gujarat' || normState === 'gj';
    let delivery = 0;

    const gjUnder299 = Number(settings?.gj_under299_rate !== undefined ? settings.gj_under299_rate : 49);
    const gj299to498 = Number(settings?.gj_299_498_rate !== undefined ? settings.gj_299_498_rate : 39);
    const gj499Plus = Number(settings?.gj_499_plus_rate !== undefined ? settings.gj_499_plus_rate : 0);

    const outUnder299 = Number(settings?.outside_under299_rate !== undefined ? settings.outside_under299_rate : 69);
    const out299to498 = Number(settings?.outside_299_498_rate !== undefined ? settings.outside_299_498_rate : 59);
    const out499Plus = Number(settings?.outside_499_plus_rate !== undefined ? settings.outside_499_plus_rate : 0);

    if (subtotal >= 499) {
      delivery = isGujarat ? gj499Plus : out499Plus;
    } else if (isGujarat) {
      if (subtotal < 299) delivery = gjUnder299;
      else delivery = gj299to498;
    } else {
      if (subtotal < 299) delivery = outUnder299;
      else delivery = out299to498;
    }

    const isCod = String(payMethod || '').toLowerCase() === 'cod';
    const codFee = isCod ? Number(settings?.cod_fee !== undefined ? settings.cod_fee : 30) : 0;

    // Fixed GST Slabs: Cosmetics & Waxes = 18%, Ayurvedic & Herbal Powders = 5% (no other rates)
    const cosmeticGst = 18;
    const herbalGst = 5;

    let tax = 0;
    if (Array.isArray(itemsList) && itemsList.length > 0) {
      itemsList.forEach(item => {
        const pId = Number(item.productId || item.id);
        const p = products.find(prod => prod.id === pId) || item;
        const qty = item.quantity || 1;
        const itemTotal = (p.price || 0) * qty;

        const searchStr = (String(p.category || '') + ' ' + String(p.name || '') + ' ' + String(p.tag || '') + ' ' + String(p.description || '') + ' ' + String(p.ingredients || '')).toLowerCase();
        const cosmeticKeywords = ['wax', 'cosmetic', 'cream', 'lotion', 'serum', 'chemical', 'hair removal', 'beauty', 'makeup', 'lipstick', 'foundation', 'mascara', 'concealer', 'toner', 'moisturizer', 'sunscreen', 'shampoo', 'conditioner', 'gel', 'soap', 'face wash', 'cleanser', 'scrub'];
        let rate = herbalGst; // 5%
        if (cosmeticKeywords.some(kw => searchStr.includes(kw))) {
          rate = cosmeticGst; // 18%
        }
        tax += Math.round(itemTotal * (rate / 100));
      });
    } else {
      tax = Math.round(subtotal * (herbalGst / 100));
    }

    const effectiveGstRate = subtotal > 0 ? Math.round((tax / subtotal) * 100) : 18;

    const cgst = isGujarat ? Math.round(tax / 2) : 0;
    const sgst = isGujarat ? (tax - cgst) : 0;
    const igst = isGujarat ? 0 : tax;

    const total = subtotal + delivery + codFee + tax;

    return {
      delivery,
      codFee,
      tax,
      effectiveGstRate,
      cgst,
      sgst,
      igst,
      total,
      isGujarat,
      hasState: Boolean(normState)
    };
  };

  // Wishlist state
  const [wishlist, setWishlist] = useState([]);
  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const isOutOfStock = (product) => {
    if (!product) return false;
    const stockVal = product.stock !== undefined ? product.stock : product.stock_qty;
    if (typeof stockVal === 'number') return stockVal <= 0;
    if (product.in_stock === false || product.is_in_stock === false) return true;
    return false;
  };

  const getPathForPage = (pageName, params = {}) => {
    const prod = params.product || selectedProduct;
    const ord = params.order || activeOrder;
    const cat = params.category || selectedCategory;

    switch (pageName) {
      case 'home': return '/';
      case 'category': return cat && cat !== 'All' ? `/category?cat=${encodeURIComponent(cat)}` : '/category';
      case 'customercare': return '/customercare';
      case 'cart': return '/cart';
      case 'login': return '/login';
      case 'terms': return '/terms';
      case 'privacy': return '/privacy';
      case 'refund-policy': return '/refund-policy';
      case 'shipping-policy': return '/shipping-policy';
      case 'checkout': return '/checkout';
      case 'orders': return '/orders';
      case 'order-details': return ord ? `/order-details?id=${ord.id}` : '/orders';
      case 'track-order': return ord ? `/track-order?id=${ord.id}` : '/orders';
      case 'wishlist': return '/wishlist';
      case 'profile': return '/profile';
      case 'addresses': return '/addresses';
      case 'payments': return '/payments';
      case 'settings': return '/settings';
      case 'product-details': return prod ? `/product-details?id=${prod.id}` : '/category';
      case 'admin': return '/admin';
      default: return '/';
    }
  };

  const changePage = useCallback((newPage, extraParams = {}, pushToHistory = true) => {
    setPage(newPage);
    if (extraParams.product) setSelectedProduct(extraParams.product);
    if (extraParams.order) setActiveOrder(extraParams.order);
    if (extraParams.category) setSelectedCategory(extraParams.category);

    if (typeof window !== 'undefined') {
      localStorage.setItem('krishiv_current_page', newPage);
      if (extraParams.product) {
        localStorage.setItem('krishiv_last_product', JSON.stringify(extraParams.product));
      }
      if (extraParams.order) {
        localStorage.setItem('krishiv_last_order', JSON.stringify(extraParams.order));
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (pushToHistory) {
        const targetPath = getPathForPage(newPage, extraParams);
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath !== targetPath && !window.location.pathname.startsWith('/admin')) {
          window.history.pushState({ page: newPage, ...extraParams }, document.title, targetPath);
        }
      }
    }
  }, [selectedProduct, activeOrder, selectedCategory]);

  const buyNow = (product) => {
    const prod = products.find(p => p.id === product.id) || product;
    if (isOutOfStock(prod)) {
      showToast("This product is currently out of stock.");
      changePage('category');
      return;
    }
    addToCart(product);
    changePage('checkout');
  };

  const particlesRef = useRef(null);
  const floatLoops = useRef([]);

  // Load saved user and parse OAuth callback query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('auth_success');
    const userJson = params.get('user');
    const authErrorParam = params.get('auth_error');

    if (success && userJson) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userJson));
        setUser(parsedUser);
        localStorage.setItem('user', JSON.stringify(parsedUser));
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error('Failed to parse redirected user data', e);
      }
    } else if (authErrorParam) {
      setAuthError(decodeURIComponent(authErrorParam));
      setPage('login');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
    }
  }, []);

  // Handle Browser Back and Forward buttons (Popstate Sync)
  useEffect(() => {
    const handlePopState = (event) => {
      const statePage = event.state?.page;
      const targetPage = statePage || getInitialPage();

      const params = new URLSearchParams(window.location.search);
      const idFromUrl = params.get('id') || event.state?.id;
      const catFromUrl = params.get('cat') || event.state?.category;

      setPage(targetPage);
      if (catFromUrl) setSelectedCategory(catFromUrl);

      if (idFromUrl) {
        if (targetPage === 'product-details' && products.length > 0) {
          const foundProd = products.find(p => String(p.id) === String(idFromUrl));
          if (foundProd) setSelectedProduct(foundProd);
        } else if ((targetPage === 'order-details' || targetPage === 'track-order') && userOrders.length > 0) {
          const foundOrder = userOrders.find(o => String(o.id) === String(idFromUrl));
          if (foundOrder) setActiveOrder(foundOrder);
        }
      } else {
        if (targetPage !== 'product-details') setSelectedProduct(null);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products, userOrders]);

  // Restore page on initial load from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialPage = params.get('page');
    const initialCat = params.get('cat');
    if (initialPage) {
      setPage(initialPage);
      if (initialCat) setSelectedCategory(initialCat);
    }
  }, []);

  // Dynamic SEO Page Title & Meta Description Manager
  useEffect(() => {
    let title = "Krishiv Corporation | 100% Pure Organic Skincare & Herbal Powders";
    let description = "Shop 100% pure organic cosmetics, ayurvedic skincare, Orange Peel Powder, Neem Leaf, Multani Mitti, Rice Powder, Ubtan & Chocolate Wax Powder.";

    if (page === 'product-details' && selectedProduct) {
      title = `${selectedProduct.name} — Organic ${selectedProduct.category || 'Skincare'} | Krishiv Corporation`;
      description = `${selectedProduct.name}: ${selectedProduct.description?.substring(0, 150) || 'Pure organic formulation for glowing skin.'} Price: ₹${selectedProduct.price}.`;
    } else if (page === 'category' || selectedCategory) {
      const cat = selectedCategory || 'Organic Products';
      title = `${cat} Collection | Krishiv Corporation`;
      description = `Explore our pure organic ${cat} range. 100% natural ingredients, no chemicals, fast delivery across India.`;
    } else if (page === 'checkout') {
      title = "Checkout & Place Order | Krishiv Corporation";
    } else if (page === 'terms') {
      title = "Terms of Service & Statutory Policy | Krishiv Corporation";
    } else if (page === 'customer-care') {
      title = "Customer Support & Contact Us | Krishiv Corporation";
    } else if (page === 'track-order') {
      title = "Track Your Order | Krishiv Corporation";
    } else if (page === 'account') {
      title = "My Account & Orders | Krishiv Corporation";
    }

    document.title = title;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }
  }, [page, selectedProduct, selectedCategory]);

  // Render Cloudflare Turnstile Widget dynamically on auth modal
  useEffect(() => {
    if (page === 'login') {
      const timer = setTimeout(() => {
        const container = document.getElementById('cf-turnstile-container');
        if (container && window.turnstile) {
          try {
            container.innerHTML = '';
            window.turnstile.render('#cf-turnstile-container', {
              sitekey: turnstileSiteKey,
              theme: 'light',
              appearance: 'always',
              callback: (token) => setTurnstileToken(token),
              'expired-callback': () => resetTurnstile(),
              'error-callback': () => resetTurnstile()
            });
          } catch (e) {
            console.warn('Turnstile widget render note:', e.message);
          }
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [page, authMode, turnstileSiteKey]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialPage = params.get('page') || window.location.pathname.replace(/^\//, '');
    const initialId = params.get('id');

    if (initialId) {
      if ((initialPage === 'product-details' || window.location.pathname === '/product-details') && products.length > 0) {
        const found = products.find(p => String(p.id) === String(initialId));
        if (found) setSelectedProduct(found);
      } else if (initialPage === 'order-details' || initialPage === 'track-order' || window.location.pathname === '/order-details' || window.location.pathname === '/track-order') {
        let found = userOrders.find(o => String(o.id) === String(initialId));
        if (!found) {
          const cached = localStorage.getItem('krishiv_last_order');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (!initialId || String(parsed.id) === String(initialId)) {
                found = parsed;
              }
            } catch (e) {}
          }
        }
        if (found) setActiveOrder(found);
      }
    }
  }, [products, userOrders]);

  // Persist current page to localStorage for single page navigation tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishiv_current_page', page);
    }
  }, [page]);

  // Close profile dropdown on click outside or escape key press
  useEffect(() => {
    const handleClickOutside = (event) => {
      const container = document.querySelector('.profile-menu-container');
      if (container && !container.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchUserOrders = useCallback(async () => {
    if (!user) return;
    try {
      const uId = user.id || 'guest';
      const qEmail = encodeURIComponent(user.email || '');
      const qPhone = encodeURIComponent(user.phone || '');
      const qName = encodeURIComponent(user.name || '');
      const res = await fetch(`${API_BASE_URL}/orders/${uId}?email=${qEmail}&phone=${qPhone}&name=${qName}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUserOrders(data.orders || []);
        }
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    }
  }, [user]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('krishiv_last_order');
    setUser(null);
    setUserOrders([]);
    setActiveOrder(null);
    setAuthError('');
    setFieldErrors({});
    setLoginIdentifier('');
    setLoginPassword('');
    showToast('Logged out successfully.');
    changePage('home');
  }, [changePage]);

  useEffect(() => {
    fetchUserOrders();
    const interval = setInterval(() => {
      fetchUserOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [user, fetchUserOrders]);

  // Sync activeOrder in real-time when admin updates order status
  useEffect(() => {
    if (activeOrder && userOrders.length > 0) {
      const updated = userOrders.find(o => String(o.id) === String(activeOrder.id));
      if (updated && updated.status !== activeOrder.status) {
        setActiveOrder(updated);
        localStorage.setItem('krishiv_last_order', JSON.stringify(updated));
      }
    }
  }, [userOrders, activeOrder]);

  // Initialize Google Sign In
  useEffect(() => {
    if (window.google && isGoogleClientConfigured) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
        auto_select: false
      });

      if (page === 'login') {
        const btnDiv = document.getElementById("google-signin-button-div");
        if (btnDiv) {
          window.google.accounts.id.renderButton(
            btnDiv,
            { theme: "outline", size: "large", width: "350", text: "continue_with" }
          );
        }
      }
    }
  }, [page, authMode, isGoogleClientConfigured]);

  // Protect secure pages and redirect guest users
  useEffect(() => {
    const securePages = ['checkout', 'orders', 'settings', 'cart', 'wishlist', 'profile', 'payment-methods'];
    if (securePages.includes(page) && !user) {
      setRedirectAfterLogin(page);
      setPage('login');
      setAuthError('Please sign in to access this secure page.');
    }
  }, [page, user]);

  // Fetch Products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        const enriched = data.map((p, index) => {
          const origPrice = Number(p.original_price || (p.price * 1.25));
          const priceVal = Number(p.price || 0);
          const calcDiscount = origPrice > priceVal ? Math.round(((origPrice - priceVal) / origPrice) * 100) : 0;
          const stock_qty = p.stock !== undefined ? Number(p.stock) : (p.stock_qty !== undefined ? Number(p.stock_qty) : 10);
          const stock_status = stock_qty === 0 ? 'Out of Stock' : (stock_qty <= 5 ? 'Limited Stock' : 'In Stock');
          
          return {
            ...p,
            id: p.id || p._id || `prod-${index}`,
            stock: stock_qty,
            stock_qty: stock_qty,
            original_price: Math.round(origPrice),
            discount_pct: p.discount_pct !== undefined ? p.discount_pct : calcDiscount,
            rating: p.rating || 5.0,
            review_count: p.review_count || 0,
            stock_status: stock_status,
            is_new: p.is_new !== undefined ? p.is_new : true
          };
        });
        setProducts(enriched);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync Cart to Server/Local DB if logged in
  const syncCart = async (updatedCart) => {
    if (!user) return;
    try {
      await fetch(`${API_BASE_URL}/cart/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedCart }),
      });
    } catch (err) {
      console.error('Failed to sync cart:', err);
    }
  };

  // Fetch Cart when User Changes
  useEffect(() => {
    if (user) {
      fetch(`${API_BASE_URL}/cart/${user.id}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setCart(data))
        .catch(err => console.error(err));
    } else {
      setCart([]);
    }
  }, [user]);

  // Handle Offline Status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Animations with Anime.js
  useEffect(() => {
    // Floating loop for card cards
    startFloatingAnimations();

    // Intro Animations
    playIntroAnimations();
  }, [page, loading]);

  const startFloatingAnimations = () => {
    floatLoops.current.forEach(f => f.pause());
    floatLoops.current = [];
    document.querySelectorAll('[data-float]').forEach((el, i) => {
      const loop = anime({
        targets: el,
        translateY: [{ value: -10, duration: 1600 + i * 120 }, { value: 0, duration: 1600 + i * 120 }],
        rotate: [{ value: i % 2 === 0 ? 1.4 : -1.4, duration: 1600 + i * 120 }, { value: i % 2 === 0 ? -1.4 : 1.4, duration: 1600 + i * 120 }],
        easing: 'easeInOutSine',
        loop: true,
        delay: i * 160
      });
      floatLoops.current.push(loop);
    });
  };

  const playIntroAnimations = () => {
    anime.timeline({ easing: 'easeOutExpo' })
      .add({
        targets: '#wordmark',
        opacity: [0, 1],
        translateY: [-14, 0],
        duration: 700
      })
      .add({
        targets: '#rule',
        width: [0, 38],
        duration: 500,
        easing: 'easeOutQuad'
      }, '-=200')
      .add({
        targets: '#eyebrow',
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 600
      }, '-=200')
      .add({
        targets: '.headline-word',
        opacity: [0, 1],
        translateY: [36, 0],
        rotate: [4, 0],
        duration: 800,
        delay: anime.stagger(70)
      }, '-=250')
      .add({
        targets: '#sub',
        opacity: [0, 1],
        translateY: [14, 0],
        duration: 600
      }, '-=400')
      .add({
        targets: '.jar-card',
        opacity: [0, 1],
        translateY: [46, 0],
        scale: [0.7, 1],
        rotate: () => anime.random(-6, 6),
        duration: 900,
        easing: 'easeOutElastic(1, .7)',
        delay: anime.stagger(110)
      }, '-=200')
      .add({
        targets: '.chip',
        opacity: [0, 1],
        scale: [0.4, 1],
        duration: 650,
        easing: 'easeOutBack',
        delay: anime.stagger(90)
      }, '-=400');
  };

  // Toast helpers
  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Cart operations
  const addToCart = (product) => {
    const prod = products.find(p => p.id === product.id) || product;
    if (isOutOfStock(prod)) {
      showToast("This product is currently out of stock.");
      return;
    }

    const availableStock = prod.stock !== undefined ? prod.stock : (prod.stock_qty || 99);
    const existing = cart.find(item => item.productId === product.id);
    if (existing && existing.quantity >= availableStock) {
      showToast(`Cannot add more. Only ${availableStock} items in stock.`);
      return;
    }

    let newCart;
    if (existing) {
      newCart = cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
    } else {
      newCart = [...cart, { productId: product.id, quantity: 1 }];
    }
    setCart(newCart);
    syncCart(newCart);
    showToast(`Added ${product.name} to cart!`);
    setIsCartDrawerOpen(true); // Open the drawer immediately to show updated cart items
    
    // Popup feedback
    anime({
      targets: '.cart-icon-nav',
      scale: [1, 1.3, 1],
      duration: 300,
      easing: 'easeInOutQuad'
    });
  };

  const updateCartQuantity = (productId, amount) => {
    const prod = products.find(p => p.id === productId);
    const existing = cart.find(item => item.productId === productId);
    if (!existing) return;

    const newQty = existing.quantity + amount;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const availableStock = prod ? (prod.stock !== undefined ? prod.stock : (prod.stock_qty || 99)) : 99;
    if (amount > 0 && prod && (isOutOfStock(prod) || newQty > availableStock)) {
      showToast(isOutOfStock(prod) ? "This product is currently out of stock." : `Only ${availableStock} items in stock.`);
      return;
    }

    const newCart = cart.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCart(newCart);
    syncCart(newCart);
  };

  const removeFromCart = (productId) => {
    const prod = products.find(p => p.id === productId);
    const newCart = cart.filter(item => item.productId !== productId);
    setCart(newCart);
    syncCart(newCart);
    if (prod) {
      showToast(`Removed ${prod.name} from cart.`);
    }
  };

  const clearCart = () => {
    setCart([]);
    syncCart([]);
    showToast('Cleared all items from your cart.');
  };

  // --- AUTH OPERATIONS ---

  // 1. Initial Sign Up Submit (Triggers OTP Email Verification)
  const handleInitSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    const errors = {};

    if (!regName.trim()) {
      errors.name = 'Full Name is required';
    }
    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      errors.email = 'Valid Email Address is required';
    }
    if (!validateIndianPhone(regPhone)) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number (starts with 6-9)';
    }

    const strength = evaluatePasswordStrength(regPassword);
    if (strength.score < 5) {
      errors.password = 'Password does not meet all security requirements';
    }
    if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!regTermsAccepted) {
      errors.terms = 'You must agree to the Terms & Conditions and Privacy Policy';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setAuthLoading(true);

    try {
      const fullPhone = `${regCountryCode} ${regPhone.trim()}`;
      const res = await fetch(`${API_BASE_URL}/auth/signup/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          phone: fullPhone,
          email: regEmail.trim(),
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTargetEmail(data.email);
        setAuthMode('verify-otp');
        setOtpDigits(['', '', '', '', '', '']);
        setOtpTimer(60);
        setCanResendOtp(false);
        showToast(`Verification code sent to ${data.email}`);
      } else {
        if (data.code === 'EMAIL_EXISTS') {
          setFieldErrors({ email: 'An account with this email already exists. Please log in instead.' });
        }
        setAuthError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Unable to connect to registration server. Please check your connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. Verify Signup OTP
  const handleVerifySignUpOtp = async (e) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setAuthError('Please enter the complete 6-digit verification code.');
      return;
    }

    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, otp: otpCode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        showToast('Account registered and verified successfully!');
        if (redirectAfterLogin) {
          setPage(redirectAfterLogin);
          setRedirectAfterLogin(null);
        } else {
          setPage('home');
        }
      } else {
        setAuthError(data.error || 'Verification failed');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection error during verification.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Resend Signup OTP
  const handleResendSignUpOtp = async () => {
    if (!canResendOtp) return;
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOtpTimer(60);
        setCanResendOtp(false);
        setOtpDigits(['', '', '', '', '', '']);
        showToast('A new verification code has been sent to your email.');
      } else {
        setAuthError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setAuthError('Failed to resend verification code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 4. Login Submit
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setFieldErrors({});

    if (!loginIdentifier.trim()) {
      setFieldErrors({ identifier: 'Email Address or Mobile Number is required' });
      return;
    }
    if (!loginPassword) {
      setFieldErrors({ password: 'Password is required' });
      return;
    }

    setAuthLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier.trim(), password: loginPassword, turnstileToken }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        showToast(`Welcome back, ${data.user.name || 'valued customer'}!`);
        if (redirectAfterLogin) {
          setPage(redirectAfterLogin);
          setRedirectAfterLogin(null);
        } else {
          setPage('home');
        }
      } else {
        resetTurnstile();
        setAuthError(data.error || 'Invalid email/mobile number or password');
      }
    } catch (err) {
      console.error(err);
      resetTurnstile();
      setAuthError('Connection error. Running offline mode.');
      const mockUser = { id: 'mock-user-123', email: loginIdentifier, name: 'Guest User' };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      if (redirectAfterLogin) {
        setPage(redirectAfterLogin);
        setRedirectAfterLogin(null);
      } else {
        setPage('home');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // 5. Forgot Password: Init (Request Email)
  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setFieldErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setFieldErrors({});
    setAuthLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTargetEmail(data.email);
        setAuthMode('forgot-otp');
        setOtpDigits(['', '', '', '', '', '']);
        setOtpTimer(60);
        setCanResendOtp(false);
        showToast('Password reset code sent to your email');
      } else {
        setAuthError(data.error || 'Failed to process request');
      }
    } catch (err) {
      setAuthError('Connection error while sending reset code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 6. Forgot Password: Verify OTP
  const handleForgotOtpVerify = async (e) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setAuthError('Please enter the 6-digit reset code.');
      return;
    }

    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, otp: otpCode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthMode('forgot-reset');
        showToast('Reset code verified. Please choose a new password.');
      } else {
        setAuthError(data.error || 'Verification failed');
      }
    } catch (err) {
      setAuthError('Server error verifying reset code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 7. Forgot Password: Reset Submit
  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const errors = {};

    const strength = evaluatePasswordStrength(forgotNewPassword);
    if (strength.score < 5) {
      errors.newPassword = 'Password must meet all security requirements';
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setAuthLoading(true);

    try {
      const otpCode = otpDigits.join('');
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          otp: otpCode,
          newPassword: forgotNewPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Password reset successful! Please sign in with your new password.');
        setLoginIdentifier(targetEmail);
        setAuthMode('login');
      } else {
        setAuthError(data.error || 'Password reset failed');
      }
    } catch (err) {
      setAuthError('Connection error during password reset.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Helper for OTP Box input change & Paste
  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      const lastInput = document.getElementById('otp-input-5');
      if (lastInput) lastInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleGoogleCallback = async (response) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (redirectAfterLogin) {
          setPage(redirectAfterLogin);
          setRedirectAfterLogin(null);
        } else {
          setPage('home');
        }
      } else {
        setAuthError(data.error || 'Google token validation failed.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Connection error during Google Sign-In verification.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    if (provider === 'google') {
      return;
    }
    window.location.href = `${API_BASE_URL}/auth/${provider}/redirect`;
  };

  // Feedback Submission
  const handleFeedback = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ccName, email: ccEmail, subject: ccSubject, message: ccMessage }),
      });
      if (res.ok) {
        setCcSubmitted(true);
        setCcName('');
        setCcEmail('');
        setCcSubject('');
        setCcMessage('');
      }
    } catch (err) {
      setCcSubmitted(true);
    }
  };

  // Checkout simulation
  const handleCheckout = async () => {
    if (!user) {
      setRedirectAfterLogin('checkout');
      setPage('login');
      setAuthError('Please sign in to proceed to checkout.');
      return;
    }
    setPage('checkout');
  };

  const placeOrder = async (shippingDetails) => {
    if (cart.length === 0) return;

    if (paymentMethod === 'razorpay' || paymentMethod === 'online' || paymentMethod === 'card') {
      try {
        // 1. Request Server-Signed Razorpay Order
        const res = await fetch(`${API_BASE_URL}/payment/create-razorpay-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            items: cart,
            shipping: shippingDetails
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          showToast(data.error || 'Failed to initialize Razorpay payment.');
          return;
        }

        // 2. Open Razorpay Test Mode Checkout Modal
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: "Krishiv Corporation",
          description: "Organic Beauty & Skincare Checkout",
          image: "/images/orange_peel.png",
          order_id: data.orderId,
          handler: async function (response) {
            try {
              // 3. Verify Payment HMAC Signature on Backend
              const verifyRes = await fetch(`${API_BASE_URL}/payment/verify-razorpay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: user?.id,
                  verifiedItems: data.verifiedItems,
                  verifiedGrandTotal: data.verifiedGrandTotal,
                  shipping: shippingDetails,
                  paymentMethod: 'Razorpay Online'
                })
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success && verifyData.order) {
                setActiveOrder(verifyData.order);
                localStorage.setItem('krishiv_last_order', JSON.stringify(verifyData.order));
                setCheckoutSuccess(true);
                setCart([]);
                syncCart([]);
                fetchUserOrders();
                changePage('order-details', { order: verifyData.order });
                showToast('🎉 Razorpay Payment Verified! Order Placed.');
              } else {
                alert(verifyData.error || 'Payment signature verification failed.');
              }
            } catch (vErr) {
              alert('Payment verification connection error.');
            }
          },
          prefill: {
            name: shippingDetails.name || user?.name || '',
            email: shippingDetails.email || user?.email || 'krishivcorporation4513@gmail.com',
            contact: shippingDetails.phone || user?.phone || '9876543210'
          },
          theme: {
            color: "#8f8269"
          }
        };

        if (window.Razorpay) {
          options.modal = {
            ondismiss: function () {
              console.log('Razorpay Checkout Modal Dismissed by user.');
              showToast('Payment cancelled. You can retry checkout anytime.');
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response) {
            console.error('Razorpay Payment Failed:', response.error);
            showToast(`Payment Failed: ${response.error?.description || response.error?.reason || 'Transaction cancelled.'}`);
          });
          rzp.open();
        } else {
          alert('Razorpay Payment Gateway SDK is loading. Please try again in a moment.');
        }
      } catch (err) {
        showToast('Error connecting to Razorpay payment server.');
      }
    } else {
      // Standard COD Flow - Trigger Confirmation Modal
      setPendingCodShipping(shippingDetails);
      setShowCodConfirmModal(true);
    }
  };

  const executeCodOrder = async (shippingDetails) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          items: cart,
          shipping: shippingDetails,
          payment: { method: 'Cash on Delivery (COD)' }
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
        localStorage.setItem('krishiv_last_order', JSON.stringify(data.order));
        setCheckoutSuccess(true);
        setCart([]);
        syncCart([]);
        fetchUserOrders();
        setShowCodConfirmModal(false);
        setPendingCodShipping(null);
        changePage('order-details', { order: data.order });
        showToast('🎉 Cash on Delivery Order Placed Successfully!');
      } else {
        showToast(data.error || 'Failed to place order.');
      }
    } catch (err) {
      showToast('Connection error. Failed to place order.');
    }
  };



  const handleDownloadInvoice = () => {
    if (!activeOrder) return;
    const itemsList = Array.isArray(activeOrder.items) 
      ? activeOrder.items 
      : (activeOrder.items?.cartItems || []);
    const shippingInfo = activeOrder.items?.shipping || {};
    const paymentInfo = activeOrder.items?.payment || {};
    const paymentMethodName = typeof paymentInfo === 'string' ? paymentInfo : (paymentInfo.method || 'COD');

    const customerState = (shippingInfo.state || 'Gujarat').trim();
    const isIntraState = customerState.toLowerCase().includes('gujarat') || customerState.toLowerCase() === 'gj' || !shippingInfo.state;

    const grandTotal = Number(activeOrder.total || 0);
    const shippingFee = Number(activeOrder.shipping_fee || (grandTotal > 500 ? 0 : 50));

    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    // Fixed GST Slabs: Cosmetics & Waxes = 18%, Ayurvedic & Herbal Powders = 5% (no other rates)
    const cosmeticGstRate = 18;
    const herbalGstRate = 5;

    const itemRows = itemsList.map((item, idx) => {
      let pName = item.name;
      let pPrice = Number(item.price || 0);
      let foundP = null;
      if (products.length > 0) {
        foundP = products.find(p => p.id === (item.productId || item.id));
        if (foundP) {
          if (!pName) pName = foundP.name;
          if (!pPrice) pPrice = Number(foundP.price);
        }
      }
      pName = pName || `Product #${item.productId || item.id}`;
      const targetObj = foundP || item;
      const qty = Number(item.quantity || 1);
      const itemInclusiveTotal = pPrice * qty;

      const searchStr = (String(targetObj.category || '') + ' ' + String(targetObj.name || pName || '') + ' ' + String(targetObj.tag || '') + ' ' + String(targetObj.description || '') + ' ' + String(targetObj.ingredients || '')).toLowerCase();
      const cosmeticKeywords = ['wax', 'cosmetic', 'cream', 'lotion', 'serum', 'chemical', 'hair removal', 'beauty', 'makeup', 'lipstick', 'foundation', 'mascara', 'concealer', 'toner', 'moisturizer', 'sunscreen', 'shampoo', 'conditioner', 'gel', 'soap', 'face wash', 'cleanser', 'scrub'];
      let itemRate = herbalGstRate; // 5%
      let hsnCode = "3004";
      if (cosmeticKeywords.some(kw => searchStr.includes(kw))) {
        itemRate = cosmeticGstRate; // 18%
        hsnCode = "3304";
      }

      const itemTaxable = itemInclusiveTotal / (1 + itemRate / 100);
      const itemGst = itemInclusiveTotal - itemTaxable;

      totalTaxableValue += itemTaxable;

      let cgstVal = 0, sgstVal = 0, igstVal = 0;
      if (isIntraState) {
        cgstVal = itemGst / 2;
        sgstVal = itemGst / 2;
        totalCgst += cgstVal;
        totalSgst += sgstVal;
      } else {
        igstVal = itemGst;
        totalIgst += igstVal;
      }

      const rateExclTax = itemTaxable / qty;
      const halfRate = itemRate / 2;

      return `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${pName}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${hsnCode}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${qty}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${rateExclTax.toFixed(2)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${itemTaxable.toFixed(2)}</td>
          ${isIntraState ? `
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${cgstVal.toFixed(2)} (${halfRate}%)</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${sgstVal.toFixed(2)} (${halfRate}%)</td>
          ` : `
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;" colspan="2">₹${igstVal.toFixed(2)} (${itemRate}%)</td>
          `}
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">₹${itemInclusiveTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const numberToWords = (num) => {
      const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const n = Math.floor(num);
      if (n === 0) return 'Zero';
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + numberToWords(n % 100) : '');
      if (n < 100000) return numberToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numberToWords(n % 1000) : '');
      return 'Rupees ' + n;
    };

    const amountInWords = `Rupees ${numberToWords(grandTotal)} Only`;
    const orderDateStr = activeOrder.created_at ? new Date(activeOrder.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>GST Tax Invoice - ${activeOrder.id}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; background: #fff; font-size: 12px; }
            .invoice-box { max-width: 800px; margin: 0 auto; border: 1.5px solid #cbd5e1; padding: 24px; border-radius: 8px; }
            .top-bar { display: flex; justify-content: space-between; border-bottom: 2px solid #8f8269; padding-bottom: 16px; margin-bottom: 20px; }
            .company-name { font-size: 22px; font-weight: 800; color: #221d16; letter-spacing: -0.5px; }
            .gst-badge { background: #8f8269; color: #fff; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block; margin-top: 4px; }
            .title-box { text-align: right; }
            .title-box h1 { margin: 0; font-size: 24px; color: #8f8269; text-transform: uppercase; letter-spacing: 1px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f1f5f9; color: #475569; font-weight: 700; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }
            .totals-table { width: 320px; margin-left: auto; border: 1px solid #e2e8f0; }
            .totals-table td { padding: 6px 12px; }
            .sign-block { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="top-bar">
              <div>
                <div class="company-name">KRISHIV CORPORATION</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">100% Pure Organic Cosmetics & Personal Care</div>
                <div class="gst-badge">GSTIN: 24APTPK3284N1Z6</div>
                <div style="font-size: 11px; color: #475569; margin-top: 4px;">
                  State: Gujarat (State Code: 24)<br>
                  Email: krishivcorporation4513@gmail.com
                </div>
              </div>
              <div class="title-box">
                <h1>TAX INVOICE</h1>
                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">(Issued under Rule 46 of CGST Rules, 2017)</div>
                <div style="font-size: 13px; font-weight: 700; margin-top: 8px; color: #0f172a;">Invoice No: KC/2026-27/${activeOrder.id}</div>
                <div style="font-size: 12px; color: #475569;">Date: ${orderDateStr}</div>
                <div style="font-size: 12px; color: #475569;">Place of Supply: ${customerState} (${isIntraState ? '24' : 'Inter-State'})</div>
              </div>
            </div>

            <div class="meta-grid">
              <div>
                <div style="font-weight: 700; color: #8f8269; text-transform: uppercase; font-size: 10px; margin-bottom: 4px;">BILLED TO / SHIPPED TO:</div>
                <div style="font-size: 13px; font-weight: 700;">${shippingInfo.fullName || shippingInfo.name || 'Valued Customer'}</div>
                <div>${shippingInfo.address || 'Standard Shipping Address'}</div>
                <div>${shippingInfo.city || ''}${shippingInfo.state ? ', ' + shippingInfo.state : ''} - ${shippingInfo.zip || ''}</div>
                <div>Mobile: ${shippingInfo.phone || 'N/A'}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 700; color: #8f8269; text-transform: uppercase; font-size: 10px; margin-bottom: 4px;">PAYMENT DETAILS:</div>
                <div style="font-size: 13px; font-weight: 700; color: #10b981;">Method: ${String(paymentMethodName).toUpperCase()}</div>
                <div>Payment Status: <span style="font-weight: 700; color: #10b981;">PAID & VERIFIED</span></div>
                ${activeOrder.razorpay_payment_id ? `<div>Razorpay Txn ID: ${activeOrder.razorpay_payment_id}</div>` : ''}
                <div>Reverse Charge: No</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="text-align: center; width: 30px;">#</th>
                  <th>Description of Goods</th>
                  <th style="text-align: center;">HSN</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Rate (Excl. Tax)</th>
                  <th style="text-align: right;">Taxable Val</th>
                  ${isIntraState ? `
                    <th style="text-align: right;">CGST</th>
                    <th style="text-align: right;">SGST</th>
                  ` : `
                    <th style="text-align: right;" colspan="2">IGST</th>
                  `}
                  <th style="text-align: right;">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px;">
              <div style="max-width: 420px;">
                <div style="font-size: 11px; font-weight: 700; color: #475569;">AMOUNT IN WORDS:</div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; font-style: italic; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 4px;">
                  ${amountInWords}
                </div>
                <div style="margin-top: 16px; font-size: 10px; color: #64748b;">
                  <strong>Terms & Conditions:</strong><br>
                  1. All products are 100% pure organic cosmetics.<br>
                  2. Goods once sold are subject to Krishiv Return Policy.<br>
                  3. Subject to Gujarat Jurisdiction.
                </div>
              </div>

              <table class="totals-table">
                <tr>
                  <td>Taxable Amount:</td>
                  <td style="text-align: right; font-weight: 600;">₹${totalTaxableValue.toFixed(2)}</td>
                </tr>
                ${isIntraState ? `
                  <tr>
                    <td>CGST:</td>
                    <td style="text-align: right; font-weight: 600;">₹${totalCgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>SGST:</td>
                    <td style="text-align: right; font-weight: 600;">₹${totalSgst.toFixed(2)}</td>
                  </tr>
                ` : `
                  <tr>
                    <td>IGST:</td>
                    <td style="text-align: right; font-weight: 600;">₹${totalIgst.toFixed(2)}</td>
                  </tr>
                `}
                <tr>
                  <td>Shipping Charges:</td>
                  <td style="text-align: right; font-weight: 600;">${shippingFee === 0 ? 'FREE' : '₹' + shippingFee}</td>
                </tr>
                <tr style="border-top: 2px solid #8f8269; background: #f8fafc;">
                  <td style="font-weight: 800; font-size: 13px; color: #0f172a;">Grand Total:</td>
                  <td style="text-align: right; font-weight: 800; font-size: 14px; color: #8f8269;">₹${grandTotal.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="sign-block">
              <div style="font-size: 10px; color: #94a3b8;">
                This is a computer-generated tax invoice issued by Krishiv Corporation.
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 700; font-size: 11px; color: #0f172a;">For KRISHIV CORPORATION</div>
                <div style="height: 40px;"></div>
                <div style="border-top: 1px dashed #cbd5e1; padding-top: 4px; font-size: 10px; color: #64748b;">Authorized Signatory</div>
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const isAdminRoute = window.location.pathname.startsWith('/admin') || page === 'admin' || page === 'admin-login';

  if (isAdminRoute) {
    return <AdminDashboard onNavigateHome={() => { fetchProducts(); setPage('home'); }} />;
  }

  return (
    <div className="app-container">
      {/* Offline Page Overlay */}
      {isOffline && (
        <div className="offline-overlay">
          <div className="glass-panel offline-panel">
            <WifiOff className="contact-icon" style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
            <h2>No Internet Connection</h2>
            <p>
              It looks like you're offline. Krishiv Cosmetics needs an active connection to synchronize your cart and process orders.
            </p>
            <button 
              onClick={() => setIsOffline(!navigator.onLine)}
              className="btn-primary"
            >
              <RefreshCw style={{ width: '16px', height: '16px' }} /> Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Floating background particles */}
      <div className="particles" ref={particlesRef}></div>

      {/* Premium Header */}
      <header className="glass-panel app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="mobile-menu-btn"
            onClick={() => setShowMobileNav(!showMobileNav)}
            aria-label="Toggle Mobile Navigation"
          >
            {showMobileNav ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="logo-container" onClick={() => setPage('home')}>
            <span className="logo-kc">Kc</span>
            <div className="logo-text">
              <span className="logo-main">KRISHIV</span>
              <span className="logo-sub">CORPORATION</span>
            </div>
          </div>
        </div>

        <nav className="app-nav">
          <button onClick={() => changePage('home')} className={`nav-link ${page === 'home' ? 'active' : ''}`}>Home</button>
          <button onClick={() => changePage('category')} className={`nav-link ${page === 'category' ? 'active' : ''}`}>Categories</button>
          <button onClick={() => changePage('customercare')} className={`nav-link ${page === 'customercare' ? 'active' : ''}`}>Customer Care</button>
          <button onClick={() => changePage('terms')} className={`nav-link ${page === 'terms' ? 'active' : ''}`}>Terms & Policies</button>
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <button 
                onClick={() => changePage('wishlist')}
                className="icon-btn"
                style={{ position: 'relative' }}
                aria-label="View Wishlist"
              >
                <Heart style={{ width: '20px', height: '20px', fill: wishlist.length > 0 ? 'var(--clay)' : 'none', color: wishlist.length > 0 ? 'var(--clay)' : 'var(--ink)' }} />
                {wishlist.length > 0 && (
                  <span className="badge" style={{ background: 'var(--clay)' }}>{wishlist.length}</span>
                )}
              </button>
              
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)} 
                  className="icon-btn"
                  style={{ position: 'relative' }}
                  aria-label="Notifications"
                >
                  <Bell style={{ width: '20px', height: '20px', color: 'var(--ink)' }} />
                  {notifications.some(n => !n.read) && (
                    <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: 'var(--gold)', borderRadius: '50%', border: '1.5px solid var(--cream)', boxShadow: '0 0 6px var(--gold)' }}></span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="glass-panel notifications-dropdown" style={{ position: 'absolute', right: '-40px', top: '46px', width: '310px', padding: '18px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', background: '#FAF7EE', border: '1.5px solid var(--gold-light)', boxShadow: '0 16px 40px rgba(34, 29, 22, 0.25)', borderRadius: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--cream-deep)', paddingBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Bell size={16} style={{ color: 'var(--gold)' }} /> Notification Center
                      </div>
                      <button 
                        onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                        style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--gold)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                      >
                        Mark all read
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ fontSize: '12px', color: 'var(--ink-soft)', textAlign: 'center', padding: '16px 0' }}>No new notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => setNotifications(notifications.map(item => item.id === n.id ? { ...item, read: true } : item))}
                            style={{ padding: '10px 12px', borderRadius: '12px', background: n.read ? 'rgba(255,255,255,0.4)' : '#ffffff', border: n.read ? '1px solid transparent' : '1px solid var(--gold-light)', cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink)' }}>{n.title}</span>
                              {!n.read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }}></span>}
                            </div>
                            <p style={{ fontSize: '11.5px', color: 'var(--ink-soft)', margin: '0 0 4px', lineHeight: '1.4' }}>{n.message}</p>
                            <span style={{ fontSize: '10px', color: 'var(--ink-soft)', opacity: 0.7 }}>{n.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsCartDrawerOpen(true)} 
                className="icon-btn cart-icon-nav"
                aria-label="View Cart"
              >
                <ShoppingBag style={{ width: '20px', height: '20px' }} />
                {cart.length > 0 && (
                  <span className="badge">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>
              <div className="profile-menu-container" style={{ position: 'relative' }}>
                <button 
                  className="profile-btn" 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}
                >
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name || user.email} 
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--gold)' }} 
                    />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--cream-deep)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', border: '1.5px solid var(--gold)' }}>
                      {(user.name || user.email).substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="profile-name-nav" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>{user.name || user.email.split('@')[0]}</span>
                </button>

                {profileDropdownOpen && (
                  <div className="glass-panel profile-dropdown" style={{ position: 'absolute', right: 0, top: '46px', width: '230px', padding: '18px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', pointerEvents: 'auto', background: '#FAF7EE', border: '1.5px solid var(--gold-light)', boxShadow: '0 12px 36px rgba(34, 29, 22, 0.25)', borderRadius: '16px' }}>
                    <div style={{ borderBottom: '1px solid var(--cream-deep)', paddingBottom: '8px', marginBottom: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.name || 'User'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileDropdownOpen(false);
                        changePage('profile');
                      }}
                      style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--ink)', padding: '4px 0', width: '100%', display: 'block', fontWeight: '500' }}
                    >
                      My Profile
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileDropdownOpen(false);
                        changePage('orders');
                      }}
                      style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--ink)', padding: '4px 0', width: '100%', display: 'block', fontWeight: '500' }}
                    >
                      My Orders
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileDropdownOpen(false);
                        changePage('wishlist');
                      }}
                      style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--ink)', padding: '4px 0', width: '100%', display: 'block', fontWeight: '500' }}
                    >
                      Wishlist ({wishlist.length})
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileDropdownOpen(false);
                        changePage('addresses');
                      }}
                      style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--ink)', padding: '4px 0', width: '100%', display: 'block', fontWeight: '500' }}
                    >
                      Saved Addresses
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileDropdownOpen(false);
                        setPage('payments');
                      }}
                      style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--ink)', padding: '4px 0', width: '100%', display: 'block', fontWeight: '500' }}
                    >
                      Payment Methods
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileDropdownOpen(false);
                        setPage('settings');
                      }}
                      style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--ink)', padding: '4px 0', width: '100%', display: 'block', fontWeight: '500' }}
                    >
                      Account Settings
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', color: 'var(--clay)', fontWeight: '700', padding: '6px 0', width: '100%', display: 'block', borderTop: '1px solid var(--cream-deep)', marginTop: '4px' }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="header-auth-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => { setAuthMode('login'); setPage('login'); }} 
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setAuthMode('signup'); setPage('login'); }} 
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Slide-Out Navigation Drawer */}
      {showMobileNav && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 99999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'flex-start' }}
          onClick={() => setShowMobileNav(false)}
        >
          <div 
            className="glass-panel" 
            style={{ width: '280px', maxWidth: '85vw', height: '100%', borderRadius: 0, padding: '24px', background: 'var(--cream)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'slideInLeft 0.3s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--cream-deep)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="logo-kc" style={{ fontSize: '24px' }}>Kc</span>
                <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '2px', color: 'var(--ink-soft)' }}>KRISHIV</span>
              </div>
              <button 
                onClick={() => setShowMobileNav(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--ink)' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => { changePage('home'); setShowMobileNav(false); }} className={`btn-secondary ${page === 'home' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', padding: '12px 16px', fontSize: '13px', background: page === 'home' ? 'var(--cream-deep)' : 'transparent' }}>
                🏠 Home
              </button>
              <button onClick={() => { changePage('category'); setShowMobileNav(false); }} className={`btn-secondary ${page === 'category' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', padding: '12px 16px', fontSize: '13px', background: page === 'category' ? 'var(--cream-deep)' : 'transparent' }}>
                🛍️ Shop Categories
              </button>
              <button onClick={() => { changePage('customercare'); setShowMobileNav(false); }} className={`btn-secondary ${page === 'customercare' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', padding: '12px 16px', fontSize: '13px', background: page === 'customercare' ? 'var(--cream-deep)' : 'transparent' }}>
                💬 Customer Care
              </button>
              <button onClick={() => { changePage('terms'); setShowMobileNav(false); }} className={`btn-secondary ${page === 'terms' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', border: 'none', padding: '12px 16px', fontSize: '13px', background: page === 'terms' ? 'var(--cream-deep)' : 'transparent' }}>
                📜 Terms of Service & Policies
              </button>
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1.5px solid var(--cream-deep)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {user ? (
                <>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink)' }}>
                    Signed in as: <span style={{ color: 'var(--gold)' }}>{user.name || user.email}</span>
                  </div>
                  <button onClick={() => { changePage('profile'); setShowMobileNav(false); }} className="btn-secondary" style={{ width: '100%', fontSize: '12px', padding: '10px' }}>
                    👤 My Account & Orders
                  </button>
                  <button onClick={() => { handleLogout(); setShowMobileNav(false); }} className="btn-primary" style={{ width: '100%', fontSize: '12px', padding: '10px', background: '#dc2626', borderColor: '#dc2626' }}>
                    Logout
                  </button>
                </>
              ) : (
                <button onClick={() => { setAuthMode('login'); changePage('login'); setShowMobileNav(false); }} className="btn-primary" style={{ width: '100%', fontSize: '12px', padding: '12px' }}>
                  🔐 Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="app-main">
        
        {/* PAGE 1: HOME PAGE */}
        {page === 'home' && (
          <div className="home-section">
            <div className="wordmark" id="wordmark">
              <div className="wordmark-kc">Kc</div>
              <div className="wordmark-full">KRISHIV CORPORATION</div>
              <div className="wordmark-rule" id="rule"></div>
            </div>

            <div className="eyebrow" id="eyebrow">
              TRUSTED SINCE GENERATIONS
            </div>

            <h1 className="headline">
              <span className="headline-word">100%&nbsp;</span> 
              <span className="headline-word">Natural&nbsp;</span> 
              <span className="headline-word">&amp;&nbsp;</span> 
              <span className="headline-word headline-accent">Chemical&nbsp;</span> 
              <span className="headline-word headline-accent">Free</span>
            </h1>

            <p className="subhead" id="sub">
              Sourced traditionally, freshly packed, and lab-tested for purity — because your skin deserves nothing less.
            </p>

            {/* Product Cards Row */}
            {loading ? (
              <div className="flex items-center justify-center text-gray-600 font-medium" style={{ gap: '8px' }}>
                <RefreshCw className="animate-spin" style={{ width: '20px', height: '20px' }} /> Loading products...
              </div>
            ) : (
              <div className="jar-row">
                {products.map((p, i) => (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="jar-card"
                    data-float
                  >
                    <div className="ring">
                      <div className="ring-inner">
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                        />
                      </div>
                    </div>
                    <div className="name">{p.name}</div>
                    <div className="tag">{p.tag}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Trust Chips */}
            <div className="chips">
              <div className="chip">
                <ShieldCheck style={{ width: '16px', height: '16px', color: 'var(--sage)' }} />
                <span>Lab Certified Pure</span>
              </div>
              <div className="chip">
                <ShieldCheck style={{ width: '16px', height: '16px', color: 'var(--sage)' }} />
                <span>100% Organic</span>
              </div>
              <div className="chip">
                <ShieldCheck style={{ width: '16px', height: '16px', color: 'var(--sage)' }} />
                <span>Traditional Methods</span>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: CATEGORY PAGE */}
        {page === 'category' && (
          <div className="w-full">
            <h2 className="cart-title">Our Collection</h2>
            
            {/* Filter buttons */}
            <div className="category-filters">
              {['All', 'Skin Care', 'Body Care'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid list */}
            <div className="product-grid">
              {products
                .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
                .map((p) => {
                  const isWishlisted = wishlist.includes(p.id);
                  // Dynamic badges based on index
                  const isBestseller = p.id === 1 || p.id === 3;
                  const isOrganic = p.id === 2 || p.id === 4 || p.id === 5;
                  
                  return (
                    <div key={p.id} className="product-card-horizontal">
                      {/* Wishlist Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(p.id);
                        }}
                        className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
                        title="Add to Wishlist"
                      >
                        <Heart size={18} fill={isWishlisted ? "var(--rose)" : "none"} />
                      </button>

                      {/* Badges */}
                      <div className="badge-container">
                        {isOutOfStock(p) ? (
                          <span className="badge-pill out-of-stock" style={{ background: '#fee2e2', color: '#dc2626', fontWeight: '700' }}>OUT OF STOCK</span>
                        ) : (
                          <>
                            {p.is_new && <span className="badge-pill new">New</span>}
                            {isBestseller && <span className="badge-pill bestseller">Bestseller</span>}
                            {isOrganic && <span className="badge-pill organic">Organic</span>}
                          </>
                        )}
                      </div>

                      {/* Left: Image Wrap with hover Quick View overlay */}
                      <div className="img-wrap">
                        <img src={p.image_url} alt={p.name} loading="lazy" />
                        <div className="img-overlay" onClick={() => changePage('product-details', { product: p })}>
                          <button className="quickview-trigger">
                            <Eye size={13} />
                            Quick View
                          </button>
                        </div>
                      </div>

                      {/* Right: Info Section */}
                      <div className="info-section">
                        <span className="card-tag">{p.tag}</span>
                        <h3>{p.name}</h3>

                        {/* Rating & Reviews */}
                        <div className="rating-row">
                          <span className="stars">
                            {'★'.repeat(Math.floor(p.rating || 5))}
                            {'☆'.repeat(5 - Math.floor(p.rating || 5))}
                          </span>
                          <span className="reviews">({p.review_count || 0} reviews)</span>
                        </div>

                        {/* Description */}
                        <p className="desc">{p.description}</p>

                        {/* Stock and Price Row */}
                        <div className="status-and-price">
                          <div className={`stock-status ${isOutOfStock(p) ? 'out-of-stock' : 'in-stock'}`} style={isOutOfStock(p) ? { color: '#dc2626' } : {}}>
                            <span className="stock-dot" style={isOutOfStock(p) ? { background: '#dc2626' } : {}}></span>
                            {isOutOfStock(p) ? 'OUT OF STOCK' : (p.stock_status || 'In Stock')}
                          </div>
                          
                          <div className="price-box">
                            <span className="price-curr">₹{p.price}</span>
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="actions-row">
                          <button 
                            onClick={() => addToCart(p)}
                            disabled={isOutOfStock(p)}
                            className="btn-action btn-primary-action"
                            style={isOutOfStock(p) ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--cream-deep)', border: '1px solid var(--cream-deep)', color: 'var(--ink-soft)' } : {}}
                          >
                            <ShoppingCart size={15} />
                            {isOutOfStock(p) ? 'OUT OF STOCK' : 'Add to Cart'}
                          </button>
                          <button 
                            onClick={() => buyNow(p)}
                            disabled={isOutOfStock(p)}
                            className="btn-action btn-accent-action"
                            style={isOutOfStock(p) ? { opacity: 0.5, cursor: 'not-allowed', background: 'var(--cream-deep)', border: '1px solid var(--cream-deep)', color: 'var(--ink-soft)' } : {}}
                          >
                            <CreditCard size={15} />
                            {isOutOfStock(p) ? 'OUT OF STOCK' : 'Buy Now'}
                          </button>
                          <button 
                            onClick={() => changePage('product-details', { product: p })}
                            className="btn-action btn-outline-action"
                          >
                            <Eye size={14} />
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* PAGE 3: CUSTOMER CARE PAGE */}
        {page === 'customercare' && (
          <div className="support-container">
            <div className="support-info">
              <h2>Customer Care</h2>
              <p>
                We are dedicated to providing the best natural cosmetics and customer experience. If you have questions about our ingredients, orders, or custom mixtures, get in touch with us!
              </p>

              <div className="contact-details">
                <div className="contact-item">
                  <PhoneCall className="contact-icon" style={{ width: '20px', height: '20px' }} />
                  <div>
                    <div className="contact-label">Contact Number</div>
                    <div className="contact-val">+91 98765 43210</div>
                  </div>
                </div>
                <div className="contact-item">
                  <User className="contact-icon" style={{ width: '20px', height: '20px' }} />
                  <div>
                    <div className="contact-label">Corporate Office</div>
                    <div className="contact-val">Krishiv Corporation, Gujarat, India</div>
                  </div>
                </div>
              </div>

              <div className="faq-section">
                <h3>Frequently Asked Questions</h3>
                <div className="faq-item">
                  <h4 className="faq-q">Are your products 100% natural?</h4>
                  <p className="faq-a">Yes, all of our products are freshly sourced, sun-dried, and completely chemical and preservative free.</p>
                </div>
                <div className="faq-item">
                  <h4 className="faq-q">How long does shipping take?</h4>
                  <p className="faq-a">Usually 3 to 5 business days across India.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel feedback-form">
              <h3>Send us a Message</h3>
              {ccSubmitted ? (
                <div className="text-center" style={{ padding: '40px 0' }}>
                  <CheckCircle style={{ width: '48px', height: '48px', color: 'var(--sage)', margin: '0 auto 12px' }} />
                  <h4 style={{ fontWeight: '700', fontSize: '18px', marginBottom: '4px' }}>Message Sent!</h4>
                  <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Thank you for contacting us. We will get back to you within 24 hours.</p>
                  <button onClick={() => setCcSubmitted(false)} className="btn-secondary" style={{ marginTop: '24px', padding: '8px 24px', fontSize: '12px' }}>Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleFeedback} className="flex flex-col" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={ccName} onChange={(e) => setCcName(e.target.value)} required className="glass-input" />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={ccEmail} onChange={(e) => setCcEmail(e.target.value)} required className="glass-input" />
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input type="text" value={ccSubject} onChange={(e) => setCcSubject(e.target.value)} className="glass-input" />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea rows="4" value={ccMessage} onChange={(e) => setCcMessage(e.target.value)} required className="glass-input form-textarea"></textarea>
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '12px' }}>Submit Feedback</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* PAGE 4: CART PAGE */}
        {page === 'cart' && (
          <div className="cart-container">
            <h2 className="cart-title">Shopping Cart</h2>
            
            {checkoutSuccess ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                <CheckCircle style={{ width: '64px', height: '64px', color: 'var(--sage)', margin: '0 auto 16px' }} />
                <h3 className="wordmark-kc" style={{ fontSize: '24px', marginBottom: '8px' }}>Order Confirmed!</h3>
                <p style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: '1.6', marginBottom: '24px' }}>
                  Thank you for shopping with Krishiv Corporation. Your order has been placed successfully and is being prepared for dispatch.
                </p>
                <button onClick={() => { setCheckoutSuccess(false); setPage('home'); }} className="btn-primary" style={{ padding: '12px 32px', fontSize: '12px' }}>Continue Shopping</button>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center" style={{ padding: '48px 0' }}>
                <ShoppingBag style={{ width: '64px', height: '64px', color: '#eae0cb', margin: '0 auto 16px' }} />
                <h3 style={{ fontWeight: '600', fontSize: '18px', color: '#5B5346', marginBottom: '8px' }}>Your cart is empty</h3>
                <p style={{ fontSize: '12px', color: '#999', marginBottom: '24px' }}>Looks like you haven't added anything to your cart yet.</p>
                <button onClick={() => setPage('category')} className="btn-primary" style={{ padding: '12px 32px', fontSize: '12px' }}>Browse Collection</button>
              </div>
            ) : (
              <div className="cart-layout">
                <div className="cart-items">
                  {cart.map((item) => {
                    const p = products.find(p => p.id === item.productId);
                    if (!p) return null;
                    return (
                      <div key={item.productId} className="glass-panel cart-item">
                        <div className="cart-img-wrap">
                          <img src={p.image_url} alt={p.name} />
                        </div>
                        <div className="cart-details">
                          <h4 className="cart-name">{p.name}</h4>
                          <span className="cart-tag">{p.tag}</span>
                          <div className="cart-price">₹{p.price}</div>
                        </div>
                        <div className="qty-controls">
                          <button onClick={() => updateCartQuantity(item.productId, -1)} className="qty-btn">-</button>
                          <span className="qty-val">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.productId, 1)} className="qty-btn">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.productId)} className="icon-btn" style={{ color: 'var(--clay)' }} aria-label="Remove item">
                          <Trash2 style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="glass-panel cart-summary">
                  <h3 className="summary-title">Order Summary</h3>
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span style={{ fontWeight: '700', color: 'var(--ink)' }}>
                      ₹{cart.reduce((sum, item) => {
                        const p = products.find(p => p.id === item.productId);
                        return sum + (p ? p.price * item.quantity : 0);
                      }, 0)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span style={{ color: 'var(--sage)', fontWeight: '700' }}>FREE</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>
                      ₹{cart.reduce((sum, item) => {
                        const p = products.find(p => p.id === item.productId);
                        return sum + (p ? p.price * item.quantity : 0);
                      }, 0)}
                    </span>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '12px', marginTop: '16px' }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAGE 5: AUTHENTICATION FLOW PAGES */}
        {page === 'login' && (
          <div className="glass-panel auth-panel" style={{ position: 'relative' }}>
            {authLoading && (
              <div className="auth-loading-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, borderRadius: '16px' }}>
                <div className="spinner" style={{ width: '42px', height: '42px', border: '3px solid var(--cream-deep)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <span style={{ marginTop: '12px', fontSize: '13px', fontWeight: '600', color: 'var(--ink-soft)' }}>Processing request...</span>
              </div>
            )}

            {/* --- VIEW 1: SIGN UP FORM --- */}
            {authMode === 'signup' && (
              <>
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-sub">Join Krishiv Corporation for organic, pure beauty products</p>

                {authError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <ShieldAlert style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div>{authError}</div>
                      {fieldErrors.email === 'An account with this email already exists. Please log in instead.' && (
                        <button
                          type="button"
                          onClick={() => { setLoginIdentifier(regEmail); setAuthMode('login'); setAuthError(''); setFieldErrors({}); }}
                          className="btn-secondary"
                          style={{ marginTop: '8px', padding: '6px 14px', fontSize: '11px' }}
                        >
                          Log In Now
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleInitSignUp} className="flex flex-col" style={{ gap: '14px', marginTop: '12px' }}>
                  {/* Full Name */}
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Full Name</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon-left" />
                      <input
                        type="text"
                        placeholder="e.g. Priyanshu Sharma"
                        value={regName}
                        onChange={(e) => { setRegName(e.target.value); setFieldErrors({ ...fieldErrors, name: '' }); }}
                        className="glass-input glass-input-padded-left"
                      />
                    </div>
                    {fieldErrors.name && <div className="field-error-text"><AlertCircle size={12} /> {fieldErrors.name}</div>}
                  </div>

                  {/* Mobile Number with Country Code */}
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Mobile Number</label>
                    <div className="phone-input-group">
                      <select
                        value={regCountryCode}
                        onChange={(e) => setRegCountryCode(e.target.value)}
                        className="country-code-select"
                      >
                        <option value="+91">🇮🇳 +91</option>
                      </select>
                      <div className="input-with-icon" style={{ flex: 1 }}>
                        <Phone size={18} className="input-icon-left" />
                        <input
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={regPhone}
                          onChange={(e) => { setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setFieldErrors({ ...fieldErrors, phone: '' }); }}
                          className="glass-input glass-input-padded-left"
                        />
                      </div>
                    </div>
                    {fieldErrors.phone && <div className="field-error-text"><AlertCircle size={12} /> {fieldErrors.phone}</div>}
                  </div>

                  {/* Email Address */}
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={18} className="input-icon-left" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={(e) => { setRegEmail(e.target.value); setFieldErrors({ ...fieldErrors, email: '' }); }}
                        className="glass-input glass-input-padded-left"
                      />
                    </div>
                    {fieldErrors.email && <div className="field-error-text"><AlertCircle size={12} /> {fieldErrors.email}</div>}
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon-left" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={regPassword}
                        onChange={(e) => { setRegPassword(e.target.value); setFieldErrors({ ...fieldErrors, password: '' }); }}
                        className="glass-input glass-input-padded-left glass-input-padded-right"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="input-icon-right"
                      >
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {regPassword && (
                      <div className="password-strength-container">
                        {(() => {
                          const evalRes = evaluatePasswordStrength(regPassword);
                          return (
                            <>
                              <div className="strength-bar-track">
                                {[1, 2, 3, 4].map((step) => {
                                  const active = evalRes.score >= (step === 1 ? 1 : step === 2 ? 3 : step === 3 ? 4 : 5);
                                  return (
                                    <div
                                      key={step}
                                      className="strength-bar-segment"
                                      style={{ backgroundColor: active ? evalRes.color : 'rgba(0,0,0,0.08)' }}
                                    />
                                  );
                                })}
                              </div>
                              <div className="strength-label" style={{ color: evalRes.color }}>
                                Strength: {evalRes.label}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* Password Requirements Checklist */}
                    <div className="password-requirements">
                      {(() => {
                        const checks = evaluatePasswordStrength(regPassword).checks;
                        return (
                          <>
                            <div className={`req-item ${checks.length ? 'met' : ''}`}>
                              {checks.length ? <Check size={12} /> : <span style={{ width: 12 }}>•</span>} Min 8 characters
                            </div>
                            <div className={`req-item ${checks.uppercase ? 'met' : ''}`}>
                              {checks.uppercase ? <Check size={12} /> : <span style={{ width: 12 }}>•</span>} One uppercase (A-Z)
                            </div>
                            <div className={`req-item ${checks.lowercase ? 'met' : ''}`}>
                              {checks.lowercase ? <Check size={12} /> : <span style={{ width: 12 }}>•</span>} One lowercase (a-z)
                            </div>
                            <div className={`req-item ${checks.number ? 'met' : ''}`}>
                              {checks.number ? <Check size={12} /> : <span style={{ width: 12 }}>•</span>} One number (0-9)
                            </div>
                            <div className={`req-item ${checks.special ? 'met' : ''}`} style={{ gridColumn: 'span 2' }}>
                              {checks.special ? <Check size={12} /> : <span style={{ width: 12 }}>•</span>} One special character (!@#$%^&*)
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    {fieldErrors.password && <div className="field-error-text"><AlertCircle size={12} /> {fieldErrors.password}</div>}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Confirm Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon-left" />
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={regConfirmPassword}
                        onChange={(e) => { setRegConfirmPassword(e.target.value); setFieldErrors({ ...fieldErrors, confirmPassword: '' }); }}
                        className="glass-input glass-input-padded-left glass-input-padded-right"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="input-icon-right"
                      >
                        {showRegConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {regConfirmPassword && regPassword !== regConfirmPassword && (
                      <div className="field-error-text"><AlertCircle size={12} /> Passwords do not match</div>
                    )}
                    {fieldErrors.confirmPassword && <div className="field-error-text"><AlertCircle size={12} /> {fieldErrors.confirmPassword}</div>}
                  </div>

                  {/* Terms & Privacy Checkbox */}
                  <div style={{ margin: '6px 0' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--ink)' }}>
                      <input
                        type="checkbox"
                        checked={regTermsAccepted}
                        onChange={(e) => { setRegTermsAccepted(e.target.checked); setFieldErrors({ ...fieldErrors, terms: '' }); }}
                        style={{ marginTop: '2px', accentColor: 'var(--gold)' }}
                      />
                      <span>
                        I agree to the <button type="button" onClick={() => setPage('terms')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: '600', cursor: 'pointer', padding: 0 }}>Terms & Conditions</button> and Privacy Policy
                      </span>
                    </label>
                    {fieldErrors.terms && <div className="field-error-text"><AlertCircle size={12} /> {fieldErrors.terms}</div>}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={authLoading || !regTermsAccepted}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '13px', marginTop: '6px', opacity: (authLoading || !regTermsAccepted) ? 0.6 : 1 }}
                  >
                    Register & Verify Email
                  </button>
                </form>

                <div className="auth-separator">OR</div>

                {/* Social Sign-Up */}
                <div className="social-btn-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
                  {!isGoogleClientConfigured ? (
                    <button
                      onClick={() => setAuthError('Google Sign-In is currently unavailable. Please configure Google Client credentials.')}
                      className="btn-social"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </button>
                  ) : (
                    <div id="google-signin-button-div" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
                  )}
                </div>

                <div className="auth-toggle" style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
                  Already have an account?{' '}
                  <button onClick={() => { setAuthMode('login'); setAuthError(''); setFieldErrors({}); }} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: '600', cursor: 'pointer' }}>
                    Sign In
                  </button>
                </div>
              </>
            )}

            {/* --- VIEW 2: SIGNUP EMAIL OTP VERIFICATION --- */}
            {authMode === 'verify-otp' && (
              <>
                <h2 className="auth-title">Verify Your Email</h2>
                <p className="auth-sub">We've sent a 6-digit verification code to <strong>{targetEmail}</strong></p>

                {authError && (
                  <div className="alert alert-danger" style={{ marginBottom: '12px' }}>
                    <ShieldAlert style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifySignUpOtp} className="flex flex-col" style={{ alignItems: 'center' }}>
                  <div className="otp-input-container" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="otp-box"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || otpDigits.join('').length !== 6}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '13px', marginTop: '12px', opacity: (authLoading || otpDigits.join('').length !== 6) ? 0.6 : 1 }}
                  >
                    Verify & Complete Registration
                  </button>
                </form>

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                    Didn't receive the code?{' '}
                    {canResendOtp ? (
                      <button
                        type="button"
                        onClick={handleResendSignUpOtp}
                        style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Resend Code
                      </button>
                    ) : (
                      <span>Resend in {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ArrowLeft size={14} /> Back to Registration
                  </button>
                </div>
              </>
            )}

            {/* --- VIEW 3: LOGIN FORM --- */}
            {authMode === 'login' && (
              <>
                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-sub">Sign in to access your saved cart, orders & account</p>

                {authError && (
                  <div className="alert alert-danger" style={{ marginBottom: '12px' }}>
                    <ShieldAlert style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col" style={{ gap: '14px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Email Address or Mobile Number</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon-left" />
                      <input
                        type="text"
                        placeholder="Email or 10-digit Mobile Number"
                        value={loginIdentifier}
                        onChange={(e) => { setLoginIdentifier(e.target.value); setFieldErrors({ ...fieldErrors, identifier: '' }); }}
                        className="glass-input glass-input-padded-left"
                      />
                    </div>
                    {fieldErrors.identifier && <div className="field-error-text"><AlertCircle size={12} /> {fieldErrors.identifier}</div>}
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon-left" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setFieldErrors({ ...fieldErrors, password: '' }); }}
                        className="glass-input glass-input-padded-left glass-input-padded-right"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="input-icon-right"
                      >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {fieldErrors.password && <div className="field-error-text"><AlertCircle size={12} /> {fieldErrors.password}</div>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ accentColor: 'var(--gold)' }}
                      />
                      <span>Remember Me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot-email'); setAuthError(''); setFieldErrors({}); }}
                      style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Cloudflare Turnstile CAPTCHA Security Widget */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '6px 0 8px' }}>
                    <div id="cf-turnstile-container"></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                      <ShieldCheck size={14} style={{ color: 'var(--sage)' }} />
                      <span>Protected by <strong>Cloudflare Turnstile CAPTCHA</strong></span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '13px', marginTop: '2px' }}
                  >
                    Sign In
                  </button>
                </form>

                <div className="auth-separator">OR</div>

                <div className="social-btn-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
                  {!isGoogleClientConfigured ? (
                    <button
                      onClick={() => setAuthError('Google Sign-In is currently unavailable. Please configure Google Client credentials.')}
                      className="btn-social"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </button>
                  ) : (
                    <div id="google-signin-button-div" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
                  )}
                </div>

                <div className="auth-toggle" style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
                  Don't have an account?{' '}
                  <button onClick={() => { setAuthMode('signup'); setAuthError(''); setFieldErrors({}); }} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: '600', cursor: 'pointer' }}>
                    Create Account
                  </button>
                </div>
              </>
            )}

            {/* --- VIEW 4: FORGOT PASSWORD - ENTER EMAIL --- */}
            {authMode === 'forgot-email' && (
              <>
                <h2 className="auth-title">Reset Password</h2>
                <p className="auth-sub">Enter your registered email address to receive a verification code</p>

                {authError && (
                  <div className="alert alert-danger" style={{ marginBottom: '12px' }}>
                    <ShieldAlert style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleForgotEmailSubmit} className="flex flex-col" style={{ gap: '14px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={18} className="input-icon-left" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => { setForgotEmail(e.target.value); setFieldErrors({ ...fieldErrors, email: '' }); }}
                        className="glass-input glass-input-padded-left"
                      />
                    </div>
                    {fieldErrors.email && <div className="field-error-text"><AlertCircle size={12} /> {fieldErrors.email}</div>}
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '13px', marginTop: '6px' }}
                  >
                    Send Verification Code
                  </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                </div>
              </>
            )}

            {/* --- VIEW 5: FORGOT PASSWORD - VERIFY OTP --- */}
            {authMode === 'forgot-otp' && (
              <>
                <h2 className="auth-title">Verify Reset Code</h2>
                <p className="auth-sub">Enter the 6-digit code sent to <strong>{targetEmail}</strong></p>

                {authError && (
                  <div className="alert alert-danger" style={{ marginBottom: '12px' }}>
                    <ShieldAlert style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleForgotOtpVerify} className="flex flex-col" style={{ alignItems: 'center' }}>
                  <div className="otp-input-container" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="otp-box"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || otpDigits.join('').length !== 6}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '13px', marginTop: '12px', opacity: (authLoading || otpDigits.join('').length !== 6) ? 0.6 : 1 }}
                  >
                    Verify Reset Code
                  </button>
                </form>

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                    Didn't receive the code?{' '}
                    {canResendOtp ? (
                      <button
                        type="button"
                        onClick={async () => {
                          setAuthLoading(true);
                          try {
                            const res = await fetch(`${API_BASE_URL}/auth/forgot-password/resend-otp`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: targetEmail }),
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              setDemoOtpNote(data.otpForDemo || '');
                              setOtpTimer(60);
                              setCanResendOtp(false);
                              showToast('A new reset code has been sent.');
                            }
                          } finally { setAuthLoading(false); }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Resend Code
                      </button>
                    ) : (
                      <span>Resend in {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                </div>
              </>
            )}

            {/* --- VIEW 6: FORGOT PASSWORD - CREATE NEW PASSWORD --- */}
            {authMode === 'forgot-reset' && (
              <>
                <h2 className="auth-title">Create New Password</h2>
                <p className="auth-sub">Enter a strong new password for your account</p>

                {authError && (
                  <div className="alert alert-danger" style={{ marginBottom: '12px' }}>
                    <ShieldAlert style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleForgotResetSubmit} className="flex flex-col" style={{ gap: '14px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>New Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon-left" />
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={forgotNewPassword}
                        onChange={(e) => { setForgotNewPassword(e.target.value); setFieldErrors({ ...fieldErrors, newPassword: '' }); }}
                        className="glass-input glass-input-padded-left glass-input-padded-right"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="input-icon-right"
                      >
                        {showForgotNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {forgotNewPassword && (
                      <div className="password-strength-container">
                        {(() => {
                          const evalRes = evaluatePasswordStrength(forgotNewPassword);
                          return (
                            <>
                              <div className="strength-bar-track">
                                {[1, 2, 3, 4].map((step) => {
                                  const active = evalRes.score >= (step === 1 ? 1 : step === 2 ? 3 : step === 3 ? 4 : 5);
                                  return (
                                    <div
                                      key={step}
                                      className="strength-bar-segment"
                                      style={{ backgroundColor: active ? evalRes.color : 'rgba(0,0,0,0.08)' }}
                                    />
                                  );
                                })}
                              </div>
                              <div className="strength-label" style={{ color: evalRes.color }}>
                                Strength: {evalRes.label}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                    {fieldErrors.newPassword && <div className="field-error-text"><AlertCircle size={12} /> {fieldErrors.newPassword}</div>}
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Confirm New Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon-left" />
                      <input
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        value={forgotConfirmPassword}
                        onChange={(e) => { setForgotConfirmPassword(e.target.value); setFieldErrors({ ...fieldErrors, confirmPassword: '' }); }}
                        className="glass-input glass-input-padded-left glass-input-padded-right"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        className="input-icon-right"
                      >
                        {showForgotConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {forgotConfirmPassword && forgotNewPassword !== forgotConfirmPassword && (
                      <div className="field-error-text"><AlertCircle size={12} /> Passwords do not match</div>
                    )}
                    {fieldErrors.confirmPassword && <div className="field-error-text"><AlertCircle size={12} /> {fieldErrors.confirmPassword}</div>}
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '13px', marginTop: '6px' }}
                  >
                    Reset Password & Sign In
                  </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* PAGE 6: COMPREHENSIVE TERMS OF SERVICE & LEGAL DISCLAIMER PAGE */}
        {page === 'terms' && (
          <div className="glass-panel terms-panel" style={{ padding: '40px', maxWidth: '900px', margin: '40px auto', borderRadius: '24px', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}>
            
            {/* Header Banner */}
            <div style={{ textDecoration: 'none', borderBottom: '2px solid var(--cream-deep)', paddingBottom: '24px', marginBottom: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Legal & Statutory Compliance Document
              </div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: 'var(--ink)', margin: '0 0 10px' }}>
                Terms of Service & Copyright Notice
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0, lineHeight: '1.6' }}>
                <strong>KRISHIV CORPORATION</strong> — 100% Pure Organic Cosmetics & Herbal Powders<br />
                GSTIN: <strong>24APTPK3284N1Z6</strong> | Jurisdiction: Surat, Gujarat, India
              </p>
            </div>

            <div className="terms-content" style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontSize: '13.5px', color: 'var(--ink)', lineHeight: '1.7' }}>
              
              {/* Section 1: Copyright Reservation */}
              <section className="terms-section" style={{ background: 'rgba(255,255,255,0.4)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '18px', fontFamily: 'Playfair Display, serif', color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers style={{ width: '22px', height: '22px', color: 'var(--gold)' }} />
                  1. Intellectual Property & Legal Copyright Reservation
                </h3>
                <p style={{ margin: '0 0 10px' }}>
                  All content, brand names, product formulations, packaging concepts, logos, trademarks, design tokens, source code, text, graphics, photographs, and digital assets published on this website are the sole and exclusive property of <strong>KRISHIV CORPORATION</strong>.
                </p>
                <div style={{ background: 'var(--cream-deep)', padding: '12px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12.5px', color: 'var(--ink)' }}>
                  © 2026 KRISHIV CORPORATION. ALL RIGHTS RESERVED.
                </div>
                <p style={{ margin: '10px 0 0', fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                  Unauthorized reproduction, distribution, scraping, modification, mirroring, or commercial exploitation of any material without explicit prior written consent from Krishiv Corporation is strictly prohibited under the Indian Copyright Act, 1957 and international intellectual property treaties.
                </p>
              </section>

              {/* Section 2: Strict No Refund / Return / Cancellation Policy */}
              <section className="terms-section" style={{ background: '#fef2f2', padding: '24px', borderRadius: '16px', border: '1.5px solid #fca5a5' }}>
                <h3 style={{ fontSize: '18px', fontFamily: 'Playfair Display, serif', color: '#991b1b', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert style={{ width: '22px', height: '22px', color: '#dc2626' }} />
                  2. Strict No Refund, No Return & No Cancellation Policy
                </h3>
                <p style={{ margin: '0 0 10px', color: '#7f1d1d', fontWeight: '700' }}>
                  ALL SALES EXECUTED WITH KRISHIV CORPORATION ARE FINAL.
                </p>
                <p style={{ margin: '0 0 10px', color: '#7f1d1d' }}>
                  Once an order is placed, confirmed, or paid for (via Razorpay Online or Cash on Delivery), <strong>no cancellations, refunds, returns, or product exchanges</strong> will be accepted under any circumstances.
                </p>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#991b1b' }}>
                  <em>Rationale:</em> Due to strict hygiene, safety, and quality standards for personal care, botanical clays, and organic beauty products, items cannot be restocked or returned once dispatched from our fulfillment facility.
                </p>
              </section>

              {/* Section 3: Statutory Indian GST Slabs */}
              <section className="terms-section" style={{ background: 'rgba(255,255,255,0.4)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '18px', fontFamily: 'Playfair Display, serif', color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText style={{ width: '22px', height: '22px', color: 'var(--gold)' }} />
                  3. Pricing & Statutory Goods and Services Tax (GST)
                </h3>
                <p style={{ margin: '0 0 10px' }}>
                  All prices listed on the website are in Indian Rupees (₹) and subject to statutory Indian GST regulations:
                </p>
                <ul style={{ margin: '0 0 10px', paddingLeft: '20px' }}>
                  <li><strong>Cosmetics & Waxes (HSN 3304 / 3305):</strong> Subject to <strong>18% GST</strong> (9% CGST + 9% SGST for Gujarat; 18% IGST for Inter-State).</li>
                  <li><strong>Ayurvedic & Herbal Powders (HSN 3004 / 1211):</strong> Subject to <strong>5% GST</strong> (2.5% CGST + 2.5% SGST for Gujarat; 5% IGST for Inter-State).</li>
                </ul>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                  Itemized tax invoices featuring our GSTIN (24APTPK3284N1Z6) are generated and issued with every order.
                </p>
              </section>

              {/* Section 4: Logistics & India Post Shipping */}
              <section className="terms-section" style={{ background: 'rgba(255,255,255,0.4)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '18px', fontFamily: 'Playfair Display, serif', color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BookOpen style={{ width: '22px', height: '22px', color: 'var(--gold)' }} />
                  4. Shipping Rules & India Post Tracking
                </h3>
                <p style={{ margin: '0 0 10px' }}>
                  Shipping charges are calculated dynamically based on regional delivery state and cart subtotal tiers (Gujarat vs Outside Gujarat). All orders are dispatched via our logistics partner, <strong>India Post</strong>.
                </p>
                <p style={{ margin: '0 0 10px' }}>
                  Upon dispatch, customers receive an official email containing their unique <strong>India Post Consignment Tracking ID</strong> (`CPxxxxxxxxxIN`) and direct portal link to track their shipment on the official India Post portal. Status is set to <strong>ON ESTIMATE / IN TRANSIT</strong> during delivery.
                </p>
              </section>

              {/* Section 5: Natural Ingredients & Patch Test Disclaimer */}
              <section className="terms-section" style={{ background: 'rgba(255,255,255,0.4)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '18px', fontFamily: 'Playfair Display, serif', color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck style={{ width: '22px', height: '22px', color: 'var(--gold)' }} />
                  5. Natural Product Variation & Patch Test Medical Disclaimer
                </h3>
                <p style={{ margin: '0 0 10px' }}>
                  Our formulations are 100% natural, organic, and free from synthetic preservatives. Minor natural variations in color, texture, and botanical aroma between harvest batches may occur and do not indicate a defect.
                </p>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                  <strong>Mandatory Patch Test:</strong> Natural ingredients can trigger individual allergic reactions in sensitive skin types. Customers are strictly advised to conduct a 24-hour skin patch test on their elbow before full application. Krishiv Corporation holds no liability for individual skin sensitivities or misuse.
                </p>
              </section>

              {/* Section 6: Governing Law & Jurisdiction */}
              <section className="terms-section" style={{ background: 'rgba(255,255,255,0.4)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '18px', fontFamily: 'Playfair Display, serif', color: 'var(--ink)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Lock style={{ width: '22px', height: '22px', color: 'var(--gold)' }} />
                  6. Governing Law & Legal Jurisdiction
                </h3>
                <p style={{ margin: 0 }}>
                  These Terms of Service shall be governed by and construed in accordance with the Laws of the Republic of India. Any legal dispute, claim, or judicial proceeding arising out of website usage or product purchases shall be subject to the exclusive jurisdiction of the competent courts in <strong>Surat, Gujarat, India</strong>.
                </p>
              </section>

              {/* Section 7: Corporate Support Info */}
              <div style={{ textAlign: 'center', marginTop: '12px', paddingTop: '20px', borderTop: '1px dashed var(--cream-deep)', fontSize: '12px', color: 'var(--ink-soft)' }}>
                <strong>KRISHIV CORPORATION</strong><br />
                GSTIN: 24APTPK3284N1Z6 | Surat, Gujarat, India<br />
                Official Support: <a href="mailto:krishivcorporation4513@gmail.com" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: '700' }}>krishivcorporation4513@gmail.com</a>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 7: UNIFIED ACCOUNT DASHBOARD PAGE */}
        {['profile', 'orders', 'wishlist', 'addresses', 'payments', 'settings'].includes(page) && user && (
          <div className="glass-panel account-dashboard-panel" style={{ padding: '40px', maxWidth: '1000px', margin: '40px auto', borderRadius: '24px', minHeight: '500px', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(90, 62, 26, 0.05)' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: 'var(--ink)', marginBottom: '24px' }}>My Account Dashboard</h2>
            <div className="responsive-account-grid">
              {/* Sidebar Tabs */}
              <div className="account-sidebar" style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '8px', borderRight: '1.5px solid var(--cream-deep)', paddingRight: '20px' }}>
                <button onClick={() => setPage('profile')} style={{ background: page === 'profile' ? 'var(--cream-deep)' : 'none', border: 'none', padding: '12px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'var(--ink)', transition: 'all 0.2s' }}>
                  My Profile
                </button>
                <button onClick={() => setPage('orders')} style={{ background: page === 'orders' ? 'var(--cream-deep)' : 'none', border: 'none', padding: '12px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'var(--ink)', transition: 'all 0.2s' }}>
                  My Orders
                </button>
                <button onClick={() => setPage('wishlist')} style={{ background: page === 'wishlist' ? 'var(--cream-deep)' : 'none', border: 'none', padding: '12px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'var(--ink)', transition: 'all 0.2s' }}>
                  Wishlist ({wishlist.length})
                </button>
                <button onClick={() => setPage('addresses')} style={{ background: page === 'addresses' ? 'var(--cream-deep)' : 'none', border: 'none', padding: '12px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'var(--ink)', transition: 'all 0.2s' }}>
                  Saved Addresses
                </button>
                <button onClick={() => setPage('payments')} style={{ background: page === 'payments' ? 'var(--cream-deep)' : 'none', border: 'none', padding: '12px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'var(--ink)', transition: 'all 0.2s' }}>
                  Payment Methods
                </button>
                <button onClick={() => setPage('settings')} style={{ background: page === 'settings' ? 'var(--cream-deep)' : 'none', border: 'none', padding: '12px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'var(--ink)', transition: 'all 0.2s' }}>
                  Account Settings
                </button>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', padding: '12px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'var(--clay)', transition: 'all 0.2s', marginTop: 'auto' }}>
                  Logout
                </button>
              </div>

              {/* Tab Contents */}
              <div className="account-tab-content" style={{ flex: 1, paddingLeft: '10px' }}>
                {page === 'profile' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' }}>Profile Information</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }} />
                      ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--cream-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', border: '2px solid var(--gold)', color: 'var(--ink)' }}>
                          {(user.name || user.email).substring(0,2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--ink)' }}>{user.name || 'Registered Customer'}</h4>
                        <p style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="responsive-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>FULL NAME</label>
                        <input type="text" className="glass-input" value={user.name || ''} readOnly style={{ background: 'rgba(255,255,255,0.2)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>EMAIL ADDRESS</label>
                        <input type="email" className="glass-input" value={user.email} readOnly style={{ background: 'rgba(255,255,255,0.2)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>ACCOUNT TYPE</label>
                        <input type="text" className="glass-input" value={user.provider ? `${user.provider.toUpperCase()} Auth` : 'Email/Password'} readOnly style={{ background: 'rgba(255,255,255,0.2)' }} />
                      </div>
                    </div>
                  </div>
                )}

                {page === 'orders' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' }}>Order History</h3>
                    {userOrders.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-soft)' }}>
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                          <line x1="8" y1="21" x2="16" y2="21"></line>
                          <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        <p style={{ fontSize: '13px', color: 'var(--ink-soft)', fontWeight: '600' }}>You have not placed any orders yet.</p>
                        <button className="btn-primary" onClick={() => setPage('category')} style={{ padding: '8px 16px', fontSize: '11px' }}>
                          Browse Products
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {userOrders.map(order => (
                          <div key={order.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.3)', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--cream-deep)', paddingBottom: '8px' }}>
                              <div>
                                <span style={{ fontSize: '10px', color: 'var(--ink-soft)', fontWeight: '700', display: 'block' }}>ORDER ID</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '12px', color: 'var(--ink)' }}>{order.id}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '10px', color: 'var(--ink-soft)', fontWeight: '700', display: 'block' }}>DATE</span>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ink)' }}>{new Date(order.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Total Amount:</span>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ink)', marginLeft: '6px' }}>₹{order.total}</span>
                                <div style={{ marginTop: '4px' }}>
                                  <span style={{ 
                                    fontSize: '11px', 
                                    fontWeight: '700', 
                                    padding: '3px 10px', 
                                    borderRadius: '10px', 
                                    textTransform: 'uppercase',
                                    background: order.status === 'cancelled' ? '#fee2e2' : (order.status === 'delivered' ? '#dcfce7' : (['shipped', 'out_for_delivery'].includes(order.status) ? '#e0e7ff' : '#fef3c7')),
                                    color: order.status === 'cancelled' ? '#dc2626' : (order.status === 'delivered' ? '#15803d' : (['shipped', 'out_for_delivery'].includes(order.status) ? '#4338ca' : '#b45309'))
                                  }}>
                                    Status: {(order.status || 'placed').replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  onClick={() => { setActiveOrder(order); setPage('order-details'); }}
                                  className="btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '11px' }}
                                >
                                  View Details
                                </button>
                                <button 
                                  onClick={() => { setActiveOrder(order); setPage('track-order'); }}
                                  className="btn-primary" 
                                  style={{ padding: '6px 12px', fontSize: '11px' }}
                                >
                                  Track Order
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {page === 'wishlist' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' }}>My Wishlist</h3>
                    {wishlist.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                        <Heart size={36} style={{ color: 'var(--ink-soft)' }} />
                        <p style={{ fontSize: '13px', color: 'var(--ink-soft)', fontWeight: '600' }}>Your wishlist is empty.</p>
                        <button className="btn-primary" onClick={() => setPage('category')} style={{ padding: '8px 16px', fontSize: '11px' }}>
                          Add items
                        </button>
                      </div>
                    ) : (
                      <div className="responsive-wishlist-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {wishlist.map(item => {
                          const p = products.find(prod => prod.id === item.id);
                          if (!p) return null;
                          return (
                            <div key={item.id} className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.3)', border: '1px solid var(--glass-border)' }}>
                              <img src={p.image_url} alt={p.name} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }}>{p.name}</span>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gold)' }}>₹{p.price}</span>
                              </div>
                              <button onClick={() => addToCart(p)} className="btn-primary" style={{ alignSelf: 'center', padding: '6px 12px', fontSize: '10px' }}>
                                Add to Cart
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {page === 'addresses' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' }}>Delivery Addresses</h3>
                    {(() => {
                      const lastShipping = userOrders.find(o => o.items?.shipping)?.items?.shipping;
                      if (lastShipping) {
                        return (
                          <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.3)', border: '1px solid var(--gold)', position: 'relative' }}>
                            <span style={{ position: 'absolute', right: '16px', top: '16px', fontSize: '10px', fontWeight: '700', background: 'var(--gold)', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>DEFAULT</span>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ink)', marginBottom: '8px' }}>{lastShipping.name || 'Primary Delivery Address'}</h4>
                            <p style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: '1.6', margin: 0 }}>
                              {lastShipping.address}<br />
                              {lastShipping.city}, {lastShipping.state} - {lastShipping.zip}<br />
                              Phone: {lastShipping.phone}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div style={{ padding: '30px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0 }}>No saved delivery addresses found. Your address will automatically save here when you place your first order.</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {page === 'payments' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' }}>Saved Payment Methods</h3>
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.3)' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', marginBottom: '6px' }}>Zero Saved Card Liability</h4>
                      <p style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: '1.5', margin: 0 }}>
                        For your security, card numbers are never stored on our servers. Online payments (UPI, Credit/Debit Cards, NetBanking, Wallets) are processed securely per transaction via Razorpay PCI-DSS Level 1 Gateway.
                      </p>
                    </div>
                  </div>
                )}

                {page === 'settings' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' }}>Security Settings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--cream-deep)' }}>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }}>Two-Factor Authentication</h4>
                          <p style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Enable two-factor authentication for extra security.</p>
                        </div>
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '10px', background: 'var(--sage)' }}>Enable</button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--cream-deep)' }}>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }}>Linked Identity</h4>
                          <p style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Linked via Google Identity Services.</p>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--sage)', fontWeight: '700' }}>ACTIVE</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAGE 8: CHECKOUT PAGE */}
        {page === 'checkout' && (
          <div className="checkout-container" style={{ padding: '40px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: 'var(--ink)', marginBottom: '24px', textAlign: 'center' }}>Checkout</h2>
            
            {checkoutSuccess ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '450px', margin: '40px auto', borderRadius: '18px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
                <CheckCircle style={{ width: '64px', height: '64px', color: 'var(--sage)', margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: 'var(--ink)', marginBottom: '8px' }}>Order Placed Successfully!</h3>
                <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: '1.6', marginBottom: '24px' }}>
                  Thank you for shopping with Krishiv Cosmetics. Your organic beauty package is being processed and will be delivered shortly.
                </p>
                <button 
                  onClick={() => { setCheckoutSuccess(false); setPage('home'); }} 
                  className="btn-primary" 
                  style={{ padding: '12px 32px', fontSize: '12px' }}
                >
                  Continue Shopping
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center" style={{ padding: '48px 0', textAlign: 'center' }}>
                <ShoppingBag style={{ width: '64px', height: '64px', color: '#eae0cb', margin: '0 auto 16px' }} />
                <h3 style={{ fontWeight: '600', fontSize: '18px', color: '#5B5346', marginBottom: '8px' }}>Your cart is empty</h3>
                <p style={{ fontSize: '12px', color: '#999', marginBottom: '24px' }}>Please add some organic items to your cart before checking out.</p>
                <button onClick={() => setPage('category')} className="btn-primary" style={{ padding: '12px 32px', fontSize: '12px' }}>Browse Collection</button>
              </div>
            ) : (
              <div className="responsive-checkout-grid">
                {/* Left Side: Shipping & Payment Form */}
                <div className="glass-panel" style={{ padding: '30px', borderRadius: '18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--ink)', borderBottom: '1.5px solid var(--cream-deep)', paddingBottom: '10px', margin: 0 }}>Shipping Address</h3>
                  <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (!shippingName.trim() || !shippingEmail.trim() || !shippingPhone.trim() || !shippingAddress.trim() || !shippingCity.trim() || !shippingState.trim() || !shippingZip.trim()) {
                      alert('Please fill in all mandatory shipping address fields marked with *');
                      return;
                    }
                    if (!/^[0-9]{10}$/.test(shippingPhone.trim())) {
                      alert('Please enter a valid 10-digit mobile number');
                      return;
                    }
                    placeOrder({ name: shippingName, email: shippingEmail, phone: shippingPhone, address: shippingAddress, city: shippingCity, state: shippingState, zip: shippingZip }); 
                  }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="responsive-form-row-3">
                      <div className="form-group">
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
                          FULL NAME <span style={{ color: '#dc2626', fontWeight: '800' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          placeholder="John Doe" 
                          value={shippingName} 
                          onChange={(e) => setShippingName(e.target.value)} 
                          className="glass-input" 
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
                          EMAIL ADDRESS <span style={{ color: '#dc2626', fontWeight: '800' }}>*</span>
                        </label>
                        <input 
                          type="email" 
                          required 
                          placeholder="customer@example.com" 
                          value={shippingEmail} 
                          onChange={(e) => setShippingEmail(e.target.value)} 
                          className="glass-input" 
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
                          MOBILE NUMBER <span style={{ color: '#dc2626', fontWeight: '800' }}>*</span>
                        </label>
                        <input 
                          type="tel" 
                          required 
                          pattern="[0-9]{10}"
                          placeholder="9876543210" 
                          value={shippingPhone} 
                          onChange={(e) => setShippingPhone(e.target.value)} 
                          className="glass-input" 
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
                        STREET ADDRESS <span style={{ color: '#dc2626', fontWeight: '800' }}>*</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder="123 Organic Lane" 
                        value={shippingAddress} 
                        onChange={(e) => setShippingAddress(e.target.value)} 
                        className="glass-input" 
                      />
                    </div>
                    <div className="responsive-form-row-3">
                      <div className="form-group">
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
                          CITY <span style={{ color: '#dc2626', fontWeight: '800' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Bangalore" 
                          value={shippingCity} 
                          onChange={(e) => setShippingCity(e.target.value)} 
                          className="glass-input" 
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
                          STATE <span style={{ color: '#dc2626', fontWeight: '800' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Karnataka" 
                          value={shippingState} 
                          onChange={(e) => setShippingState(e.target.value)} 
                          className="glass-input" 
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
                          PIN CODE <span style={{ color: '#dc2626', fontWeight: '800' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          placeholder="560038" 
                          value={shippingZip} 
                          onChange={(e) => setShippingZip(e.target.value)} 
                          className="glass-input" 
                        />
                      </div>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--ink)', borderBottom: '1.5px solid var(--cream-deep)', paddingBottom: '10px', margin: '20px 0 0' }}>Payment Method</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* RAZORPAY ONLINE PAYMENT */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', background: paymentMethod === 'razorpay' ? 'rgba(143, 130, 105, 0.08)' : 'rgba(255,255,255,0.4)', border: paymentMethod === 'razorpay' ? '2px solid var(--gold)' : '1px solid var(--glass-border)', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="payment" 
                          value="razorpay" 
                          checked={paymentMethod === 'razorpay'} 
                          onChange={() => setPaymentMethod('razorpay')} 
                          style={{ accentColor: 'var(--gold)' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--ink)' }}>Razorpay Online Payment (UPI, Cards, NetBanking)</span>
                            <span style={{ fontSize: '10px', fontWeight: '700', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '6px' }}>SECURE & INSTANT</span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--ink-soft)', margin: '4px 0 0', lineHeight: '1.4' }}>
                            Pay securely via <strong>UPI (GPay / PhonePe / Paytm / BHIM), Credit Card, Debit Card, NetBanking & Wallets</strong>.
                          </p>
                        </div>
                      </label>

                      {/* CASH ON DELIVERY (COD) */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', background: paymentMethod === 'cod' ? 'rgba(143, 130, 105, 0.08)' : 'rgba(255,255,255,0.4)', border: paymentMethod === 'cod' ? '2px solid var(--gold)' : '1px solid var(--glass-border)', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="payment" 
                          value="cod" 
                          checked={paymentMethod === 'cod'} 
                          onChange={() => setPaymentMethod('cod')} 
                          style={{ accentColor: 'var(--gold)' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--ink)' }}>Cash on Delivery (COD)</span>
                            <span style={{ fontSize: '10px', fontWeight: '700', background: '#b45309', color: '#fff', padding: '2px 8px', borderRadius: '6px' }}>+₹30 COD FEE</span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--ink-soft)', margin: '4px 0 0', lineHeight: '1.4' }}>
                            Pay cash at your doorstep upon delivery. Additional COD fee of ₹30 applies.
                          </p>
                        </div>
                      </label>
                    </div>

                    {paymentMethod === 'cod' && (
                      <div style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', marginTop: '6px' }}>
                        ℹ️ COD fee of ₹30 has been added. Complete final amount is displayed in the Order Summary.
                      </div>
                    )}

                    {/* Terms of Service - No Refund / Cancellation / Return Policy */}
                    <div style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--glass-border)', padding: '14px 16px', borderRadius: '12px', marginTop: '12px' }}>
                      <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
                        <input 
                          type="checkbox" 
                          checked={tosAccepted} 
                          onChange={e => setTosAccepted(e.target.checked)} 
                          style={{ accentColor: 'var(--gold)', marginTop: '2px', width: '16px', height: '16px', flexShrink: 0 }} 
                        />
                        <span style={{ fontSize: '11.5px', color: 'var(--ink-soft)', lineHeight: '1.5' }}>
                          I agree to the <strong style={{ color: 'var(--ink)' }}>Terms of Service</strong>. I understand and accept that all sales are <strong style={{ color: '#dc2626' }}>final</strong>. 
                          This store does <strong style={{ color: '#dc2626' }}>not offer refunds, cancellations, returns, or exchanges</strong> once the order is placed. 
                          By proceeding, I confirm that I have reviewed my order details and agree to these terms.
                        </span>
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={!tosAccepted}
                      style={{ 
                        padding: '14px', 
                        width: '100%', 
                        fontSize: '13px', 
                        marginTop: '16px',
                        opacity: tosAccepted ? 1 : 0.5,
                        cursor: tosAccepted ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {paymentMethod === 'cod' ? 'Confirm & Place Order (COD)' : 'Proceed to Pay & Place Order'}
                    </button>
                  </form>
                </div>

                {/* Right Side: Order Review Summary */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--ink)', borderBottom: '1.5px solid var(--cream-deep)', paddingBottom: '10px', margin: 0 }}>Review Order</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {cart.map(item => {
                      const p = products.find(prod => prod.id === item.productId);
                      if (!p) return null;
                      return (
                        <div key={item.productId} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <img src={p.image_url} alt={p.name} style={{ width: '45px', height: '45px', objectFit: 'contain', background: 'var(--cream)', borderRadius: '8px', padding: '2px', border: '1px solid var(--cream-deep)' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Qty: {item.quantity} × ₹{p.price}</div>
                          </div>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--ink)' }}>₹{p.price * item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>

                  {(() => {
                    const subtotal = cart.reduce((sum, item) => {
                      const p = products.find(prod => prod.id === item.productId);
                      return sum + (p ? p.price * item.quantity : 0);
                    }, 0);
                    
                    const calc = calculateClientShipping(subtotal, shippingState, paymentMethod, storeSettings);
                    const amountNeededForFree = 499 - subtotal;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1.5px solid var(--cream-deep)', paddingTop: '16px' }}>
                        {/* Subtotal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-soft)' }}>
                          <span>Subtotal</span>
                          <span>₹{subtotal}</span>
                        </div>

                        {/* Delivery Charge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-soft)' }}>
                          <span>Delivery Charge ({calc.isGujarat ? 'Gujarat' : 'Outside Gujarat'})</span>
                          <span style={{ fontWeight: calc.delivery === 0 ? '800' : '600', color: calc.delivery === 0 ? '#10b981' : 'inherit' }}>
                            {calc.delivery === 0 ? 'FREE' : `₹${calc.delivery}`}
                          </span>
                        </div>

                        {/* Free Shipping Nudge / Badge */}
                        {subtotal < 499 ? (
                          <div style={{ fontSize: '11px', color: '#8f8269', fontWeight: '700', background: 'rgba(143, 130, 105, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                            💡 Add ₹{amountNeededForFree} more to get FREE delivery
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#166534', fontWeight: '700', background: '#dcfce7', padding: '6px 10px', borderRadius: '6px' }}>
                            🎉 FREE DELIVERY APPLIED
                          </div>
                        )}

                        {/* COD Fee (Only if COD) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: calc.codFee > 0 ? '#b45309' : 'var(--ink-soft)', fontWeight: calc.codFee > 0 ? '700' : 'normal' }}>
                          <span>COD Fee</span>
                          <span>{calc.codFee > 0 ? `₹${calc.codFee}` : '₹0'}</span>
                        </div>

                        {/* Tax */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-soft)' }}>
                          <span>Tax ({calc.effectiveGstRate || 18}% GST)</span>
                          <span>₹{calc.tax}</span>
                        </div>

                        {/* Grand Total */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', color: 'var(--ink)', borderTop: '1px dashed var(--cream-deep)', paddingTop: '10px', marginTop: '4px' }}>
                          <span>Grand Total</span>
                          <span>₹{calc.total}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAGE 9: ORDER DETAILS PAGE */}
        {page === 'order-details' && (
          !activeOrder ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
              <div className="glass-panel" style={{ padding: '40px', borderRadius: '18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <ShieldAlert style={{ width: '64px', height: '64px', color: 'var(--clay)', margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: 'var(--ink)', marginBottom: '8px' }}>Order Not Found</h3>
                <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '24px' }}>We couldn't retrieve the details for this order. Please try selecting an order from your account dashboard.</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={() => setPage('orders')} className="btn-primary" style={{ padding: '12px 24px', fontSize: '12px' }}>View My Orders</button>
                  <button onClick={() => setPage('category')} className="btn-secondary" style={{ padding: '12px 24px', fontSize: '12px' }}>Browse Collection</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="order-details-container" style={{ padding: '40px 24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
              {(() => {
                const isCancelled = activeOrder.status === 'cancelled';
                const itemsList = Array.isArray(activeOrder.items) 
                  ? activeOrder.items 
                  : (activeOrder.items?.cartItems || []);
                const shippingInfo = activeOrder.items?.shipping || {};
                const payRaw = activeOrder.items?.payment;
                const paymentMethodName = (typeof payRaw === 'string' ? payRaw : (payRaw?.method || 'cod')).toString().toLowerCase();
                const isOnlinePayment = paymentMethodName.includes('card') || paymentMethodName.includes('online') || paymentMethodName.includes('razorpay');
                
                const subtotal = itemsList.reduce((sum, item) => {
                  const pId = Number(item.productId || item.id);
                  const p = products.find(prod => prod.id === pId) || item;
                  return sum + ((p.price || 0) * (item.quantity || 1));
                }, 0);
                const delivery = subtotal > 500 ? 0 : 50;
                const tax = Math.round(subtotal * 0.05);
                const discount = 0;

                const isCancellable = !isCancelled && !['shipped', 'out_for_delivery', 'delivered'].includes(activeOrder.status?.toLowerCase());

                return (
                  <div className="glass-panel" style={{ padding: '30px', borderRadius: '18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Top Banner */}
                    <div style={{ textAlign: 'center', borderBottom: '1.5px solid var(--cream-deep)', paddingBottom: '24px' }}>
                      {isCancelled ? (
                        <>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#dc2626', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
                            <X style={{ width: '16px', height: '16px' }} /> ORDER CANCELLED
                          </div>
                          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: 'var(--ink)', margin: '0 0 8px' }}>Order Cancelled</h2>
                          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0 }}>This order was cancelled by customer.</p>
                        </>
                      ) : (
                        <>
                          <CheckCircle style={{ width: '56px', height: '56px', color: 'var(--sage)', margin: '0 auto 12px' }} />
                          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: 'var(--ink)', margin: '0 0 8px' }}>Order Placed Successfully!</h2>
                          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0 }}>Thank you for your order. A confirmation has been sent to your account.</p>
                        </>
                      )}
                    </div>

                    {/* Order Meta Info */}
                    <div className="responsive-order-meta" style={{ display: 'grid', gridTemplateColumns: isCancelled ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.4)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '12.5px' }}>
                      <div>
                        <span style={{ color: 'var(--ink-soft)', fontWeight: '700', fontSize: '10.5px', display: 'block', marginBottom: '2px' }}>ORDER ID</span>
                        <span style={{ fontWeight: '700', color: 'var(--ink)', fontFamily: 'monospace', fontSize: '13px' }}>{activeOrder.id}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--ink-soft)', fontWeight: '700', fontSize: '10.5px', display: 'block', marginBottom: '2px' }}>ORDER DATE</span>
                        <span style={{ fontWeight: '700', color: 'var(--ink)' }}>{activeOrder.created_at ? new Date(activeOrder.created_at).toLocaleString() : new Date().toLocaleString()}</span>
                      </div>
                      {isCancelled ? (
                        <>
                          <div>
                            <span style={{ color: 'var(--ink-soft)', fontWeight: '700', fontSize: '10.5px', display: 'block', marginBottom: '2px' }}>CANCELLED DATE</span>
                            <span style={{ fontWeight: '700', color: 'var(--clay)' }}>{activeOrder.cancelled_at ? new Date(activeOrder.cancelled_at).toLocaleString() : 'Recently'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--ink-soft)', fontWeight: '700', fontSize: '10.5px', display: 'block', marginBottom: '2px' }}>REASON</span>
                            <span style={{ fontWeight: '700', color: 'var(--ink)' }}>Cancelled by customer</span>
                          </div>
                        </>
                      ) : (
                        <div>
                          <span style={{ color: 'var(--ink-soft)', fontWeight: '700', fontSize: '10.5px', display: 'block', marginBottom: '2px' }}>ESTIMATED DELIVERY</span>
                          <span style={{ fontWeight: '700', color: 'var(--sage)' }}>
                            {(() => {
                              const d = activeOrder.created_at ? new Date(activeOrder.created_at) : new Date();
                              d.setDate(d.getDate() + 4);
                              return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Refund Notice for Cancelled Orders */}
                    {isCancelled && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '12px', fontSize: '13px', color: '#991b1b' }}>
                        <h4 style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '13.5px' }}>Refund & Status Details</h4>
                        {isOnlinePayment ? (
                          <p style={{ margin: 0 }}>Your refund of ₹{activeOrder.total} has been initiated. Refund will be processed back to your original payment method within 5–7 business days.</p>
                        ) : (
                          <p style={{ margin: 0 }}>Order cancelled successfully. Since this order was Cash on Delivery (COD), no payment was collected.</p>
                        )}
                      </div>
                    )}

                    {/* Visual Tracker Timeline (Only for Active Orders) */}
                    {!isCancelled && (() => {
                      const currentStatus = (activeOrder.status || 'placed').toLowerCase();
                      const statusRanks = { placed: 0, confirmed: 1, preparing: 2, packed: 3, shipped: 4, out_for_delivery: 5, delivered: 6 };
                      const currentRank = statusRanks[currentStatus] !== undefined ? statusRanks[currentStatus] : 1;
                      const progressPercent = Math.min(100, Math.max(15, Math.round(((currentRank + 1) / 7) * 100)));

                      return (
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--ink)', marginBottom: '16px' }}>Order Status: <span style={{ color: 'var(--sage)', textTransform: 'uppercase' }}>{(activeOrder.status || 'placed').replace(/_/g, ' ')}</span></h3>
                          <div className="responsive-order-stepper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '0 10px' }}>
                            <div style={{ position: 'absolute', top: '15px', left: '30px', right: '30px', height: '4px', background: 'var(--cream-deep)', zIndex: 1 }}></div>
                            <div style={{ position: 'absolute', top: '15px', left: '30px', width: `${progressPercent}%`, height: '4px', background: 'var(--sage)', zIndex: 2, transition: 'width 0.4s ease' }}></div>

                            {[
                              { label: 'Order Placed', rank: 0 },
                              { label: 'Confirmed', rank: 1 },
                              { label: 'Preparing', rank: 2 },
                              { label: 'Shipped', rank: 4 },
                              { label: 'Out for Delivery', rank: 5 },
                              { label: 'Delivered', rank: 6 }
                            ].map((step, idx) => {
                              const isActive = currentRank >= step.rank;
                              return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 3, width: '80px', textAlign: 'center' }}>
                                  <div style={{ 
                                    width: '30px', 
                                    height: '30px', 
                                    borderRadius: '50%', 
                                    background: isActive ? 'var(--sage)' : 'var(--cream)', 
                                    color: isActive ? 'white' : 'var(--ink-soft)', 
                                    border: isActive ? '2px solid var(--sage)' : '2px solid var(--cream-deep)',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontWeight: '700', 
                                    fontSize: '11px',
                                    marginBottom: '8px',
                                    transition: 'all 0.3s'
                                  }}>
                                    {isActive ? '✓' : idx + 1}
                                  </div>
                                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: isActive ? 'var(--ink)' : 'var(--ink-soft)', lineHeight: '1.2' }}>{step.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Items List */}
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--ink)', marginBottom: '12px', borderBottom: '1px solid var(--cream-deep)', paddingBottom: '6px' }}>Items Ordered</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {itemsList.map((item, idx) => {
                          const pId = Number(item.productId || item.id);
                          const p = products.find(prod => prod.id === pId) || item;
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--cream-deep)' }}>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <img src={p.image_url || '/images/orange_peel.png'} alt={p.name || 'Product'} style={{ width: '48px', height: '48px', objectFit: 'contain', background: 'var(--cream)', borderRadius: '8px', padding: '2px', border: '1px solid var(--cream-deep)' }} />
                                <div>
                                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', margin: 0 }}>{p.name || `Product #${pId}`}</h4>
                                  <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Qty: {item.quantity || 1} × ₹{p.price || 0}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }}>₹{(p.price || 0) * (item.quantity || 1)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shipping and Payment Info */}
                    <div className="responsive-shipping-payment-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                      {/* Shipping Details */}
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--ink)', marginBottom: '12px', borderBottom: '1px solid var(--cream-deep)', paddingBottom: '6px' }}>Shipping Details</h3>
                        <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', lineHeight: '1.6' }}>
                          <p style={{ margin: '0 0 4px', fontWeight: '700', color: 'var(--ink)' }}>{shippingInfo.name || 'Customer'}</p>
                          <p style={{ margin: '0 0 4px' }}>Phone: {shippingInfo.phone || 'N/A'}</p>
                          <p style={{ margin: '0 0 4px' }}>{shippingInfo.address || 'N/A'}</p>
                          <p style={{ margin: 0 }}>{shippingInfo.city || ''}{shippingInfo.state ? `, ${shippingInfo.state}` : ''}{shippingInfo.zip ? ` - ${shippingInfo.zip}` : ''}</p>
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--ink)', marginBottom: '12px', borderBottom: '1px solid var(--cream-deep)', paddingBottom: '6px' }}>Payment Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}>
                            <span>Payment Method</span>
                            <span style={{ fontWeight: '700', color: 'var(--ink)' }}>{paymentMethodName.toUpperCase()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}>
                            <span>Payment Status</span>
                            <span style={{ fontWeight: '700', color: isCancelled ? 'var(--clay)' : 'var(--sage)' }}>{isCancelled ? 'CANCELLED' : 'CONFIRMED'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)', borderTop: '1px dashed var(--cream-deep)', paddingTop: '8px', marginTop: '4px' }}>
                            <span>Subtotal</span>
                            <span>₹{subtotal}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}>
                            <span>Delivery Charges</span>
                            <span>{subtotal > 500 ? 'FREE' : '₹50'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}>
                            <span>Tax ({subtotal > 0 && tax > 0 ? Math.round((tax / subtotal) * 100) : 18}% GST)</span>
                            <span>₹{tax}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14.5px', fontWeight: '700', color: 'var(--ink)', borderTop: '1.5px solid var(--cream-deep)', paddingTop: '8px', marginTop: '4px' }}>
                            <span>Grand Total</span>
                            <span>₹{activeOrder.total}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                      {!isCancelled && (
                        <button onClick={() => setPage('track-order')} className="btn-primary" style={{ padding: '12px 24px', fontSize: '12px' }}>Track Order</button>
                      )}
                      <button onClick={handleDownloadInvoice} className="btn-secondary" style={{ padding: '12px 24px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CreditCard style={{ width: '14px', height: '14px' }} /> Download Invoice
                      </button>
                      <button onClick={() => setPage('orders')} className="btn-secondary" style={{ padding: '12px 24px', fontSize: '12px' }}>View My Orders</button>
                      <button onClick={() => setPage('category')} className="btn-secondary" style={{ padding: '12px 24px', fontSize: '12px' }}>Continue Shopping</button>
                    </div>

                  </div>
                );
              })()}
            </div>
          )
        )}

        {/* PAGE 10: TRACK ORDER PAGE */}
        {page === 'track-order' && (
          !activeOrder ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
              <div className="glass-panel" style={{ padding: '40px', borderRadius: '18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <ShieldAlert style={{ width: '64px', height: '64px', color: 'var(--clay)', margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: 'var(--ink)', marginBottom: '8px' }}>Order Tracking Unavailable</h3>
                <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '24px' }}>Please select a valid order from your Account Dashboard to track its status.</p>
                <button onClick={() => setPage('orders')} className="btn-primary" style={{ padding: '12px 24px', fontSize: '12px' }}>View My Orders</button>
              </div>
            </div>
          ) : (
            <div className="track-order-container" style={{ padding: '40px 24px', maxWidth: '650px', margin: '0 auto', width: '100%' }}>
              <div className="glass-panel" style={{ padding: '30px', borderRadius: '18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--cream-deep)', paddingBottom: '16px' }}>
                  <button onClick={() => setPage('order-details')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', color: 'var(--ink)' }}>
                    <ArrowLeft style={{ width: '20px', height: '20px' }} />
                  </button>
                  <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: 'var(--ink)', margin: 0 }}>Track Order</h2>
                </div>

                {/* Basic Tracking Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', background: 'rgba(255,255,255,0.3)', padding: '12px 16px', borderRadius: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--ink-soft)', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>ORDER ID</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--ink)' }}>{activeOrder.id}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--ink-soft)', display: 'block', fontSize: '10.5px', fontWeight: '700' }}>STATUS</span>
                    <span style={{ fontWeight: '700', color: (activeOrder.trackingId || activeOrder.tracking_id || activeOrder.status === 'on_estimate') ? '#10b981' : 'var(--sage)', textTransform: 'uppercase' }}>
                      {(activeOrder.trackingId || activeOrder.tracking_id || activeOrder.status === 'on_estimate') ? 'ON ESTIMATE (IN TRANSIT)' : (activeOrder.status || 'PLACED').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* India Post Tracking Card (If Admin attached tracking ID) */}
                {(activeOrder.trackingId || activeOrder.tracking_id) && (
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', padding: '18px 20px', borderRadius: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      📮 India Post Tracking Consignment ID
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#166534', fontFamily: 'monospace', margin: '8px 0', letterSpacing: '2px' }}>
                      {activeOrder.trackingId || activeOrder.tracking_id}
                    </div>
                    <p style={{ fontSize: '12px', color: '#15803d', margin: '0 0 12px' }}>
                      Estimated Delivery: 3 – 5 Business Days via India Post
                    </p>
                    <a 
                      href={activeOrder.trackingUrl || "https://www.indiapost.gov.in/"} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-primary" 
                      style={{ display: 'inline-block', padding: '10px 20px', fontSize: '12px', background: '#10b981', borderColor: '#10b981', textDecoration: 'none' }}
                    >
                      Track Consignment on India Post ↗
                    </a>
                  </div>
                )}

                {/* Stepper */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px 0 10px 20px', position: 'relative' }}>
                  {(() => {
                    const currentStatus = (activeOrder.status || 'placed').toLowerCase();
                    const statusRanks = { placed: 0, confirmed: 1, preparing: 2, packed: 3, shipped: 4, on_estimate: 5, out_for_delivery: 5, delivered: 6 };
                    const currentRank = (activeOrder.trackingId || activeOrder.tracking_id) ? 5 : (statusRanks[currentStatus] !== undefined ? statusRanks[currentStatus] : 1);
                    const progressHeight = Math.min(100, Math.max(15, Math.round(((currentRank + 1) / 7) * 100)));

                    const trackingSteps = [
                      { title: 'Order Placed', rank: 0, desc: 'Your order has been logged and confirmed by Krishiv Corporation.' },
                      { title: 'Payment Confirmed', rank: 1, desc: 'Payment received and verified successfully.' },
                      { title: 'Preparing & Packing', rank: 2, desc: 'Fresh organic formulation sourced and packed.' },
                      { title: 'Dispatched via India Post', rank: 4, desc: 'Consignment handed over to India Post.' },
                      { title: 'Status: On Estimate (In Transit)', rank: 5, desc: 'Package is in transit via India Post with active consignment ID.' },
                      { title: 'Delivered', rank: 6, desc: 'Package delivered at your doorstep.' }
                    ];

                    return (
                      <>
                        <div style={{ position: 'absolute', top: '20px', bottom: '20px', left: '33px', width: '3px', background: 'var(--cream-deep)' }}></div>
                        <div style={{ position: 'absolute', top: '20px', height: `${progressHeight}%`, left: '33px', width: '3px', background: 'var(--sage)', transition: 'height 0.4s ease' }}></div>

                        {trackingSteps.map((step, idx) => {
                          const isActive = currentRank >= step.rank;
                          return (
                            <div key={idx} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 2 }}>
                              <div style={{ 
                                width: '28px', 
                                height: '28px', 
                                borderRadius: '50%', 
                                background: isActive ? 'var(--sage)' : 'var(--cream)', 
                                border: isActive ? '2px solid var(--sage)' : '2px solid var(--cream-deep)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: isActive ? 'white' : 'var(--ink-soft)',
                                fontWeight: '700',
                                fontSize: '11px',
                                flexShrink: 0,
                                transition: 'all 0.3s'
                              }}>
                                {isActive ? '✓' : idx + 1}
                              </div>

                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                  <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: isActive ? 'var(--ink)' : 'var(--ink-soft)', margin: 0 }}>{step.title}</h4>
                                  <span style={{ fontSize: '10.5px', color: isActive ? 'var(--sage)' : 'var(--ink-soft)', fontWeight: '700' }}>
                                    {isActive ? 'COMPLETED' : 'PENDING'}
                                  </span>
                                </div>
                                <p style={{ fontSize: '11.5px', color: 'var(--ink-soft)', margin: 0, lineHeight: '1.4' }}>{step.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>

                {/* Terms Policy Disclaimer Banner */}
                <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', background: 'rgba(255,255,255,0.4)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  ℹ️ <strong>Store Policy:</strong> Orders placed with Krishiv Corporation are non-cancellable, non-returnable, and non-refundable.
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setPage('order-details')} className="btn-secondary" style={{ padding: '12px', width: '100%', fontSize: '12px' }}>
                    Back to Order Details
                  </button>
                </div>

              </div>
            </div>
          )
        )}



      </main>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ background: '#FFFFFF', borderRadius: '24px' }}>
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="modal-close"
              aria-label="Close details"
            >
              <X style={{ width: '20px', height: '20px', color: 'var(--ink)' }} />
            </button>

            <div className="modal-img-wrap">
              <img src={selectedProduct.image_url} alt={selectedProduct.name} />
            </div>

            <div className="modal-info">
              <span className="tag">{selectedProduct.tag}</span>
              <h3>{selectedProduct.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span className="price">₹{selectedProduct.price}</span>
                {isOutOfStock(selectedProduct) && (
                  <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>OUT OF STOCK</span>
                )}
              </div>
              
              <div className="modal-scroll">
                <h4>Description</h4>
                <p>{selectedProduct.description}</p>

                {selectedProduct.ingredients && (
                  <>
                    <h4>Ingredients</h4>
                    <p>{selectedProduct.ingredients}</p>
                  </>
                )}

                {selectedProduct.usage && (
                  <>
                    <h4>How to Use</h4>
                    <p>{selectedProduct.usage}</p>
                  </>
                )}
              </div>

               <button 
                onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                disabled={isOutOfStock(selectedProduct)}
                className="btn-primary"
                style={{ padding: '12px', fontSize: '12px', width: '100%', marginTop: 'auto', opacity: isOutOfStock(selectedProduct) ? 0.5 : 1, cursor: isOutOfStock(selectedProduct) ? 'not-allowed' : 'pointer' }}
              >
                <ShoppingBag style={{ width: '16px', height: '16px' }} /> {isOutOfStock(selectedProduct) ? 'OUT OF STOCK' : 'Add to Shopping Cart'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aesthetic Footer */}
      <footer className="glass-panel app-footer">
        <p>© 2026 Krishiv Corporation. Purity in Motion. All Rights Reserved.</p>
        <div className="footer-links">
          <button onClick={() => setPage('terms')}>Terms & Conditions</button>
          <span>•</span>
          <button onClick={() => setPage('customercare')}>Customer Support</button>
        </div>
      </footer>

      {/* Sliding Cart Drawer Overlay */}
      <div className={`cart-drawer-overlay ${isCartDrawerOpen ? 'open' : ''}`} onClick={() => setIsCartDrawerOpen(false)}>
        <div className="cart-drawer cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
          <div className="cart-drawer-header">
            <h3 className="cart-drawer-title">Shopping Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})</h3>
            <button className="cart-drawer-close" onClick={() => setIsCartDrawerOpen(false)}>
              <X size={24} />
            </button>
          </div>
          
          <div className="cart-drawer-body">
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
                <ShoppingBag size={48} style={{ color: 'var(--ink-soft)', opacity: 0.5 }} />
                <p style={{ fontSize: '15px', color: 'var(--ink-soft)', fontWeight: '600' }}>Your cart is empty</p>
                <button className="btn-primary" onClick={() => setIsCartDrawerOpen(false)} style={{ padding: '10px 24px', fontSize: '12px' }}>
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={clearCart}
                  style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: 'var(--clay)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear Cart
                </button>
                {cart.map(item => {
                  const p = products.find(prod => prod.id === item.productId);
                  if (!p) return null;
                  return (
                    <div key={item.productId} className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.4)', position: 'relative' }}>
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        style={{ width: '70px', height: '70px', objectFit: 'contain', background: 'var(--cream)', borderRadius: '8px', padding: '4px', border: '1px solid var(--cream-deep)' }} 
                      />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                          <button 
                            onClick={() => removeFromCart(item.productId)}
                            style={{ background: 'none', border: 'none', color: 'var(--clay)', cursor: 'pointer', padding: '2px' }}
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                          Stock: <span style={{ fontWeight: '600', color: p.stock_qty <= 5 ? 'var(--clay)' : 'var(--sage)' }}>{p.stock_status} ({p.stock_qty} left)</span>
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--cream-deep)', borderRadius: '20px', background: 'var(--cream)', padding: '2px' }}>
                            <button 
                              onClick={() => updateCartQuantity(item.productId, -1)}
                              style={{ border: 'none', background: 'none', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--ink)' }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '12px', fontWeight: '700', width: '20px', textAlign: 'center', color: 'var(--ink)' }}>{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.productId, 1)}
                              style={{ border: 'none', background: 'none', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--ink)' }}
                            >
                              +
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink)' }}>₹{p.price * item.quantity}</span>
                            <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>₹{p.price} each</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
          
          {cart.length > 0 && (() => {
            const subtotal = cart.reduce((sum, item) => {
              const p = products.find(prod => prod.id === item.productId);
              return sum + (p ? p.price * item.quantity : 0);
            }, 0);
            
            const calc = calculateClientShipping(subtotal, shippingState, paymentMethod, storeSettings);
            const amountNeededForFree = 499 - subtotal;

            return (
              <div className="cart-drawer-footer">
                {/* Free Delivery Banner / Nudge */}
                <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '10px', background: subtotal >= 499 ? '#dcfce7' : 'rgba(143, 130, 105, 0.12)', border: subtotal >= 499 ? '1px solid #86efac' : '1px solid rgba(143, 130, 105, 0.2)', textAlign: 'center' }}>
                  {subtotal >= 499 ? (
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#15803d' }}>
                      🎉 FREE DELIVERY APPLIED
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink)' }}>
                      🚚 Add <strong>₹{amountNeededForFree}</strong> more to get <strong>FREE delivery</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--cream-deep)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-soft)' }}>
                    <span>Total Items</span>
                    <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-soft)' }}>
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-soft)' }}>
                    <span>Delivery Charges</span>
                    <span>
                      {calc.hasState ? (
                        calc.delivery === 0 ? <strong style={{ color: '#10b981' }}>FREE</strong> : `₹${calc.delivery}`
                      ) : (
                        <span style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--ink-soft)' }}>
                          Delivery charges calculated at checkout
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-soft)' }}>
                    <span>Tax ({calc.effectiveGstRate || 18}% GST)</span>
                    <span>₹{calc.tax}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '700', color: 'var(--ink)', margin: '8px 0' }}>
                  <span>Final Total</span>
                  <span>₹{calc.total}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setIsCartDrawerOpen(false)}
                    className="btn-primary" 
                    style={{ flex: 1, padding: '12px', fontSize: '11px', background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--ink)' }}
                  >
                    Continue Shopping
                  </button>
                  <button 
                    onClick={() => {
                      setIsCartDrawerOpen(false);
                      setPage('checkout');
                    }}
                    className="btn-primary" 
                    style={{ flex: 1, padding: '12px', fontSize: '11px' }}
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sage)' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            {toast.message}
          </div>
        ))}
      </div>

      {/* COD Confirmation Modal */}
      {showCodConfirmModal && pendingCodShipping && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', border: '1px solid var(--cream-deep)', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--ink)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📦 Confirm Cash on Delivery Order
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Please review and confirm your <strong>Cash on Delivery (COD)</strong> order details below:
            </p>
            <div style={{ background: '#FAF7EE', padding: '14px', borderRadius: '10px', border: '1px solid var(--cream-deep)', marginBottom: '16px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Recipient Name:</span>
                <strong style={{ color: 'var(--ink)' }}>{pendingCodShipping.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Contact Phone:</span>
                <strong style={{ color: 'var(--ink)' }}>{pendingCodShipping.phone}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Total Amount Payable:</span>
                <strong style={{ color: 'var(--ink)', fontSize: '14px' }}>₹{cartTotal.grandTotal}</strong>
              </div>
              <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '10px', borderTop: '1px dashed #fca5a5', paddingTop: '8px', lineHeight: '1.4' }}>
                ⚠️ <strong>Notice:</strong> Per Krishiv Corporation policy, orders placed via COD cannot be cancelled after confirmation.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setShowCodConfirmModal(false); setPendingCodShipping(null); }}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--cream-deep)', background: '#f8fafc', color: 'var(--ink)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Go Back
              </button>
              <button 
                onClick={() => executeCodOrder(pendingCodShipping)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'var(--clay)', color: '#fff', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
              >
                Confirm & Place COD Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
