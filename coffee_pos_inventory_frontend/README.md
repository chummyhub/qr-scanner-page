# Coffee POS & Inventory (frontend only)

A simple React (Vite) website for a coffee shop:

- **POS**: tap products to build an order, then checkout (stock goes down automatically).
- **Inventory**: add, edit, and delete products; low-stock and out-of-stock badges.
- **Sales**: list of completed sales and total sales.

There is no backend yet. Data is saved in the browser's localStorage.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Main files

- `src/App.jsx`: all pages (POS, Inventory, Sales)
- `src/App.css`, `src/index.css`: styles
