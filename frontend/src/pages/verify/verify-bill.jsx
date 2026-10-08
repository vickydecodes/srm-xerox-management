import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ShieldAlert, ShieldCheck, Printer, Calendar, Building2, Receipt, Hash, Clock, Award } from 'lucide-react';

export default function VerifyBill() {
  const { billId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVerification = async () => {
      setLoading(true);
      try {
        const host = window.location.hostname || 'localhost';
        const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || `http://${host}:5000/api/v1`;
        
        let effectiveApiUrl = rawApiUrl;
        if (host !== 'localhost' && host !== '127.0.0.1') {
          effectiveApiUrl = rawApiUrl.replace('localhost', host).replace('127.0.0.1', host);
        }

        const res = await fetch(`${effectiveApiUrl}/bills/public/verify/${billId}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || 'Verification failed');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Unable to reach SRM verification server');
      } finally {
        setLoading(false);
      }
    };

    if (billId) {
      fetchVerification();
    }
  }, [billId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 text-sm font-semibold animate-pulse">Verifying Invoice Authenticity with SRM Database...</p>
      </div>
    );
  }

  const isVerified = data?.isVerified === true;
  const bill = data?.bill;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-900 via-blue-700 to-amber-500 p-0.5 shadow-md shadow-blue-900/10">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.png" 
                alt="SRM Logo" 
                className="w-9 h-9 object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<div class="text-blue-900 font-bold text-xs">SRM</div>';
                }} 
              />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-950 tracking-tight">SRM IST Xerox Center</h1>
            <p className="text-xs text-slate-500 font-medium">Official Digital Bill Verification Portal</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
          <Award className="w-3.5 h-3.5 text-amber-600" /> Official Verification System
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl w-full mx-auto my-8">
        {/* Verification Status Card */}
        <div className={`rounded-2xl p-6 sm:p-8 border shadow-xl bg-white transition-all duration-300 ${
          isVerified 
            ? 'border-emerald-200 shadow-emerald-900/5' 
            : 'border-rose-200 shadow-rose-900/5'
        }`}>
          {/* Status Ribbon & Header */}
          <div className={`flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left mb-6 pb-6 border-b border-slate-100 ${
            isVerified ? 'bg-emerald-50/50 -mx-6 -mt-6 p-6 rounded-t-2xl sm:-mx-8 sm:-mt-8 sm:p-8' : 'bg-rose-50/50 -mx-6 -mt-6 p-6 rounded-t-2xl sm:-mx-8 sm:-mt-8 sm:p-8'
          }`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isVerified ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-rose-600 text-white shadow-rose-600/20'
            }`}>
              {isVerified ? <ShieldCheck className="w-9 h-9" /> : <ShieldAlert className="w-9 h-9" />}
            </div>
            <div className="flex-1">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-2 ${
                isVerified ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {isVerified ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                {data?.status || (isVerified ? 'VERIFIED' : 'UNVERIFIED')}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {isVerified ? 'Official Verified SRM Bill' : 'Unverified or Invalid Bill'}
              </h2>
              <p className="text-sm text-slate-600 mt-1 font-medium">
                {data?.message || (isVerified ? 'This invoice has been verified and authenticated against SRM Xerox database records.' : 'This bill reference number could not be authenticated.')}
              </p>
            </div>
          </div>

          {/* Bill Details */}
          {bill ? (
            <div className="space-y-6">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-blue-700" /> Bill Code
                  </span>
                  <p className="text-base font-bold text-blue-950 mt-1">{bill.code}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" /> Date & Time
                  </span>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {new Date(bill.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-amber-600" /> Payment
                  </span>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    {bill.paymentMethod} ({bill.status})
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" /> Dept / Branch
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1 truncate">
                    {bill.department?.name || bill.branch?.name || 'Main Campus'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Itemized Invoice Breakdown</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Item Name / Description</th>
                        <th className="py-3 px-4 text-center">Type</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {bill.items && bill.items.length > 0 ? (
                        bill.items.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name || 'Print Service'}</td>
                            <td className="py-3.5 px-4 text-center text-slate-500 text-xs font-medium">{item.type || 'Service'}</td>
                            <td className="py-3.5 px-4 text-center font-bold text-blue-700">{item.quantity}</td>
                            <td className="py-3.5 px-4 text-right text-slate-600 font-medium">₹{Number(item.price).toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-700">₹{Number(item.total).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 italic">No item details recorded</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="flex flex-col items-end pt-4 border-t border-slate-200 space-y-1.5">
                <div className="flex justify-between w-full sm:w-64 text-xs font-medium text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{Number(bill.subtotal || bill.total).toFixed(2)}</span>
                </div>
                {bill.tax > 0 && (
                  <div className="flex justify-between w-full sm:w-64 text-xs font-medium text-slate-600">
                    <span>Tax (5%):</span>
                    <span>₹{Number(bill.tax).toFixed(2)}</span>
                  </div>
                )}
                {bill.discount > 0 && (
                  <div className="flex justify-between w-full sm:w-64 text-xs font-medium text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{Number(bill.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-full sm:w-64 text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-blue-900">₹{Number(bill.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-600">
              <p className="text-sm font-medium">The invoice reference <code className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded border border-rose-200 font-bold">{billId}</code> could not be located in our system database.</p>
              <p className="text-xs text-slate-400 mt-2">Please verify the bill ID or present your physical receipt at the SRM Xerox Management counter.</p>
            </div>
          )}
        </div>

        {/* Footer info & Action */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 px-2">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            <span>Authenticated on {new Date().toLocaleString()}</span>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Official Certificate
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl w-full mx-auto pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
        <p>© 2026 SRM Institute of Science and Technology. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
