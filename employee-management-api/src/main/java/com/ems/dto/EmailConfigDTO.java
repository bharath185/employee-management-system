package com.ems.dto;

import com.ems.model.EmailConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailConfigDTO {

    private Long id;
    private String host;
    private Integer port;
    private String username;
    private String password;
    private String fromAddress;
    private Boolean useTls;
    private Boolean useSsl;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static EmailConfigDTO fromEntity(EmailConfig config) {
        return EmailConfigDTO.builder()
            .id(config.getId())
            .host(config.getHost())
            .port(config.getPort())
            .username(config.getUsername())
            .password(config.getPassword())
            .fromAddress(config.getFromAddress())
            .useTls(config.getUseTls())
            .useSsl(config.getUseSsl())
            .isActive(config.getIsActive())
            .createdAt(config.getCreatedAt())
            .updatedAt(config.getUpdatedAt())
            .build();
    }
}
