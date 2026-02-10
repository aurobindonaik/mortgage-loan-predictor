import React, { useState, useMemo, useRef, useEffect } from "react";

const initialForms = {
  mo: {
    age: 35,
    annual_income: 65000,
    monthly_debt: 400,
    property_price: 320000,
    deposit_amount: 50000,
    requested_loan: 250000,
    mortgage_term_years: 25,
  },
  cc: {
    age: 35,
    annual_income: 52000,
    monthly_debt: 350,
    existing_cc_balance: 1200,
    total_cc_limit: 8000,
    requested_limit: 5000,
  },
  ln: {
    age: 35,
    annual_income: 52000,
    monthly_debt: 350,
    requested_loan: 12000,
    loan_term_months: 48,
  },
  ca: {
    age: 35,
    annual_income: 52000,
    monthly_debt: 350,
    avg_monthly_balance: 1800,
    overdraft_usage: 250,
  },
};

const productOptions = [
  {
    key: "mo",
    title: "Mortgage",
    subtitle: "Property purchase or remortgage",
    tone: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    iconTone: "from-emerald-50 to-emerald-100/70",
  },
  {
    key: "cc",
    title: "Credit Card",
    subtitle: "Revolving credit limit",
    tone: "from-sky-500/15 via-sky-500/5 to-transparent",
    iconTone: "from-sky-50 to-sky-100/70",
  },
  {
    key: "ln",
    title: "Unsecured Loan",
    subtitle: "Fixed-term personal loan",
    tone: "from-amber-500/15 via-amber-500/5 to-transparent",
    iconTone: "from-amber-50 to-amber-100/70",
  },
  {
    key: "ca",
    title: "Current Account",
    subtitle: "Account approval only",
    tone: "from-violet-500/15 via-violet-500/5 to-transparent",
    iconTone: "from-violet-50 to-violet-100/70",
  },
];

const ProductIcon = ({ kind }) => {
  if (kind === "mo") {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-700">
        <path
          d="M4 11.5 12 5l8 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 11.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="9"
          y="14"
          width="6"
          height="6"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    );
  }
  if (kind === "cc") {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-sky-700">
        <rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="2"
          fill="currentColor"
          opacity="0.08"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M3 10h18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M7 14h5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <circle cx="17" cy="14.5" r="1.7" fill="currentColor" opacity="0.2" />
      </svg>
    );
  }
  if (kind === "ln") {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-amber-700">
        <path
          d="M4 13.5h8.5a3.5 3.5 0 0 1 0 7H9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 13.5 7 9.5c1-1.3 2.5-2 4.1-2H20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="18.5"
          cy="9"
          r="2"
          fill="currentColor"
          opacity="0.12"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M18.5 8.2v1.6M17.7 9h1.6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-violet-700">
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2"
        fill="currentColor"
        opacity="0.08"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 9.5h8M8 12.5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="17" cy="12.5" r="1.6" fill="currentColor" opacity="0.2" />
    </svg>
  );
};

