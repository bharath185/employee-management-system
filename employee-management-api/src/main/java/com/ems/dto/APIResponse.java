package com.ems.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class APIResponse<T> {

    private boolean success;
    private String message;
    private T data;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> APIResponse<T> success(T data) {
        return APIResponse.<T>builder()
            .success(true)
            .message("Success")
            .data(data)
            .build();
    }

    public static <T> APIResponse<T> success(String message, T data) {
        return APIResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .build();
    }

    public static <T> APIResponse<T> error(String message) {
        return APIResponse.<T>builder()
            .success(false)
            .message(message)
            .build();
    }

    public static <T> APIResponse<T> error(String message, T data) {
        return APIResponse.<T>builder()
            .success(false)
            .message(message)
            .data(data)
            .build();
    }
}
