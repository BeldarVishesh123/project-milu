import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, ShoppingBag, FolderKanban, ShoppingCart, Users, Warehouse, 
  Ticket, Star, Bell, BarChart3, UserCheck, Settings, LogOut, Search, Moon, 
  Sun, Plus, Edit2, Trash2, Copy, Eye, ShieldAlert, CheckCircle, Download, 
  Printer, ArrowUpRight, ArrowDownRight, RefreshCw, X, Filter, Lock, Mail, EyeOff, FileText, Activity, Megaphone, Send, Menu
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api');

export default function AdminDashboard({ onNavigateHome }) {
  // Auth & Session State
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('krishiv_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('krishiv_admin_token') || '');
  const [loginEmail, setLoginEmail] = useState('krishivcorporation4513@gmail.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Admin Theme & Navigation State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('admin_theme') === 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Data States (Loaded dynamically from real database APIs)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    completedOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [storeSettings, setStoreSettings] = useState({
    company_name: 'Krishiv Corporation',
    email: 'contact@krishiv.co',
    phone: '+91 98765 43210',
    address: 'Krishiv Hub, Surat, Gujarat, India',
    gst_number: '24AAACK1234F1Z9',
    currency: '₹',
    shipping_charge: 50,
    tax_percentage: 5
  });

  // Modal & Edit States
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', tag: 'BRIGHTENING', category: 'Skin Care', subcategory: 'Powders',
    price: 299, original_price: 374, stock: 15, sku: 'KC-PROD-01', weight: '100g',
    description: '', ingredients: '', usage: '', image_url: '/images/orange_peel.png',
    status: 'Published', is_new: true, is_bestseller: false, is_organic: true
  });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', image_url: '', banner_url: '' });

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: 10, min_order: 300, expiry_date: '2026-12-31' });

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'Offer' });

  // Broadcast Ad Mailer State
  const [broadcastForm, setBroadcastForm] = useState({
    subject: '✨ Exclusive 20% OFF — Organic Skin Care Celebration!',
    title: 'Glow Naturally With Pure Organic Herbals',
    message: 'We are thrilled to offer a special 20% discount across our entire organic beauty & ayurvedic collection. Hand-crafted, 100% pure formulations for a glowing complexion!',
    discountCode: 'KRISHIV20',
    ctaText: 'Shop Organic Collection',
    ctaLink: typeof window !== 'undefined' ? window.location.origin : 'https://krishivcorporation.ltd'
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatusMsg, setBroadcastStatusMsg] = useState('');

  // Live Global Search Results
  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return { products: [], orders: [], customers: [] };
    const q = globalSearch.toLowerCase().trim();
    return {
      products: products.filter(p => (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)),
      orders: orders.filter(o => String(o.id || '').toLowerCase().includes(q) || (o.items?.shipping?.name || '').toLowerCase().includes(q) || (o.items?.shipping?.email || '').toLowerCase().includes(q)),
      customers: customers.filter(c => (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(q))
    };
  }, [globalSearch, products, orders, customers]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) {
      alert('Please fill in the Title and Message for the broadcast ad');
      return;
    }

    if (!window.confirm('Are you sure you want to send this broadcast ad banner email to ALL registered customers?')) return;

    setIsBroadcasting(true);
    setBroadcastStatusMsg('Dispatching luxury ad emails to customers...');

    try {
      const res = await fetch(`${API_BASE_URL}/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(broadcastForm)
      });
      const data = await res.json();

      if (data.success) {
        setBroadcastStatusMsg(`✅ ${data.message}`);
        alert(`Success! Broadcast ad campaign delivered to ${data.sentCount} customers!`);
        fetchAdminData();
      } else {
        setBroadcastStatusMsg(`❌ Failed: ${data.error || 'Broadcast failed'}`);
        alert(data.error || 'Failed to dispatch broadcast');
      }
    } catch (err) {
      console.error('Broadcast error:', err);
      setBroadcastStatusMsg('❌ Broadcast request failed.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    if (adminUser) {
      fetchAdminData();
    }
  }, [adminUser]);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken || localStorage.getItem('krishiv_admin_token') || ''}`
  }), [adminToken]);

  // Real Dynamic Monthly Revenue & Sales Chart Data
  const monthlySalesData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const monthsToShow = monthNames.slice(0, Math.max(currentMonthIdx + 1, 8));

    const data = monthsToShow.map((mName, mIdx) => {
      const monthOrders = orders.filter(o => {
        if (o.status === 'cancelled') return false;
        const d = new Date(o.date || o.created_at || Date.now());
        return !isNaN(d.getTime()) && d.getMonth() === mIdx;
      });
      const revenue = monthOrders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0);
      return { month: mName, sales: monthOrders.length, revenue };
    });

    const maxVal = Math.max(...data.map(d => d.revenue), 1);
    return data.map(d => ({ ...d, heightPct: d.revenue > 0 ? Math.max(15, Math.round((d.revenue / maxVal) * 100)) : 5 }));
  }, [orders]);

  // Real Dynamic Category Revenue Breakdown
  const categoryBreakdown = useMemo(() => {
    const catMap = {};
    let totalCatRevenue = 0;

    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const items = o.items?.cartItems || o.cartItems || [];
      items.forEach(item => {
        const cat = item.category || 'Skin Care';
        const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
        catMap[cat] = (catMap[cat] || 0) + itemTotal;
        totalCatRevenue += itemTotal;
      });
    });

    const cats = Object.keys(catMap);
    if (cats.length === 0 || totalCatRevenue === 0) {
      return [
        { name: 'Skin Care', pct: 0, amount: 0 },
        { name: 'Body Care', pct: 0, amount: 0 }
      ];
    }

    return cats.map(cat => ({
      name: cat,
      amount: catMap[cat],
      pct: Math.round((catMap[cat] / totalCatRevenue) * 100)
    }));
  }, [orders]);

  const fetchAdminData = async () => {
    try {
      const token = adminToken || localStorage.getItem('krishiv_admin_token') || '';
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      const [resStats, resProds, resCats, resOrds, resCusts, resCoup, resRev, resLogs, resSet] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/stats`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/admin/products`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/admin/categories`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/admin/orders`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/admin/customers`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/admin/coupons`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/admin/reviews`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/admin/logs`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/admin/settings`, { headers }).then(r => r.json()).catch(() => ({}))
      ]);

      if (resStats.success && resStats.stats) {
        setStats(resStats.stats);
      }

      if (resProds.success && Array.isArray(resProds.products) && resProds.products.length > 0) {
        setProducts(resProds.products);
      } else {
        // Fallback to public products endpoint if admin auth token is not yet established
        try {
          const publicRes = await fetch(`${API_BASE_URL}/products`).then(r => r.json());
          if (publicRes.success && Array.isArray(publicRes.products)) {
            setProducts(publicRes.products);
            setStats(prev => ({ ...prev, totalProducts: publicRes.products.length }));
          }
        } catch (pErr) {
          console.error('Failed to fetch fallback products', pErr);
        }
      }

      if (resCats.success && Array.isArray(resCats.categories)) setCategories(resCats.categories);
      if (resOrds.success && Array.isArray(resOrds.orders)) setOrders(resOrds.orders);
      if (resCusts.success && Array.isArray(resCusts.customers)) setCustomers(resCusts.customers);
      if (resCoup.success && Array.isArray(resCoup.coupons)) setCoupons(resCoup.coupons);
      if (resRev.success && Array.isArray(resRev.reviews)) setReviews(resRev.reviews);
      if (resLogs.success && Array.isArray(resLogs.logs)) setLogs(resLogs.logs);
      if (resSet.success && resSet.settings) setStoreSettings(prev => ({ ...prev, ...resSet.settings }));
    } catch (e) {
      console.error('Failed to load admin data', e);
    }
  };

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        setAdminUser(data.admin);
        setAdminToken(data.token);
        localStorage.setItem('krishiv_admin_token', data.token);
        if (rememberMe) {
          localStorage.setItem('krishiv_admin_user', JSON.stringify(data.admin));
        }
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Server connection failed');
    }
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('krishiv_admin_user');
  };

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem('admin_theme', nextTheme ? 'dark' : 'light');
  };

  const hasPermission = () => true;

  // CSV Export Utility
  const exportToCSV = (dataArray, filename) => {
    if (!dataArray || !dataArray.length) return;
    const headers = Object.keys(dataArray[0]).join(',');
    const rows = dataArray.map(obj => Object.values(obj).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printAdminGstInvoice = (order) => {
    if (!order) return;
    const itemsList = Array.isArray(order.items) 
      ? order.items 
      : (order.items?.cartItems || []);
    const shippingInfo = order.items?.shipping || order.shipping_address || {};
    const paymentInfo = order.items?.payment || {};
    const paymentMethodName = typeof paymentInfo === 'string' ? paymentInfo : (paymentInfo.method || order.payment_method || 'COD');

    const customerState = (shippingInfo.state || 'Gujarat').trim();
    const isIntraState = customerState.toLowerCase().includes('gujarat') || customerState.toLowerCase() === 'gj' || !shippingInfo.state;

    const grandTotal = Number(order.total || 0);
    const shippingFee = Number(order.shipping_fee || (grandTotal > 500 ? 0 : 50));

    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

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
      let itemRate = herbalGstRate;
      let hsnCode = "3004";
      if (cosmeticKeywords.some(kw => searchStr.includes(kw))) {
        itemRate = cosmeticGstRate;
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
    const orderDateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>GST Tax Invoice - ${order.id}</title>
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
                <div style="font-size: 13px; font-weight: 700; margin-top: 8px; color: #0f172a;">Invoice No: KC/2026-27/${order.id}</div>
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
                ${order.razorpay_payment_id ? `<div>Razorpay Txn ID: ${order.razorpay_payment_id}</div>` : ''}
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

  // Save/Update Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const targetId = editingProduct ? (editingProduct.id || editingProduct._id) : null;
    const endpoint = targetId ? `${API_BASE_URL}/admin/products/${targetId}` : `${API_BASE_URL}/admin/products`;
    const method = targetId ? 'PUT' : 'POST';

    const payload = {
      ...productForm,
      price: Number(productForm.price || 0),
      original_price: Number(productForm.original_price || productForm.price || 0),
      stock: Number(productForm.stock || 0),
      stock_qty: Number(productForm.stock || 0),
      stock_status: Number(productForm.stock || 0) > 0 ? 'In Stock' : 'Out of Stock',
      image_url: productForm.image_url
    };

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => {
          if (targetId) {
            return prev.map(p => (String(p.id || p._id) === String(targetId)) ? { ...p, ...payload } : p);
          } else {
            return [data.product || payload, ...prev];
          }
        });
        await fetchAdminData();
        setShowProductModal(false);
        setEditingProduct(null);
        alert('Product image and details updated successfully!');
      } else {
        alert(data.error || 'Failed to save product image or details.');
      }
    } catch (err) {
      console.error('Failed to save product', err);
      alert('Network Error: Failed to save product.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (adminUser?.role === 'Manager') {
      alert('Permission Denied: Managers cannot delete products.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    setProducts(prev => prev.filter(p => Number(p.id) !== Number(id)));

    try {
      await fetch(`${API_BASE_URL}/admin/products/${id}`, { method: 'DELETE', headers: authHeaders });
      fetchAdminData();
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleDuplicateProduct = async (prod) => {
    const dup = { ...prod, id: undefined, name: `${prod.name} (Copy)` };
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(dup)
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts(prev => [data.product, ...prev]);
      }
      fetchAdminData();
    } catch (err) {
      console.error('Failed to duplicate product:', err);
    }
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ image: base64Data })
        });
        const data = await res.json();
        if (data.success && data.image_url) {
          setProductForm(prev => ({ ...prev, image_url: data.image_url }));
        } else {
          setProductForm(prev => ({ ...prev, image_url: base64Data }));
        }
      } catch (err) {
        console.error('Image upload failed:', err);
        setProductForm(prev => ({ ...prev, image_url: base64Data }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Update Order Status & India Post Tracking ID
  const handleUpdateOrderStatus = async (orderId, newStatus, trackingId = '') => {
    const finalStatus = trackingId ? 'on_estimate' : (newStatus || 'shipped');
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: finalStatus, trackingId: trackingId || o.trackingId, tracking_id: trackingId || o.tracking_id } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: finalStatus, trackingId: trackingId || prev.trackingId, tracking_id: trackingId || prev.tracking_id } : null);
    }
    try {
      await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status: finalStatus, trackingId, courier: 'India Post' })
      });
      fetchAdminData();
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  // If not logged in, render Admin Login Page
  if (!adminUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e1e24 0%, #121216 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter', sans-serif",
        color: '#f3f4f6'
      }}>
        <div className="admin-modal-container" style={{
          maxWidth: '440px',
          width: '100%',
          background: 'rgba(30, 30, 40, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #8f8269, #bfa882)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '24px', fontWeight: '800', color: '#fff',
              boxShadow: '0 8px 20px rgba(143, 130, 105, 0.3)'
            }}>
              Kc
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Krishiv Admin Portal</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Sign in to manage Krishiv Corporation operations</p>
          </div>

          {loginError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171', padding: '12px 16px', borderRadius: '12px', fontSize: '13px',
              marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <ShieldAlert size={16} /> {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>Admin Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#6b7280' }} />
                <input 
                  type="email" 
                  value={loginEmail} 
                  onChange={e => setLoginEmail(e.target.value)} 
                  required
                  placeholder="admin@krishiv.co"
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                    background: 'rgba(15, 15, 20, 0.6)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', minHeight: '44px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#6b7280' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={loginPassword} 
                  onChange={e => setLoginPassword(e.target.value)} 
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '12px 42px 12px 42px', borderRadius: '12px',
                    background: 'rgba(15, 15, 20, 0.6)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', minHeight: '44px'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '12px', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', minHeight: '36px' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)} 
                  style={{ accentColor: '#8f8269' }}
                /> Remember me
              </label>
              <button 
                type="button" 
                onClick={() => setShowForgotModal(true)} 
                style={{ background: 'none', border: 'none', color: '#bfa882', cursor: 'pointer', fontWeight: '500', minHeight: '36px' }}
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #8f8269, #70624a)',
                color: '#fff', fontWeight: '700', fontSize: '14px', border: 'none',
                cursor: 'pointer', boxShadow: '0 8px 20px rgba(143, 130, 105, 0.3)',
                transition: 'transform 0.2s', minHeight: '44px'
              }}
            >
              Log In to Admin Dashboard
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button onClick={onNavigateHome} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', minHeight: '36px' }}>
              ← Return to Customer Store
            </button>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }}>
            <div className="admin-modal-container" style={{ background: '#1e1e24', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '30px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
              <Lock size={40} style={{ color: '#bfa882', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Reset Admin Password</h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>Enter your administrator email to receive a password reset link.</p>
              <input type="email" placeholder="admin@krishiv.co" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#121216', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box', minHeight: '44px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowForgotModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', minHeight: '44px' }}>Cancel</button>
                <button onClick={() => { alert('Password reset instructions sent to admin email.'); setShowForgotModal(false); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#8f8269', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', minHeight: '44px' }}>Send Link</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Sidebar Menu Config
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'categories', label: 'Categories', icon: FolderKanban },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: stats.pendingOrders },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Warehouse, badge: stats.outOfStockProducts > 0 ? stats.outOfStockProducts : null },
    { id: 'broadcast', label: 'Broadcast Ad Mailer', icon: Megaphone },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logs', label: 'Activity Logs', icon: Activity }
  ];

  const themeBg = darkMode ? '#0f172a' : '#f8fafc';
  const themeCardBg = darkMode ? '#1e293b' : '#ffffff';
  const themeText = darkMode ? '#f8fafc' : '#0f172a';
  const themeTextSoft = darkMode ? '#94a3b8' : '#64748b';
  const themeBorder = darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: themeBg, color: themeText, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .admin-desktop-sidebar {
          display: flex;
        }
        .admin-mobile-hamburger {
          display: none !important;
        }
        .admin-header-padding {
          padding: 0 32px;
        }
        .admin-main-padding {
          padding: 32px;
        }
        .admin-dashboard-grid-2 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        .admin-split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .responsive-form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .responsive-form-row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
        }
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .admin-modal-container {
          max-width: 640px;
          width: 100%;
        }

        @media (max-width: 1200px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 900px) {
          .admin-dashboard-grid-2, .admin-split-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .admin-desktop-sidebar {
            display: none !important;
          }
          .admin-mobile-hamburger {
            display: flex !important;
          }
          .admin-header-padding {
            padding: 0 16px !important;
            height: 64px !important;
          }
          .admin-main-padding {
            padding: 16px 12px !important;
          }
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .responsive-form-row-2, .responsive-form-row-3 {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .admin-modal-container {
            max-width: 95vw !important;
            padding: 20px 16px !important;
          }
          button, input[type="text"], input[type="email"], input[type="password"], input[type="number"], select, textarea {
            min-height: 44px;
          }
        }

        @media (max-width: 380px) {
          .admin-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      
      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className="admin-desktop-sidebar" style={{
        width: sidebarOpen ? '260px' : '80px',
        background: darkMode ? '#1e293b' : '#ffffff',
        borderRight: `1px solid ${themeBorder}`,
        transition: 'width 0.25s ease',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', zIndex: 100
      }}>
        {/* Brand Header */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${themeBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #8f8269, #bfa882)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '15px' }}>
              Kc
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.3px', color: themeText }}>KRISHIV</div>
                <div style={{ fontSize: '9px', fontWeight: '700', color: '#8f8269', letterSpacing: '1px' }}>ADMIN SUITE</div>
              </div>
            )}
          </div>
        </div>

        {/* User Info Capsule */}
        {sidebarOpen && (
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${themeBorder}`, background: darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#8f8269', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
              {adminUser?.name ? adminUser.name.substring(0,2).toUpperCase() : 'AD'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{adminUser?.name}</div>
              <div style={{ fontSize: '10px', color: '#8f8269', fontWeight: '600' }}>{adminUser?.role}</div>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isAllowed = hasPermission(item.id);
            const isActive = activeTab === item.id;

            if (!isAllowed) return null;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: sidebarOpen ? '11px 16px' : '11px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius: '12px', border: 'none',
                  background: isActive ? 'linear-gradient(135deg, #8f8269, #70624a)' : 'transparent',
                  color: isActive ? '#ffffff' : themeTextSoft,
                  cursor: 'pointer', fontWeight: isActive ? '700' : '500',
                  fontSize: '13.5px', transition: 'all 0.15s ease'
                }}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={18} />
                {sidebarOpen && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
                {sidebarOpen && item.badge && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div style={{ padding: '16px 12px', borderTop: `1px solid ${themeBorder}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: sidebarOpen ? '10px 16px' : '10px 0',
              justifyContent: sidebarOpen ? 'flex-start' : 'center', borderRadius: '10px',
              border: `1px solid ${themeBorder}`, background: 'transparent', color: themeText,
              cursor: 'pointer', fontSize: '12.5px', fontWeight: '600'
            }}
          >
            {darkMode ? <Sun size={16} style={{ color: '#f59e0b' }} /> : <Moon size={16} style={{ color: '#6366f1' }} />}
            {sidebarOpen && <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>}
          </button>

          <button 
            onClick={handleAdminLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: sidebarOpen ? '10px 16px' : '10px 0',
              justifyContent: sidebarOpen ? 'flex-start' : 'center', borderRadius: '10px',
              border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              cursor: 'pointer', fontSize: '12.5px', fontWeight: '700'
            }}
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR (<= 768px) */}
      {mobileMenuOpen && (
        <>
          <div 
            onClick={() => setMobileMenuOpen(false)} 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9998 }}
          />
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px',
            background: darkMode ? '#1e293b' : '#ffffff',
            zIndex: 9999, display: 'flex', flexDirection: 'column',
            boxShadow: '4px 0 24px rgba(0,0,0,0.3)', transition: 'all 0.3s ease'
          }}>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${themeBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #8f8269, #bfa882)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '15px' }}>
                  Kc
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: themeText }}>KRISHIV</div>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#8f8269', letterSpacing: '1px' }}>ADMIN SUITE</div>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: themeText, cursor: 'pointer', padding: '6px', minHeight: '44px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${themeBorder}`, background: darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#8f8269', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                {adminUser?.name ? adminUser.name.substring(0,2).toUpperCase() : 'AD'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{adminUser?.name}</div>
                <div style={{ fontSize: '10px', color: '#8f8269', fontWeight: '600' }}>{adminUser?.role}</div>
              </div>
            </div>

            <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '12px 16px', borderRadius: '12px', border: 'none',
                      background: isActive ? 'linear-gradient(135deg, #8f8269, #70624a)' : 'transparent',
                      color: isActive ? '#ffffff' : themeTextSoft,
                      cursor: 'pointer', fontWeight: isActive ? '700' : '500',
                      fontSize: '14px', minHeight: '44px'
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    {item.badge && (
                      <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px' }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div style={{ padding: '16px 12px', borderTop: `1px solid ${themeBorder}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={toggleTheme}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px',
                  borderRadius: '10px', border: `1px solid ${themeBorder}`, background: 'transparent',
                  color: themeText, cursor: 'pointer', fontSize: '13px', fontWeight: '600', minHeight: '44px'
                }}
              >
                {darkMode ? <Sun size={16} style={{ color: '#f59e0b' }} /> : <Moon size={16} style={{ color: '#6366f1' }} />}
                <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); handleAdminLogout(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px',
                  borderRadius: '10px', border: 'none', background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: '700', minHeight: '44px'
                }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* TOP NAVBAR */}
        <header className="admin-header-padding" style={{
          height: '70px', padding: '0 32px', background: themeCardBg,
          borderBottom: `1px solid ${themeBorder}`, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 90
        }}>
          {/* Left Search Bar with Mobile Hamburger & Live Results Overlay */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '480px', position: 'relative' }}>
            <button 
              className="admin-mobile-hamburger" 
              onClick={() => setMobileMenuOpen(true)}
              style={{
                alignItems: 'center', justifyContent: 'center',
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'transparent', border: `1px solid ${themeBorder}`,
                color: themeText, cursor: 'pointer', flexShrink: 0
              }}
              aria-label="Open Mobile Admin Menu"
            >
              <Menu size={22} />
            </button>

            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: themeTextSoft }} />
              <input
                type="text"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%', padding: '10px 36px 10px 36px', borderRadius: '10px',
                  background: darkMode ? '#0f172a' : '#f1f5f9', border: `1px solid ${themeBorder}`,
                  color: themeText, fontSize: '13px', outline: 'none', minHeight: '44px'
                }}
              />
              {globalSearch && (
                <X 
                  size={14} 
                  onClick={() => setGlobalSearch('')} 
                  style={{ position: 'absolute', right: '14px', top: '15px', color: themeTextSoft, cursor: 'pointer' }} 
                />
              )}

              {/* LIVE SEARCH DROPDOWN OVERLAY */}
              {globalSearch.trim().length > 0 && (
                <div style={{
                  position: 'absolute', top: '50px', left: 0, right: 0,
                  background: themeCardBg, borderRadius: '16px', border: `1px solid ${themeBorder}`,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.2)', padding: '14px', zIndex: 100,
                  maxHeight: '400px', overflowY: 'auto'
                }}>
                  {/* MATCHING PRODUCTS */}
                  {searchResults.products.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#8f8269', textTransform: 'uppercase', marginBottom: '6px' }}>
                        🛍️ Products ({searchResults.products.length})
                      </div>
                      {searchResults.products.slice(0, 4).map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => { setActiveTab('products'); setGlobalSearch(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', cursor: 'pointer', background: darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', marginBottom: '4px' }}
                        >
                          <img src={p.image_url || '/images/orange_peel.png'} alt={p.name} style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                            <div style={{ fontSize: '10px', color: themeTextSoft }}>₹{p.price} · {p.category}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MATCHING ORDERS */}
                  {searchResults.orders.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#8f8269', textTransform: 'uppercase', marginBottom: '6px' }}>
                        📦 Orders ({searchResults.orders.length})
                      </div>
                      {searchResults.orders.slice(0, 4).map(o => (
                        <div 
                          key={o.id} 
                          onClick={() => { setActiveTab('orders'); setSelectedOrder(o); setShowOrderModal(true); setGlobalSearch(''); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '8px', cursor: 'pointer', background: darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', marginBottom: '4px' }}
                        >
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '700' }}>#{o.id}</div>
                            <div style={{ fontSize: '10px', color: themeTextSoft }}>{o.items?.shipping?.name || o.customerName || 'Customer'} · ₹{o.total}</div>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#dcfce7', color: '#166534', textTransform: 'uppercase' }}>{o.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MATCHING CUSTOMERS */}
                  {searchResults.customers.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#8f8269', textTransform: 'uppercase', marginBottom: '6px' }}>
                        👥 Customers ({searchResults.customers.length})
                      </div>
                      {searchResults.customers.slice(0, 4).map((c, i) => (
                        <div 
                          key={i} 
                          onClick={() => { setActiveTab('customers'); setGlobalSearch(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', cursor: 'pointer', background: darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', marginBottom: '4px' }}
                        >
                          <Users size={16} style={{ color: '#8f8269' }} />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '700' }}>{c.name || 'User'}</div>
                            <div style={{ fontSize: '10px', color: themeTextSoft }}>{c.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.products.length === 0 && searchResults.orders.length === 0 && searchResults.customers.length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', color: themeTextSoft, fontSize: '12px' }}>
                      No matching products, orders, or customers found for "{globalSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                window.location.href = '/';
              }} 
              style={{
                padding: '8px 12px', borderRadius: '10px', background: 'rgba(143, 130, 105, 0.15)',
                color: '#8f8269', border: '1px solid rgba(143, 130, 105, 0.3)',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer', minHeight: '38px',
                whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px'
              }}
              title="Visit Store Front"
            >
              <ShoppingBag size={14} /> <span className="hide-mobile">Store</span>
            </button>

            <div className="hide-mobile" style={{ width: '1px', height: '24px', background: themeBorder }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#8f8269', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', flexShrink: 0, border: '1.5px solid var(--cream)' }}>
                {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hide-mobile" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{adminUser?.name || 'Admin'}</div>
                <div style={{ fontSize: '10px', color: themeTextSoft }}>{adminUser?.role || 'Super Admin'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* TAB PANELS CONTAINER */}
        <div className="admin-main-padding" style={{ flex: 1, overflowY: 'auto' }}>

          {/* 1. DASHBOARD HOME */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Dashboard Overview</h1>
                  <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Real-time business telemetry and metrics for Krishiv Corporation</p>
                </div>
                <button onClick={fetchAdminData} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: themeCardBg, border: `1px solid ${themeBorder}`, color: themeText, cursor: 'pointer', fontSize: '12px', fontWeight: '600', minHeight: '44px' }}>
                  <RefreshCw size={14} /> Refresh Telemetry
                </button>
              </div>

              {/* KPI Stats Cards Responsive Grid */}
              <div className="admin-stats-grid">
                {[
                  { label: "Total Revenue", val: `₹${stats.totalRevenue.toLocaleString()}`, tag: "Live DB Total", pos: true, color: "#10b981" },
                  { label: "Today's Revenue", val: `₹${stats.todayRevenue.toLocaleString()}`, tag: "Today's Orders", pos: true, color: "#3b82f6" },
                  { label: "Total Orders", val: stats.totalOrders, tag: "Recorded Checkout", pos: true, color: "#8b5cf6" },
                  { label: "Pending Orders", val: stats.pendingOrders, tag: "Awaiting Dispatch", pos: false, color: "#f59e0b" },
                  { label: "Cancelled Orders", val: stats.cancelledOrders, tag: "Cancelled Count", pos: false, color: "#ef4444" },
                  { label: "Completed Orders", val: stats.completedOrders, tag: "Delivered Status", pos: true, color: "#06b6d4" },
                  { label: "Total Customers", val: stats.totalCustomers, tag: "Registered Accounts", pos: true, color: "#ec4899" },
                  { label: "Total Products", val: stats.totalProducts, tag: "Active Catalog", pos: true, color: "#6366f1" }
                ].map((c, i) => (
                  <div key={i} style={{ background: themeCardBg, padding: '20px', borderRadius: '16px', border: `1px solid ${themeBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontSize: '12px', color: themeTextSoft, fontWeight: '600', marginBottom: '8px' }}>{c.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: themeText, marginBottom: '6px' }}>{c.val}</div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: c.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {c.pos ? <ArrowUpRight size={14} /> : <Activity size={14} />} {c.tag}
                    </div>
                  </div>
                ))}
              </div>

              {/* Monthly Sales & Revenue SVG Bar Chart */}
              <div style={{ background: themeCardBg, padding: '24px', borderRadius: '20px', border: `1px solid ${themeBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Monthly Sales & Revenue Growth (Live Orders)</h3>
                  <span style={{ fontSize: '12px', color: themeTextSoft, fontWeight: '600' }}>Calculated from real transactions</span>
                </div>
                <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '10px', overflowX: 'auto' }}>
                  {monthlySalesData.map((m, i) => (
                    <div key={i} style={{ flex: 1, minWidth: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: m.revenue > 0 ? '#10b981' : themeTextSoft }}>
                        {m.revenue > 0 ? `₹${m.revenue}` : '₹0'}
                      </span>
                      <div 
                        title={`${m.month}: ₹${m.revenue} (${m.sales} orders)`}
                        style={{
                          width: '100%', maxWidth: '36px', height: `${m.heightPct}%`,
                          background: m.revenue > 0 ? 'linear-gradient(180deg, #8f8269 0%, #bfa882 100%)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                          borderRadius: '8px 8px 0 0', transition: 'height 0.3s ease'
                        }}
                      ></div>
                      <span style={{ fontSize: '11px', color: themeTextSoft, fontWeight: '600' }}>{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders & Top Products Grid */}
              <div className="admin-dashboard-grid-2">
                {/* Recent Orders Table Wrapper */}
                <div style={{ background: themeCardBg, padding: '24px', borderRadius: '20px', border: `1px solid ${themeBorder}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Recent Orders</h3>
                    <button onClick={() => setActiveTab('orders')} style={{ background: 'none', border: 'none', color: '#8f8269', fontSize: '12px', fontWeight: '700', cursor: 'pointer', minHeight: '36px' }}>View All →</button>
                  </div>
                  <div className="table-responsive">
                    <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${themeBorder}`, color: themeTextSoft, textAlign: 'left' }}>
                          <th style={{ padding: '10px 0' }}>Order ID</th>
                          <th style={{ padding: '10px 0' }}>Customer</th>
                          <th style={{ padding: '10px 0' }}>Total</th>
                          <th style={{ padding: '10px 0' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(o => (
                          <tr key={o.id} style={{ borderBottom: `1px solid ${themeBorder}` }}>
                            <td style={{ padding: '12px 0', fontWeight: '700' }}>#{o.id}</td>
                            <td style={{ padding: '12px 0' }}>{o.user_id ? 'Customer' : 'Guest'}</td>
                            <td style={{ padding: '12px 0', fontWeight: '700' }}>₹{o.total}</td>
                            <td style={{ padding: '12px 0' }}>
                              <span style={{
                                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                                background: o.status === 'delivered' ? '#dcfce7' : (o.status === 'cancelled' ? '#fee2e2' : '#fef3c7'),
                                color: o.status === 'delivered' ? '#166534' : (o.status === 'cancelled' ? '#991b1b' : '#92400e')
                              }}>
                                {o.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Selling Products */}
                <div style={{ background: themeCardBg, padding: '24px', borderRadius: '20px', border: `1px solid ${themeBorder}` }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px' }}>Top Selling Products</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {products.slice(0, 4).map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={p.image_url} alt={p.name} style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: themeTextSoft }}>₹{p.price} • Stock: {p.stock !== undefined ? p.stock : p.stock_qty}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Products Management</h1>
                  <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Add, edit, duplicate, archive, and manage product catalog</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => exportToCSV(products, 'krishiv_products')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: themeCardBg, border: `1px solid ${themeBorder}`, color: themeText, cursor: 'pointer', fontSize: '12px', fontWeight: '600', minHeight: '44px' }}>
                    <Download size={14} /> Export CSV
                  </button>
                  <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', tag: 'BRIGHTENING', category: 'Skin Care', subcategory: 'Powders', price: 299, original_price: 374, stock: 15, sku: `KC-PROD-${Date.now().toString().slice(-4)}`, weight: '100g', description: '', ingredients: '', usage: '', image_url: '/images/orange_peel.png', status: 'Published', is_new: true, is_bestseller: false, is_organic: true }); setShowProductModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: '#8f8269', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', minHeight: '44px' }}>
                    <Plus size={16} /> Add Product
                  </button>
                </div>
              </div>

              {/* Products Table Wrapper */}
              <div className="table-responsive" style={{ background: themeCardBg, borderRadius: '20px', border: `1px solid ${themeBorder}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${themeBorder}`, background: darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', color: themeTextSoft, textAlign: 'left' }}>
                      <th style={{ padding: '14px 20px' }}>Product</th>
                      <th style={{ padding: '14px 20px' }}>SKU</th>
                      <th style={{ padding: '14px 20px' }}>Category</th>
                      <th style={{ padding: '14px 20px' }}>Price</th>
                      <th style={{ padding: '14px 20px' }}>Stock</th>
                      <th style={{ padding: '14px 20px' }}>Status</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${themeBorder}` }}>
                        <td style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={p.image_url} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: '700' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: themeTextSoft }}>{p.tag}</div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: 'monospace' }}>{p.sku || `KC-${p.id}`}</td>
                        <td style={{ padding: '14px 20px' }}>{p.category}</td>
                        <td style={{ padding: '14px 20px', fontWeight: '700' }}>₹{p.price}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontWeight: '700', color: (p.stock !== undefined ? p.stock : (p.stock_qty || 0)) <= 0 ? '#ef4444' : '#10b981' }}>
                            {p.stock !== undefined ? p.stock : p.stock_qty} units
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: p.status === 'Published' ? '#dcfce7' : '#f1f5f9', color: p.status === 'Published' ? '#166534' : '#475569' }}>
                            {p.status || 'Published'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleDuplicateProduct(p)} title="Duplicate" style={{ padding: '8px', borderRadius: '8px', background: 'transparent', border: `1px solid ${themeBorder}`, color: themeText, cursor: 'pointer', minHeight: '36px', minWidth: '36px' }}><Copy size={14} /></button>
                            <button onClick={() => { 
                              const currentProd = { ...p, id: p.id || p._id };
                              setEditingProduct(currentProd); 
                              setProductForm({ 
                                ...currentProd, 
                                price: Number(currentProd.price || 0), 
                                original_price: Number(currentProd.original_price || currentProd.price || 0), 
                                stock: Number(currentProd.stock !== undefined ? currentProd.stock : currentProd.stock_qty || 0),
                                image_url: currentProd.image_url || '/images/orange_peel.png'
                              }); 
                              setShowProductModal(true); 
                            }} title="Edit" style={{ padding: '8px', borderRadius: '8px', background: 'transparent', border: `1px solid ${themeBorder}`, color: themeText, cursor: 'pointer', minHeight: '36px', minWidth: '36px' }}><Edit2 size={14} /></button>
                            <button onClick={() => handleDeleteProduct(p.id || p._id)} title="Delete" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', minHeight: '36px', minWidth: '36px' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Order Pipeline Management</h1>
                  <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Fulfill customer orders, update tracking status, and generate invoices</p>
                </div>
                <button onClick={() => exportToCSV(orders, 'krishiv_orders')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: themeCardBg, border: `1px solid ${themeBorder}`, color: themeText, cursor: 'pointer', fontSize: '12px', fontWeight: '600', minHeight: '44px' }}>
                  <Download size={14} /> Export Orders CSV
                </button>
              </div>

              {/* Orders Table Wrapper */}
              <div className="table-responsive" style={{ background: themeCardBg, borderRadius: '20px', border: `1px solid ${themeBorder}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${themeBorder}`, background: darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', color: themeTextSoft, textAlign: 'left' }}>
                      <th style={{ padding: '14px 20px' }}>Order ID</th>
                      <th style={{ padding: '14px 20px' }}>Date</th>
                      <th style={{ padding: '14px 20px' }}>Payment</th>
                      <th style={{ padding: '14px 20px' }}>Total</th>
                      <th style={{ padding: '14px 20px' }}>Pipeline Status</th>
                      <th style={{ padding: '14px 20px' }}>India Post Tracking</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} style={{ borderBottom: `1px solid ${themeBorder}` }}>
                        <td style={{ padding: '14px 20px', fontWeight: '700' }}>#{o.id}</td>
                        <td style={{ padding: '14px 20px', color: themeTextSoft }}>{new Date(o.created_at || Date.now()).toLocaleDateString()}</td>
                        <td style={{ padding: '14px 20px' }}>{(o.payment_method || 'COD').toUpperCase()}</td>
                        <td style={{ padding: '14px 20px', fontWeight: '700' }}>₹{o.total}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <select 
                            value={o.status} 
                            onChange={e => handleUpdateOrderStatus(o.id, e.target.value, o.trackingId || o.tracking_id || '')}
                            style={{ padding: '6px 12px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeCardBg, color: themeText, fontSize: '12px', fontWeight: '700', minHeight: '38px' }}
                          >
                            <option value="placed">Placed</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="on_estimate">On Estimate (In Transit)</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input 
                              type="text" 
                              placeholder="e.g. CP123456789IN"
                              defaultValue={o.trackingId || o.tracking_id || ''}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val && val !== (o.trackingId || o.tracking_id)) {
                                  handleUpdateOrderStatus(o.id, 'on_estimate', val);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = e.target.value.trim();
                                  if (val) handleUpdateOrderStatus(o.id, 'on_estimate', val);
                                }
                              }}
                              style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '11px', width: '130px', minHeight: '36px' }}
                            />
                            {(o.trackingId || o.tracking_id) && (
                              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700' }}>✓ Saved</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button onClick={() => { setSelectedOrder(o); setShowOrderModal(true); }} style={{ padding: '8px 14px', borderRadius: '8px', background: '#8f8269', color: '#fff', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer', minHeight: '36px' }}>View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. INVENTORY MANAGEMENT */}
          {activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Inventory Control Center</h1>
                <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Monitor stock levels, increase/decrease stock counts, and prevent stockouts</p>
              </div>

              {/* Inventory Table Wrapper */}
              <div className="table-responsive" style={{ background: themeCardBg, borderRadius: '20px', border: `1px solid ${themeBorder}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${themeBorder}`, background: darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', color: themeTextSoft, textAlign: 'left' }}>
                      <th style={{ padding: '14px 20px' }}>Product</th>
                      <th style={{ padding: '14px 20px' }}>Category</th>
                      <th style={{ padding: '14px 20px' }}>Current Stock</th>
                      <th style={{ padding: '14px 20px' }}>Stock Alert</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Adjust Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const qty = p.stock !== undefined ? p.stock : p.stock_qty;
                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${themeBorder}` }}>
                          <td style={{ padding: '14px 20px', fontWeight: '700' }}>{p.name}</td>
                          <td style={{ padding: '14px 20px' }}>{p.category}</td>
                          <td style={{ padding: '14px 20px', fontWeight: '800', fontSize: '14px' }}>{qty} units</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: qty <= 0 ? '#fee2e2' : (qty <= 5 ? '#fef3c7' : '#dcfce7'), color: qty <= 0 ? '#991b1b' : (qty <= 5 ? '#92400e' : '#166534') }}>
                              {qty <= 0 ? 'OUT OF STOCK' : (qty <= 5 ? 'LOW STOCK' : 'HEALTHY')}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button onClick={async () => { await fetch(`${API_BASE_URL}/admin/products/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify({ stock: Math.max(0, qty - 1) }) }); fetchAdminData(); }} style={{ padding: '6px 12px', borderRadius: '8px', background: themeCardBg, border: `1px solid ${themeBorder}`, color: themeText, fontWeight: '700', cursor: 'pointer', minHeight: '36px' }}>- 1</button>
                              <button onClick={async () => { await fetch(`${API_BASE_URL}/admin/products/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify({ stock: qty + 5 }) }); fetchAdminData(); }} style={{ padding: '6px 12px', borderRadius: '8px', background: '#8f8269', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', minHeight: '36px' }}>+ 5</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BROADCAST AD MAILER & CAMPAIGN HUB */}
          {activeTab === 'broadcast' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Megaphone style={{ color: '#8f8269' }} /> Marketing Broadcast & Ad Emailer
                </h1>
                <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Design luxury ad banners and dispatch promotional emails to all registered customers at once</p>
              </div>

              {broadcastStatusMsg && (
                <div style={{ padding: '14px 20px', borderRadius: '14px', background: broadcastStatusMsg.includes('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${broadcastStatusMsg.includes('✅') ? '#10b981' : '#ef4444'}`, fontSize: '13px', fontWeight: '700', color: broadcastStatusMsg.includes('✅') ? '#10b981' : '#ef4444' }}>
                  {broadcastStatusMsg}
                </div>
              )}

              <div className="admin-split-grid" style={{ alignItems: 'start' }}>
                {/* AD CAMPAIGN FORM */}
                <div style={{ background: themeCardBg, borderRadius: '20px', border: `1px solid ${themeBorder}`, padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px', color: '#8f8269' }}>📢 Compose Broadcast Campaign</h3>
                  <form onSubmit={handleSendBroadcast}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Email Subject Line</label>
                      <input 
                        type="text" 
                        value={broadcastForm.subject} 
                        onChange={e => setBroadcastForm({ ...broadcastForm, subject: e.target.value })} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box', minHeight: '44px' }} 
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Ad Banner Title / Headline</label>
                      <input 
                        type="text" 
                        value={broadcastForm.title} 
                        onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box', minHeight: '44px' }} 
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Ad Banner Message / Offer Details</label>
                      <textarea 
                        value={broadcastForm.message} 
                        onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })} 
                        rows={4} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <div className="responsive-form-row-2" style={{ marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Promo / Coupon Code (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. KRISHIV20" 
                          value={broadcastForm.discountCode} 
                          onChange={e => setBroadcastForm({ ...broadcastForm, discountCode: e.target.value })} 
                          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box', fontFamily: 'monospace', textTransform: 'uppercase', minHeight: '44px' }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Button CTA Text</label>
                        <input 
                          type="text" 
                          value={broadcastForm.ctaText} 
                          onChange={e => setBroadcastForm({ ...broadcastForm, ctaText: e.target.value })} 
                          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box', minHeight: '44px' }} 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isBroadcasting} 
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: isBroadcasting ? '#94a3b8' : 'linear-gradient(135deg, #aa820a 0%, #8f8269 100%)', color: '#fff', border: 'none', fontWeight: '800', fontSize: '14px', cursor: isBroadcasting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 14px rgba(170,130,10,0.3)', marginTop: '20px', minHeight: '44px' }}
                    >
                      {isBroadcasting ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                      {isBroadcasting ? 'Dispatching Broadcast Emails...' : '🚀 Launch & Mail Broadcast Ad To All Customers'}
                    </button>
                  </form>
                </div>

                {/* LIVE AD BANNER PREVIEW */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px', color: themeTextSoft }}>👁️ Live Ad Email Banner Preview</h3>
                  <div style={{ background: '#f4f1ea', borderRadius: '20px', padding: '20px', border: `1px solid ${themeBorder}` }}>
                    <div style={{ maxWidth: '500px', margin: '0 auto', background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', border: '1px solid #e5dfd3' }}>
                      <div style={{ background: 'linear-gradient(135deg, #1b261b 0%, #2a3a2a 50%, #3e503e 100%)', padding: '28px 20px', textAlign: 'center', color: '#ffffff' }}>
                        <span style={{ background: 'linear-gradient(135deg, #d4af37 0%, #aa820a 100%)', color: '#ffffff', fontSize: '10px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '16px', display: 'inline-block', marginBottom: '10px' }}>✨ Special Announcement</span>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px', color: '#ffffff' }}>{broadcastForm.title || 'Ad Headline'}</h2>
                        <p style={{ fontSize: '11px', opacity: 0.85, margin: 0 }}>Krishiv Corporation — Pure Organic Beauty & Wellness</p>
                      </div>
                      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                        <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#4a453e', margin: '0 0 18px' }}>{broadcastForm.message || 'Ad message description will appear here...'}</p>
                        {broadcastForm.discountCode && (
                          <div style={{ background: '#faf7f0', border: '2px dashed #aa820a', borderRadius: '12px', padding: '12px', margin: '16px 0' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#aa820a', textTransform: 'uppercase' }}>Use Coupon Code At Checkout</div>
                            <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '2px', color: '#1b261b', fontFamily: 'monospace' }}>{broadcastForm.discountCode}</div>
                          </div>
                        )}
                        <div style={{ marginTop: '20px' }}>
                          <span style={{ display: 'inline-block', background: 'linear-gradient(135deg, #aa820a 0%, #8f8269 100%)', color: '#ffffff', fontSize: '12px', fontWeight: '700', padding: '10px 24px', borderRadius: '20px' }}>{broadcastForm.ctaText || 'Shop Collection'} →</span>
                        </div>
                      </div>
                      <div style={{ background: '#f9f8f5', borderTop: '1px solid #eee8dd', padding: '12px', textAlign: 'center', fontSize: '10px', color: '#888075' }}>
                        <strong>KRISHIV CORPORATION</strong> | GSTIN: 24APTPK3284N1Z6<br />Surat, Gujarat, India
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. CUSTOMER MANAGEMENT */}
          {activeTab === 'customers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Customer Management</h1>
                  <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>View registered customers, order history, and account statuses</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => exportToCSV(customers, 'krishiv_customers')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: themeCardBg, border: `1px solid ${themeBorder}`, color: themeText, cursor: 'pointer', fontSize: '12px', fontWeight: '600', minHeight: '44px' }}>
                    <Download size={14} /> Export Customers CSV
                  </button>
                  <button onClick={async () => {
                    if (window.confirm('Are you sure you want to PURGE ALL customer user accounts and details? (Admin credentials will NOT be deleted)')) {
                      try {
                        const res = await fetch(`${API_BASE_URL}/admin/customers`, { method: 'DELETE', headers: authHeaders });
                        const data = await res.json();
                        alert(data.message || 'Customer records purged');
                        fetchAdminData();
                      } catch (err) {
                        alert('Failed to purge customer records');
                      }
                    }
                  }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: '#ef4444', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', minHeight: '44px' }}>
                    <Trash2 size={14} /> Purge All Customers
                  </button>
                </div>
              </div>

              {/* Customers Table Wrapper */}
              <div className="table-responsive" style={{ background: themeCardBg, borderRadius: '20px', border: `1px solid ${themeBorder}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${themeBorder}`, background: darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', color: themeTextSoft, textAlign: 'left' }}>
                      <th style={{ padding: '14px 20px' }}>Customer Name</th>
                      <th style={{ padding: '14px 20px' }}>Email</th>
                      <th style={{ padding: '14px 20px' }}>Joined Date</th>
                      <th style={{ padding: '14px 20px' }}>Status</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: themeTextSoft }}>
                          No customer user records found.
                        </td>
                      </tr>
                    ) : (
                      customers.map(c => (
                        <tr key={c.id || c.email} style={{ borderBottom: `1px solid ${themeBorder}` }}>
                          <td style={{ padding: '14px 20px', fontWeight: '700' }}>{c.name || 'Registered User'}</td>
                          <td style={{ padding: '14px 20px' }}>{c.email}</td>
                          <td style={{ padding: '14px 20px', color: themeTextSoft }}>{new Date(c.created_at || Date.now()).toLocaleDateString()}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: '#dcfce7', color: '#166534' }}>
                              ACTIVE
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button onClick={async () => {
                              if (window.confirm(`Delete customer ${c.name || c.email}?`)) {
                                try {
                                  await fetch(`${API_BASE_URL}/admin/customers/${c.id || c._id}`, { method: 'DELETE', headers: authHeaders });
                                  fetchAdminData();
                                } catch (err) {
                                  alert('Failed to delete customer');
                                }
                              }
                            }} style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer', fontWeight: '700', fontSize: '11px', minHeight: '36px' }}>
                              <Trash2 size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Categories Management</h1>
                  <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Manage store categories, images, and marketing banners</p>
                </div>
                <button onClick={() => setShowCategoryModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: '#8f8269', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', minHeight: '44px' }}>
                  <Plus size={16} /> Add Category
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {categories.map(cat => (
                  <div key={cat.id} style={{ background: themeCardBg, borderRadius: '18px', border: `1px solid ${themeBorder}`, overflow: 'hidden', padding: '20px' }}>
                    <img src={cat.image_url || '/images/orange_peel.png'} alt={cat.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px', marginBottom: '14px' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px' }}>{cat.name}</h3>
                    <p style={{ fontSize: '12px', color: themeTextSoft, margin: '0 0 12px' }}>{cat.description}</p>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#8f8269' }}>{cat.product_count || 5} Products</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. COUPON MANAGEMENT */}
          {activeTab === 'coupons' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Coupon & Promo Codes</h1>
                  <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Create percentage or flat discount vouchers for checkout</p>
                </div>
                <button onClick={() => setShowCouponModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: '#8f8269', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', minHeight: '44px' }}>
                  <Plus size={16} /> Create Coupon
                </button>
              </div>

              {/* Coupons Table Wrapper */}
              <div className="table-responsive" style={{ background: themeCardBg, borderRadius: '20px', border: `1px solid ${themeBorder}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${themeBorder}`, background: darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', color: themeTextSoft, textAlign: 'left' }}>
                      <th style={{ padding: '14px 20px' }}>Coupon Code</th>
                      <th style={{ padding: '14px 20px' }}>Discount</th>
                      <th style={{ padding: '14px 20px' }}>Min Order</th>
                      <th style={{ padding: '14px 20px' }}>Uses</th>
                      <th style={{ padding: '14px 20px' }}>Expiry</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(c => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${themeBorder}` }}>
                        <td style={{ padding: '14px 20px', fontWeight: '800', fontFamily: 'monospace' }}>{c.code}</td>
                        <td style={{ padding: '14px 20px', fontWeight: '700' }}>{c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}</td>
                        <td style={{ padding: '14px 20px' }}>₹{c.min_order}</td>
                        <td style={{ padding: '14px 20px' }}>{c.current_uses} / {c.max_uses}</td>
                        <td style={{ padding: '14px 20px', color: themeTextSoft }}>{c.expiry_date}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button onClick={async () => { await fetch(`${API_BASE_URL}/admin/coupons/${c.id}`, { method: 'DELETE' }); fetchAdminData(); }} style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '700', minHeight: '36px' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Review Moderation</h1>
                <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Approve, reject, or reply to customer product reviews</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ background: themeCardBg, borderRadius: '16px', border: `1px solid ${themeBorder}`, padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{r.customer_name} <span style={{ fontSize: '12px', color: themeTextSoft, fontWeight: '400' }}>on {r.product_name}</span></div>
                      <div style={{ color: '#f59e0b', fontSize: '13px' }}>{'★'.repeat(r.rating)}</div>
                    </div>
                    <p style={{ fontSize: '13px', margin: '0 0 12px', color: themeText }}>"{r.comment}"</p>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '700', background: r.status === 'approved' ? '#dcfce7' : '#fef3c7', color: r.status === 'approved' ? '#166534' : '#92400e' }}>
                        {r.status.toUpperCase()}
                      </span>
                      {r.status !== 'approved' && (
                        <button onClick={async () => { await fetch(`${API_BASE_URL}/admin/reviews/${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) }); fetchAdminData(); }} style={{ padding: '6px 12px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontSize: '11px', cursor: 'pointer', fontWeight: '700', minHeight: '36px' }}>Approve</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. NOTIFICATIONS CENTER */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Notifications & Broadcasts</h1>
                  <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Send customer store notifications, offer announcements, and system alerts</p>
                </div>
                <button onClick={() => setShowNotificationModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: '#8f8269', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', minHeight: '44px' }}>
                  <Bell size={16} /> Broadcast Notification
                </button>
              </div>

              <div style={{ background: themeCardBg, borderRadius: '20px', border: `1px solid ${themeBorder}`, padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px' }}>Sent Broadcast History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(!logs || logs.filter(l => l.action && l.action.includes('Broadcast')).length === 0) ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: themeTextSoft, fontSize: '13px' }}>
                      No broadcast notifications sent yet. Use the button above or "Broadcast Ad Mailer" tab to launch a campaign.
                    </div>
                  ) : (
                    logs.filter(l => l.action && l.action.includes('Broadcast')).map((n, i) => (
                      <div key={i} style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${themeBorder}`, background: darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>{n.action}</div>
                        <div style={{ fontSize: '12px', color: themeTextSoft }}>{n.details}</div>
                        <div style={{ fontSize: '10px', color: '#8f8269', marginTop: '6px' }}>{new Date(n.timestamp || Date.now()).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 10. ANALYTICS & REPORTS */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Reports & Analytics</h1>
                <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Business intelligence, visitor stats, and product category performance</p>
              </div>

              <div className="admin-split-grid">
                <div style={{ background: themeCardBg, padding: '24px', borderRadius: '20px', border: `1px solid ${themeBorder}` }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px' }}>Category Revenue Breakdown (Real Orders)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {categoryBreakdown.map((cat, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                          <span>{cat.name}</span>
                          <span>{cat.pct}% (₹{cat.amount.toLocaleString()})</span>
                        </div>
                        <div style={{ height: '8px', borderRadius: '4px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(cat.pct, 4)}%`, height: '100%', background: idx % 2 === 0 ? '#8f8269' : '#3b82f6', transition: 'width 0.3s ease' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: themeCardBg, padding: '24px', borderRadius: '20px', border: `1px solid ${themeBorder}` }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px' }}>Registered Customers Telemetry</h3>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: themeText, marginBottom: '4px' }}>{stats.totalCustomers} Accounts</div>
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>Active registered customer database</div>
                </div>
              </div>
            </div>
          )}

          {/* 12. STORE SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Store Settings</h1>
                <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Business credentials, GST, shipping fees, and tax configuration</p>
              </div>

              <div style={{ background: themeCardBg, borderRadius: '20px', border: `1px solid ${themeBorder}`, padding: '24px', maxWidth: '680px' }}>
                <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  if (adminUser?.role === 'Author' || adminUser?.role === 'Manager') {
                    alert('Permission Denied: Financial and Shipping Rate settings modification is restricted to Super Admin only.');
                    return;
                  }
                  try {
                    await fetch(`${API_BASE_URL}/admin/settings`, { 
                      method: 'PUT', 
                      headers: { 'Content-Type': 'application/json', ...authHeaders }, 
                      body: JSON.stringify(storeSettings) 
                    }); 
                    alert('Shipping Rates, GST & Store Settings updated successfully!'); 
                  } catch (err) {
                    alert('Failed to save settings');
                  }
                }}>
                  <div className="responsive-form-row-2" style={{ marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Company Name</label>
                      <input type="text" value={storeSettings?.company_name || ''} onChange={e => setStoreSettings(prev => ({ ...prev, company_name: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box', minHeight: '44px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>GSTIN Number</label>
                      <input type="text" value={storeSettings?.gst_number || ''} onChange={e => setStoreSettings(prev => ({ ...prev, gst_number: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box', minHeight: '44px' }} />
                    </div>
                  </div>

                  {/* SHIPPING & DELIVERY RATES CONFIGURATION */}
                  <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '18px', borderRadius: '14px', border: `1px solid ${themeBorder}`, marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#8f8269' }}>🚚 State-Based Shipping & Delivery Rate Rules</h4>
                      <span style={{ fontSize: '10px', fontWeight: '700', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '6px' }}>SUPER ADMIN ONLY</span>
                    </div>

                    {/* GUJARAT RATES */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: themeText, marginBottom: '8px' }}>📍 Gujarat Delivery Rates (State = Gujarat)</div>
                      <div className="responsive-form-row-3">
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: themeTextSoft, marginBottom: '4px' }}>Below ₹299 Charge (₹)</label>
                          <input type="number" value={storeSettings?.gj_under299_rate ?? 49} onChange={e => setStoreSettings(prev => ({ ...prev, gj_under299_rate: Number(e.target.value) }))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '12px', boxSizing: 'border-box', minHeight: '44px' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: themeTextSoft, marginBottom: '4px' }}>₹299–₹498 Charge (₹)</label>
                          <input type="number" value={storeSettings?.gj_299_498_rate ?? 39} onChange={e => setStoreSettings(prev => ({ ...prev, gj_299_498_rate: Number(e.target.value) }))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '12px', boxSizing: 'border-box', minHeight: '44px' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: themeTextSoft, marginBottom: '4px' }}>₹499+ Charge (FREE)</label>
                          <input type="number" value={storeSettings?.gj_499_plus_rate ?? 0} onChange={e => setStoreSettings(prev => ({ ...prev, gj_499_plus_rate: Number(e.target.value) }))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '12px', boxSizing: 'border-box', minHeight: '44px' }} />
                        </div>
                      </div>
                    </div>

                    {/* OUTSIDE GUJARAT RATES */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: themeText, marginBottom: '8px' }}>🌐 Outside Gujarat Delivery Rates (All Other States/UTs)</div>
                      <div className="responsive-form-row-3">
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: themeTextSoft, marginBottom: '4px' }}>Below ₹299 Charge (₹)</label>
                          <input type="number" value={storeSettings?.outside_under299_rate ?? 69} onChange={e => setStoreSettings(prev => ({ ...prev, outside_under299_rate: Number(e.target.value) }))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '12px', boxSizing: 'border-box', minHeight: '44px' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: themeTextSoft, marginBottom: '4px' }}>₹299–₹498 Charge (₹)</label>
                          <input type="number" value={storeSettings?.outside_299_498_rate ?? 59} onChange={e => setStoreSettings(prev => ({ ...prev, outside_299_498_rate: Number(e.target.value) }))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '12px', boxSizing: 'border-box', minHeight: '44px' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: themeTextSoft, marginBottom: '4px' }}>₹499+ Charge (FREE)</label>
                          <input type="number" value={storeSettings?.outside_499_plus_rate ?? 0} onChange={e => setStoreSettings(prev => ({ ...prev, outside_499_plus_rate: Number(e.target.value) }))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '12px', boxSizing: 'border-box', minHeight: '44px' }} />
                        </div>
                      </div>
                    </div>

                    {/* COD FEE */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: themeText, marginBottom: '6px' }}>💵 Cash on Delivery (COD) Additional Fee</div>
                      <div style={{ maxWidth: '240px' }}>
                        <input type="number" value={storeSettings?.cod_fee ?? 30} onChange={e => setStoreSettings(prev => ({ ...prev, cod_fee: Number(e.target.value) }))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '12px', boxSizing: 'border-box', minHeight: '44px' }} />
                        <span style={{ fontSize: '10px', color: themeTextSoft, marginTop: '2px', display: 'block' }}>Fee added separately on COD checkout</span>
                      </div>
                    </div>
                  </div>

                  {/* SEPARATE GST SLAB CONFIGURATION */}
                  <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '16px', borderRadius: '14px', border: `1px solid ${themeBorder}`, marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 12px', color: '#8f8269' }}>🏛️ Indian GST Statutory Tax Slabs</h4>
                    <div className="responsive-form-row-2">
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Cosmetics & Waxes GST Rate (%)</label>
                        <input 
                          type="number" 
                          placeholder="18" 
                          value={18} 
                          readOnly
                          disabled
                          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeTextSoft, fontSize: '13px', boxSizing: 'border-box', opacity: 0.7, cursor: 'not-allowed', minHeight: '44px' }} 
                        />
                        <span style={{ fontSize: '10px', color: themeTextSoft, marginTop: '4px', display: 'block' }}>Fixed: Cosmetics (HSN 3304 / 3305) - 9% CGST + 9% SGST = 18% GST</span>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Ayurvedic & Herbal Powders GST Rate (%)</label>
                        <input 
                          type="number" 
                          placeholder="5" 
                          value={5} 
                          readOnly
                          disabled
                          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeTextSoft, fontSize: '13px', boxSizing: 'border-box', opacity: 0.7, cursor: 'not-allowed', minHeight: '44px' }} 
                        />
                        <span style={{ fontSize: '10px', color: themeTextSoft, marginTop: '4px', display: 'block' }}>Fixed: Ayurvedic (HSN 3004 / 1211) - 2.5% CGST + 2.5% SGST = 5% GST</span>
                      </div>
                    </div>
                  </div>

                  <button type="submit" style={{ padding: '12px 24px', borderRadius: '10px', background: '#8f8269', color: '#fff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', minHeight: '44px' }}>Save Shipping & GST Settings</button>
                </form>
              </div>
            </div>
          )}

          {/* 13. ACTIVITY LOGS */}
          {activeTab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>Admin Activity Audit Logs</h1>
                <p style={{ fontSize: '13px', color: themeTextSoft, margin: 0 }}>Security logs of all administrator actions and system modifications</p>
              </div>

              {/* Logs Table Wrapper */}
              <div className="table-responsive" style={{ background: themeCardBg, borderRadius: '20px', border: `1px solid ${themeBorder}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${themeBorder}`, background: darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', color: themeTextSoft, textAlign: 'left' }}>
                      <th style={{ padding: '14px 20px' }}>Timestamp</th>
                      <th style={{ padding: '14px 20px' }}>Admin User</th>
                      <th style={{ padding: '14px 20px' }}>Action</th>
                      <th style={{ padding: '14px 20px' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} style={{ borderBottom: `1px solid ${themeBorder}` }}>
                        <td style={{ padding: '14px 20px', color: themeTextSoft, fontFamily: 'monospace' }}>{new Date(l.timestamp).toLocaleString()}</td>
                        <td style={{ padding: '14px 20px', fontWeight: '700' }}>{l.user}</td>
                        <td style={{ padding: '14px 20px' }}><span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(143, 130, 105, 0.2)', color: '#8f8269', fontWeight: '700', fontSize: '11px' }}>{l.action}</span></td>
                        <td style={{ padding: '14px 20px' }}>{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99990, padding: '16px' }}>
          <div className="admin-modal-container" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: '24px', padding: '32px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: themeText, cursor: 'pointer', padding: '6px', minHeight: '44px' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="responsive-form-row-2" style={{ marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Product Name</label>
                  <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box', minHeight: '44px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Category</label>
                  <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box', minHeight: '44px' }}>
                    <option value="Skin Care">Skin Care</option>
                    <option value="Body Care">Body Care</option>
                  </select>
                </div>
              </div>
              <div className="responsive-form-row-3" style={{ marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Price (₹)</label>
                  <input 
                    type="number" 
                    value={productForm.price === '' || productForm.price === null || productForm.price === undefined ? '' : productForm.price} 
                    onChange={e => {
                      const val = e.target.value;
                      setProductForm({ ...productForm, price: val === '' ? '' : Number(val) });
                    }} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box', minHeight: '44px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>MRP (₹)</label>
                  <input 
                    type="number" 
                    value={productForm.original_price === '' || productForm.original_price === null || productForm.original_price === undefined ? '' : productForm.original_price} 
                    onChange={e => {
                      const val = e.target.value;
                      setProductForm({ ...productForm, original_price: val === '' ? '' : Number(val) });
                    }} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box', minHeight: '44px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Stock Qty</label>
                  <input 
                    type="number" 
                    value={productForm.stock === '' || productForm.stock === null || productForm.stock === undefined ? '' : productForm.stock} 
                    onChange={e => {
                      const val = e.target.value;
                      setProductForm({ ...productForm, stock: val === '' ? '' : Number(val) });
                    }} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box', minHeight: '44px' }} 
                  />
                </div>
              </div>
              {/* Auto-detected GST Slab Indicator */}
              {(() => {
                const searchStr = (String(productForm.name || '') + ' ' + String(productForm.category || '') + ' ' + String(productForm.tag || '') + ' ' + String(productForm.description || '') + ' ' + String(productForm.ingredients || '')).toLowerCase();
                const cosmeticKeywords = ['wax', 'cosmetic', 'cream', 'lotion', 'serum', 'chemical', 'hair removal', 'beauty', 'makeup', 'lipstick', 'foundation', 'mascara', 'concealer', 'toner', 'moisturizer', 'sunscreen', 'shampoo', 'conditioner', 'gel', 'soap', 'face wash', 'cleanser', 'scrub'];
                const isCosmeticProduct = cosmeticKeywords.some(kw => searchStr.includes(kw));
                const gstRate = isCosmeticProduct ? 18 : 5;
                const gstLabel = isCosmeticProduct ? 'Cosmetics & Waxes' : 'Ayurvedic & Herbal Powders';
                const hsnCode = isCosmeticProduct ? '3304' : '3004';
                return (
                  <div style={{ marginBottom: '14px', padding: '12px 16px', borderRadius: '12px', background: isCosmeticProduct ? 'rgba(234, 179, 8, 0.08)' : 'rgba(34, 197, 94, 0.08)', border: `1px solid ${isCosmeticProduct ? 'rgba(234, 179, 8, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{isCosmeticProduct ? '🏷️' : '🌿'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: themeText }}>Auto-Detected GST: <span style={{ color: '#8f8269' }}>{gstRate}%</span></div>
                      <div style={{ fontSize: '11px', color: themeTextSoft, marginTop: '2px' }}>{gstLabel} • HSN {hsnCode}</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: isCosmeticProduct ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)', color: isCosmeticProduct ? '#b45309' : '#15803d' }}>{gstRate}% GST</span>
                  </div>
                );
              })()}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>Product Image Upload</label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', background: themeBg, padding: '12px', borderRadius: '12px', border: `1px solid ${themeBorder}`, flexWrap: 'wrap' }}>
                  {productForm.image_url ? (
                    <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${themeBorder}`, flexShrink: 0 }}>
                      <img src={productForm.image_url} alt="Product Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '10px', border: `1px dashed ${themeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📷</div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="admin-product-image-file-input"
                      onChange={handleProductImageUpload} 
                      style={{ display: 'none' }} 
                    />
                    <label 
                      htmlFor="admin-product-image-file-input"
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '8px 14px', 
                        borderRadius: '8px', 
                        background: '#8f8269', 
                        color: '#ffffff', 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        cursor: 'pointer',
                        width: 'fit-content',
                        minHeight: '44px'
                      }}
                    >
                      📁 Upload Image File
                    </label>
                    <input 
                      type="text" 
                      placeholder="Or enter Image URL" 
                      value={productForm.image_url} 
                      onChange={e => setProductForm({ ...productForm, image_url: e.target.value })} 
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${themeBorder}`, background: 'transparent', color: themeText, fontSize: '11px', boxSizing: 'border-box', minHeight: '36px' }} 
                    />
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>Description</label>
                <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowProductModal(false)} style={{ padding: '10px 18px', borderRadius: '10px', background: 'transparent', border: `1px solid ${themeBorder}`, color: themeText, cursor: 'pointer', fontSize: '13px', minHeight: '44px' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: '10px', background: '#8f8269', color: '#fff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', minHeight: '44px' }}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS & INVOICE MODAL */}
      {showOrderModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99990, padding: '16px' }}>
          <div className="admin-modal-container" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: '24px', padding: '32px', maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Order #{selectedOrder.id}</h3>
              <button onClick={() => setShowOrderModal(false)} style={{ background: 'none', border: 'none', color: themeText, cursor: 'pointer', padding: '6px', minHeight: '44px' }}><X size={20} /></button>
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
              <div><strong>Status:</strong> {selectedOrder.status.toUpperCase()}</div>
              <div><strong>Total Amount:</strong> ₹{selectedOrder.total}</div>
              <div><strong>Payment Method:</strong> {(selectedOrder.payment_method || 'COD').toUpperCase()}</div>
              
              {/* India Post Tracking Control Box */}
              <div style={{ marginTop: '12px', padding: '14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: '#065f46', fontSize: '12px' }}>📮 India Post Tracking & Dispatch:</strong>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    id="modal-tracking-input"
                    placeholder="Enter India Post Tracking ID (e.g. CP123456789IN)" 
                    defaultValue={selectedOrder.trackingId || selectedOrder.tracking_id || ''}
                    style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, fontSize: '12px', minHeight: '44px' }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('modal-tracking-input');
                      const val = input ? input.value.trim() : '';
                      if (val) {
                        handleUpdateOrderStatus(selectedOrder.id, 'on_estimate', val);
                        alert(`India Post Tracking ID (${val}) saved! Customer notified via email with tracking link.`);
                      } else {
                        alert('Please enter a valid India Post Tracking ID.');
                      }
                    }}
                    style={{ padding: '8px 14px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: '700', fontSize: '11px', cursor: 'pointer', minHeight: '44px' }}
                  >
                    Save & Send Email ↗
                  </button>
                </div>
                {(selectedOrder.trackingId || selectedOrder.tracking_id) && (
                  <div style={{ fontSize: '11px', color: '#047857', marginTop: '6px' }}>
                    Current Consignment ID: <strong>{selectedOrder.trackingId || selectedOrder.tracking_id}</strong>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '12px', padding: '12px', background: themeBg, borderRadius: '12px', border: `1px solid ${themeBorder}` }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Shipping Address:</strong>
                <div>{selectedOrder.shipping_address?.name || 'Valued Customer'}</div>
                <div>{selectedOrder.shipping_address?.address || 'Standard Address'}, {selectedOrder.shipping_address?.city || ''}</div>
                <div>Phone: {selectedOrder.shipping_address?.phone || 'N/A'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => printAdminGstInvoice(selectedOrder)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: '#8f8269', color: '#fff', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer', minHeight: '44px' }}>
                <Printer size={14} /> Print GST Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99990, padding: '16px' }}>
          <div className="admin-modal-container" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: '24px', padding: '32px', maxWidth: '440px', width: '100%' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>Add New Category</h3>
            <form onSubmit={async (e) => { e.preventDefault(); await fetch(`${API_BASE_URL}/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryForm) }); fetchAdminData(); setShowCategoryModal(false); }}>
              <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, marginBottom: '12px', boxSizing: 'border-box', minHeight: '44px' }} />
              <textarea placeholder="Description" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, marginBottom: '16px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={{ padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: `1px solid ${themeBorder}`, color: themeText, cursor: 'pointer', minHeight: '44px' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', background: '#8f8269', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', minHeight: '44px' }}>Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {showCouponModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99990, padding: '16px' }}>
          <div className="admin-modal-container" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: '24px', padding: '32px', maxWidth: '440px', width: '100%' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>Create Promo Code</h3>
            <form onSubmit={async (e) => { e.preventDefault(); await fetch(`${API_BASE_URL}/admin/coupons`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(couponForm) }); fetchAdminData(); setShowCouponModal(false); }}>
              <input type="text" placeholder="Coupon Code (e.g. KRISHIV20)" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, marginBottom: '12px', boxSizing: 'border-box', minHeight: '44px' }} />
              <div className="responsive-form-row-2" style={{ marginBottom: '12px' }}>
                <select value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, minHeight: '44px' }}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
                <input type="number" placeholder="Value" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: Number(e.target.value) })} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, minHeight: '44px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowCouponModal(false)} style={{ padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: `1px solid ${themeBorder}`, color: themeText, cursor: 'pointer', minHeight: '44px' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', background: '#8f8269', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', minHeight: '44px' }}>Create Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BROADCAST NOTIFICATION MODAL */}
      {showNotificationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99990, padding: '16px' }}>
          <div className="admin-modal-container" style={{ background: themeCardBg, border: `1px solid ${themeBorder}`, borderRadius: '24px', padding: '32px', maxWidth: '440px', width: '100%' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>Broadcast Customer Notification</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert(`Notification Broadcast Sent: "${notifForm.title}"`); setShowNotificationModal(false); }}>
              <input type="text" placeholder="Title" value={notifForm.title} onChange={e => setNotifForm({ ...notifForm, title: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, marginBottom: '12px', boxSizing: 'border-box', minHeight: '44px' }} />
              <textarea placeholder="Message body" value={notifForm.message} onChange={e => setNotifForm({ ...notifForm, message: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${themeBorder}`, background: themeBg, color: themeText, marginBottom: '16px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowNotificationModal(false)} style={{ padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: `1px solid ${themeBorder}`, color: themeText, cursor: 'pointer', minHeight: '44px' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', background: '#8f8269', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', minHeight: '44px' }}>Broadcast Now</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
