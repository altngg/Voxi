
package com.example.java_service.dto.response;

import java.time.LocalDateTime;

import com.example.java_service.entity.DictionaryEntry;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DictionaryEntryResponse {

    private Long id;
    private Long userId;
    private String word;
    private String translation;
    private String definition;
    private Long languageId;
    private LocalDateTime createdAt;

    public static DictionaryEntryResponse fromEntity(DictionaryEntry entry) {
        return DictionaryEntryResponse.builder()
                .id(entry.getId())
                .userId(entry.getUser().getId())
                .word(entry.getWord())
                .translation(entry.getTranslation())
                .definition(entry.getDefinition())
                .languageId(entry.getLanguage().getId())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
