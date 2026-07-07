package com.ems.service;

import com.ems.dto.APIResponse;
import com.ems.dto.EmployeeDTO;
import com.ems.dto.PendingRegistrationDTO;
import com.ems.exception.BadRequestException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Employee;
import com.ems.model.PendingRegistration;
import com.ems.model.RegistrationStatus;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.PendingRegistrationRepository;
import com.ems.utils.EmployeeCodeGenerator;
import com.ems.utils.PhotoUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PendingRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(PendingRegistrationService.class);

    private final PendingRegistrationRepository pendingRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeService employeeService;
    private final EmployeeCodeGenerator codeGenerator;
    private final PhotoUtils photoUtils;

    @Value("${app.photo.upload-dir}")
    private String photoUploadDir;

    @Value("${app.document.upload-dir}")
    private String documentUploadDir;

    public List<PendingRegistrationDTO> getAllByStatus(String statusFilter) {
        RegistrationStatus status = (statusFilter != null && !statusFilter.isEmpty())
            ? RegistrationStatus.valueOf(statusFilter.toUpperCase())
            : null;

        List<PendingRegistration> list;
        if (status != null) {
            list = pendingRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            list = pendingRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
        }
        return list.stream()
            .map(PendingRegistrationDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public PendingRegistrationDTO getById(Long id) {
        PendingRegistration entity = pendingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Pending registration not found with id: " + id));
        return PendingRegistrationDTO.fromEntity(entity);
    }

    @Transactional
    public PendingRegistrationDTO create(PendingRegistrationDTO dto, MultipartFile photo,
                                          MultipartFile aadharDoc, MultipartFile panDoc) {
        if (dto.getFirstName() == null || dto.getFirstName().trim().isEmpty()) {
            throw new BadRequestException("First name is required");
        }
        if (dto.getSurname() == null || dto.getSurname().trim().isEmpty()) {
            throw new BadRequestException("Surname is required");
        }
        if (dto.getMobile() == null || dto.getMobile().trim().isEmpty()) {
            throw new BadRequestException("Mobile number is required");
        }

        PendingRegistration entity = new PendingRegistration();
        entity.setRegistrationCode(generateRegistrationCode());
        entity.setFirstName(dto.getFirstName().trim());
        entity.setMiddleName(dto.getMiddleName() != null ? dto.getMiddleName().trim() : null);
        entity.setSurname(dto.getSurname().trim());
        entity.setMobile(dto.getMobile().trim());
        entity.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : null);
        entity.setDob(dto.getDob());
        entity.setGender(dto.getGender());
        entity.setPrefix(dto.getPrefix());
        entity.setMaritalStatus(dto.getMaritalStatus());
        entity.setPresentAddress(dto.getPresentAddress());
        entity.setPermanentAddress(dto.getPermanentAddress());
        entity.setAadharNumber(dto.getAadharNumber());
        entity.setPanNumber(dto.getPanNumber());
        entity.setHighestQualification(dto.getHighestQualification());
        entity.setDesignation(dto.getDesignation());
        entity.setDoj(parseDate(dto.getDoj()));
        entity.setBankName(dto.getBankName());
        entity.setAccountNumber(dto.getAccountNumber());
        entity.setIfscCode(dto.getIfscCode());
        entity.setBranch(dto.getBranch());
        entity.setFatherName(dto.getFatherName());
        entity.setFatherPhone(dto.getFatherPhone());
        entity.setLanguages(dto.getLanguages());
        entity.setStatus(RegistrationStatus.PENDING);

        // Handle photo upload
        if (photo != null && !photo.isEmpty()) {
            try {
                String photoPath = savePendingFile(photo, entity.getRegistrationCode(), "photo");
                entity.setPhotoPath(photoPath);
            } catch (Exception e) {
                log.error("Failed to upload photo for registration {}", entity.getRegistrationCode(), e);
            }
        }

        // Handle AADHAR document upload
        if (aadharDoc != null && !aadharDoc.isEmpty()) {
            try {
                String docPath = savePendingFile(aadharDoc, entity.getRegistrationCode(), "AADHAR");
                entity.setAadharDocPath(docPath);
            } catch (Exception e) {
                log.error("Failed to upload AADHAR for registration {}", entity.getRegistrationCode(), e);
            }
        }

        // Handle PAN document upload
        if (panDoc != null && !panDoc.isEmpty()) {
            try {
                String docPath = savePendingFile(panDoc, entity.getRegistrationCode(), "PAN");
                entity.setPanDocPath(docPath);
            } catch (Exception e) {
                log.error("Failed to upload PAN for registration {}", entity.getRegistrationCode(), e);
            }
        }

        entity = pendingRepository.save(entity);
        return PendingRegistrationDTO.fromEntity(entity);
    }

    @Transactional
    public APIResponse<EmployeeDTO> approve(Long id, String employeeCode, String username) {
        PendingRegistration pending = pendingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Pending registration not found with id: " + id));

        if (pending.getStatus() != RegistrationStatus.PENDING) {
            throw new BadRequestException("Registration is already " + pending.getStatus().name().toLowerCase());
        }

        // Use provided employee code or auto-generate one
        final String finalEmployeeCode;
        if (employeeCode == null || employeeCode.trim().isEmpty()) {
            finalEmployeeCode = codeGenerator.generateNextCode();
        } else {
            finalEmployeeCode = employeeCode.trim();
            if (employeeRepository.existsByEmployeeCodeIncludingDeleted(finalEmployeeCode)) {
                throw new com.ems.exception.DuplicateResourceException("Employee code already exists: " + finalEmployeeCode);
            }
        }

        // Build EmployeeDTO from pending registration data
        EmployeeDTO employeeDTO = EmployeeDTO.builder()
            .employeeCode(finalEmployeeCode)
            .prefix(pending.getPrefix())
            .firstName(pending.getFirstName())
            .surname(pending.getSurname())
            .mobile(pending.getMobile())
            .email(pending.getEmail())
            .dob(pending.getDob())
            .gender(pending.getGender())
            .maritalStatus(pending.getMaritalStatus())
            .presentAddress(pending.getPresentAddress())
            .permanentAddress(pending.getPermanentAddress())
            .aadharNumber(pending.getAadharNumber())
            .panNumber(pending.getPanNumber())
            .highestQualification(pending.getHighestQualification())
            .designation(pending.getDesignation())
            .bankName(pending.getBankName())
            .accountNumber(pending.getAccountNumber())
            .ifscCode(pending.getIfscCode())
            .branch(pending.getBranch())
            .fatherName(pending.getFatherName())
            .fatherPhone(pending.getFatherPhone())
            .employeeStatus("LIVE")
            .build();

        // Create employee without photo (handle separately)
        EmployeeDTO created = employeeService.createEmployee(employeeDTO, null, username);

        // Save languages from registration
        if (pending.getLanguages() != null && !pending.getLanguages().isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.List<com.ems.dto.EmployeeLanguageDTO> langList = mapper.readValue(pending.getLanguages(),
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.List<com.ems.dto.EmployeeLanguageDTO>>() {});
                employeeService.saveEmployeeLanguages(created.getId(), langList);
                employeeService.updateLanguagesCanSpeakField(created.getId());
                created.setLanguages(langList);
            } catch (Exception e) {
                log.error("Failed to parse/save languages for employee {}", finalEmployeeCode, e);
            }
        }

        // Copy photo to employee directory
        if (pending.getPhotoPath() != null) {
            try {
                String newPhotoPath = copyFileToEmployee(pending.getPhotoPath(), finalEmployeeCode, "photos");
                employeeService.updateEmployeePhoto(created.getId(), newPhotoPath);
                created.setPhotoPath(newPhotoPath);
            } catch (Exception e) {
                log.error("Failed to copy photo for employee {}", finalEmployeeCode, e);
            }
        }

        // Copy documents
        if (pending.getAadharDocPath() != null) {
            try {
                copyFileToEmployee(pending.getAadharDocPath(), finalEmployeeCode, "documents");
            } catch (Exception e) {
                log.error("Failed to copy AADHAR for employee {}", finalEmployeeCode, e);
            }
        }
        if (pending.getPanDocPath() != null) {
            try {
                copyFileToEmployee(pending.getPanDocPath(), finalEmployeeCode, "documents");
            } catch (Exception e) {
                log.error("Failed to copy PAN for employee {}", finalEmployeeCode, e);
            }
        }

        // Update pending registration status
        pending.setStatus(RegistrationStatus.APPROVED);
        pending.setApprovedAt(LocalDateTime.now());
        pending.setApprovedBy(username);
        pendingRepository.save(pending);

        log.info("Pending registration {} approved as employee {}", pending.getRegistrationCode(), finalEmployeeCode);
        return APIResponse.success("Registration approved successfully. Employee code: " + finalEmployeeCode, created);
    }

    @Transactional
    public APIResponse<Void> reject(Long id, String reason, String username) {
        PendingRegistration pending = pendingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Pending registration not found with id: " + id));

        if (pending.getStatus() != RegistrationStatus.PENDING) {
            throw new BadRequestException("Registration is already " + pending.getStatus().name().toLowerCase());
        }

        pending.setStatus(RegistrationStatus.REJECTED);
        pending.setRejectionReason(reason);
        pendingRepository.save(pending);

        log.info("Pending registration {} rejected by {}", pending.getRegistrationCode(), username);
        return APIResponse.success("Registration rejected", null);
    }

    private String generateRegistrationCode() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = String.format("%04d", new Random().nextInt(10000));
        return "PREG-" + datePart + "-" + randomPart;
    }

    private String savePendingFile(MultipartFile file, String regCode, String prefix) {
        try {
            String uploadSubDir = "pending";
            Path baseDir = Paths.get(documentUploadDir).toAbsolutePath().normalize();
            Path pendingDir = baseDir.resolve(uploadSubDir).resolve(regCode);
            Files.createDirectories(pendingDir);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            }
            String fileName = regCode + "_" + prefix + extension;
            Path targetPath = pendingDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return "/api/v1/pending-files/" + regCode + "/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + prefix, e);
        }
    }

    private String copyFileToEmployee(String pendingFilePath, String employeeCode, String type) throws IOException {
        // Extract filename from URL
        String fileName = pendingFilePath.substring(pendingFilePath.lastIndexOf('/') + 1);
        String regCode = pendingFilePath.substring(
            pendingFilePath.lastIndexOf('/', pendingFilePath.lastIndexOf('/') - 1) + 1,
            pendingFilePath.lastIndexOf('/'));

        Path sourceDir = Paths.get(documentUploadDir).toAbsolutePath().normalize()
            .resolve("pending").resolve(regCode);
        Path sourceFile = sourceDir.resolve(fileName);

        if (Files.exists(sourceFile)) {
            Path targetDir;
            String newFileName;
            if ("photos".equals(type)) {
                targetDir = Paths.get(photoUploadDir).toAbsolutePath().normalize();
                String ext = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf('.')) : ".jpg";
                newFileName = employeeCode + ext;
            } else {
                targetDir = Paths.get(documentUploadDir).toAbsolutePath().normalize()
                    .resolve(employeeCode);
                String docType = fileName.contains("_") ? fileName.substring(fileName.indexOf('_') + 1, fileName.lastIndexOf('.')) : "DOC";
                newFileName = employeeCode + "_" + docType + (fileName.contains(".") ? fileName.substring(fileName.lastIndexOf('.')) : "");
            }

            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(newFileName);
            Files.copy(sourceFile, targetFile, StandardCopyOption.REPLACE_EXISTING);

            if ("photos".equals(type)) {
                return "/api/v1/photos/" + newFileName;
            }
        }
        return null;
    }

    public long countPending() {
        return pendingRepository.countPending();
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (Exception e) {
            return null;
        }
    }
}
