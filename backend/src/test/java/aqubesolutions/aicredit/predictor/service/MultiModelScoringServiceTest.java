package aqubesolutions.aicredit.predictor.service;

import aqubesolutions.aicredit.predictor.dto.ScoreRequest;
import hex.genmodel.easy.EasyPredictModelWrapper;
import hex.genmodel.easy.RowData;
import hex.genmodel.easy.prediction.BinomialModelPrediction;
import hex.genmodel.easy.prediction.RegressionModelPrediction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MultiModelScoringServiceTest {

    private MultiModelScoringService service;

    @Mock
    private EasyPredictModelWrapper approvalModel;

    @Mock
    private EasyPredictModelWrapper borrowModel;

    @Mock
    private PolicyRuleEngine rules;

    @BeforeEach
    void setUp() throws Exception {
        service = new MultiModelScoringService();

        setPrivateField(service, "approvalModel", approvalModel);
        setPrivateField(service, "borrowModel", borrowModel);
        setPrivateField(service, "rules", rules);
    }

    private void setPrivateField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    @Test
    void testIsReady() {
        assertTrue(service.isReady());
    }

    @Test
    void testScore() throws Exception {
        PolicyRuleEngine.PolicyResult policyResult = new PolicyRuleEngine.PolicyResult();
        policyResult.approved = true;
        when(rules.applyRules(any(ScoreRequest.class))).thenReturn(policyResult);

        // Mock predictions
        BinomialModelPrediction approvalPrediction = new BinomialModelPrediction();
        approvalPrediction.label = "Approved";
        approvalPrediction.classProbabilities = new double[]{0.3, 0.7};

        RegressionModelPrediction borrowPrediction = new RegressionModelPrediction();
        borrowPrediction.value = 250000.0;

        when(approvalModel.predictBinomial(any(RowData.class))).thenReturn(approvalPrediction);
        when(borrowModel.predictRegression(any(RowData.class))).thenReturn(borrowPrediction);

        // Create request
        ScoreRequest request = new ScoreRequest();
        request.age = 30;
        request.annual_income = 60000.0;
        request.monthly_debt = 1500.0;
        request.property_price = 300000.0;
        request.deposit_amount = 50000.0;
        request.requested_loan = 250000.0;
        request.mortgage_term_years = 30;
        request.mortgage_term_months = 360;

        // Call the method
        var response = service.score(request);

        // Verify response
        assertNotNull(response);
        assertEquals("Approved", response.approval.label);
        assertEquals(0.7, response.approval.prob_approved);
        assertEquals(250000.0, response.loanAmount.predicted_amount);
    }

    @Test
    void testScoreDeclinedByPolicy() throws Exception {
        PolicyRuleEngine.PolicyResult policyResult = new PolicyRuleEngine.PolicyResult();
        policyResult.approved = false;
        policyResult.declineReason = "Debt-to-income ratio too high";
        when(rules.applyRules(any(ScoreRequest.class))).thenReturn(policyResult);

        ScoreRequest request = new ScoreRequest();
        request.age = 30;
        request.annual_income = 60000.0;
        request.monthly_debt = 1500.0;
        request.property_price = 300000.0;
        request.deposit_amount = 50000.0;
        request.requested_loan = 250000.0;
        request.mortgage_term_years = 30;
        request.mortgage_term_months = 360;

        var response = service.score(request);

        assertNotNull(response);
        assertEquals("Declined", response.approval.label);
        assertEquals(0.0, response.approval.prob_approved);
        assertEquals(1.0, response.approval.prob_declined);
        assertEquals(0.0, response.loanAmount.predicted_amount);
        verifyNoInteractions(approvalModel);
        verifyNoInteractions(borrowModel);
    }

    @Test
    void testScoreAppliesAdjustedIncome() throws Exception {
        PolicyRuleEngine.PolicyResult policyResult = new PolicyRuleEngine.PolicyResult();
        policyResult.approved = true;
        policyResult.incomeAdjusted = true;
        policyResult.adjustedIncome = 42000.0;
        when(rules.applyRules(any(ScoreRequest.class))).thenReturn(policyResult);

        BinomialModelPrediction approvalPrediction = new BinomialModelPrediction();
        approvalPrediction.label = "Approved";
        approvalPrediction.classProbabilities = new double[]{0.3, 0.7};

        RegressionModelPrediction borrowPrediction = new RegressionModelPrediction();
        borrowPrediction.value = 250000.0;

        when(approvalModel.predictBinomial(any(RowData.class))).thenReturn(approvalPrediction);
        when(borrowModel.predictRegression(any(RowData.class))).thenReturn(borrowPrediction);

        ScoreRequest request = new ScoreRequest();
        request.age = 61;
        request.annual_income = 70000.0;
        request.monthly_debt = 1500.0;
        request.property_price = 300000.0;
        request.deposit_amount = 50000.0;
        request.requested_loan = 250000.0;
        request.mortgage_term_years = 10;
        request.mortgage_term_months = 120;

        service.score(request);

        ArgumentCaptor<RowData> rowCaptor = ArgumentCaptor.forClass(RowData.class);
        verify(approvalModel).predictBinomial(rowCaptor.capture());
        RowData captured = rowCaptor.getValue();
        assertEquals(String.valueOf(policyResult.adjustedIncome), captured.get("annual_income"));
    }

    @Test
    void testScoreWhenModelsNotLoaded() throws Exception {
        setPrivateField(service, "approvalModel", null);
        setPrivateField(service, "borrowModel", null);

        var request = new ScoreRequest();

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> service.score(request));
        assertEquals("Models not loaded", exception.getMessage());
    }
}
