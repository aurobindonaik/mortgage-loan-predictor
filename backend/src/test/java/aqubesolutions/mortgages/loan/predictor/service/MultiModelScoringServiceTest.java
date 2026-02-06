package aqubesolutions.mortgages.loan.predictor.service;

import aqubesolutions.mortgages.loan.predictor.dto.ScoreRequest;
import hex.genmodel.easy.EasyPredictModelWrapper;
import hex.genmodel.easy.RowData;
import hex.genmodel.easy.prediction.BinomialModelPrediction;
import hex.genmodel.easy.prediction.RegressionModelPrediction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MultiModelScoringServiceTest {

    private MultiModelScoringService service;

    @Mock
    private EasyPredictModelWrapper approvalModel;

    @Mock
    private EasyPredictModelWrapper borrowModel;

    @BeforeEach
    void setUp() throws Exception {
        service = new MultiModelScoringService();

        setPrivateField(service, "approvalModel", approvalModel);
        setPrivateField(service, "borrowModel", borrowModel);
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
    void testScoreWhenModelsNotLoaded() throws Exception {
        setPrivateField(service, "approvalModel", null);
        setPrivateField(service, "borrowModel", null);

        var request = new ScoreRequest();

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> service.score(request));
        assertEquals("Models not loaded", exception.getMessage());
    }
}
