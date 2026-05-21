package com.ems.utils;

import com.ems.exception.FileStorageException;
import com.ems.exception.InvalidFileException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;

@Component
public class PhotoUtils {

    private final Path uploadDir;
    private final Set<String> allowedTypes;

    public PhotoUtils(
            @Value("${app.photo.upload-dir}") String uploadDir,
            @Value("${app.photo.allowed-types}") String allowedTypes) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.allowedTypes = Set.of(allowedTypes.split(","));
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new FileStorageException(
                "Could not create upload directory", e);
        }
    }

    public String savePhoto(MultipartFile file, String employeeCode) {
        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new InvalidFileException(
                "Only JPEG and PNG files are allowed. Received: " + contentType);
        }

        // Validate file size (2MB max)
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new InvalidFileException(
                "File size exceeds 2MB limit: " + file.getSize() + " bytes");
        }

        // Get clean filename
        String originalFilename = StringUtils.cleanPath(
            file.getOriginalFilename() != null ? file.getOriginalFilename() : "photo.jpg");
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }

        // Generate filename: employeeCode + extension
        String fileName = employeeCode + extension;
        Path targetPath = uploadDir.resolve(fileName);

        // Avoid overwriting
        int counter = 1;
        while (Files.exists(targetPath)) {
            fileName = employeeCode + "_" + counter + extension;
            targetPath = uploadDir.resolve(fileName);
            counter++;
        }

        try {
            Files.copy(file.getInputStream(), targetPath,
                StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new FileStorageException(
                "Failed to store file: " + fileName, e);
        }

        return "/api/v1/photos/" + fileName;
    }

    public void deletePhoto(String photoPath) {
        if (photoPath == null || photoPath.isEmpty()) return;

        String fileName = photoPath.substring(photoPath.lastIndexOf('/') + 1);
        Path filePath = uploadDir.resolve(fileName);

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log but don't throw - photo deletion is non-critical
            System.err.println("Failed to delete photo: " + fileName);
        }
    }
}
