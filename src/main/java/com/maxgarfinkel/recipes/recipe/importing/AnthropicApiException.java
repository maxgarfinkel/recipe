package com.maxgarfinkel.recipes.recipe.importing;

public class AnthropicApiException extends RuntimeException {

    public AnthropicApiException(String message) {
        super(message);
    }

    public AnthropicApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
