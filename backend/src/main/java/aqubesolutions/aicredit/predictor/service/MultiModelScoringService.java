package aqubesolutions.aicredit.predictor.service;

import aqubesolutions.aicredit.predictor.dto.ScoreRequest;
import aqubesolutions.aicredit.predictor.dto.ScoreResponse;
import hex.genmodel.MojoModel;
import hex.genmodel.easy.EasyPredictModelWrapper;
import hex.genmodel.easy.RowData;
import hex.genmodel.easy.prediction.BinomialModelPrediction;
import hex.genmodel.easy.prediction.RegressionModelPrediction;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


@Service
public class MultiModelScoringService {

    private static final Logger log = LoggerFactory.getLogger(MultiModelScoringService.class);

    @Value("${model.approval-path}")
    private String approvalPath;

    @Value("${model.borrow-path}")
    private String borrowPath;


    @Autowired
    private PolicyRuleEngine rules;

    private EasyPredictModelWrapper approvalModel;
    private EasyPredictModelWrapper borrowModel;

    @PostConstruct
    public void init() {
        try {
            log.info("Loading approval model from {}", approvalPath);
            approvalModel = new EasyPredictModelWrapper(MojoModel.load(approvalPath));
            log.info("Loading borrow model from {}", borrowPath);
            borrowModel = new EasyPredictModelWrapper(MojoModel.load(borrowPath));
        } catch (Exception e) {
            log.error("Error loading MOJO models: {}", e.getMessage(), e);
        }
    }

    public boolean isReady() {
        return approvalModel != null && borrowModel != null;
    }

    public ScoreResponse score(ScoreRequest req) throws Exception {
        if (!isReady()) {
            throw new IllegalStateException("Models not loaded");
        }

        // Run policy rules BEFORE ML
        PolicyRuleEngine.PolicyResult ruleResult = rules.applyRules(req);

        if (!ruleResult.approved) {
            // Hard decline — skip ML
            ScoreResponse res = new ScoreResponse();
            ScoreResponse.ApprovalPart ap = new ScoreResponse.ApprovalPart();
            ap.label = "Declined";
            ap.prob_approved = 0.0;
            ap.prob_declined = 1.0;
            res.approval = ap;

            ScoreResponse.LoanPart lp = new ScoreResponse.LoanPart();
            lp.predicted_amount = 0.0;
            res.loanAmount = lp;

            return res;
        }

        // Adjust income if required
        if (ruleResult.incomeAdjusted) {
            req.annual_income = ruleResult.adjustedIncome;
        }

        RowData row = new RowData();
        put(row, "age", req.age);
        put(row, "annual_income", req.annual_income);
        put(row, "monthly_debt", req.monthly_debt);
        put(row, "property_price", req.property_price);
        put(row, "deposit_amount", req.deposit_amount);
        put(row, "requested_loan", req.requested_loan);
        put(row, "mortgage_term_years", req.mortgage_term_years);
        put(row, "mortgage_term_months", req.mortgage_term_months);

        BinomialModelPrediction approvalPred = approvalModel.predictBinomial(row);
        RegressionModelPrediction borrowPred = borrowModel.predictRegression(row);

        var res = new ScoreResponse();
        res.policy_message = ruleResult.incomeAdjusted
                ? "Income adjusted for retirement"
                : "Eligible under policy rules";

        ScoreResponse.ApprovalPart approvalPart = new ScoreResponse.ApprovalPart();
        approvalPart.label = approvalPred.label;
        approvalPart.prob_approved = approvalPred.classProbabilities[1];
        approvalPart.prob_declined = approvalPred.classProbabilities[0];
        res.approval = approvalPart;

        ScoreResponse.LoanPart loanPart = new ScoreResponse.LoanPart();
        loanPart.predicted_amount = borrowPred.value;
        res.loanAmount = loanPart;

        return res;
    }

    private void put(RowData row, String key, Object val) {
        if (val != null) {
            row.put(key, String.valueOf(val));
        }
    }
}
