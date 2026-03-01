package com.maxgarfinkel.recipes.recipe.importing;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/recipe/import")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;

    @PostMapping("/preview")
    public ResponseEntity<RecipeImportDraft> preview(@RequestBody Map<String, String> body) {
        String url = body.get("url");
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        RecipeImportDraft draft = importService.importFromUrl(url);
        return ResponseEntity.ok(draft);
    }

    @PostMapping("/preview/image")
    public ResponseEntity<RecipeImportDraft> previewFromImage(@RequestParam("image") MultipartFile image)
            throws IOException {
        if (image.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        RecipeImportDraft draft = importService.importFromImage(image.getBytes(), image.getContentType());
        return ResponseEntity.ok(draft);
    }
}
