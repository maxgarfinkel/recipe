package com.maxgarfinkel.recipes;

import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@org.springframework.web.bind.annotation.ControllerAdvice
public class ControllerAdvice extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ItemNotFound.class)
    ProblemDetail handleItemNotFound(ItemNotFound exception) {
        return exception.getBody();
    }

}
