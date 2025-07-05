
import { User, CreditCard, Phone } from 'lucide-react';

const CustomerDemo = () => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-4">
      <div className="border-b border-slate-700 pb-4">
        <h3 className="text-lg font-semibold">Customer Profile</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-center space-x-3 bg-slate-700/50 p-3 rounded">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-medium">Mary Wanjiku</div>
            <div className="text-sm text-slate-400 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              0712345678
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/30 p-3 rounded">
            <div className="text-sm text-slate-400">Total Purchases</div>
            <div className="text-lg font-semibold text-green-400">KSh 24,500</div>
          </div>
          <div className="bg-slate-700/30 p-3 rounded">
            <div className="text-sm text-slate-400">Outstanding</div>
            <div className="text-lg font-semibold text-orange-400">KSh 1,200</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-slate-400">Recent Transactions</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm bg-slate-700/30 p-2 rounded">
              <span>Sugar 2kg</span>
              <span className="text-green-400">KSh 240</span>
            </div>
            <div className="flex justify-between items-center text-sm bg-slate-700/30 p-2 rounded">
              <span>Cooking Oil 1L</span>
              <span className="text-orange-400">KSh 220 (Credit)</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center gap-1">
            <CreditCard className="w-4 h-4" />
            Record Payment
          </button>
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm">
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDemo;
