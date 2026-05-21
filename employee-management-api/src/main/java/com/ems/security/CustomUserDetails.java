package com.ems.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

@Getter
public class CustomUserDetails extends User {

    private final Long id;
    private final Long employeeId;

    public CustomUserDetails(Long id, String username, String password,
                             boolean enabled, Long employeeId,
                             Collection<? extends GrantedAuthority> authorities) {
        super(username, password, enabled, true, true, true, authorities);
        this.id = id;
        this.employeeId = employeeId;
    }
}
