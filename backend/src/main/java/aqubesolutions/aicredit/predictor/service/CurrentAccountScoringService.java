package aqubesolutions.aicredit.predictor.service;

import aqubesolutions.aicredit.predictor.dto.ApprovalOnlyResponse;
import aqubesolutions.aicredit.predictor.dto.CurrentAccountScoreRequest;
import aqubesolutions.aicredit.predictor.dto.ScoreResponse;
import hex.genmodel.MojoModel;
import hex.genmodel.easy.EasyPredictModelWrapper;
import hex.genmodel.easy.RowData;
import hex.genmodel.easy.prediction.BinomialModelPrediction;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class CurrentAccountScoringService {

    private static final Logger log = LoggerFactory.getLogger(CurrentAccountScoringService.class);

    @Value("${model.current-approval-path}")
    private String approvalPath;

    private EasyPredictModelWrapper approvalModel;

    @PostConstruct
    public void init() {
        try {
            log.info("Loading current account approval model from {}", approvalPath);
            approvalModel = new EasyPredictModelWrapper(MojoModel.load(approvalPath));
        } catch (Exception e) {
            log.error("Error loading current account MOJO model: {}", e.getMessage(), e);
        }
    }

    public boolean isReady() {
        return approvalModel != null;
    }

    public ApprovalOnlyResponse score(CurrentAccountScoreRequest req) throws Exception {
        if (!isReady()) {
            throw new IllegalStateException("Models not loaded");
        }

        RowData row = new RowData();
        put(row, "age", req.age);
        put(row, "annual_income", req.annual_income);
        put(row, "monthly_debt", req.monthly_debt);
        put(row, "avg_monthly_balance", req.avg_monthly_balance);
        put(row, "overdraft_usage", req.overdraft_usage);

        BinomialModelPrediction approvalPred = approvalModel.predictBinomial(row);

        ApprovalOnlyResponse res = new ApprovalOnlyResponse();
        ScoreResponse.ApprovalPart approvalPart = new ScoreResponse.ApprovalPart();
        approvalPart.label = approvalPred.label;
        approvalPart.prob_approved = approvalPred.classProbabilities[1];
        approvalPart.prob_declined = approvalPred.classProbabilities[0];
        res.approval = approvalPart;

        return res;
    }

    private void put(RowData row, String key, Object val) {
        if (val != null) {
            row.put(key, String.valueOf(val));
        }
    }
}
