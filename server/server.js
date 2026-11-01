require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const app = express();
const appOrigin = process.env.APP_ORIGIN || "https://morgan-collection.onrender.com";
const PORT = Number(process.env.PORT || 3000);
const appOrigin = process.env.APP_ORIGIN || "https://morgan-collection.onrender.com";
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const customerDataFile = path.join(__dirname, "data", "customers.json");
if (!fs.existsSync(customerDataFile)) fs.writeFileSync(customerDataFile, "[]", "utf8");
const readCustomers = () => JSON.parse(fs.readFileSync(customerDataFile, "utf8"));
const writeCustomers = (customers) => fs.writeFileSync(customerDataFile, JSON.stringify(customers, null, 2), "utf8");
const adminDataFile = path.join(__dirname, "data", "admin-accounts.json");
if (!fs.existsSync(adminDataFile)) fs.writeFileSync(adminDataFile, "[]", "utf8");
const readAdminAccounts = () => JSON.parse(fs.readFileSync(adminDataFile, "utf8"));
const writeAdminAccounts = (accounts) => fs.writeFileSync(adminDataFile, JSON.stringify(accounts, null, 2), "utf8");
const settingsFile = path.join(__dirname, "data", "settings.json");
if (!fs.existsSync(settingsFile)) fs.writeFileSync(settingsFile, JSON.stringify({ contactName: "Morgan Collection", phone: "0546163592", whatsapp: "", email: "bernardopoku020@gmail.com" }, null, 2), "utf8");
const readSettings = () => JSON.parse(fs.readFileSync(settingsFile, "utf8"));
const writeSettings = (settings) => fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), "utf8");

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):5173$/.test(origin)) {
      return callback(null, true);
          if (origin === appOrigin) return callback(null, true);
    }
    callback(new Error("Origin is not allowed."));
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(session({
  secret: process.env.SESSION_SECRET || "development-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 8 * 60 * 60 * 1000 }
}));
app.use("/uploads", express.static(uploadDir));

