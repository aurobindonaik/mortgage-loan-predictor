package aqubesolutions.mortgages.loan.predictor.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CorsConfigTest.TestController.class)
@Import(CorsConfig.class)
@AutoConfigureMockMvc
class CorsConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @RestController
    @RequestMapping("/api/test")
    static class TestController {
        @GetMapping
        public String test() {
            return "ok";
        }
    }

    @Test
    void testCorsConfiguration() throws Exception {
        mockMvc.perform(
                        options("/api/test")
                                .header("Origin", "http://localhost:5173")
                                .header("Access-Control-Request-Method", "GET")
                                .header("Access-Control-Request-Headers", "Content-Type") // ⬅ REQUIRED
                )
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Methods", "GET,POST,OPTIONS"))
                .andExpect(header().string("Access-Control-Allow-Headers", "Content-Type"));
    }
}
