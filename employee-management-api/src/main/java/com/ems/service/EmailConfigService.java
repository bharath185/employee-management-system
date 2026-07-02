package com.ems.service;

import com.ems.dto.EmailConfigDTO;
import com.ems.exception.BadRequestException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.EmailConfig;
import com.ems.repository.EmailConfigRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Properties;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailConfigService {

    private final EmailConfigRepository emailConfigRepository;

    public EmailConfigDTO getConfig() {
        EmailConfig config = emailConfigRepository.findFirstByIsActiveTrue()
            .orElseThrow(() -> new ResourceNotFoundException("No active email configuration found"));
        return EmailConfigDTO.fromEntity(config);
    }

    @Transactional
    public EmailConfigDTO saveConfig(EmailConfigDTO dto) {
        EmailConfig config;

        if (dto.getId() != null) {
            config = emailConfigRepository.findById(dto.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Email config not found with id: " + dto.getId()));
        } else {
            config = new EmailConfig();
        }

        config.setHost(dto.getHost());
        config.setPort(dto.getPort());
        config.setUsername(dto.getUsername());
        config.setPassword(dto.getPassword());
        config.setFromAddress(dto.getFromAddress());
        if (dto.getUseTls() != null) config.setUseTls(dto.getUseTls());
        if (dto.getUseSsl() != null) config.setUseSsl(dto.getUseSsl());
        if (dto.getIsActive() != null) config.setIsActive(dto.getIsActive());

        config = emailConfigRepository.save(config);
        log.info("Email configuration saved: {}", config.getHost());
        return EmailConfigDTO.fromEntity(config);
    }

    /**
     * Test SMTP connection using the active email configuration.
     */
    public boolean testConnection() {
        EmailConfig config = emailConfigRepository.findFirstByIsActiveTrue()
            .orElseThrow(() -> new ResourceNotFoundException("No active email configuration found"));

        try {
            JavaMailSenderImpl mailSender = createMailSender(config);
            mailSender.testConnection();
            log.info("SMTP connection test successful to {}", config.getHost());
            return true;
        } catch (Exception e) {
            log.error("SMTP connection test failed: {}", e.getMessage());
            throw new BadRequestException("SMTP connection failed: " + e.getMessage());
        }
    }

    /**
     * Send an email using the active email configuration.
     */
    public void sendEmail(String to, String subject, String htmlBody) {
        EmailConfig config = emailConfigRepository.findFirstByIsActiveTrue()
            .orElseThrow(() -> new ResourceNotFoundException("No active email configuration found"));

        try {
            JavaMailSenderImpl mailSender = createMailSender(config);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(config.getFromAddress());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email: {}", e.getMessage());
            throw new BadRequestException("Failed to send email: " + e.getMessage());
        }
    }

    private JavaMailSenderImpl createMailSender(EmailConfig config) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(config.getHost());
        mailSender.setPort(config.getPort());
        mailSender.setUsername(config.getUsername());
        mailSender.setPassword(config.getPassword());

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        if (Boolean.TRUE.equals(config.getUseTls())) {
            props.put("mail.smtp.starttls.enable", "true");
        }
        if (Boolean.TRUE.equals(config.getUseSsl())) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", String.valueOf(config.getPort()));
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        }

        return mailSender;
    }
}
