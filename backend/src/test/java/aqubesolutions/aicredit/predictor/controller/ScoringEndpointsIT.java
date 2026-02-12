package aqubesolutions.aicredit.predictor.controller;

import aqubesolutions.aicredit.predictor.dto.ApprovalOnlyResponse;
import aqubesolutions.aicredit.predictor.dto.ScoreResponse;
import aqubesolutions.aicredit.predictor.dto.SimpleScoreResponse;
import aqubesolutions.aicredit.predictor.service.CreditCardScoringService;
import aqubesolutions.aicredit.predictor.service.CurrentAccountScoringService;
import aqubesolutions.aicredit.predictor.service.LoanScoringService;
import aqubesolutions.aicredit.predictor.service.MultiModelScoringService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ScoringEndpointsIT {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MultiModelScoringService service;

    @MockitoBean
    private CreditCardScoringService creditCardService;

    @MockitoBean
    private LoanScoringService loanService;

    @MockitoBean
    private CurrentAccountScoringService currentAccountService;

    @Test
    void scoreMortgageWithJson() throws Exception {
        var response = new ScoreResponse();
        response.approval = new ScoreResponse.ApprovalPart();
        response.approval.label = "Approved";
        response.approval.prob_approved = 0.7;
        response.approval.prob_declined = 0.3;
        response.loanAmount = new ScoreResponse.LoanPart();
        response.loanAmount.predicted_amount = 250000.0;
        response.policy_message = "Eligible under policy rules";

        when(service.score(any())).thenReturn(response);

        String json = """
            {
              "age": 30,
              "annual_income": 60000,
              "monthly_debt": 1500,
              "property_price": 300000,
              "deposit_amount": 50000,
              "requested_loan": 250000,
              "mortgage_term_years": 30,
              "mortgage_term_months": 360
            }
            """;

        mockMvc.perform(post("/api/score/mo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approval.label").value("Approved"))
                .andExpect(jsonPath("$.approval.prob_approved").value(0.7))
                .andExpect(jsonPath("$.loanAmount.predicted_amount").value(250000.0))
                .andExpect(jsonPath("$.policy_message").value("Eligible under policy rules"));
    }

    @Test
    void scoreCreditCardWithJson() throws Exception {
        var response = new SimpleScoreResponse();
        response.approval = new ScoreResponse.ApprovalPart();
        response.approval.label = "Approved";
        response.approval.prob_approved = 0.8;
        response.approval.prob_declined = 0.2;
        response.loanAmount = new ScoreResponse.LoanPart();
        response.loanAmount.predicted_amount = 12000.0;

        when(creditCardService.score(any())).thenReturn(response);

        String json = """
            {
              "age": 40,
              "annual_income": 70000,
              "monthly_debt": 1200,
              "existing_cc_balance": 1500,
              "total_cc_limit": 8000,
              "requested_limit": 12000
            }
            """;

        mockMvc.perform(post("/api/score/cc")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approval.label").value("Approved"))
                .andExpect(jsonPath("$.loanAmount.predicted_amount").value(12000.0));
    }

    @Test
    void scoreLoanWithJson() throws Exception {
        var response = new SimpleScoreResponse();
        response.approval = new ScoreResponse.ApprovalPart();
        response.approval.label = "Approved";
        response.approval.prob_approved = 0.65;
        response.approval.prob_declined = 0.35;
        response.loanAmount = new ScoreResponse.LoanPart();
        response.loanAmount.predicted_amount = 15000.0;

        when(loanService.score(any())).thenReturn(response);

        String json = """
            {
              "age": 35,
              "annual_income": 50000,
              "monthly_debt": 800,
              "requested_loan": 15000,
              "loan_term_months": 36
            }
            """;

        mockMvc.perform(post("/api/score/ln")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approval.label").value("Approved"))
                .andExpect(jsonPath("$.loanAmount.predicted_amount").value(15000.0));
    }

    @Test
    void scoreCurrentAccountWithJson() throws Exception {
        var response = new ApprovalOnlyResponse();
        response.approval = new ScoreResponse.ApprovalPart();
        response.approval.label = "Approved";
        response.approval.prob_approved = 0.9;
        response.approval.prob_declined = 0.1;
        response.policy_message = "Eligible under policy rules";

        when(currentAccountService.score(any())).thenReturn(response);

        String json = """
            {
              "age": 28,
              "annual_income": 42000,
              "monthly_debt": 400,
              "avg_monthly_balance": 2500,
              "overdraft_usage": 200
            }
            """;

        mockMvc.perform(post("/api/score/ca")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approval.label").value("Approved"))
                .andExpect(jsonPath("$.policy_message").value("Eligible under policy rules"));
    }
}
