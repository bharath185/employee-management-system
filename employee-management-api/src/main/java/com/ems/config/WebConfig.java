package com.ems.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.photo.upload-dir:uploads/photos}")
    private String uploadDir;

    @Value("${app.company.upload-dir:uploads/company}")
    private String companyUploadDir;

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        if (contextPath == null || contextPath.isEmpty() || "/".equals(contextPath)) {
            configurer.addPathPrefix("/api/v1", c -> c.isAnnotationPresent(RestController.class));
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded photos at /photos/** and /api/v1/photos/**
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/photos/**", "/api/v1/photos/**")
            .addResourceLocations("file:" + uploadPath.toString() + "/")
            .setCachePeriod(3600);

        // Serve company uploads at /company-uploads/** and /api/v1/company-uploads/**
        Path companyPath = Paths.get(companyUploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/company-uploads/**", "/api/v1/company-uploads/**")
            .addResourceLocations("file:" + companyPath.toString() + "/")
            .setCachePeriod(3600);

        // Serve Angular Static SPA & route fallback to index.html
        registry.addResourceHandler("/**")
            .addResourceLocations("classpath:/static/")
            .resourceChain(true)
            .addResolver(new PathResourceResolver() {
                @Override
                protected Resource getResource(String resourcePath, Resource location) throws IOException {
                    Resource requestedResource = location.createRelative(resourcePath);
                    if (requestedResource.exists() && requestedResource.isReadable()) {
                        return requestedResource;
                    }
                    if (resourcePath.startsWith("api/") || resourcePath.startsWith("photos/") || resourcePath.startsWith("company-uploads/")) {
                        return null;
                    }
                    return new ClassPathResource("/static/index.html");
                }
            });
    }
}
