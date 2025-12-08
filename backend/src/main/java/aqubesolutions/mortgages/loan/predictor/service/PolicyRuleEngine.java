package aqubesolutions.mortgages.loan.predictor.service;

import aqubesolutions.mortgages.loan.predictor.dto.ScoreRequest;
import aqubesolutions.mortgages.loan.predictor.dto.ScoreResponse;
import org.springframework.stereotype.Component;

@Component
public class PolicyRuleEngine {

    private static final int MAX_AGE_AT_TERM_END = 75;
    private static final double RETIREMENT_INCOME_REDUCTION = 0.60; // reduce to 60%
    private static final double MAX_LTV = 0.95;                      // 95% max
    private static final double MAX_DTI = 0.40;                      // 40% of income
    private static final double MAX_INCOME_MULTIPLE = 4.5;          // typical UK rule

    public PolicyResult applyRules(ScoreRequest req) {

        PolicyResult result = new PolicyResult();

        // --------------------------
        // RULE 1: Age + Term <= 75
        // --------------------------
        int ageAtEnd = req.age + req.mortgage_term_years;
        if (ageAtEnd > MAX_AGE_AT_TERM_END) {
            return decline("Loan term too long for applicant age. Maximum allowed: "
                    + (MAX_AGE_AT_TERM_END - req.age) + " years");
        }

        // -------------------------------------------------
        // RULE 2: Adjust income for retirement assumptions
        // -------------------------------------------------
        double effectiveIncome = req.annual_income;

        if (req.age >= 60) {
            effectiveIncome *= RETIREMENT_INCOME_REDUCTION;
            result.incomeAdjusted = true;
            result.adjustedIncome = effectiveIncome;
        }

        // ----------------------------------
        // RULE 3: Max Loan-to-Value (LTV)
        // ----------------------------------
        double ltv = req.requested_loan / req.property_price;
        if (ltv > MAX_LTV) {
            return decline("Loan-to-value exceeds allowable maximum (" + (MAX_LTV * 100) + "%)");
        }

        // ----------------------------------
        // RULE 4: Debt-to-Income (DTI)
        // ----------------------------------
        double monthlyIncome = effectiveIncome / 12.0;
        double dti = req.monthly_debt / monthlyIncome;

        if (dti > MAX_DTI) {
            return decline("Debt-to-income ratio too high (" + Math.round(dti * 100) + "%)");
        }

        // ----------------------------------
        // RULE 5: Income multiple
        // ----------------------------------
        double multiple = req.requested_loan / effectiveIncome;
        if (multiple > MAX_INCOME_MULTIPLE) {
            return decline("Requested loan exceeds income multiple limit ("
                    + MAX_INCOME_MULTIPLE + "× income)");
        }

        // ------------------
        // Passed all rules
        // ------------------
        result.approved = true;
        return result;
    }

    private PolicyResult decline(String reason) {
        PolicyResult r = new PolicyResult();
        r.approved = false;
        r.declineReason = reason;
        return r;
    }

    public static class PolicyResult {
        public boolean approved;
        public boolean incomeAdjusted = false;
        public double adjustedIncome;
        public String declineReason;
    }
}
