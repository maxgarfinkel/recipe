package com.maxgarfinkel.recipes;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.client.RestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestConfig.class)
public class SpringTestBase {

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected RestClient restClient;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    @LocalServerPort
    protected int port;

    @BeforeEach
    public void beforeEach() {
        restClient = restClient.mutate().baseUrl("http://localhost:" + port + "/").build();
        jdbcTemplate.execute("TRUNCATE TABLE ingredient, ingredient_quantity, recipe");
        jdbcTemplate.execute("ALTER SEQUENCE ingredient_seq RESTART WITH 1");
        jdbcTemplate.execute("ALTER SEQUENCE ingredient_quantity_seq RESTART WITH 1");
        jdbcTemplate.execute("ALTER SEQUENCE recipe_seq RESTART WITH 1");
    }

}
