package com.ems.exception;

import com.ems.dto.APIResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<APIResponse<Void>> handleResourceNotFound(
            ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(APIResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<APIResponse<Void>> handleBadRequest(
            BadRequestException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(APIResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<APIResponse<Void>> handleDuplicate(
            DuplicateResourceException ex) {
        log.warn("Duplicate: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(APIResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<APIResponse<Void>> handleUnauthorized(
            UnauthorizedException ex) {
        log.warn("Unauthorized: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(APIResponse.error(ex.getMessage()));
    }

    @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
    public ResponseEntity<APIResponse<Void>> handleAccessDenied(
            RuntimeException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(APIResponse.error("Access denied"));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<APIResponse<Void>> handleBadCredentials(
            BadCredentialsException ex) {
        log.warn("Bad credentials: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(APIResponse.error("Invalid username or password"));
    }

    @ExceptionHandler(InvalidFileException.class)
    public ResponseEntity<APIResponse<Void>> handleInvalidFile(
            InvalidFileException ex) {
        log.warn("Invalid file: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(APIResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<APIResponse<Void>> handleFileStorage(
            FileStorageException ex) {
        log.error("File storage error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(APIResponse.error("Error processing file upload"));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<APIResponse<Void>> handleMaxUploadSize(
            MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(APIResponse.error("File size exceeds maximum limit (2MB)"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIResponse<Map<String, String>>> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        log.warn("Validation errors: {}", errors);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(APIResponse.error("Validation failed", errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<APIResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unexpected error: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(APIResponse.error("An unexpected error occurred"));
    }
}
