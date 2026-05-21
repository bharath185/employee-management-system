package com.ems.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey jwtSecret;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;
    private final String issuer;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${app.jwt.refresh-token-expiration}") long refreshTokenExpiration,
            @Value("${app.jwt.issuer}") String issuer) {
        this.jwtSecret = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
        this.issuer = issuer;
    }

    public String generateAccessToken(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpiration);

        List<String> roles = userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .toList();

        return Jwts.builder()
            .subject(userDetails.getUsername())
            .claim("roles", roles)
            .claim("employeeId", userDetails.getEmployeeId())
            .claim("userId", userDetails.getId())
            .issuer(issuer)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(jwtSecret)
            .compact();
    }

    public String generateRefreshToken(String username) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenExpiration);

        return Jwts.builder()
            .subject(username)
            .claim("type", "refresh")
            .issuer(issuer)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(jwtSecret)
            .compact();
    }

    public String getUsernameFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(jwtSecret)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
