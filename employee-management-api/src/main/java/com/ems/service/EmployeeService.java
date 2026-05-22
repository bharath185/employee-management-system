package com.ems.service;

import com.ems.dto.EmployeeDTO;
import com.ems.exception.BadRequestException;
import com.ems.exception.DuplicateResourceException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Employee;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.EmployeeSpecification;
import com.ems.utils.AgeCalculator;
import com.ems.utils.EmployeeCodeGenerator;
import com.ems.utils.ExcelHelper;
import com.ems.utils.PhotoUtils;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeCodeGenerator codeGenerator;
    private final PhotoUtils photoUtils;
    private final ExcelHelper excelHelper;
    private final EntityManager entityManager;

    public Page<EmployeeDTO> getAllEmployees(int page, int size, String sort,
            String search, String employeeCode, String firstName,
            String surname, String gender, String employeeStatus,
            String designation, String religion, String socialCategory) {

        Sort sorting = Sort.by(sort.contains("desc") ?
            Sort.Direction.DESC : Sort.Direction.ASC,
            sort.split(",")[0]);

        Pageable pageable = PageRequest.of(page, size, sorting);

        Specification<Employee> spec = Specification.where(null);

        if (search != null && !search.isEmpty()) {
            spec = spec.and(EmployeeSpecification.search(search));
        }
        if (employeeCode != null && !employeeCode.isEmpty()) {
            spec = spec.and(EmployeeSpecification.hasEmployeeCode(employeeCode));
        }
        if (firstName != null && !firstName.isEmpty()) {
            spec = spec.and(EmployeeSpecification.hasFirstName(firstName));
        }
        if (surname != null && !surname.isEmpty()) {
            spec = spec.and(EmployeeSpecification.hasSurname(surname));
        }
        if (gender != null && !gender.isEmpty()) {
            spec = spec.and(EmployeeSpecification.hasGender(gender));
        }
        if (employeeStatus != null && !employeeStatus.isEmpty()) {
            spec = spec.and(EmployeeSpecification.hasEmployeeStatus(employeeStatus));
        }
        if (designation != null && !designation.isEmpty()) {
            spec = spec.and(EmployeeSpecification.hasDesignation(designation));
        }
        if (religion != null && !religion.isEmpty()) {
            spec = spec.and(EmployeeSpecification.hasReligion(religion));
        }
        if (socialCategory != null && !socialCategory.isEmpty()) {
            spec = spec.and(EmployeeSpecification.hasSocialCategory(socialCategory));
        }

        return employeeRepository.findAll(spec, pageable)
            .map(EmployeeDTO::fromEntity);
    }

    public EmployeeDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Employee not found with id: " + id));
        return EmployeeDTO.fromEntity(employee);
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO employeeDTO,
            MultipartFile photo, String username) {
        if (employeeDTO.getEmployeeCode() == null || employeeDTO.getEmployeeCode().trim().isEmpty()) {
            throw new BadRequestException("Employee code is required");
        }
        if (employeeRepository.existsByEmployeeCode(employeeDTO.getEmployeeCode())) {
            throw new DuplicateResourceException("Employee code already exists: " + employeeDTO.getEmployeeCode());
        }

        Employee employee = employeeDTO.toEntity();
        employee.setCreatedBy(username);
        employee.setUpdatedBy(username);

        // Handle photo upload
        if (photo != null && !photo.isEmpty()) {
            String photoPath = photoUtils.savePhoto(
                photo, employeeDTO.getEmployeeCode());
            employee.setPhotoPath(photoPath);
        }

        Employee saved = employeeRepository.save(employee);
        log.info("Employee created: {}", saved.getEmployeeCode());

        return EmployeeDTO.fromEntity(saved);
    }

    @Transactional
    public EmployeeDTO updateEmployee(Long id, EmployeeDTO employeeDTO,
            MultipartFile photo, String username) {
        Employee existing = employeeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Employee not found with id: " + id));

        // Preserve fields not being updated
        Employee updateData = employeeDTO.toEntity();
        updateData.setId(id);
        updateData.setCreatedAt(existing.getCreatedAt());
        updateData.setCreatedBy(existing.getCreatedBy());
        updateData.setUpdatedBy(username);
        updateData.setIsDeleted(existing.getIsDeleted());
        updateData.setPhotoPath(existing.getPhotoPath());

        // Handle photo update
        if (photo != null && !photo.isEmpty()) {
            String photoPath = photoUtils.savePhoto(
                photo, existing.getEmployeeCode());
            updateData.setPhotoPath(photoPath);
        }

        // Merge: copy non-null values from DTO to existing
        entityManager.merge(updateData);

        Employee updated = employeeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Employee not found after update"));

        log.info("Employee updated: {}", updated.getEmployeeCode());
        return EmployeeDTO.fromEntity(updated);
    }

    @Transactional
    public void deleteEmployee(Long id, String username) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Employee not found with id: " + id));

        employee.setIsDeleted(true);
        employee.setDeletedAt(LocalDateTime.now());
        employee.setUpdatedBy(username);
        employeeRepository.save(employee);

        log.info("Employee soft-deleted: {} by {}", employee.getEmployeeCode(), username);
    }

    public Map<String, Object> uploadPhoto(Long id, MultipartFile photo) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Employee not found with id: " + id));

        String photoPath = photoUtils.savePhoto(photo, employee.getEmployeeCode());
        employee.setPhotoPath(photoPath);
        employeeRepository.save(employee);

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("photoPath", photoPath);
        result.put("fileName", employee.getEmployeeCode() + ".jpg");
        result.put("fileSize", photo.getSize());
        result.put("contentType", photo.getContentType());
        return result;
    }

    public byte[] generateSampleExcel() {
        return excelHelper.generateSampleExcel();
    }

    public byte[] exportToExcel(String employeeStatus, String designation) {
        Specification<Employee> spec = Specification.where(null);

        if (employeeStatus != null && !employeeStatus.isEmpty()) {
            spec = spec.and(EmployeeSpecification.hasEmployeeStatus(employeeStatus));
        }
        if (designation != null && !designation.isEmpty()) {
            spec = spec.and(EmployeeSpecification.hasDesignation(designation));
        }

        List<Employee> employees = employeeRepository.findAll(spec);
        log.info("Exporting {} employees to Excel", employees.size());
        return excelHelper.exportToExcel(employees);
    }

    public Map<String, Object> importFromExcel(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                || contentType.equals("application/vnd.ms-excel"))) {
            throw new BadRequestException("Only .xlsx files are supported");
        }

        List<Map<String, String>> errors = new ArrayList<>();
        int totalRows = 0;
        int successful = 0;

        try {
            List<Employee> employees = excelHelper.importFromExcel(file.getInputStream());
            totalRows = employees.size();

            for (int i = 0; i < employees.size(); i++) {
                Employee emp = employees.get(i);
                try {
                    // Generate employee code if not provided
                    if (emp.getEmployeeCode() == null || emp.getEmployeeCode().isEmpty()) {
                        emp.setEmployeeCode(codeGenerator.generateNextCode());
                    }

                    // Check uniqueness
                    if (employeeRepository.existsByEmployeeCode(emp.getEmployeeCode())) {
                        errors.add(Map.of(
                            "row", String.valueOf(i + 2),
                            "message", "Duplicate employee code: " + emp.getEmployeeCode()
                        ));
                        continue;
                    }

                    // Set defaults
                    if (emp.getEmployeeStatus() == null) {
                        emp.setEmployeeStatus("Live");
                    }

                    employeeRepository.save(emp);
                    successful++;
                } catch (Exception e) {
                    log.error("Error importing row {}: {}", i + 2, e.getMessage());
                    errors.add(Map.of(
                        "row", String.valueOf(i + 2),
                        "message", e.getMessage()
                    ));
                }
            }
        } catch (IOException e) {
            throw new BadRequestException("Failed to read Excel file: " + e.getMessage());
        }

        log.info("Import completed: {}/{} successful, {} errors", successful, totalRows, errors.size());
        return Map.of(
            "totalRows", totalRows,
            "successful", successful,
            "failed", totalRows - successful,
            "errors", errors
        );
    }

    @Transactional
    public void updateEmployeePhoto(Long id, String photoPath) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        employee.setPhotoPath(photoPath);
        employeeRepository.save(employee);
    }
}
