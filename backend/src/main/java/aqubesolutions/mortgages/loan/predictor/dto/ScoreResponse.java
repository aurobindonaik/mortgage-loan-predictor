package aqubesolutions.mortgages.loan.predictor.dto;

import java.util.Map;

public class ScoreResponse {
    public ApprovalPart approval;
    public LoanPart loanAmount;
    public RiskPart risk;

    public static class ApprovalPart {
        public String label;
        public double prob_approved;
        public double prob_declined;
    }

    public static class LoanPart {
        public double predicted_amount;
    }

    public static class RiskPart {
        public String label;
        public Map<String, Double> classProbabilities;
    }
}
