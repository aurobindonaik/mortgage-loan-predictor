package aqubesolutions.mortgages.loan.predictor.dto;

public class ScoreResponse {
    public ApprovalPart approval;
    public LoanPart loanAmount;
    public String policy_message;

    public static class ApprovalPart {
        public String label;
        public double prob_approved;
        public double prob_declined;
    }

    public static class LoanPart {
        public double predicted_amount;
    }
}
