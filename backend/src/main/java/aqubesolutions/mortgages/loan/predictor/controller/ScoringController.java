package aqubesolutions.mortgages.loan.predictor.controller;

import aqubesolutions.mortgages.loan.predictor.dto.ScoreRequest;
import aqubesolutions.mortgages.loan.predictor.dto.ScoreResponse;
import aqubesolutions.mortgages.loan.predictor.service.MultiModelScoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ScoringController {

    private final MultiModelScoringService service;

    public ScoringController(MultiModelScoringService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(
                service.isReady()
                        ? java.util.Map.of("status", "UP")
                        : java.util.Map.of("status", "DOWN", "reason", "Models not loaded")
        );
    }

    @PostMapping("/score")
    public ResponseEntity<?> score(@RequestBody ScoreRequest req) {
        try {
            ScoreResponse res = service.score(req);
            return ResponseEntity.ok(res);
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(503).body(java.util.Map.of("error", ise.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

}
