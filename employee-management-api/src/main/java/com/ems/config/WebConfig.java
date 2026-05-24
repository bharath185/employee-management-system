package com.ems.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.photo.upload-dir}")
    private String uploadDir;

    @Value("${app.company.upload-dir:uploads/company}")
    private String companyUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded photos at /photos/**
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/photos/**")
            .addResourceLocations("file:" + uploadPath.toString() + "/")
            .setCachePeriod(3600);

        // Serve company uploads at /company-uploads/**
        Path companyPath = Paths.get(companyUploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/company-uploads/**")
            .addResourceLocations("file:" + companyPath.toString() + "/")
            .setCachePeriod(3600);
    }
}
