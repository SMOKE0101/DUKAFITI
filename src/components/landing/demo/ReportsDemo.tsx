
import { TrendingUp, Package, Users, DollarSign } from 'lucide-react';

const ReportsDemo = () => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-4">
      <div className="border-b border-slate-700 pb-4">
        <h3 className="text-lg font-semibold">Today's Performance</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-r from-green-600/20 to-green-400/20 border border-green-500/30 p-3 rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-300">Sales</div>
              <div className="text-xl font-bold text-green-400">KSh 12,450</div>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-xs text-green-300 mt-1">+15% from yesterday</div>
        </div>

        <div className="bg-gradient-to-r from-blue-600/20 to-blue-400/20 border border-blue-500/30 p-3 rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-300">Profit</div>
              <div className="text-xl font-bold text-blue-400">KSh 3,120</div>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-xs text-blue-300 mt-1">25% margin</div>
        </div>

        <div className="bg-gradient-to-r from-purple-600/20 to-purple-400/20 border border-purple-500/30 p-3 rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-300">Customers</div>
              <div className="text-xl font-bold text-purple-400">47</div>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-xs text-purple-300 mt-1">12 new today</div>
        </div>

        <div className="bg-gradient-to-r from-orange-600/20 to-orange-400/20 border border-orange-500/30 p-3 rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-orange-300">Low Stock</div>
              <div className="text-xl font-bold text-orange-400">3</div>
            </div>
            <Package className="w-8 h-8 text-orange-400" />
          </div>
          <div className="text-xs text-orange-300 mt-1">Needs restocking</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-slate-400">Top Selling Products</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center bg-slate-700/30 p-2 rounded">
            <span className="text-sm">Milk 1L</span>
            <div className="text-right">
              <div className="text-sm text-green-400">24 sold</div>
              <div className="text-xs text-slate-400">KSh 2,880</div>
            </div>
          </div>
          <div className="flex justify-between items-center bg-slate-700/30 p-2 rounded">
            <span className="text-sm">Bread</span>
            <div className="text-right">
              <div className="text-sm text-green-400">18 sold</div>
              <div className="text-xs text-slate-400">KSh 1,800</div>
            </div>
          </div>
          <div className="flex justify-between items-center bg-slate-700/30 p-2 rounded">
            <span className="text-sm">Sugar 2kg</span>
            <div className="text-right">
              <div className="text-sm text-green-400">12 sold</div>
              <div className="text-xs text-slate-400">KSh 2,880</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDemo;
