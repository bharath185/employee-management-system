package com.ems.service;

import com.ems.model.RolePermission;
import com.ems.repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RolePermissionService {
    private final RolePermissionRepository repo;

    public List<RolePermission> getPermissionsByRole(String role) {
        return repo.findByRole(role);
    }

    public List<RolePermission> getAllPermissions() {
        return repo.findAll();
    }

    @Transactional
    public void savePermissions(String role, List<RolePermission> permissions) {
        repo.deleteByRole(role);
        repo.flush();
        permissions.forEach(p -> {
            p.setId(null);
            p.setRole(role);
        });
        repo.saveAll(permissions);
    }
}
