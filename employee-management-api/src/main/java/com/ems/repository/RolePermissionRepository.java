package com.ems.repository;

import com.ems.model.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRole(String role);
    void deleteByRole(String role);
}
