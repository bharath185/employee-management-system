package com.ems.controller;

import com.ems.dto.*;
import com.ems.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<APIResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(APIResponse.success("Login successful", response));
    }

    @PostMapping("/register")
    public ResponseEntity<APIResponse<String>> register(
            @Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(APIResponse.success("User registered successfully", null));
    }

    @PostMapping("/change-password")
    public ResponseEntity<APIResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(APIResponse.success("Password changed successfully", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<APIResponse<LoginResponse>> refreshToken(
            @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(APIResponse.success("Token refreshed successfully", response));
    }
}
