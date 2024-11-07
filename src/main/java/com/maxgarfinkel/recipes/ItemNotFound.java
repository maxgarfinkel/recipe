package com.maxgarfinkel.recipes;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.lang.NonNull;
import org.springframework.web.ErrorResponse;

public class ItemNotFound extends RuntimeException implements ErrorResponse {

    private final long id;
    private final String entityName;

    public ItemNotFound(long id, String entityName, String message) {
        super(message);
        this.id = id;
        this.entityName = entityName;
    }

    @Override
    @NonNull
    public HttpStatusCode getStatusCode() {
        return HttpStatus.NOT_FOUND;
    }

    @Override
    @NonNull
    public ProblemDetail getBody() {
        var problemDetails =  ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, getMessage());
        problemDetails.setDetail(entityName + " with id: " + id + " not found");
        return problemDetails;
    }
}