const productFieldConfig = {
  mo: [
    { key: "age", label: "Age" },
    { key: "annual_income", label: "Annual income (£)" },
    { key: "monthly_debt", label: "Monthly debt (£)" },
    { key: "property_price", label: "Property price (£)" },
    { key: "deposit_amount", label: "Deposit amount (£)" },
    { key: "requested_loan", label: "Requested loan (£)" },
    { key: "mortgage_term_years", label: "Mortgage term (years)" },
  ],
  cc: [
    { key: "age", label: "Age" },
    { key: "annual_income", label: "Annual income (£)" },
    { key: "monthly_debt", label: "Monthly debt (£)" },
    { key: "existing_cc_balance", label: "Existing card balance (£)" },
    { key: "total_cc_limit", label: "Total card limits (£)" },
    { key: "requested_limit", label: "Requested limit (£)" },
  ],
  ln: [
    { key: "age", label: "Age" },
    { key: "annual_income", label: "Annual income (£)" },
    { key: "monthly_debt", label: "Monthly debt (£)" },
    { key: "requested_loan", label: "Requested loan (£)" },
    { key: "loan_term_months", label: "Loan term (months)" },
  ],
  ca: [
    { key: "age", label: "Age" },
    { key: "annual_income", label: "Annual income (£)" },
    { key: "monthly_debt", label: "Monthly debt (£)" },
    { key: "avg_monthly_balance", label: "Avg monthly balance (£)" },
    { key: "overdraft_usage", label: "Overdraft usage (£)" },
  ],
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

/* --------- Decision Engine (approval + affordability) ---------- */
function buildDecision(form, result) {
  if (!result?.approval || !result?.loanAmount) return null;

  const requested = form.requested_loan;
  const approval = result.approval;
  const capacity = result.loanAmount.predicted_amount ?? 0;
  const probApproved = approval.prob_approved ?? 0;
  const probDeclined = approval.prob_declined ?? 0;

  // "Scoring says approve?" (fallback to label if probs not present)
  let isApprovedModel = probApproved > probDeclined;
  if (probApproved === 0 && probDeclined === 0 && approval.label != null) {
    isApprovedModel = String(approval.label) === "0";
  }

  // Simple confidence band for display
  const mlBand =
    probApproved >= 0.8 ? "Strong" : probApproved >= 0.6 ? "Moderate" : "Weak";

  // Affordability ratio: requested loan vs estimated capacity
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

  let finalDecision = "REFER"; // default
  let level = "amber";
  const reasons = [];

  // ───────────────────────────────
  // 1) Hard declines (non-negotiable)
  // ───────────────────────────────
  if (!isApprovedModel) {
    finalDecision = "DECLINED";
    level = "red";
    reasons.push("Low approval confidence");
  }

  if (affordabilityTier === "Fail") {
    finalDecision = "DECLINED";
    level = "red";
    reasons.push("Requested loan exceeds estimated capacity");
  }

  if (finalDecision === "DECLINED") {
    return {
      finalDecision,
      level,
      isApprovedModel,
      mlBand,
      affordability,
      affordableRatio,
      capacity,
      requested,
      probApproved,
      probDeclined,
      reasons,
    };
  }

  if (affordabilityTier === "Borderline") {
    finalDecision = "REFER";
    level = "amber";
    reasons.push("Borderline affordability — refer for manual review");
  } else if (affordabilityTier === "Strong" && probApproved >= 0.7) {
    finalDecision = "APPROVED";
    level = "green";
    reasons.push("Strong affordability and approval confidence");
  } else if (affordabilityTier === "Acceptable" && probApproved >= 0.8) {
    finalDecision = "APPROVED";
    level = "green";
    reasons.push("Acceptable affordability with high approval confidence");
  } else {
    finalDecision = "REFER";
    level = "amber";
    reasons.push("Needs underwriter review based on confidence and affordability");
  }

  return {
    finalDecision,
    level,
    isApprovedModel,
    mlBand,
    affordability,
    affordableRatio,
    capacity,
    requested,
    probApproved,
    probDeclined,
    reasons,
  };
}

function buildApprovalDecision(approval) {
  if (!approval) return null;
  const probApproved = approval.prob_approved ?? 0;
  const probDeclined = approval.prob_declined ?? 0;
  let finalDecision = "REFER";
  if (probApproved || probDeclined) {
    finalDecision = probApproved >= probDeclined ? "APPROVED" : "DECLINED";
  } else if (approval.label != null) {
    const label = String(approval.label).toLowerCase();
    if (["approved", "1", "yes", "true"].includes(label)) {
      finalDecision = "APPROVED";
    } else if (["declined", "0", "no", "false"].includes(label)) {
      finalDecision = "DECLINED";
    }
  }
  return { probApproved, finalDecision };
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
    <div className="rounded-2xl bg-gradient-to-br from-emerald-200/70 via-emerald-100/40 to-transparent p-[1px] shadow-card">
      <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-4 shadow-card flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute -top-16 -right-10 h-32 w-32 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="flex items-center justify-between">
          <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.16em]">
            Final decision
          </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Combines approval &amp; capacity.
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
            <span className="text-slate-500">Approval confidence</span>
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

        <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
          <p className="text-slate-500 mb-0.5">Capacity usage</p>
          <p className="font-mono text-slate-900">
            {capacity
              ? `${Math.min(affordableRatio * 100, 999).toFixed(1)}%`
              : "—"}
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
    <div
      className={`rounded-2xl bg-gradient-to-br ${
        isApproved
          ? "from-emerald-200/70 via-emerald-100/40 to-transparent"
          : isDeclined
          ? "from-red-200/70 via-red-100/40 to-transparent"
          : "from-amber-200/70 via-amber-100/40 to-transparent"
      } p-[1px] shadow-card`}
    >
      <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-4 shadow-card flex flex-col gap-3 relative overflow-hidden">
        <div
          className={`absolute -top-16 -left-12 h-32 w-32 rounded-full blur-2xl ${
            isApproved
              ? "bg-emerald-300/20"
              : isDeclined
              ? "bg-red-300/20"
              : "bg-amber-300/20"
          }`}
        />
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
        Approval confidence based on scoring output.
      </p>
      </div>
    </div>
  );
}


