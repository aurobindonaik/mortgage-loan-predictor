package aqubesolutions.mortgages.loan.predictor.service;

import aqubesolutions.mortgages.loan.predictor.dto.ScoreRequest;
import aqubesolutions.mortgages.loan.predictor.dto.ScoreResponse;
import hex.genmodel.MojoModel;
import hex.genmodel.easy.EasyPredictModelWrapper;
import hex.genmodel.easy.RowData;
import hex.genmodel.easy.prediction.BinomialModelPrediction;
import hex.genmodel.easy.prediction.MultinomialModelPrediction;
import hex.genmodel.easy.prediction.RegressionModelPrediction;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class MultiModelScoringService {

    private static final Logger log = LoggerFactory.getLogger(MultiModelScoringService.class);

    @Value("${model.approval-path}")
    private String approvalPath;

    @Value("${model.borrow-path}")
    private String borrowPath;

    @Value("${model.risk-path}")
    private String riskPath;

    private EasyPredictModelWrapper approvalModel;
    private EasyPredictModelWrapper borrowModel;
    private EasyPredictModelWrapper riskModel;
    private String[] riskDomain;

    @PostConstruct
    public void init() {
        try {
            log.info("Loading approval model from {}", approvalPath);
            approvalModel = new EasyPredictModelWrapper(MojoModel.load(approvalPath));
            log.info("Loading borrow model from {}", borrowPath);
            borrowModel = new EasyPredictModelWrapper(MojoModel.load(borrowPath));
            log.info("Loading risk model from {}", riskPath);
            riskModel = new EasyPredictModelWrapper(MojoModel.load(riskPath));
            riskDomain = riskModel.getResponseDomainValues();   // <- class labels used by model
        } catch (Exception e) {
            log.error("Error loading MOJO models: {}", e.getMessage(), e);
        }
    }

    public boolean isReady() {
        return approvalModel != null && borrowModel != null && riskModel != null;
    }

    public ScoreResponse score(ScoreRequest req) throws Exception {
        if (!isReady()) {
            throw new IllegalStateException("Models not loaded");
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
        MultinomialModelPrediction riskPred = riskModel.predictMultinomial(row);

        ScoreResponse res = new ScoreResponse();

        ScoreResponse.ApprovalPart approvalPart = new ScoreResponse.ApprovalPart();
        approvalPart.label = approvalPred.label;
        approvalPart.prob_approved = approvalPred.classProbabilities[1];
        approvalPart.prob_declined = approvalPred.classProbabilities[0];
        res.approval = approvalPart;

        ScoreResponse.LoanPart loanPart = new ScoreResponse.LoanPart();
        loanPart.predicted_amount = borrowPred.value;
        res.loanAmount = loanPart;

        ScoreResponse.RiskPart riskPart = new ScoreResponse.RiskPart();
        riskPart.label = riskPred.label;
        Map<String, Double> probs = new LinkedHashMap<>();
        for (var i = 0; i < riskPred.classProbabilities.length; i++) {
            probs.put(riskDomain[i], riskPred.classProbabilities[i]);
        }

        riskPart.classProbabilities = probs;
        res.risk = riskPart;

        return res;
    }

    private void put(RowData row, String key, Object val) {
        if (val != null) {
            row.put(key, String.valueOf(val));
        }
    }
}
