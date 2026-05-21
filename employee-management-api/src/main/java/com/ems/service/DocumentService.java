package com.ems.service;

import com.ems.dto.EmployeeDocumentDTO;
import com.ems.exception.BadRequestException;
import com.ems.exception.FileStorageException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Employee;
import com.ems.model.EmployeeDocument;
import com.ems.repository.EmployeeDocumentRepository;
import com.ems.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final EmployeeDocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;

    @Value("${app.document.upload-dir:uploads/documents}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<EmployeeDocumentDTO> getDocumentsByEmployee(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found");
        }
        return documentRepository.findByEmployeeIdOrderByUploadedAtDesc(employeeId)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public EmployeeDocumentDTO uploadDocument(Long employeeId, String documentType, MultipartFile file, String uploadedBy) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (file.isEmpty()) throw new BadRequestException("File is empty");
        if (documentType == null || documentType.trim().isEmpty())
            throw new BadRequestException("Document type is required");

        String ext = "";
        String originalName = file.getOriginalFilename();
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf("."));
        }

        String fileName = employee.getEmployeeCode() + "_" + documentType + ext;
        Path uploadPath = Paths.get(uploadDir).resolve(employee.getEmployeeCode());
        try {
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            documentRepository.findByEmployeeIdAndDocumentType(employeeId, documentType)
                .ifPresent(doc -> {
                    Path oldFile = Paths.get(doc.getFilePath());
                    try { Files.deleteIfExists(oldFile); } catch (IOException e) { log.warn("Could not delete old file: {}", doc.getFilePath()); }
                    documentRepository.delete(doc);
                    documentRepository.flush();
                });

            EmployeeDocument doc = EmployeeDocument.builder()
                .employee(employee)
                .documentType(documentType)
                .fileName(fileName)
                .originalName(originalName != null ? originalName : fileName)
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedAt(LocalDateTime.now())
                .uploadedBy(uploadedBy)
                .build();

            EmployeeDocument saved = documentRepository.save(doc);
            log.info("Document uploaded: {} for employee {}", fileName, employee.getEmployeeCode());
            return toDTO(saved);
        } catch (IOException e) {
            throw new FileStorageException("Failed to store document: " + e.getMessage());
        }
    }

    public Resource downloadDocument(Long documentId) {
        EmployeeDocument doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        Path filePath = Paths.get(doc.getFilePath());
        if (!Files.exists(filePath)) throw new ResourceNotFoundException("File not found on disk");
        return new FileSystemResource(filePath);
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        EmployeeDocument doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        Path filePath = Paths.get(doc.getFilePath());
        try { Files.deleteIfExists(filePath); } catch (IOException e) { log.warn("Could not delete file: {}", doc.getFilePath()); }
        documentRepository.delete(doc);
    }

    private EmployeeDocumentDTO toDTO(EmployeeDocument doc) {
        return EmployeeDocumentDTO.builder()
            .id(doc.getId())
            .employeeId(doc.getEmployee().getId())
            .employeeCode(doc.getEmployee().getEmployeeCode())
            .documentType(doc.getDocumentType())
            .fileName(doc.getFileName())
            .originalName(doc.getOriginalName())
            .fileSize(doc.getFileSize())
            .contentType(doc.getContentType())
            .uploadedAt(doc.getUploadedAt())
            .uploadedBy(doc.getUploadedBy())
            .build();
    }
}
