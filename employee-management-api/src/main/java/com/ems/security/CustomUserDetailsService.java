package com.ems.security;

import com.ems.model.User;
import com.ems.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        String cleanUsername = username != null ? username.trim() : "";
        User user = userRepository.findByUsernameIgnoreCase(cleanUsername)
            .orElseThrow(() -> new UsernameNotFoundException(
                "User not found with username: " + cleanUsername));

        return new CustomUserDetails(
            user.getId(),
            user.getUsername(),
            user.getPassword(),
            user.isEnabled(),
            user.getEmployeeId(),
            Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}
