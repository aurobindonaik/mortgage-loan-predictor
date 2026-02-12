package aqubesolutions.aicredit.predictor.service;

import aqubesolutions.aicredit.predictor.dto.LoanScoreRequest;
import aqubesolutions.aicredit.predictor.dto.ScoreResponse;
import aqubesolutions.aicredit.predictor.dto.SimpleScoreResponse;
import hex.genmodel.MojoModel;
import hex.genmodel.easy.EasyPredictModelWrapper;
import hex.genmodel.easy.RowData;
import hex.genmodel.easy.prediction.BinomialModelPrediction;
import hex.genmodel.easy.prediction.RegressionModelPrediction;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LoanScoringService {

    private static final Logger log = LoggerFactory.getLogger(LoanScoringService.class);

    @Value("${model.loan-approval-path}")
    private String approvalPath;

    @Value("${model.loan-borrow-path}")
    private String borrowPath;

    private EasyPredictModelWrapper approvalModel;
    private EasyPredictModelWrapper borrowModel;

    @PostConstruct
    public void init() {
        try {
            log.info("Loading loan approval model from {}", approvalPath);
            approvalModel = new EasyPredictModelWrapper(MojoModel.load(approvalPath));
            log.info("Loading loan borrow model from {}", borrowPath);
            borrowModel = new EasyPredictModelWrapper(MojoModel.load(borrowPath));
        } catch (Exception e) {
            log.error("Error loading loan MOJO models: {}", e.getMessage(), e);
        }
    }

    public boolean isReady() {
        return approvalModel != null && borrowModel != null;
    }

    public SimpleScoreResponse score(LoanScoreRequest req) throws Exception {
        if (!isReady()) {
            throw new IllegalStateException("Models not loaded");
        }

        RowData row = new RowData();
        put(row, "age", req.age);
        put(row, "annual_income", req.annual_income);
        put(row, "monthly_debt", req.monthly_debt);
        put(row, "requested_loan", req.requested_loan);
        put(row, "loan_term_months", req.loan_term_months);

        BinomialModelPrediction approvalPred = approvalModel.predictBinomial(row);
        RegressionModelPrediction borrowPred = borrowModel.predictRegression(row);

        SimpleScoreResponse res = new SimpleScoreResponse();
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
