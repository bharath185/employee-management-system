package com.ems.service;

import com.ems.dto.*;
import com.ems.exception.BadRequestException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.exception.UnauthorizedException;
import com.ems.model.User;
import com.ems.repository.UserRepository;
import com.ems.security.CustomUserDetails;
import com.ems.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeService employeeService;

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(), request.getPassword()));

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(
            userDetails.getUsername());

        String role = userDetails.getAuthorities().stream()
            .findFirst()
            .map(a -> a.getAuthority().replace("ROLE_", ""))
            .orElse("EMPLOYEE");

        EmployeeBasicDTO employeeBasic = null;
        if (userDetails.getEmployeeId() != null) {
            try {
                var emp = employeeService.getEmployeeById(userDetails.getEmployeeId());
                employeeBasic = EmployeeBasicDTO.builder()
                    .id(emp.getId())
                    .employeeCode(emp.getEmployeeCode())
                    .firstName(emp.getFirstName())
                    .surname(emp.getSurname())
                    .email(emp.getEmail())
                    .photoPath(emp.getPhotoPath())
                    .build();
            } catch (Exception e) {
                // Employee may not exist yet for admin accounts
            }
        }

        return LoginResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(86400000)
            .role(role)
            .employee(employeeBasic)
            .build();
    }

    public void register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        User user = User.builder()
            .username(request.getUsername())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(request.getRole() != null ? request.getRole() : "EMPLOYEE")
            .employeeId(request.getEmployeeId())
            .enabled(true)
            .build();

        userRepository.save(user);
    }

    public void changePassword(ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("User not authenticated");
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }
        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Authentication authentication = new UsernamePasswordAuthenticationToken(
            username, null, java.util.Collections.emptyList());

        String newAccessToken = jwtTokenProvider.generateAccessToken(authentication);

        return LoginResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(86400000)
            .role(user.getRole())
            .build();
    }
}
