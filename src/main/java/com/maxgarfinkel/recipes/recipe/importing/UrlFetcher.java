package com.maxgarfinkel.recipes.recipe.importing;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class UrlFetcher {

    private final RestClient restClient;

    public UrlFetcher(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder
                .defaultHeader("User-Agent", "Mozilla/5.0 (compatible; RecipeImporter/1.0)")
                .build();
    }

    public String fetch(String url) {
        return restClient.get()
                .uri(url)
                .retrieve()
                .body(String.class);
    }
}
