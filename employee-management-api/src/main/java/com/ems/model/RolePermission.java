package com.ems.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "role_permissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"role", "resource"})
})
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RolePermission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false, length = 50)
    private String resource;

    @Column(nullable = false)
    private boolean canView;

    @Column(nullable = false)
    private boolean canAdd;

    @Column(nullable = false)
    private boolean canEdit;

    @Column(nullable = false)
    private boolean canDelete;
}
