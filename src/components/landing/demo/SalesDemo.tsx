
import { Button } from '@/components/ui/button';

const SalesDemo = () => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <h3 className="text-lg font-semibold">New Sale</h3>
        <span className="text-green-400">KSh 340</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded">
          <div>
            <div className="font-medium">Milk 1L</div>
            <div className="text-sm text-slate-400">Qty: 2</div>
          </div>
          <span className="text-green-400">KSh 240</span>
        </div>
        <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded">
          <div>
            <div className="font-medium">Bread</div>
            <div className="text-sm text-slate-400">Qty: 1</div>
          </div>
          <span className="text-green-400">KSh 100</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-4">
        <Button variant="outline" className="bg-slate-700 border-slate-600">
          Cash Payment
        </Button>
        <Button className="bg-green-600 hover:bg-green-700">
          M-Pesa Payment
        </Button>
      </div>
    </div>
  );
};

export default SalesDemo;
