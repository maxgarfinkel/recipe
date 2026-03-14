package com.maxgarfinkel.recipes;

import com.maxgarfinkel.recipes.ingredient.DuplicateIngredientException;
import com.maxgarfinkel.recipes.recipe.importing.RecipeImportException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@org.springframework.web.bind.annotation.ControllerAdvice
public class ControllerAdvice extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ItemNotFound.class)
    ProblemDetail handleItemNotFound(ItemNotFound exception) {
        return exception.getBody();
    }

    @ExceptionHandler(RecipeImportException.class)
    ProblemDetail handleRecipeImportException(RecipeImportException exception) {
        ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        detail.setDetail(exception.getMessage());
        return detail;
    }

    @ExceptionHandler(DuplicateIngredientException.class)
    ProblemDetail handleDuplicateIngredient(DuplicateIngredientException exception) {
        ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        detail.setDetail(exception.getMessage());
        return detail;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException exception) {
        ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        detail.setDetail("A database constraint was violated");
        return detail;
    }

}
