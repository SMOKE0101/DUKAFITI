
const InventoryDemo = () => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-4">
      <div className="border-b border-slate-700 pb-4">
        <h3 className="text-lg font-semibold">Add Product</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-400">Product Name</label>
          <div className="bg-slate-700 rounded px-3 py-2 mt-1">Cooking Oil 1L</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400">Buy Price</label>
            <div className="bg-slate-700 rounded px-3 py-2 mt-1">KSh 180</div>
          </div>
          <div>
            <label className="text-sm text-slate-400">Sell Price</label>
            <div className="bg-slate-700 rounded px-3 py-2 mt-1">KSh 220</div>
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-400">Current Stock</label>
          <div className="bg-slate-700 rounded px-3 py-2 mt-1">24 units</div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3">
          <div className="text-orange-400 text-sm">⚠️ Low stock alert set at 5 units</div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDemo;