/* ------------- Main App ------------- */
export default function App() {
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(initialForms.mo);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const showRawResponse = import.meta.env.VITE_SHOW_RAW_RESPONSE === "true";
  const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || "";
  const formSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  const isMobileView = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 1023px)").matches;

  const scrollToRef = (ref) => {
    if (!ref?.current || !isMobileView()) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!result?.approval) return;
    const handleResize = () => {
      if (isMobileView()) {
        scrollToRef(resultsSectionRef);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [result]);

  const isMortgage = product === "mo";
  const isCreditCard = product === "cc";
  const isLoan = product === "ln";
  const isCurrentAccount = product === "ca";

  const mortgage_term_months =
    isMortgage && form.mortgage_term_years ? form.mortgage_term_years * 12 : 0;
  const ltv =
    isMortgage && form.property_price > 0
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

  const handleSelectProduct = (nextProduct) => {
    if (!nextProduct) {
      setProduct(null);
      setForm(initialForms.mo);
      setResult(null);
      setError(null);
      return;
    }
    setProduct(nextProduct);
    setForm(initialForms[nextProduct]);
    setResult(null);
    setError(null);
    setTimeout(() => scrollToRef(formSectionRef), 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const endpointMap = {
        mo: `${apiBase}/api/score/mo`,
        cc: `${apiBase}/api/score/cc`,
        ln: `${apiBase}/api/score/ln`,
        ca: `${apiBase}/api/score/ca`,
      };
      const body = isMortgage ? { ...form, mortgage_term_months } : { ...form };
      const resp = await fetch(endpointMap[product], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json.error || "Request failed");
      }
      if (resp.policy_message) {
         showBanner(resp.policy_message);
      }
      setResult(json);
      if (json?.approval) {
        setTimeout(() => scrollToRef(resultsSectionRef), 100);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const capacity = result?.loanAmount?.predicted_amount ?? 0;
  const decision = useMemo(
    () => (isMortgage ? buildDecision(form, result) : null),
    [form, result, isMortgage]
  );

  const approvalDecision = useMemo(
    () => (!isMortgage ? buildApprovalDecision(result?.approval) : null),
    [isMortgage, result]
  );
  const requestedAmount = isCreditCard
    ? form.requested_limit
    : isLoan
    ? form.requested_loan
    : 0;
  const capacityLabel = isCreditCard ? "Credit limit capacity" : "Borrowing capacity";
  const capacityHint = isCreditCard
    ? "Estimated maximum card limit for this profile."
    : "Estimated maximum loan for this profile.";
  const requestedLabel = isCreditCard ? "Requested vs limit" : "Requested vs capacity";

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
                AI Credit Lens
              </div>
              <div className="text-xs text-red-100/90">
                No credit check performed · For informational use only
              </div>
            </div>
          </div>
          {product && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSelectProduct(null)}
                className="px-2.5 py-1 rounded-full bg-red-800/70 border border-red-500/60 hover:bg-red-700/70 transition"
              >
                Change product
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {!product ? (
          <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="bg-white/80 backdrop-blur rounded-3xl shadow-card border border-slate-200/80 p-8">
              <div className="flex flex-col gap-2 mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Get a quick eligibility overview
                </h2>
                <p className="text-sm text-slate-500">
                  Choose a product to generate a fast, policy-aware preview —
                  no personal data is collected or stored.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {productOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleSelectProduct(option.key)}
                    className="group text-left bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-card hover:border-slate-300 transition relative overflow-hidden"
                  >
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br ${option.tone}`}
                    />
                    <div className="relative flex items-center justify-between">
                      <div
                        className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${option.iconTone} border border-white/80 shadow-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}
                      >
                        <ProductIcon kind={option.key} />
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        No credit check
                      </div>
                    </div>
                    <div className="text-base font-semibold text-slate-900 mt-3">
                      {option.title}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {option.subtitle}
                    </div>
                    <div className="mt-3 text-[11px] text-slate-400">
                      No credit check performed
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[1.6fr,1.4fr]">
          {/* Results: decision, capacity, chart, JSON */}
          <section
            ref={resultsSectionRef}
            className="space-y-4 overflow-hidden lg:overflow-visible lg:col-start-2 lg:row-start-1"
          >
            {isMortgage ? (
              <>
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-card border border-slate-200/80 p-5 space-y-4">
                  <DecisionTile decision={decision} />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <ApprovalGauge decision={decision} />

                    <div className="rounded-2xl bg-gradient-to-br from-red-200/70 via-red-100/40 to-transparent p-[1px] shadow-card">
                      <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-4 shadow-card flex flex-col gap-3 relative overflow-hidden">
                        <div className="absolute -top-16 -right-10 h-32 w-32 rounded-full bg-red-300/20 blur-2xl" />
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
                          Estimated maximum loan for this profile.
                        </p>
                        <Progress
                          label="Requested vs capacity"
                          value={
                            capacity
                              ? Math.min(form.requested_loan / capacity, 1)
                              : 0
                          }
                        />
                      </div>
                    </div>

                  </div>
                </div>

              </>
            ) : (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-card border border-slate-200/80 p-5 space-y-4">
                <div
                  className={`grid gap-4 ${
                    isCurrentAccount ? "sm:grid-cols-1" : "sm:grid-cols-2"
                  }`}
                >
                  <ApprovalGauge decision={approvalDecision} />
                  {!isCurrentAccount && (
                    <div className="rounded-2xl bg-gradient-to-br from-red-200/70 via-red-100/40 to-transparent p-[1px] shadow-card">
                      <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-4 shadow-card flex flex-col gap-3 relative overflow-hidden">
                        <div className="absolute -top-16 -right-10 h-32 w-32 rounded-full bg-red-300/20 blur-2xl" />
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.16em]">
                          {capacityLabel}
                        </p>
                        <p className="text-lg font-semibold text-slate-900">
                          £
                          {capacity.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {capacityHint}
                        </p>
                        <Progress
                          label={requestedLabel}
                          value={
                            capacity
                              ? Math.min(requestedAmount / capacity, 1)
                              : 0
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  No credit check performed. Results are indicative and not a final decision.
                </div>
              </div>
            )}

            {showRawResponse && (
              <div className="bg-slate-950 rounded-2xl shadow border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-100">
                    Raw API response
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Spring Boot ·{" "}
                    {isMortgage
                      ? "/api/score/mo"
                      : isCreditCard
                      ? "/api/score/cc"
                      : isLoan
                      ? "/api/score/ln"
                      : "/api/score/ca"}
                  </span>
                </div>
                <pre className="max-h-64 overflow-auto text-[11px] text-emerald-300">
{result ? JSON.stringify(result, null, 2) : "// Run an assessment to see the JSON payload here."}
                </pre>
              </div>
            )}
          </section>

          {/* Inputs: form + KPI cards */}
          <section
            ref={formSectionRef}
            className="space-y-4 lg:col-start-1 lg:row-start-1"
          >
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-card border border-slate-200/80">
              <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Customer details
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    No personal data is collected or stored.
                  </p>
                </div>
                {loading && (
                  <span className="text-xs text-white bg-brand-red px-2 py-1 rounded-full">
                    Running assessment…
                  </span>
                )}
              </div>
              <form
                onSubmit={handleSubmit}
                className="px-5 pb-5 pt-3 grid gap-3 sm:grid-cols-2"
              >
                {productFieldConfig[product].map((field) => (
                  <div key={field.key}>
                    <Label>{field.label}</Label>
                    <NumberInput
                      value={form[field.key]}
                      onChange={(v) => handleChange(field.key, v)}
                    />
                  </div>
                ))}
                {isMortgage && (
                  <div>
                    <Label>Mortgage term (months)</Label>
                    <input
                      value={mortgage_term_months}
                      readOnly
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-100 text-slate-500"
                    />
                  </div>
                )}
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

            {isMortgage && (
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
            )}
          </section>
        </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 text-[11px] text-slate-500 flex justify-between">
          <span>
            No credit check performed · Not financial advice.
          </span>
          <span>AI Credit Lens</span>
        </div>
      </footer>
    </div>
  );
}
