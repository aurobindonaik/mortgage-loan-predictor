package aqubesolutions.mortgages.loan.predictor.controller;

import aqubesolutions.mortgages.loan.predictor.dto.ScoreRequest;
import aqubesolutions.mortgages.loan.predictor.dto.ScoreResponse;
import aqubesolutions.mortgages.loan.predictor.service.CreditCardScoringService;
import aqubesolutions.mortgages.loan.predictor.service.CurrentAccountScoringService;
import aqubesolutions.mortgages.loan.predictor.service.LoanScoringService;
import aqubesolutions.mortgages.loan.predictor.service.MultiModelScoringService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ScoringController.class)
class ScoringControllerTest {

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

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testHealthEndpointWhenServiceIsReady() throws Exception {
        Mockito.when(service.isReady()).thenReturn(true);

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void testHealthEndpointWhenServiceIsNotReady() throws Exception {
        Mockito.when(service.isReady()).thenReturn(false);

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DOWN"))
                .andExpect(jsonPath("$.reason").value("Models not loaded"));
    }

    @Test
    void testScoreEndpointSuccess() throws Exception {
        var request = new ScoreRequest(); // Populate request fields as needed
        var response = new ScoreResponse(); // Populate response fields as needed

        Mockito.when(service.score(any(ScoreRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/score/mo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void testScoreEndpointServiceUnavailable() throws Exception {
        var request = new ScoreRequest(); // Populate request fields as needed

        Mockito.when(service.score(any(ScoreRequest.class))).thenThrow(new IllegalStateException("Models not loaded"));

        mockMvc.perform(post("/api/score/mo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("Models not loaded"));
    }

    @Test
    void testScoreEndpointInternalServerError() throws Exception {
        var request = new ScoreRequest(); // Populate request fields as needed

        Mockito.when(service.score(any(ScoreRequest.class))).thenThrow(new RuntimeException("Unexpected error"));

        mockMvc.perform(post("/api/score/mo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Unexpected error"));
    }
}
