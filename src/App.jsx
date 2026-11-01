import { useEffect, useMemo, useState } from "react";

const demoProducts = [
  { id: 1, name: "The Sculpted Blazer", category: "Outerwear", audience: "Unisex", price: 1850, tag: "New season", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85" },
  { id: 2, name: "Silk Slip Dress", category: "Dresses", audience: "Women", price: 980, tag: "Bestseller", image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85" },
  { id: 3, name: "Studio Knit Polo", category: "Tops", audience: "Men", price: 540, tag: "Essential", image: "https://images.unsplash.com/photo-1625910513413-5fc45c8d2b24?auto=format&fit=crop&w=900&q=85" },
  { id: 4, name: "The Daylight Tote", category: "Bags", audience: "Unisex", price: 760, tag: "Limited", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85" },
  { id: 5, name: "Form 01 Sunglasses", category: "Accessories", audience: "Unisex", price: 320, tag: "New season", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85" },
  { id: 6, name: "Everyday Leather Loafer", category: "Shoes", audience: "Unisex", price: 890, tag: "Bestseller", image: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=85" },
];
const categoryOptions = ["Tops", "Dresses", "Outerwear", "Bottoms", "Ladies' Shoes", "Men's Shoes", "Ladies' Slippers", "Men's Slippers", "Bags", "Accessories"];

const money = (value) => `GH₵ ${value.toLocaleString("en-GH")}`;
const api = async (url, options) => {
  const response = await fetch(url, { credentials: "include", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
};

function App() {
  const isAdminPath = window.location.pathname.startsWith("/admin");
  const [page, setPage] = useState(isAdminPath ? "admin" : "home");
  const [filter, setFilter] = useState("All");
  const [cart, setCart] = useState([]);
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [products, setProducts] = useState(demoProducts);
  const [admin, setAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [customer, setCustomer] = useState(null);
  const [settings, setSettings] = useState({ contactName: "Morgan Collection", phone: "0546163592", whatsapp: "", email: "bernardopoku020@gmail.com" });

  useEffect(() => {
    api("/api/products").then((items) => { if (items.length) setProducts(items); }).catch(() => {});
    api("/api/admin/me").then((data) => { setAdmin(true); setAdminUser(data.username); }).catch(() => {});
    api("/api/auth/me").then((data) => setCustomer(data.customer)).catch(() => {});
    api("/api/settings").then(setSettings).catch(() => {});
  }, []);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const visibleProducts = useMemo(() => {
    if (filter === "All") return products;
    return products.filter((product) => product.audience === filter || product.category === filter);
  }, [filter]);

  const navigate = (nextPage, nextFilter = "All") => {
    setPage(nextPage);
    setFilter(nextFilter);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    setSelected(null);
    setNotice(`${product.name} added to your bag`);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const updateQuantity = (id, amount) => setCart((current) => current
    .map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item)
    .filter((item) => item.quantity > 0));

  return (
    <div className="app-shell">
      <div className="announcement">COMPLIMENTARY SHIPPING ON ORDERS OVER GH₵ 1,500 <span>—</span> ACCRA / WORLDWIDE</div>
      {page !== "admin" && <header className="site-header">
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? "×" : "☰"}</button>
        <button className="wordmark" onClick={() => navigate("home")}>MORGAN <small>COLLECTION</small></button>
        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <button onClick={() => navigate("shop", "Women")}>Women</button>
          <button onClick={() => navigate("shop", "Men")}>Men</button>
          <button onClick={() => navigate("shop", "Unisex")}>Unisex</button>
          <button onClick={() => navigate("shop", "Ladies' Shoes")}>Shoes</button>
          <button onClick={() => navigate("shop", "All")}>The edit</button>
        </nav>
        <div className="header-actions">
          <button className="search-button" aria-label="Search">⌕</button>
          <button onClick={() => navigate("cart")} className="bag-link">Bag <span>{cartCount.toString().padStart(2, "0")}</span></button>
          <button onClick={() => navigate("account")} className="account-link">{customer ? "Account" : "Create account / Sign in"}</button>
        </div>
      </header>}

      {page === "home" && <Home products={products} navigate={navigate} openProduct={setSelected} addToCart={addToCart} />}
      {page === "shop" && <Shop filter={filter} setFilter={setFilter} products={visibleProducts} openProduct={setSelected} addToCart={addToCart} />}
      {page === "cart" && <Cart cart={cart} total={cartTotal} updateQuantity={updateQuantity} navigate={navigate} customer={customer} setNotice={setNotice} />}
      {page === "account" && <Account customer={customer} setCustomer={setCustomer} navigate={navigate} setNotice={setNotice} settings={settings} />}
      {page === "admin" && <AdminPanel admin={admin} adminUser={adminUser} setAdmin={setAdmin} setAdminUser={setAdminUser} products={products} setProducts={setProducts} setNotice={setNotice} settings={settings} setSettings={setSettings} />}

      {page !== "admin" && <footer className="site-footer">
        <div className="footer-main">
          <div><p className="footer-logo">MORGAN</p><p className="footer-copy">Thoughtful clothing for<br />the life you lead.</p></div>
          <div className="footer-links"><div><b>Explore</b><button onClick={() => navigate("shop", "All")}>The collection</button><button onClick={() => navigate("shop", "Women")}>Women</button><button onClick={() => navigate("shop", "Men")}>Men</button></div><div><b>Connect</b><a href={`mailto:${settings.email}`}>Email us</a>{settings.phone && <a href={`tel:${settings.phone}`}>Call {settings.phone}</a>}{settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp us</a>}<span>Accra, Ghana</span></div></div>
          <div className="newsletter"><b>Stay in the know</b><p>News, new arrivals, and a little inspiration.</p><div className="email-field"><input placeholder="Your email address" aria-label="Email address" /><button aria-label="Subscribe">↗</button></div></div>
        </div>
        <div className="footer-bottom"><span>© 2025 MORGAN COLLECTION</span><span>Made with intention in Ghana</span><span>Privacy &nbsp; Terms</span></div>
      </footer>}
      {page !== "admin" && <nav className="mobile-shopping-nav" aria-label="Mobile shopping navigation">
        <button className={page === "home" ? "active" : ""} onClick={() => navigate("home")}><span>⌂</span>Home</button>
        <button className={page === "shop" ? "active" : ""} onClick={() => navigate("shop", "All")}><span>⌕</span>Shop</button>
        <button className={page === "cart" ? "active" : ""} onClick={() => navigate("cart")}><span>Bag <b>{cartCount}</b></span>Bag</button>
        <button className={page === "account" ? "active" : ""} onClick={() => navigate("account")}><span>◎</span>Account</button>
      </nav>}
      {selected && <ProductModal product={selected} close={() => setSelected(null)} addToCart={addToCart} />}
      {notice && <div className="toast">{notice}<span>✓</span></div>}
    </div>
  );
}

function Home({ products, navigate, openProduct, addToCart }) {
  return <main>
    <section className="hero">
      <div className="hero-image"><div className="hero-overlay" /><div className="hero-note">SS / 25 <span>↓</span></div><p className="hero-credit">CAMPAIGN 01 — CAPE COAST</p></div>
      <div className="hero-content"><p className="eyebrow">THE MORGAN UNIFORM</p><h1>Dress like<br /><i>yourself.</i></h1><p className="hero-description">Modern essentials with a point of view. Designed in Ghana, made for everywhere.</p><button className="arrow-button light" onClick={() => navigate("shop", "All")}>Explore the collection <span>↗</span></button></div>
    </section>
    <section className="marquee"><span>MODERN ESSENTIALS</span><i>✳</i><span>EVERYDAY RITUALS</span><i>✳</i><span>MADE IN GHANA</span><i>✳</i><span>MODERN ESSENTIALS</span></section>
    <section className="editorial">
      <div className="editorial-copy"><p className="eyebrow">A QUIET CONFIDENCE</p><h2>Pieces that<br /><i>stay with you.</i></h2><p>We believe the best wardrobe is built slowly — with considered pieces that feel as good on day one as they do on day one hundred.</p><button className="arrow-button dark" onClick={() => navigate("shop", "All")}>Our philosophy <span>↗</span></button></div>
      <div className="editorial-image"><img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=85" alt="Neutral clothing on a rack" /><span>THE EVERYDAY EDIT</span></div>
    </section>
    <section className="featured"><div className="section-intro"><div><p className="eyebrow">CURATED FOR YOU</p><h2>New arrivals</h2></div><button className="underlined-link" onClick={() => navigate("shop", "All")}>View all <span>↗</span></button></div><ProductGrid products={products.slice(0, 4)} openProduct={openProduct} addToCart={addToCart} /></section>
    <section className="quote-section"><p>“Style is a way to say who you are<br />without having to speak.”</p><span>— RACHEL ZOE</span></section>
  </main>;
}

function Shop({ filter, setFilter, products: visibleProducts, openProduct, addToCart }) {
  const filters = ["All", "Women", "Men", "Unisex", "Ladies' Shoes", "Men's Shoes", "Ladies' Slippers", "Men's Slippers", "Bags", "Accessories"];
  return <main className="shop-page"><div className="shop-heading"><p className="eyebrow">THE MORGAN COLLECTION</p><h1>Find your <i>everyday.</i></h1><p>Thoughtful pieces for every version of you.</p></div><div className="filter-bar">{filters.map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><ProductGrid products={visibleProducts} openProduct={openProduct} addToCart={addToCart} /></main>;
}

function ProductGrid({ products: items, openProduct, addToCart }) {
  return <div className="product-grid">{items.map((product) => <article className="product-card" key={product.id}><button className="product-photo" onClick={() => openProduct(product)}><img src={product.image} alt={product.name} /><span>{product.tag}</span></button><div className="product-info"><div><p>{product.category} · {product.audience}</p><h3>{product.name}</h3></div><strong>{money(product.price)}</strong></div><button className="add-link" onClick={() => addToCart(product)}>Add to bag <span>+</span></button></article>)}</div>;
}

function Cart({ cart, total, updateQuantity, navigate, customer, setNotice }) {
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ customer_name: customer?.name || "", phone: "", address: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitOrder = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { const data = await api("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, items: cart.map(({ id, quantity }) => ({ id, quantity })) }) }); setNotice(`Order #${data.orderId} received. We will contact you to confirm delivery.`); navigate("account"); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <main className="cart-page"><p className="eyebrow">YOUR SELECTION</p><h1>Your bag <i>({cart.reduce((sum, item) => sum + item.quantity, 0).toString().padStart(2, "0")})</i></h1>{cart.length === 0 ? <div className="empty-cart"><p>Your bag is waiting for something beautiful.</p><button className="arrow-button dark" onClick={() => navigate("shop", "All")}>Discover the collection <span>↗</span></button></div> : <div className="cart-layout"><div>{cart.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt={item.name} /><div><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><span>{money(item.price)}</span><div className="quantity"><button onClick={() => updateQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)}>+</button></div></div></div>)}</div><aside className="summary"><p>Subtotal <strong>{money(total)}</strong></p><small>Delivery across Ghana. Pay on confirmation.</small>{customer ? <button className="arrow-button dark full" onClick={() => setCheckout(true)}>Place order <span>↗</span></button> : <button className="arrow-button dark full" onClick={() => navigate("account")}>Sign in to order <span>↗</span></button>}{checkout && <form className="checkout-form" onSubmit={submitOrder}><h3>Delivery details</h3><input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Full name" required /><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ghana phone number" required /><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Delivery address, town and region" required /><button className="arrow-button dark full" disabled={busy}>{busy ? "Sending..." : "Confirm order"} <span>↗</span></button>{error && <p className="form-error">{error}</p>}</form>}</aside></div>}</main>;
}

function Account({ customer, setCustomer, navigate, setNotice, settings }) {
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (mode === "register") {
        setMode("login");
        setForm({ name: "", email: form.email, password: "" });
        setNotice("Account created. Sign in with your new account.");
      } else {
        setCustomer(data.customer);
        setNotice("Welcome back.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    setCustomer(null);
    setNotice("You have been signed out.");
  };

  if (customer) return <CustomerAccount customer={customer} logout={logout} navigate={navigate} settings={settings} />;
  return <main className="account-page"><div className="account-panel"><p className="eyebrow">MORGAN COLLECTION</p><h1>{mode === "register" ? <>Create your <i>account.</i></> : <>Welcome <i>back.</i></>}</h1><p className="account-lead">{mode === "register" ? "Create your own account to keep your Morgan experience personal." : "Sign in to your Morgan account."}</p><form className="account-form" onSubmit={submit}>{mode === "register" && <label>Full name<input name="name" value={form.name} onChange={update} placeholder="Your full name" required /></label>}<label>Email address<input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" required /></label><label>Password<input name="password" type="password" value={form.password} onChange={update} placeholder={mode === "register" ? "At least 8 characters" : "Your password"} minLength={mode === "register" ? 8 : undefined} required /></label><button className="arrow-button dark full" disabled={busy}>{busy ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"} <span>↗</span></button>{error && <p className="form-error">{error}</p>}</form><button className="account-switch" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}>{mode === "register" ? "Already have an account? Sign in" : "New to Morgan? Create an account"}</button></div></main>;
}

function CustomerAccount({ customer, logout, navigate, settings }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api("/api/orders/mine").then(setOrders).catch(() => {}); }, []);
  return <main className="account-page"><p className="eyebrow">YOUR MORGAN ACCOUNT</p><h1>Welcome, <i>{customer.name.split(" ")[0]}.</i></h1><div className="account-card"><p>Signed in as</p><strong>{customer.email}</strong><p className="account-note">Your orders and delivery updates live here.</p><div className="contact-actions"><a href={`mailto:${settings.email}`}>Email Morgan</a>{settings.phone && <a href={`tel:${settings.phone}`}>Call {settings.phone}</a>}{settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>}</div><button className="arrow-button dark" onClick={logout}>Sign out <span>↗</span></button></div><div className="orders-panel"><h2>Track your orders</h2>{orders.length ? orders.map((order) => <div className="order-card" key={order.id}><div><b>Order #{order.id}</b><small>{new Date(order.created_at).toLocaleDateString("en-GH")}</small></div><strong>{order.status}</strong><span>{money(Number(order.total))}</span></div>) : <p>No orders yet. Your confirmed orders will appear here.</p>}</div><button className="underlined-link account-continue" onClick={() => navigate("shop", "All")}>Continue shopping <span>↗</span></button></main>;
}

function ProductModal({ product, close, addToCart }) {
  return <div className="modal-backdrop" onClick={close}><div className="product-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={close}>×</button><img src={product.image} alt={product.name} /><div className="modal-copy"><p className="eyebrow">{product.category} · {product.audience}</p><h2>{product.name}</h2><strong>{money(product.price)}</strong><p className="modal-description">A considered essential, made to be lived in. Designed with a relaxed silhouette and finished with the details that make Morgan distinctly yours.</p><button className="arrow-button dark full" onClick={() => addToCart(product)}>Add to bag <span>↗</span></button></div></div></div>;
}

function AdminPanel({ admin, adminUser, setAdmin, setAdminUser, products, setProducts, setNotice, settings, setSettings }) {
  const [form, setForm] = useState({ name: "", description: "", category: "Tops", audience: "Unisex", price: "", sale_price: "", sizes: "", colours: "", stock: "0", image: null });
  const [credentials, setCredentials] = useState({ username: "admin", password: "" });
  const [authMode, setAuthMode] = useState("register");
  const [adminSignup, setAdminSignup] = useState({ name: "", email: "", username: "", password: "" });
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [contactForm, setContactForm] = useState(settings);
  const isFootwear = form.category.includes("Shoes") || form.category.includes("Slippers");
  const footwearSizes = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === "file" ? event.target.files[0] : event.target.value }));
  const toggleSize = (size) => {
    const sizes = (form.sizes || "").split(",").map((item) => item.trim()).filter(Boolean);
    const nextSizes = sizes.includes(size) ? sizes.filter((item) => item !== size) : [...sizes, size];
    setForm((current) => ({ ...current, sizes: nextSizes.join(", ") }));
  };
  const submitLogin = async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    try { const data = await api("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) }); setAdmin(true); setAdminUser(data.username); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const submitAdminSignup = async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await api("/api/admin/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(adminSignup) });
      setCredentials({ username: adminSignup.username, password: "" });
      setAuthMode("login");
      setNotice("Admin account created. Sign in with your new credentials.");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const submitProduct = async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => { if (value !== null && value !== "") body.append(key, value); });
    try {
      await api(editing ? `/api/admin/products/${editing.id}` : "/api/admin/products", { method: editing ? "PUT" : "POST", body });
      const latest = await api("/api/products"); setProducts(latest); setForm({ name: "", description: "", category: "Tops", audience: "Unisex", price: "", sale_price: "", sizes: "", colours: "", stock: "0", image: null }); setEditing(null); setNotice(editing ? "Product updated." : "Product published.");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const editProduct = (product) => { setEditing(product); setForm({ ...product, sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : product.sizes, colours: Array.isArray(product.colours) ? product.colours.join(", ") : product.colours, image: null }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const deleteProduct = async (id) => { if (!window.confirm("Delete this product?")) return; try { await api(`/api/admin/products/${id}`, { method: "DELETE" }); setProducts(await api("/api/products")); setNotice("Product deleted."); } catch (err) { setError(err.message); } };
  useEffect(() => {
    if (!admin) return undefined;
    let previousCount = 0;
    const refreshOrders = () => api("/api/admin/orders").then((nextOrders) => {
      if (previousCount && nextOrders.length > previousCount) setNotice("New customer order received.");
      previousCount = nextOrders.length;
      setOrders(nextOrders);
    }).catch(() => {});
    refreshOrders();
    const interval = window.setInterval(refreshOrders, 15000);
    return () => window.clearInterval(interval);
  }, [admin]);
  const saveSettings = async (event) => { event.preventDefault(); try { const next = await api("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contactForm) }); setSettings(next); setNotice("Contact settings saved."); } catch (err) { setError(err.message); } };

  if (!admin) return <main className="admin-page"><div className="admin-login"><p className="eyebrow">MORGAN COLLECTION / ADMIN</p><h1>{authMode === "register" ? <>Create your <i>admin account.</i></> : <>Admin <i>studio.</i></>}</h1><p>{authMode === "register" ? "Create your personal administrator account first. You will sign in after signup." : "Sign in with your administrator account."}</p>{authMode === "register" ? <form onSubmit={submitAdminSignup}><input value={adminSignup.name} onChange={(e) => setAdminSignup({ ...adminSignup, name: e.target.value })} placeholder="Full name" required /><input type="email" value={adminSignup.email} onChange={(e) => setAdminSignup({ ...adminSignup, email: e.target.value })} placeholder="Personal email" required /><input value={adminSignup.username} onChange={(e) => setAdminSignup({ ...adminSignup, username: e.target.value })} placeholder="Admin username" required /><input type="password" value={adminSignup.password} onChange={(e) => setAdminSignup({ ...adminSignup, password: e.target.value })} placeholder="Password (at least 8 characters)" minLength="8" required /><button className="arrow-button dark full" disabled={busy}>{busy ? "Creating account..." : "Create admin account"} <span>↗</span></button></form> : <form onSubmit={submitLogin}><input value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} placeholder="Username or email" required /><input type="password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} placeholder="Password" required /><button className="arrow-button dark full" disabled={busy}>{busy ? "Signing in..." : "Sign in"} <span>↗</span></button></form>}<button className="account-switch" onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setError(""); }}>{authMode === "register" ? "Already have an admin account? Sign in" : "Need a personal admin account? Sign up"}</button>{error && <p className="form-error">{error}</p>}</div></main>;
  return <main className="admin-page"><div className="admin-heading"><div><p className="eyebrow">ADMIN STUDIO / {adminUser}</p><h1>Manage your <i>collection.</i></h1></div><button className="underlined-link" onClick={async () => { await api("/api/admin/logout", { method: "POST" }); setAdmin(false); }}>Sign out</button></div><div className="admin-layout"><form className="product-form" onSubmit={submitProduct}><h2>{editing ? "Edit product" : "Add a product"}</h2><label>Product name<input name="name" value={form.name} onChange={update} placeholder="e.g. The Studio Shirt" required /></label><label>Description<textarea name="description" value={form.description} onChange={update} placeholder="Tell customers about the piece." /></label><div className="form-grid"><label>Category<select name="category" value={form.category} onChange={update}>{categoryOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label>Audience<select name="audience" value={form.audience} onChange={update}>{["Women", "Men", "Unisex"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Price (GH₵)<input type="number" min="0" name="price" value={form.price} onChange={update} required /></label><label>Sale price<input type="number" min="0" name="sale_price" value={form.sale_price || ""} onChange={update} /></label><label className="size-field">{isFootwear ? "Shoe / slipper sizes" : "Clothing sizes"}<input name="sizes" value={form.sizes || ""} onChange={update} placeholder={isFootwear ? "Select below or type sizes" : "XS, S, M, L, XL"} />{isFootwear && <span className="size-picker">{footwearSizes.map((size) => <button type="button" className={(form.sizes || "").split(",").map((item) => item.trim()).includes(size) ? "selected" : ""} onClick={() => toggleSize(size)} key={size}>{size}</button>)}</span>}</label><label>Colours<input name="colours" value={form.colours || ""} onChange={update} placeholder="Black, Ivory" /></label><label>Stock<input type="number" min="0" name="stock" value={form.stock} onChange={update} /></label></div><label>Product image<input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif" onChange={update} required={!editing} /></label><button className="arrow-button dark full" disabled={busy}>{busy ? "Saving..." : editing ? "Update product" : "Publish product"} <span>↗</span></button>{editing && <button type="button" className="cancel-button" onClick={() => setEditing(null)}>Cancel editing</button>}{error && <p className="form-error">{error}</p>}</form><div className="admin-list"><div className="list-heading"><h2>Products <span>{products.length}</span></h2></div>{products.map((product) => <div className="admin-product" key={product.id}>{product.image ? <img src={product.image} alt="" /> : <div className="admin-placeholder">MC</div>}<div><b>{product.name}</b><small>{product.category} · {product.audience}<br />{money(Number(product.sale_price ?? product.price))} · {product.stock} in stock</small></div><div className="admin-actions"><button onClick={() => editProduct(product)}>Edit</button><button onClick={() => deleteProduct(product.id)}>Delete</button></div></div>)}<section className="admin-orders"><h2>Orders <span>{orders.length}</span></h2>{orders.map((order) => <div className="admin-order" key={order.id}><div><b>Order #{order.id}</b><small>{order.customer_name} · {order.phone}<br />{order.address}</small></div><strong>{money(Number(order.total))}</strong><select value={order.status} onChange={async (event) => { await api(`/api/admin/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: event.target.value }) }); setOrders(await api("/api/admin/orders")); }}><option>Pending</option><option>Confirmed</option><option>Preparing</option><option>Dispatched</option><option>Delivered</option><option>Cancelled</option></select></div>)}</section><form className="contact-settings" onSubmit={saveSettings}><h2>Customer contact</h2><label>Business name<input value={contactForm.contactName} onChange={(e) => setContactForm({ ...contactForm, contactName: e.target.value })} /></label><label>Phone<input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="0546163592" /></label><label>WhatsApp number<input value={contactForm.whatsapp} onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })} placeholder="233546163592" /></label><label>Email<input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required /></label><button className="arrow-button dark full">Save contact details <span>↗</span></button></form></div></div></main>;
}

export default App;
