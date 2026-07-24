package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.EmailConfigDTO;
import com.ems.service.EmailConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/email-config")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
@RequiredArgsConstructor
public class EmailConfigController {

    private final EmailConfigService emailConfigService;

    @GetMapping
    public ResponseEntity<APIResponse<EmailConfigDTO>> getConfig() {
        return ResponseEntity.ok(APIResponse.success(emailConfigService.getConfig()));
    }

    @PostMapping
    public ResponseEntity<APIResponse<EmailConfigDTO>> saveConfig(@RequestBody EmailConfigDTO dto) {
        return ResponseEntity.ok(APIResponse.success(emailConfigService.saveConfig(dto)));
    }

    @PostMapping("/test")
    public ResponseEntity<APIResponse<String>> testConnection() {
        emailConfigService.testConnection();
        return ResponseEntity.ok(APIResponse.success("SMTP connection successful"));
    }
}
