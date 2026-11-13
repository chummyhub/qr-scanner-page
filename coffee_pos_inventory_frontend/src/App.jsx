import { useEffect, useState } from 'react';
import './App.css';

// Starting menu. Data is saved in the browser (localStorage) since there is no backend yet.
const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Espresso', price: 90, stock: 50 },
  { id: 2, name: 'Americano', price: 110, stock: 50 },
  { id: 3, name: 'Cappuccino', price: 140, stock: 40 },
  { id: 4, name: 'Cafe Latte', price: 150, stock: 40 },
  { id: 5, name: 'Caramel Macchiato', price: 170, stock: 30 },
  { id: 6, name: 'Croissant', price: 85, stock: 20 },
];

const LOW_STOCK = 10;
const peso = (n) => `₱${n.toFixed(2)}`;

function useSavedState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep working in memory */
    }
  }, [key, value]);
  return [value, setValue];
}

export default function App() {
  const [page, setPage] = useState('pos');
  const [products, setProducts] = useSavedState('products', DEFAULT_PRODUCTS);
  const [sales, setSales] = useSavedState('sales', []);

  return (
    <div className="app">
      <header className="topbar">
        <h1>☕ Coffee POS</h1>
        <nav>
          <button className={page === 'pos' ? 'active' : ''} onClick={() => setPage('pos')}>POS</button>
          <button className={page === 'inventory' ? 'active' : ''} onClick={() => setPage('inventory')}>Inventory</button>
          <button className={page === 'sales' ? 'active' : ''} onClick={() => setPage('sales')}>Sales</button>
        </nav>
      </header>

      <main>
        {page === 'pos' && <Pos products={products} setProducts={setProducts} setSales={setSales} />}
        {page === 'inventory' && <Inventory products={products} setProducts={setProducts} />}
        {page === 'sales' && <Sales sales={sales} />}
      </main>
    </div>
  );
}

/* ---------------- POS ---------------- */
function Pos({ products, setProducts, setSales }) {
  const [cart, setCart] = useState([]); // [{ id, name, price, qty }]
  const [message, setMessage] = useState('');

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function addToCart(product) {
    const inCart = cart.find((c) => c.id === product.id)?.qty ?? 0;
    if (inCart >= product.stock) {
      setMessage(`Not enough stock for ${product.name}.`);
      return;
    }
    setMessage('');
    setCart((prev) =>
      prev.some((c) => c.id === product.id)
        ? prev.map((c) => (c.id === product.id ? { ...c, qty: c.qty + 1 } : c))
        : [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }],
    );
  }

  function removeOne(id) {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: c.qty - 1 } : c)).filter((c) => c.qty > 0));
  }

  function checkout() {
    if (cart.length === 0) return;
    setProducts((prev) =>
      prev.map((p) => {
        const item = cart.find((c) => c.id === p.id);
        return item ? { ...p, stock: p.stock - item.qty } : p;
      }),
    );
    setSales((prev) => [{ id: Date.now(), date: new Date().toLocaleString(), items: cart, total }, ...prev]);
    setCart([]);
    setMessage(`Sale completed: ${peso(total)}`);
  }

  return (
    <div className="pos">
      <section className="menu">
        {products.map((p) => (
          <button key={p.id} className="product" onClick={() => addToCart(p)} disabled={p.stock <= 0}>
            <strong>{p.name}</strong>
            <span>{peso(p.price)}</span>
            <small className={p.stock <= LOW_STOCK ? 'low' : ''}>
              {p.stock <= 0 ? 'Out of stock' : `${p.stock} left`}
            </small>
          </button>
        ))}
      </section>

      <aside className="cart">
        <h2>Order</h2>
        {cart.length === 0 && <p className="muted">Tap a product to add it.</p>}
        <ul>
          {cart.map((item) => (
            <li key={item.id}>
              <span>{item.qty} × {item.name}</span>
              <span>{peso(item.price * item.qty)}</span>
              <button className="small" onClick={() => removeOne(item.id)}>−</button>
            </li>
          ))}
        </ul>
        <div className="total">
          <span>Total</span>
          <strong>{peso(total)}</strong>
        </div>
        <button className="primary" onClick={checkout} disabled={cart.length === 0}>Checkout</button>
        {cart.length > 0 && <button className="link" onClick={() => setCart([])}>Clear order</button>}
        {message && <p className="message">{message}</p>}
      </aside>
    </div>
  );
}

/* ---------------- Inventory ---------------- */
function Inventory({ products, setProducts }) {
  const [form, setForm] = useState({ name: '', price: '', stock: '' });

  function addProduct(e) {
    e.preventDefault();
    if (!form.name.trim() || form.price === '' || form.stock === '') return;
    setProducts((prev) => [
      ...prev,
      { id: Date.now(), name: form.name.trim(), price: Number(form.price), stock: Number(form.stock) },
    ]);
    setForm({ name: '', price: '', stock: '' });
  }

  function update(id, field, value) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: field === 'name' ? value : Number(value) } : p)));
  }

  function remove(id) {
    if (confirm('Delete this product?')) setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="inventory">
      <form className="add-form" onSubmit={addProduct}>
        <input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <button className="primary" type="submit">Add product</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><input value={p.name} onChange={(e) => update(p.id, 'name', e.target.value)} /></td>
                <td><input type="number" min="0" step="0.01" value={p.price} onChange={(e) => update(p.id, 'price', e.target.value)} /></td>
                <td><input type="number" min="0" value={p.stock} onChange={(e) => update(p.id, 'stock', e.target.value)} /></td>
                <td>
                  {p.stock <= 0 ? <span className="badge out">Out</span>
                    : p.stock <= LOW_STOCK ? <span className="badge low">Low</span>
                    : <span className="badge ok">OK</span>}
                </td>
                <td><button className="small danger" onClick={() => remove(p.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Sales ---------------- */
function Sales({ sales }) {
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  return (
    <div className="sales">
      <div className="summary">
        <div><small>Transactions</small><strong>{sales.length}</strong></div>
        <div><small>Total sales</small><strong>{peso(totalSales)}</strong></div>
      </div>
      {sales.length === 0 && <p className="muted">No sales yet.</p>}
      {sales.map((s) => (
        <div key={s.id} className="sale">
          <div className="sale-head"><span>{s.date}</span><strong>{peso(s.total)}</strong></div>
          <small className="muted">{s.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</small>
        </div>
      ))}
    </div>
  );
}
