import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Activity,
  BedDouble,
  Pill,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Sliders,
  BarChart3,
  Cpu,
  Layers,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { api } from '../api/client';
import { Badge } from '../components/Badge';

export const AIIntelligence = () => {
  const [metrics, setMetrics] = useState([]);
  const [volumeForecast, setVolumeForecast] = useState(null);
  const [bedForecast, setBedForecast] = useState(null);
  const [medForecast, setMedForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive Live Predictor Form State
  const [testAge, setTestAge] = useState(48);
  const [testLeadTime, setTestLeadTime] = useState(12);
  const [testDay, setTestDay] = useState(0); // Monday
  const [testHour, setTestHour] = useState(9); // 9 AM
  const [testPrevAppts, setTestPrevAppts] = useState(3);
  const [testPrevNoShows, setTestPrevNoShows] = useState(1);
  const [interactivePred, setInteractivePred] = useState(null);
  const [predLoading, setPredLoading] = useState(false);

  useEffect(() => {
    fetchAllAIData();
    runInteractivePrediction();
  }, []);

  const fetchAllAIData = async () => {
    setLoading(true);
    try {
      const [m, v, b, med] = await Promise.all([
        api.get('/ai/model-metrics'),
        api.get('/ai/forecast-patient-volume?forecast_days=14'),
        api.get('/ai/forecast-bed-demand?forecast_days=14'),
        api.get('/ai/forecast-medicine'),
      ]);
      setMetrics(m);
      setVolumeForecast(v);
      setBedForecast(b);
      setMedForecast(med);
    } catch (err) {
      console.error('Error fetching AI data:', err);
    } finally {
      setLoading(false);
    }
  };

  const runInteractivePrediction = async () => {
    setPredLoading(true);
    try {
      const res = await api.post('/ai/predict-noshow', {
        age: parseInt(testAge, 10),
        gender: 'Male',
        lead_time_days: parseInt(testLeadTime, 10),
        day_of_week: parseInt(testDay, 10),
        hour_of_day: parseInt(testHour, 10),
        department_id: 1,
        previous_appointments: parseInt(testPrevAppts, 10),
        previous_noshows: parseInt(testPrevNoShows, 10),
      });
      setInteractivePred(res);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setPredLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title & Vision Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30 mb-3">
              <Cpu className="w-4 h-4" />
              <span>Machine Learning & Time-Series Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AI Intelligence & Operational Analytics
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Evaluating probabilistic risk scoring, 14-day holdout time-series forecasting, and automated stockout prevention algorithms.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-left">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Models in Pipeline</p>
              <p className="text-xl font-extrabold text-teal-300">4 Ensembles</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-left">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Holdout Horizon</p>
              <p className="text-xl font-extrabold text-emerald-400">14-Day Rolling</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advisory Notification Alert */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 flex items-start space-x-3 text-xs leading-relaxed">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Clinical & Operational Advisory Notice:</span> All machine learning predictions, risk probabilities, and demand forecasts are decision-support recommendations. Decisions regarding elective bed holds or medication purchase orders require authorized physician or managerial approval.
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE APPOINTMENT NO-SHOW PREDICTOR */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <h3 className="text-lg sm:text-xl font-extrabold text-navy-900">
                1. Appointment No-Show Classifier (Live Inference)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Adjust parameters below to test the live Random Forest Classifier and see explainable feature weights.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
            Model: Scikit-Learn Random Forest
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Form */}
          <div className="lg:col-span-7 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/70">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Booking Lead Time: <span className="text-teal-600">{testLeadTime} Days</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="35"
                  value={testLeadTime}
                  onChange={(e) => setTestLeadTime(e.target.value)}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Patient Age: <span className="text-teal-600">{testAge} Years</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="85"
                  value={testAge}
                  onChange={(e) => setTestAge(e.target.value)}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Day of Week</label>
                <select
                  value={testDay}
                  onChange={(e) => setTestDay(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value={0}>Monday (High Historical Surge)</option>
                  <option value={1}>Tuesday</option>
                  <option value={2}>Wednesday</option>
                  <option value={3}>Thursday</option>
                  <option value={4}>Friday (Pre-Weekend Volatility)</option>
                  <option value={5}>Saturday</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Appointment Slot</label>
                <select
                  value={testHour}
                  onChange={(e) => setTestHour(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value={9}>09:00 AM (Morning Peak)</option>
                  <option value={10}>10:00 AM</option>
                  <option value={11}>11:30 AM</option>
                  <option value={14}>02:00 PM (Afternoon)</option>
                  <option value={16}>04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Previous Appointments: <span className="text-teal-600">{testPrevAppts}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={testPrevAppts}
                  onChange={(e) => setTestPrevAppts(e.target.value)}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Previous No-Shows: <span className="text-rose-600 font-bold">{testPrevNoShows}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={testPrevNoShows}
                  onChange={(e) => setTestPrevNoShows(e.target.value)}
                  className="w-full accent-rose-600"
                />
              </div>
            </div>

            <button
              onClick={runInteractivePrediction}
              disabled={predLoading}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-navy-900 hover:bg-navy-800 transition-colors shadow-sm flex items-center justify-center space-x-2"
            >
              <Cpu className="w-4 h-4 text-teal-400" />
              <span>{predLoading ? 'Running Classifier...' : 'Run Real-Time Prediction'}</span>
            </button>
          </div>

          {/* Prediction Output Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-navy-950 text-white p-6 rounded-2xl shadow-md border border-slate-800">
            <span className="text-[10px] font-bold tracking-widest text-teal-400 uppercase">
              Model Inference Output
            </span>

            {interactivePred ? (
              <div className="mt-3 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">
                      {interactivePred.risk_percentage}%
                    </span>
                    <p className="text-xs text-slate-400">Estimated No-Show Risk</p>
                  </div>
                  <Badge status={interactivePred.risk_level} className="text-sm px-3 py-1" />
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      interactivePred.risk_level === 'High'
                        ? 'bg-rose-500'
                        : interactivePred.risk_level === 'Medium'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${interactivePred.risk_percentage}%` }}
                  ></div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <p className="text-xs font-bold text-slate-300 mb-2">Key Contributing Factors:</p>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {interactivePred.top_contributing_factors.map((f, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-teal-400 font-bold shrink-0">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-teal-200">
                  <span className="font-bold block text-white mb-0.5">Recommended Protocol:</span>
                  {interactivePred.advisory_recommendation}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-4">Running initial prediction...</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: PATIENT VOLUME FORECASTING */}
      {volumeForecast && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                <h3 className="text-lg sm:text-xl font-extrabold text-navy-900">
                  2. Patient Volume 14-Day Time-Series Forecast
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ExponentialSmoothing (statsmodels) with additive 7-day seasonality & 95% confidence intervals.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg">
                MAE: {volumeForecast.mae} patients
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">
                RMSE: {volumeForecast.rmse}
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeForecast.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volForecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                
                {/* Confidence bound region */}
                <Area type="monotone" dataKey="upper_bound" name="Upper 95% Bound" stroke="#99f6e4" fill="#ccfbf1" fillOpacity={0.4} />
                <Area type="monotone" dataKey="lower_bound" name="Lower 95% Bound" stroke="#99f6e4" fill="#ffffff" fillOpacity={0.9} />
                
                <Line type="monotone" dataKey="actual_volume" name="Actual Historical Volume" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="predicted_volume" name="Predicted Volume (Forecast)" stroke="#0d9488" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            {volumeForecast.insights.map((ins, i) => (
              <div key={i} className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: BED DEMAND FORECASTING */}
      {bedForecast && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <h3 className="text-lg sm:text-xl font-extrabold text-navy-900">
                  3. Bed Demand & Surge Capacity Projection
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Projected inpatient census vs total hospital bed capacity ({bedForecast.total_capacity} beds).
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                Peak Demand: {bedForecast.peak_demand_count} Beds ({bedForecast.peak_demand_date})
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bedForecast.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[10, 65]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                
                {/* Total Capacity Benchmark Line */}
                <ReferenceLine y={bedForecast.total_capacity} label="Max Bed Capacity (56)" stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={2} />
                
                <Line type="monotone" dataKey="actual_occupied" name="Actual Occupied" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="predicted_demand" name="Predicted Bed Demand" stroke="#0d9488" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            {bedForecast.insights.map((ins, i) => (
              <div key={i} className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: MEDICINE CONSUMPTION & REORDER FORECASTING */}
      {medForecast && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 className="text-lg sm:text-xl font-extrabold text-navy-900">
                  4. Medicine Consumption & EOQ Reorder Alerts
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Consumption velocity, days-until-stockout projection, and automated replenishment quantities.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                {medForecast.critical_items_count} Critical Stockouts
              </span>
              <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                {medForecast.warning_items_count} Warning Stock
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Current Stock</th>
                  <th className="py-3 px-3">Daily Burn</th>
                  <th className="py-3 px-3">14-Day Demand</th>
                  <th className="py-3 px-3">Days to Stockout</th>
                  <th className="py-3 px-3">Status Risk</th>
                  <th className="py-3 px-4">Suggested Reorder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medForecast.items.slice(0, 8).map((m) => (
                  <tr key={m.medicine_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-navy-900">{m.name}</td>
                    <td className="py-3 px-3 text-slate-600">{m.category}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{m.current_stock} units</td>
                    <td className="py-3 px-3 text-slate-600">{m.avg_daily_consumption}/day</td>
                    <td className="py-3 px-3 font-medium text-slate-700">{m.predicted_consumption_14d} units</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {m.days_until_stockout < 5 ? (
                        <span className="text-rose-600 font-extrabold">{m.days_until_stockout} Days</span>
                      ) : (
                        <span>{m.days_until_stockout} Days</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={m.stockout_risk} />
                    </td>
                    <td className="py-3 px-4">
                      {m.suggested_reorder_quantity > 0 ? (
                        <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 font-bold border border-teal-200">
                          + {m.suggested_reorder_quantity} Units
                        </span>
                      ) : (
                        <span className="text-slate-400">Optimal Buffer</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            {medForecast.insights.map((ins, i) => (
              <div key={i} className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: MODEL PERFORMANCE & HOLDOUT EVALUATION SUMMARY */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-100">
          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-navy-900">
              5. Model Performance & Holdout Validation Metrics
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rigorous benchmarking metrics across classification and time-series forecasting models.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {metrics.map((m, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-navy-900 text-sm">{m.model_name}</h4>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{m.model_type}</p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{m.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                {m.accuracy && (
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase">Accuracy</span>
                    <span className="font-extrabold text-navy-900 text-sm">{Math.round(m.accuracy * 100)}%</span>
                  </div>
                )}
                {m.auc_roc && (
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase">ROC-AUC</span>
                    <span className="font-extrabold text-teal-600 text-sm">{m.auc_roc}</span>
                  </div>
                )}
                {m.f1_score && (
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase">F1-Score</span>
                    <span className="font-extrabold text-blue-600 text-sm">{m.f1_score}</span>
                  </div>
                )}
                {m.mae !== null && m.mae !== undefined && (
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase">MAE</span>
                    <span className="font-extrabold text-teal-600 text-sm">{m.mae}</span>
                  </div>
                )}
                {m.rmse !== null && m.rmse !== undefined && (
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase">RMSE</span>
                    <span className="font-extrabold text-navy-900 text-sm">{m.rmse}</span>
                  </div>
                )}
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase">Records</span>
                  <span className="font-extrabold text-slate-700 text-sm">{m.dataset_records}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