const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
if (!readAdminAccounts().length) {
  writeAdminAccounts([{ id: 1, name: "Store administrator", username, email: "", password_hash: bcrypt.hashSync(password, 12), created_at: new Date().toISOString() }]);
}
const existingAdmin = db.prepare("SELECT id FROM admins WHERE username = ?").get(username);
if (!existingAdmin) {
  db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(username, bcrypt.hashSync(password, 12));
  console.log(`Initial admin created: ${username}. Change the default password in your .env file.`);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`);
  }
});
const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP or GIF images are allowed."));
    }
    cb(null, true);
  }
});

const requireAdmin = (req, res, next) => {
  if (!req.session.adminId) return res.status(401).json({ error: "Please sign in as administrator." });
  next();
};
const requireCustomer = (req, res, next) => {
  if (!req.session.customerId) return res.status(401).json({ error: "Please sign in to your customer account." });
  next();
};

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "Morgan Collection" }));
app.get("/api/settings", (_req, res) => res.json(readSettings()));
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!String(name || "").trim() || !normalizedEmail || !String(password || "")) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "Your password must be at least 8 characters." });
  }
  const customers = readCustomers();
  const existing = customers.find((customer) => customer.email === normalizedEmail);
  if (existing) return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
  const customer = { id: customers.length ? Math.max(...customers.map((item) => item.id)) + 1 : 1, name: String(name).trim(), email: normalizedEmail, password_hash: bcrypt.hashSync(password, 12), created_at: new Date().toISOString() };
  customers.push(customer);
  writeCustomers(customers);
  res.status(201).json({ ok: true, customer: { name: customer.name, email: normalizedEmail } });
});
app.post("/api/auth/login", (req, res) => {
  const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
  const customer = readCustomers().find((item) => item.email === normalizedEmail);
  if (!customer || !bcrypt.compareSync(String(req.body?.password || ""), customer.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  req.session.customerId = customer.id;
  req.session.customerName = customer.name;
  req.session.customerEmail = customer.email;
  res.json({ ok: true, customer: { name: customer.name, email: customer.email } });
});
app.get("/api/auth/me", (req, res) => {
  if (!req.session.customerId) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, customer: { name: req.session.customerName, email: req.session.customerEmail } });
});
app.post("/api/auth/logout", requireCustomer, (req, res) => {
  const customerSession = req.session;
  delete customerSession.customerId;
  delete customerSession.customerName;
  delete customerSession.customerEmail;
  res.json({ ok: true });
});
app.get("/api/products", (_req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY created_at DESC, id DESC").all();
  res.json(rows.map(p => ({ ...p, sizes: p.sizes.split(",").filter(Boolean), colours: p.colours.split(",").filter(Boolean) })));
});
app.get("/api/products/:id", (req, res) => {
  const p = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!p) return res.status(404).json({ error: "Product not found." });
  res.json({ ...p, sizes: p.sizes.split(",").filter(Boolean), colours: p.colours.split(",").filter(Boolean) });
});
app.post("/api/admin/login", (req, res) => {
  const identifier = String(req.body?.username || req.body?.email || "").trim().toLowerCase();
  const account = readAdminAccounts().find((item) => item.username.toLowerCase() === identifier || item.email.toLowerCase() === identifier);
  if (!account || !bcrypt.compareSync(String(req.body?.password || ""), account.password_hash)) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  req.session.adminId = account.id;
  req.session.adminUsername = account.username;
  res.json({ ok: true, username: account.username });
});
app.post("/api/admin/register", (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const username = String(req.body?.username || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!name || !email || !username || !password) return res.status(400).json({ error: "Name, email, username and password are required." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
  if (password.length < 8) return res.status(400).json({ error: "Your password must be at least 8 characters." });
  const accounts = readAdminAccounts();
  if (accounts.some((item) => item.email.toLowerCase() === email || item.username.toLowerCase() === username)) return res.status(409).json({ error: "That admin email or username is already registered." });
  const account = { id: accounts.length ? Math.max(...accounts.map((item) => item.id)) + 1 : 1, name, username, email, password_hash: bcrypt.hashSync(password, 12), created_at: new Date().toISOString() };
  accounts.push(account);
  writeAdminAccounts(accounts);
  res.status(201).json({ ok: true, username });
});
app.get("/api/admin/me", (req, res) => {
  if (!req.session.adminId) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, username: req.session.adminUsername });
});
app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});
app.put("/api/admin/settings", requireAdmin, (req, res) => {
  const current = readSettings();
  const next = {
    contactName: String(req.body?.contactName ?? current.contactName).trim(),
    phone: String(req.body?.phone ?? current.phone).trim(),
    whatsapp: String(req.body?.whatsapp ?? current.whatsapp).replace(/\D/g, ""),
    email: String(req.body?.email ?? current.email).trim(),
  };
  if (!next.contactName || !next.email) return res.status(400).json({ error: "Business name and email are required." });
  writeSettings(next);
  res.json(next);
});
app.post("/api/admin/products", requireAdmin, imageUpload.single("image"), (req, res) => {
  const { name, description = "", category, audience = "Unisex", price, sale_price, sizes = "", colours = "", stock = 0 } = req.body;
  if (!name || !category || !Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: "Product name, category and a valid price are required." });
  }
  const image = req.file ? `/uploads/${req.file.filename}` : "";
  const result = db.prepare(`INSERT INTO products
    (name, description, category, audience, price, sale_price, sizes, colours, stock, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      name.trim(), description, category, audience, Number(price),
      sale_price === "" || sale_price == null ? null : Number(sale_price),
      sizes, colours, Math.max(0, Number(stock) || 0), image
    );
  res.status(201).json({ id: result.lastInsertRowid, ok: true });
});
app.put("/api/admin/products/:id", requireAdmin, imageUpload.single("image"), (req, res) => {
  const old = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!old) return res.status(404).json({ error: "Product not found." });
  const b = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : old.image;
  db.prepare(`UPDATE products SET name=?, description=?, category=?, audience=?, price=?, sale_price=?,
    sizes=?, colours=?, stock=?, image=? WHERE id=?`).run(
    b.name || old.name, b.description ?? old.description, b.category || old.category,
    b.audience || old.audience, Number(b.price ?? old.price),
    b.sale_price === "" ? null : (b.sale_price == null ? old.sale_price : Number(b.sale_price)),
    b.sizes ?? old.sizes, b.colours ?? old.colours, Math.max(0, Number(b.stock ?? old.stock) || 0),
    image, req.params.id
  );
  res.json({ ok: true });
});
app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});
app.get("/api/admin/orders", requireAdmin, (_req, res) => {
  res.json(db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all().map((order) => ({ ...order, items: JSON.parse(order.items_json) })));
});
app.get("/api/orders/mine", requireCustomer, (req, res) => {
  const orders = db.prepare("SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC").all(req.session.customerEmail);
  res.json(orders.map((order) => ({ ...order, items: JSON.parse(order.items_json) })));
});
app.patch("/api/admin/orders/:id", requireAdmin, (req, res) => {
  const allowed = ["Pending", "Confirmed", "Preparing", "Dispatched", "Delivered", "Cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Invalid order status." });
  db.prepare("UPDATE orders SET status=? WHERE id=?").run(req.body.status, req.params.id);
  res.json({ ok: true });
});
app.post("/api/orders", requireCustomer, (req, res) => {
  const { customer_name, phone, address, items } = req.body || {};
  if (!customer_name || !phone || !address || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Please provide your name, phone, delivery address and cart items." });
  }
  let total = 0;
  const cleanItems = [];
  for (const item of items) {
    const product = db.prepare("SELECT id, name, price, sale_price, stock FROM products WHERE id=?").get(item.id);
    const quantity = Math.max(1, Math.min(50, Number(item.quantity) || 1));
    if (!product) return res.status(400).json({ error: "A product in your cart is no longer available." });
    if (product.stock < quantity) return res.status(400).json({ error: `Not enough stock for ${product.name}.` });
    const unit = product.sale_price != null ? product.sale_price : product.price;
    total += unit * quantity;
    cleanItems.push({ id: product.id, name: product.name, quantity, unit_price: unit });
  }
  const transaction = db.transaction(() => {
    for (const item of cleanItems) db.prepare("UPDATE products SET stock=stock-? WHERE id=?").run(item.quantity, item.id);
    return db.prepare("INSERT INTO orders (customer_name, phone, address, items_json, total, customer_email) VALUES (?, ?, ?, ?, ?, ?)")
      .run(customer_name.trim(), phone.trim(), address.trim(), JSON.stringify(cleanItems), total, req.session.customerEmail);
  });
  const result = transaction();
  res.status(201).json({ ok: true, orderId: result.lastInsertRowid, total });
});
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Something went wrong." });
});

app.listen(PORT, "0.0.0.0", () => console.log(`Morgan Collection server running on port ${PORT}`));
