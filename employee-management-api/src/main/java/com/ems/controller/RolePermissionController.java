package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.model.RolePermission;
import com.ems.security.CustomUserDetails;
import com.ems.service.RolePermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
public class RolePermissionController {
    private final RolePermissionService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Map<String, List<RolePermission>>>> getAll() {
        Map<String, List<RolePermission>> all = Map.of(
            "ADMIN", service.getPermissionsByRole("ADMIN"),
            "HR", service.getPermissionsByRole("HR"),
            "EMPLOYEE", service.getPermissionsByRole("EMPLOYEE")
        );
        return ResponseEntity.ok(APIResponse.success(all));
    }

    @GetMapping("/my")
    public ResponseEntity<APIResponse<List<RolePermission>>> getMyPermissions(
            @AuthenticationPrincipal CustomUserDetails user) {
        String role = user.getAuthorities().stream()
            .map(a -> a.getAuthority().replace("ROLE_", ""))
            .findFirst().orElse("EMPLOYEE");
        return ResponseEntity.ok(APIResponse.success(service.getPermissionsByRole(role)));
    }

    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<RolePermission>>> getByRole(@PathVariable String role) {
        return ResponseEntity.ok(APIResponse.success(service.getPermissionsByRole(role)));
    }

    @PutMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Void>> saveRolePermissions(
            @PathVariable String role, @RequestBody List<RolePermission> permissions) {
        service.savePermissions(role, permissions);
        return ResponseEntity.ok(APIResponse.success("Permissions saved", null));
    }
}
