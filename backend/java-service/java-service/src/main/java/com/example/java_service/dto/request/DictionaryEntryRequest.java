
package com.example.java_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DictionaryEntryRequest {

    @NotBlank
    private String word;

    @NotBlank
    private String translation;

    @NotBlank
    private String definition;

    @NotNull
    private Long languageId;
}
