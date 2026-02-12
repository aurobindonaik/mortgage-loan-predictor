package aqubesolutions.aicredit.predictor.controller;

import aqubesolutions.aicredit.predictor.dto.ApprovalOnlyResponse;
import aqubesolutions.aicredit.predictor.dto.CreditCardScoreRequest;
import aqubesolutions.aicredit.predictor.dto.CurrentAccountScoreRequest;
import aqubesolutions.aicredit.predictor.dto.LoanScoreRequest;
import aqubesolutions.aicredit.predictor.dto.ScoreRequest;
import aqubesolutions.aicredit.predictor.dto.ScoreResponse;
import aqubesolutions.aicredit.predictor.dto.SimpleScoreResponse;
import aqubesolutions.aicredit.predictor.service.CreditCardScoringService;
import aqubesolutions.aicredit.predictor.service.CurrentAccountScoringService;
import aqubesolutions.aicredit.predictor.service.LoanScoringService;
import aqubesolutions.aicredit.predictor.service.MultiModelScoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ScoringController {

    private final MultiModelScoringService mortgageService;
    private final CreditCardScoringService creditCardService;
    private final LoanScoringService loanService;
    private final CurrentAccountScoringService currentAccountService;

    public ScoringController(MultiModelScoringService mortgageService,
                             CreditCardScoringService creditCardService,
                             LoanScoringService loanService,
                             CurrentAccountScoringService currentAccountService) {
        this.mortgageService = mortgageService;
        this.creditCardService = creditCardService;
        this.loanService = loanService;
        this.currentAccountService = currentAccountService;
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(
                mortgageService.isReady()
                        ? java.util.Map.of("status", "UP")
                        : java.util.Map.of("status", "DOWN", "reason", "Models not loaded")
        );
    }

    @PostMapping("/score/mo")
    public ResponseEntity<?> scoreMortgage(@RequestBody ScoreRequest req) {
        try {
            ScoreResponse res = mortgageService.score(req);
            return ResponseEntity.ok(res);
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(503).body(java.util.Map.of("error", ise.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/score/cc")
    public ResponseEntity<?> scoreCreditCard(@RequestBody CreditCardScoreRequest req) {
        try {
            SimpleScoreResponse res = creditCardService.score(req);
            return ResponseEntity.ok(res);
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(503).body(java.util.Map.of("error", ise.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/score/ln")
    public ResponseEntity<?> scoreLoan(@RequestBody LoanScoreRequest req) {
        try {
            SimpleScoreResponse res = loanService.score(req);
            return ResponseEntity.ok(res);
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(503).body(java.util.Map.of("error", ise.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/score/ca")
    public ResponseEntity<?> scoreCurrentAccount(@RequestBody CurrentAccountScoreRequest req) {
        try {
            ApprovalOnlyResponse res = currentAccountService.score(req);
            return ResponseEntity.ok(res);
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(503).body(java.util.Map.of("error", ise.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
