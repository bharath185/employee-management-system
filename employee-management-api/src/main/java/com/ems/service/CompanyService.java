package com.ems.service;

import com.ems.dto.CompanyDTO;
import com.ems.dto.CompanyDocumentDTO;
import com.ems.exception.BadRequestException;
import com.ems.exception.FileStorageException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Company;
import com.ems.model.CompanyDocument;
import com.ems.repository.CompanyDocumentRepository;
import com.ems.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyDocumentRepository companyDocumentRepository;

    @Value("${app.company.upload-dir:uploads/company}")
    private String uploadDir;

    /**
     * Returns the singleton company record. Creates a default one if none exists.
     */
    @Transactional
    public Company getCompany() {
        return companyRepository.findById(1L)
            .orElseGet(() -> {
                Company defaultCompany = Company.builder()
                    .companyName("My Company")
                    .build();
                Company saved = companyRepository.save(defaultCompany);
                log.info("Default company record created with id=1");
                return saved;
            });
    }

    /**
     * Get company as DTO.
     */
    public CompanyDTO getCompanyDTO() {
        return CompanyDTO.fromEntity(getCompany());
    }

    /**
     * Update company details.
     */
    @Transactional
    public CompanyDTO updateCompany(CompanyDTO companyDTO, MultipartFile logo, String username) {
        Company company = getCompany();

        // Update fields from DTO
        if (companyDTO.getCompanyName() != null) {
            company.setCompanyName(companyDTO.getCompanyName());
        }
        company.setAddress(companyDTO.getAddress());
        company.setPhone(companyDTO.getPhone());
        company.setEmail(companyDTO.getEmail());
        company.setWebsite(companyDTO.getWebsite());
        company.setRegistrationNumber(companyDTO.getRegistrationNumber());
        company.setGstNumber(companyDTO.getGstNumber());
        company.setPanNumber(companyDTO.getPanNumber());
        company.setTanNumber(companyDTO.getTanNumber());
        company.setCinNumber(companyDTO.getCinNumber());
        company.setIncorporatedDate(companyDTO.getIncorporatedDate());
        company.setAuthorizedSignatory(companyDTO.getAuthorizedSignatory());
        company.setUpdatedBy(username);

        // Handle logo upload
        if (logo != null && !logo.isEmpty()) {
            String logoPath = saveCompanyFile(logo, "logo");
            company.setLogoPath(logoPath);
        }

        Company saved = companyRepository.save(company);
        log.info("Company details updated by {}", username);
        return CompanyDTO.fromEntity(saved);
    }

    /**
     * Upload company logo only.
     */
    @Transactional
    public CompanyDTO uploadLogo(MultipartFile logo, String username) {
        if (logo == null || logo.isEmpty()) {
            throw new BadRequestException("Logo file is required");
        }

        Company company = getCompany();
        String logoPath = saveCompanyFile(logo, "logo");
        company.setLogoPath(logoPath);
        company.setUpdatedBy(username);

        Company saved = companyRepository.save(company);
        log.info("Company logo updated by {}", username);
        return CompanyDTO.fromEntity(saved);
    }

    /**
     * Get company documents.
     */
    public List<CompanyDocumentDTO> getDocuments() {
        Company company = getCompany();
        return companyDocumentRepository.findByCompanyIdOrderByUploadedAtDesc(company.getId())
            .stream()
            .map(this::toDocumentDTO)
            .collect(Collectors.toList());
    }

    /**
     * Upload a company document.
     */
    @Transactional
    public CompanyDocumentDTO uploadDocument(String documentType, MultipartFile file, String uploadedBy) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        if (documentType == null || documentType.trim().isEmpty()) {
            throw new BadRequestException("Document type is required");
        }

        Company company = getCompany();

        String ext = getFileExtension(file.getOriginalFilename());
        String fileName = "company_" + documentType + "_" + System.currentTimeMillis() + ext;

        try {
            Path uploadPath = Paths.get(uploadDir).resolve("documents");
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            CompanyDocument doc = CompanyDocument.builder()
                .company(company)
                .documentType(documentType.toUpperCase())
                .fileName(fileName)
                .originalName(file.getOriginalFilename() != null ? file.getOriginalFilename() : fileName)
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedAt(LocalDateTime.now())
                .uploadedBy(uploadedBy)
                .build();

            CompanyDocument saved = companyDocumentRepository.save(doc);
            log.info("Company document uploaded: {} by {}", fileName, uploadedBy);
            return toDocumentDTO(saved);
        } catch (IOException e) {
            throw new FileStorageException("Failed to store company document: " + e.getMessage());
        }
    }

    /**
     * Delete a company document.
     */
    @Transactional
    public void deleteDocument(Long documentId) {
        CompanyDocument doc = companyDocumentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Company document not found with id: " + documentId));

        // Delete file from disk
        Path filePath = Paths.get(doc.getFilePath());
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Could not delete company document file: {}", doc.getFilePath());
        }

        companyDocumentRepository.delete(doc);
        log.info("Company document deleted: {}", doc.getFileName());
    }

    /**
     * Get the company logo file path.
     */
    public Path getLogoFilePath() {
        Company company = getCompany();
        if (company.getLogoPath() == null || company.getLogoPath().isEmpty()) {
            throw new ResourceNotFoundException("Company logo not found");
        }
        Path filePath = Paths.get(company.getLogoPath());
        if (!Files.exists(filePath)) {
            // Try resolving relative to upload dir
            Path resolved = Paths.get(uploadDir).resolve(company.getLogoPath());
            if (Files.exists(resolved)) {
                return resolved;
            }
            throw new ResourceNotFoundException("Company logo file not found on disk");
        }
        return filePath;
    }

    // ========== PRIVATE HELPERS ==========

    private String saveCompanyFile(MultipartFile file, String prefix) {
        String ext = getFileExtension(file.getOriginalFilename());
        String fileName = prefix + ext;

        try {
            Path uploadPath = Paths.get(uploadDir);
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(fileName);

            // Avoid overwriting by appending counter
            int counter = 1;
            while (Files.exists(filePath)) {
                fileName = prefix + "_" + counter + ext;
                filePath = uploadPath.resolve(fileName);
                counter++;
            }

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return filePath.toString();
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + fileName, e);
        }
    }

    private String getFileExtension(String originalFilename) {
        if (originalFilename != null && originalFilename.contains(".")) {
            return originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return ".bin";
    }

    private CompanyDocumentDTO toDocumentDTO(CompanyDocument doc) {
        return CompanyDocumentDTO.builder()
            .id(doc.getId())
            .companyId(doc.getCompany().getId())
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
