import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const initialForm = {
  age: 35,
  annual_income: 65000,
  monthly_debt: 400,
  property_price: 320000,
  deposit_amount: 50000,
  requested_loan: 250000,
  mortgage_term_years: 25,
};

const Label = ({ children }) => (
  <label className="block text-xs font-medium text-slate-600 mb-1">
    {children}
  </label>
);

const NumberInput = ({ value, onChange }) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className="w-full rounded-xl border border-slate-300/80 px-3 py-2 text-sm bg-white/60
    focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition"
  />
);

const StatCard = ({ label, value, hint }) => (
  <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl px-4 py-3 shadow-card flex flex-col gap-1">
    <p className="text-[10px] text-slate-500 uppercase tracking-[0.12em]">
      {label}
    </p>
    <p className="text-sm font-semibold text-slate-900">{value}</p>
    {hint && <p className="text-xs text-slate-500">{hint}</p>}
  </div>
);

const Progress = ({ label, value }) => {
  const pct = Math.min(Math.max((value ?? 0) * 100, 0), 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>{label}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

/* --------- Decision Engine (risk-tiered rules) ---------- */
function buildDecision(form, result) {
  if (!result?.approval || !result?.loanAmount || !result?.risk) return null;

  const requested = form.requested_loan;
  const approval = result.approval;
  const capacity = result.loanAmount.predicted_amount ?? 0;
  const risk = result.risk;

  const probApproved = approval.prob_approved ?? 0;
  const probDeclined = approval.prob_declined ?? 0;

  // "Model says approve?" (fallback to label if probs not present)
  let isApprovedModel = probApproved > probDeclined;
  if (probApproved === 0 && probDeclined === 0 && approval.label != null) {
    isApprovedModel = String(approval.label) === "0";
  }

  // Simple ML confidence band for display
  const mlBand =
    probApproved >= 0.8 ? "Strong" : probApproved >= 0.6 ? "Moderate" : "Weak";

  // Affordability ratio: requested loan vs model capacity
  const affordableRatio =
    capacity > 0 ? requested / capacity : Number.POSITIVE_INFINITY;

  // More granular internal tier
  const affordabilityTier =
    affordableRatio < 0.7
      ? "Strong"
      : affordableRatio < 1.0
      ? "Acceptable"
      : affordableRatio < 1.2
      ? "Borderline"
      : "Fail";

  // Legacy 3-state value for the UI colour logic
  const affordability =
    affordabilityTier === "Fail"
      ? "Fail"
      : affordabilityTier === "Borderline"
      ? "Borderline"
      : "Pass";

  const highRisk = risk.label === "High";

  let finalDecision = "REFER"; // default
  let level = "amber";
  const reasons = [];

  // ───────────────────────────────
  // 1) Hard declines (non-negotiable)
  // ───────────────────────────────
  if (!isApprovedModel) {
    finalDecision = "DECLINED";
    level = "red";
    reasons.push("Low model approval confidence");
  }

  if (affordabilityTier === "Fail") {
    finalDecision = "DECLINED";
    level = "red";
    reasons.push("Requested loan exceeds model capacity");
  }

  // If already declined, just add risk reason (if any) and return
  if (finalDecision === "DECLINED") {
    if (highRisk) {
      reasons.push("High risk profile");
    }
    return {
      finalDecision,
      level,
      isApprovedModel,
      mlBand,
      affordability,
      affordableRatio,
      highRisk,
      capacity,
      requested,
      probApproved,
      probDeclined,
      reasons,
    };
  }

  // ───────────────────────────────
  // 2) Risk-weighted decision matrix
  // ───────────────────────────────
  const riskLabel = risk.label;

  if (riskLabel === "Low") {
    // Low risk customers get green if not borderline
    if (affordabilityTier === "Borderline") {
      finalDecision = "REFER";
      level = "amber";
      reasons.push("Borderline affordability with low risk");
    } else {
      finalDecision = "APPROVED";
      level = "green";
      reasons.push("Low risk and acceptable affordability");
    }
  } else if (riskLabel === "Medium") {
    // Medium risk: need strong affordability + decent ML confidence
    if (affordabilityTier === "Strong" && probApproved > 0.75) {
      finalDecision = "APPROVED";
      level = "green";
      reasons.push("Medium risk but strong affordability and approval confidence");
    } else {
      finalDecision = "REFER";
      level = "amber";
      reasons.push("Medium risk profile – manual underwriter review recommended");
    }
  } else if (riskLabel === "High") {
       if (affordabilityTier === "Strong" && probApproved > 0.80) {
         finalDecision = "APPROVED";    // 🟢 KEY CHANGE vs v3
         level = "green";
         reasons.push("High risk offset by strong affordability and ML approval");
       }
       else if (affordabilityTier === "Acceptable") {
         finalDecision = "REFER";       // borderline call — human UW needed
         level = "amber";
         reasons.push("High risk + moderate affordability — refer for underwriting review");
       }
       else {
         finalDecision = "DECLINED";    // weak affordability = no chance
         level = "red";
         reasons.push("High risk with insufficient affordability buffer");
       }
  } else {
    // Unknown risk label – safest is refer
    finalDecision = "REFER";
    level = "amber";
    reasons.push("Unknown risk band – refer for manual review");
  }

  return {
    finalDecision,
    level,
    isApprovedModel,
    mlBand,
    affordability,
    affordableRatio,
    highRisk,
    capacity,
    requested,
    probApproved,
    probDeclined,
    reasons,
  };
}

/* --------- Decision Tile (full snapshot) ---------- */
function DecisionTile({ decision }) {
  if (!decision) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 px-4 py-4 shadow-card text-xs text-slate-500 flex items-center justify-center">
        Run an assessment to see the combined decision.
      </div>
    );
  }

  const {
    finalDecision,
    level,
    mlBand,
    affordability,
    affordableRatio,
    highRisk,
    capacity,
    requested,
    probApproved,
    probDeclined,
    reasons,
  } = decision;

  const levelClasses =
    level === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : level === "red"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  const label =
    finalDecision === "APPROVED"
      ? "Approved"
      : finalDecision === "DECLINED"
      ? "Declined"
      : "Refer to underwriter";

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 px-4 py-4 shadow-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.16em]">
            Final decision (engine v2)
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Combines approval, capacity &amp; risk.
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${levelClasses}`}
        >
          {label}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">ML confidence</span>
            <span className="font-medium text-slate-800">{mlBand}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">P(approve)</span>
            <span className="font-mono">
              {(probApproved * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">P(decline)</span>
            <span className="font-mono">
              {(probDeclined * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Affordability</span>
            <span
              className={`font-medium ${
                affordability === "Pass"
                  ? "text-emerald-600"
                  : affordability === "Borderline"
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {affordability}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Requested</span>
            <span className="font-mono">
              £{requested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Capacity</span>
            <span className="font-mono">
              £{capacity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px] mt-1">
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
          <p className="text-slate-500 mb-0.5">Capacity usage</p>
          <p className="font-mono text-slate-900">
            {capacity
              ? `${Math.min(affordableRatio * 100, 999).toFixed(1)}%`
              : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
          <p className="text-slate-500 mb-0.5">Risk high?</p>
          <p className={`font-semibold ${highRisk ? "text-red-600" : "text-emerald-600"}`}>
            {highRisk ? "Yes" : "No"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
          <p className="text-slate-500 mb-0.5">Engine level</p>
          <p
            className={`font-semibold ${
              level === "green"
                ? "text-emerald-600"
                : level === "red"
                ? "text-red-600"
                : "text-amber-600"
            }`}
          >
            {level.toUpperCase()}
          </p>
        </div>
      </div>

      {reasons && reasons.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] text-slate-500 mb-1">Key reasons:</p>
          <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
            {reasons.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* --- Approval Gauge now uses finalDecision colouring --- */
function ApprovalGauge({ decision }) {
  if (!decision) {
    return (
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 px-4 py-4 shadow-card flex flex-col items-center justify-center text-xs text-slate-500">
        Run an assessment to see approval.
      </div>
    );
  }
  const { probApproved, finalDecision } = decision;
  const p = Math.min(Math.max(probApproved, 0), 1);
  const dash = p * 97;

  const isApproved = finalDecision === "APPROVED";
  const isDeclined = finalDecision === "DECLINED";

  const label =
    finalDecision === "APPROVED"
      ? "Approved"
      : finalDecision === "DECLINED"
      ? "Declined"
      : "Refer";
  const color =
    isApproved ? "#16a34a" : isDeclined ? "#dc2626" : "#eab308";

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 px-4 py-4 shadow-card flex flex-col gap-3">
      <div className="flex items-center justify-between w-full">
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.16em]">
          Approval
        </p>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border
          ${
            isApproved
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : isDeclined
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}
        >
          {label}
        </span>
      </div>
      <div className="relative w-24 h-24 mx-auto">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <defs>
            <linearGradient id="gauge" x1="0%" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
          <path
            stroke="#e5e7eb"
            strokeWidth="3"
            fill="none"
            d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 1 1 0 -31"
          />
          <path
            stroke="url(#gauge)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash},100`}
            d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 1 1 0 -31"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold" style={{ color }}>
            {label}
          </span>
          <span className="text-[11px] text-slate-500">
            {(p * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 text-center">
        Model approval confidence based on ML output.
      </p>
    </div>
  );
}

function RiskCard({ risk }) {
  const label = risk?.label ?? "—";
  const probs = risk?.classProbabilities ?? {};
  const order = ["Low", "Medium", "High"];
  const palette = {
    Low: "text-emerald-600",
    Medium: "text-amber-600",
    High: "text-red-600",
  };

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 px-4 py-4 shadow-card flex flex-col gap-3">
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.16em]">
          Risk band
        </p>
        <p
          className={`text-sm font-semibold mt-1 ${
            palette[label] || "text-slate-800"
          }`}
        >
          {label}
        </p>
      </div>
      <div className="space-y-2 mt-1">
        {order.map((k) => (
          <Progress
            key={k}
            label={k}
            value={typeof probs[k] === "number" ? probs[k] : 0}
          />
        ))}
      </div>
    </div>
  );
}

function buildRepaymentData(maxBorrow, years) {
  if (!maxBorrow || !years) return [];
  const termMonths = years * 12;
  const rates = [0.02, 0.03, 0.04, 0.05, 0.06];
  return rates.map((r) => {
    const m = r / 12;
    const payment =
      m === 0
        ? maxBorrow / termMonths
        : (maxBorrow * m) / (1 - Math.pow(1 + m, -termMonths));
    return {
      rateLabel: `${(r * 100).toFixed(1)}%`,
      payment: Math.round(payment),
    };
  });
}

/* ------------- Main App ------------- */
export default function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mortgage_term_months = form.mortgage_term_years * 12;
  const ltv =
    form.property_price > 0
      ? (form.requested_loan / form.property_price) * 100
      : 0;
  const dti =
    form.annual_income > 0
      ? (form.monthly_debt * 12) / form.annual_income
      : 0;

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = { ...form, mortgage_term_months };
      const resp = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json.error || "Request failed");
      }
      setResult(json);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const capacity = result?.loanAmount?.predicted_amount ?? 0;
  const repaymentData = useMemo(
    () => buildRepaymentData(capacity, form.mortgage_term_years),
    [capacity, form.mortgage_term_years]
  );

  const decision = useMemo(() => buildDecision(form, result), [form, result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-100 to-slate-200 flex flex-col">
      <header className="bg-brand-red text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shadow-sm">
              <span className="text-brand-red font-bold text-lg">£</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Mortgage Decision Console
              </div>
              <div className="text-xs text-red-100/90">
                Internal use · Pre-approval, capacity & risk overview
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-red-800/70 border border-red-500/60">
              Demo environment
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[1.6fr,1.4fr]">
          {/* Left: form + KPI cards */}
          <section className="space-y-4">
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-card border border-slate-200/80">
              <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Applicant & Property
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Capture income, debt and property details for this scenario.
                  </p>
                </div>
                {loading && (
                  <span className="text-xs text-white bg-brand-red px-2 py-1 rounded-full">
                    Running models…
                  </span>
                )}
              </div>
              <form
                onSubmit={handleSubmit}
                className="px-5 pb-5 pt-3 grid gap-3 sm:grid-cols-2"
              >
                <div>
                  <Label>Age</Label>
                  <NumberInput
                    value={form.age}
                    onChange={(v) => handleChange("age", v)}
                  />
                </div>
                <div>
                  <Label>Annual income (£)</Label>
                  <NumberInput
                    value={form.annual_income}
                    onChange={(v) => handleChange("annual_income", v)}
                  />
                </div>
                <div>
                  <Label>Monthly debt (£)</Label>
                  <NumberInput
                    value={form.monthly_debt}
                    onChange={(v) => handleChange("monthly_debt", v)}
                  />
                </div>
                <div>
                  <Label>Property price (£)</Label>
                  <NumberInput
                    value={form.property_price}
                    onChange={(v) => handleChange("property_price", v)}
                  />
                </div>
                <div>
                  <Label>Deposit amount (£)</Label>
                  <NumberInput
                    value={form.deposit_amount}
                    onChange={(v) => handleChange("deposit_amount", v)}
                  />
                </div>
                <div>
                  <Label>Requested loan (£)</Label>
                  <NumberInput
                    value={form.requested_loan}
                    onChange={(v) => handleChange("requested_loan", v)}
                  />
                </div>
                <div>
                  <Label>Mortgage term (years)</Label>
                  <NumberInput
                    value={form.mortgage_term_years}
                    onChange={(v) => handleChange("mortgage_term_years", v)}
                  />
                </div>
                <div>
                  <Label>Mortgage term (months)</Label>
                  <input
                    value={mortgage_term_months}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-100 text-slate-500"
                  />
                </div>
                <div className="sm:col-span-2 mt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-brand-red hover:bg-red-600 disabled:bg-red-300 text-sm font-semibold text-white py-2.5 shadow-md shadow-red-500/20 transition"
                  >
                    {loading ? "Running assessment…" : "Run assessment"}
                  </button>
                </div>
              </form>
              {error && (
                <div className="px-5 pb-4 text-xs text-red-700 bg-red-50 border-t border-red-100">
                  {error}
                </div>
              )}
            </div>

            {/* KPI cards row: LTV / DTI / Term */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard
                label="Indicative LTV"
                value={form.property_price ? `${ltv.toFixed(1)}%` : "—"}
                hint="Requested loan vs property value"
              />
              <StatCard
                label="Debt / income"
                value={`${(dti * 100).toFixed(1)}%`}
                hint="Annualised debt as % of income"
              />
              <StatCard
                label="Term"
                value={`${form.mortgage_term_years} years`}
                hint={`${mortgage_term_months} months`}
              />
            </div>
          </section>

          {/* Right: decision, capacity, risk, chart, JSON */}
          <section className="space-y-4">
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-card border border-slate-200/80 p-5 space-y-4">
              <DecisionTile decision={decision} />

              <div className="grid gap-4 sm:grid-cols-3">
                <ApprovalGauge decision={decision} />

                <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 px-4 py-4 shadow-card flex flex-col gap-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.16em]">
                    Borrowing capacity
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    £
                    {capacity.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Model-estimated maximum loan for this profile.
                  </p>
                  <Progress
                    label="Requested vs capacity"
                    value={
                      capacity ? Math.min(form.requested_loan / capacity, 1) : 0
                    }
                  />
                </div>

                <RiskCard risk={result?.risk} />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-card border border-slate-200/80 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-900">
                  Monthly repayment vs interest rate
                </h3>
                <span className="text-[11px] text-slate-500">
                  Based on model capacity & selected term
                </span>
              </div>
              <div className="h-56">
                {repaymentData && repaymentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={repaymentData}
                      margin={{ left: -20, right: 10, top: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="rateLabel"
                        tick={{ fontSize: 10 }}
                        stroke="#64748b"
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        stroke="#64748b"
                        tickFormatter={(v) => `£${v}`}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `£${value.toLocaleString()}`,
                          "Payment",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="payment"
                        stroke="#c20f2f"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Run an assessment to see projected repayments.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-950 rounded-2xl shadow border border-slate-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-100">
                  Raw API response
                </h3>
                <span className="text-[10px] text-slate-400">
                  Spring Boot · /api/score
                </span>
              </div>
              <pre className="max-h-64 overflow-auto text-[11px] text-emerald-300">
{result ? JSON.stringify(result, null, 2) : "// Run an assessment to see the JSON payload here."}
              </pre>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 text-[11px] text-slate-500 flex justify-between">
          <span>
            Internal demo only · Outputs are synthetic and not financial advice.
          </span>
          <span>Mortgage Decision Console · React · Tailwind · Recharts</span>
        </div>
      </footer>
    </div>
  );
}
