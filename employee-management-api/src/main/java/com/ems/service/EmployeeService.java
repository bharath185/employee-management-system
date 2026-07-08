package com.ems.service;

import com.ems.dto.EmployeeDTO;
import com.ems.dto.EmployeeLanguageDTO;
import com.ems.exception.BadRequestException;
import com.ems.exception.DuplicateResourceException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Employee;
import com.ems.model.EmployeeLanguage;
import com.ems.model.MasterData;
import com.ems.model.User;
import com.ems.repository.EmployeeLanguageRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.EmployeeSpecification;
import com.ems.repository.MasterDataRepository;
import com.ems.repository.UserRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeCodeGenerator codeGenerator;
    private final PhotoUtils photoUtils;
    private final ExcelHelper excelHelper;
    private final EntityManager entityManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MasterDataRepository masterDataRepository;
    private final EmployeeLanguageRepository employeeLanguageRepository;

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
            .map(emp -> {
                EmployeeDTO dto = enrichWithRole(EmployeeDTO.fromEntity(emp));
                dto.setLanguages(getEmployeeLanguagesAsDTO(emp.getId()));
                return dto;
            });
    }

    private EmployeeDTO enrichWithRole(EmployeeDTO dto) {
        if (dto.getId() != null) {
            userRepository.findByEmployeeId(dto.getId())
                .ifPresent(u -> dto.setUserRole(u.getRole()));
        }
        return dto;
    }

    public EmployeeDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Employee not found with id: " + id));
        EmployeeDTO dto = enrichWithRole(EmployeeDTO.fromEntity(employee));
        dto.setLanguages(getEmployeeLanguagesAsDTO(id));
        return dto;
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO employeeDTO,
            MultipartFile photo, String username) {
        // Auto-generate employee code if not provided
        if (employeeDTO.getEmployeeCode() == null || employeeDTO.getEmployeeCode().trim().isEmpty()) {
            employeeDTO.setEmployeeCode(codeGenerator.generateNextCode());
        }
        if (employeeRepository.existsByEmployeeCodeIncludingDeleted(employeeDTO.getEmployeeCode())) {
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

        saveEmployeeLanguages(saved.getId(), employeeDTO.getLanguages());
        updateLanguagesCanSpeakField(saved.getId());

        if (employeeDTO.getUserRole() != null && !employeeDTO.getUserRole().isEmpty()) {
            createOrUpdateUser(saved, employeeDTO.getUserRole());
        }

        EmployeeDTO result = enrichWithRole(EmployeeDTO.fromEntity(saved));
        result.setLanguages(getEmployeeLanguagesAsDTO(saved.getId()));
        return result;
    }

    @Transactional
    public void createOrUpdateUser(Employee employee, String role) {
        User user = userRepository.findByEmployeeId(employee.getId())
            .orElse(User.builder()
                .username(employee.getEmployeeCode())
                .password(passwordEncoder.encode("Admin@123"))
                .employeeId(employee.getId())
                .build());
        user.setRole(role);
        user.setEnabled(true);
        user.setAccountNonLocked(true);
        userRepository.save(user);
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

        if (employeeDTO.getUserRole() != null && !employeeDTO.getUserRole().isEmpty()) {
            createOrUpdateUser(updated, employeeDTO.getUserRole());
        } else if (employeeDTO.getUserRole() != null && employeeDTO.getUserRole().isEmpty()) {
            userRepository.findByEmployeeId(id).ifPresent(userRepository::delete);
        }

        saveEmployeeLanguages(updated.getId(), employeeDTO.getLanguages());
        updateLanguagesCanSpeakField(updated.getId());

        log.info("Employee updated: {}", updated.getEmployeeCode());
        EmployeeDTO result = enrichWithRole(EmployeeDTO.fromEntity(updated));
        result.setLanguages(getEmployeeLanguagesAsDTO(updated.getId()));
        return result;
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
        return excelHelper.generateSampleExcel(loadMasterDataOptionsForExcel());
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
        Map<Long, List<EmployeeLanguageDTO>> employeeLanguages = new HashMap<>();
        for (Employee emp : employees) {
            employeeLanguages.put(emp.getId(), getEmployeeLanguagesAsDTO(emp.getId()));
        }
        return excelHelper.exportToExcel(employees, loadMasterDataOptionsForExcel(), employeeLanguages);
    }

    private Map<String, List<String>> loadMasterDataOptionsForExcel() {
        List<String> categories = List.of(
            "PREFIX", "GENDER", "MARITAL_STATUS", "F_M_H", "OCCUPATION_KIN",
            "OCCUPATION_SUB", "RELIGION", "SOCIAL_CATEGORY", "SOCIAL_SUBCATEGORY",
            "BLOOD_GROUP", "EMPLOYEE_STATUS", "DESIGNATION", "EXIT_TYPE",
            "YES_NO", "LANGUAGE", "QUALIFICATION", "EDUCATION_LEVEL",
            "PROCESS", "RELATIONSHIP", "BANK_NAME"
        );
        Map<String, List<String>> options = new HashMap<>();
        for (String category : categories) {
            List<String> codes = masterDataRepository
                .findByCategoryIgnoreCaseAndActiveTrueOrderBySortOrderAsc(category)
                .stream()
                .map(MasterData::getCode)
                .toList();
            options.put(category, codes);
        }
        return options;
    }

    private Map<String, Set<String>> loadMasterDataCodesForValidation() {
        List<String> categories = List.of(
            "PREFIX", "GENDER", "MARITAL_STATUS", "F_M_H", "OCCUPATION_KIN",
            "RELIGION", "SOCIAL_CATEGORY", "SOCIAL_SUBCATEGORY", "BLOOD_GROUP",
            "EMPLOYEE_STATUS", "DESIGNATION", "EXIT_TYPE", "YES_NO", "LANGUAGE"
        );
        Map<String, Set<String>> codes = new HashMap<>();
        for (String category : categories) {
            Set<String> categoryCodes = new HashSet<>(masterDataRepository
                .findByCategoryIgnoreCaseAndActiveTrueOrderBySortOrderAsc(category)
                .stream()
                .map(MasterData::getCode)
                .toList());
            codes.put(category, categoryCodes);
        }
        return codes;
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

            Map<String, Set<String>> masterDataCodes = loadMasterDataCodesForValidation();

            for (int i = 0; i < employees.size(); i++) {
                Employee emp = employees.get(i);
                try {
                    // Validate required fields
                    if (emp.getFirstName() == null || emp.getFirstName().trim().isEmpty()) {
                        errors.add(Map.of(
                            "row", String.valueOf(i + 2),
                            "message", "First name is required"
                        ));
                        continue;
                    }
                    if (emp.getSurname() == null || emp.getSurname().trim().isEmpty()) {
                        errors.add(Map.of(
                            "row", String.valueOf(i + 2),
                            "message", "Surname is required"
                        ));
                        continue;
                    }
                    if (emp.getMobile() == null || emp.getMobile().trim().isEmpty()) {
                        errors.add(Map.of(
                            "row", String.valueOf(i + 2),
                            "message", "Mobile is required"
                        ));
                        continue;
                    }

                    // Validate master data values
                    List<String> masterErrors = excelHelper.validateEmployeeMasterData(emp, masterDataCodes);
                    if (!masterErrors.isEmpty()) {
                        for (String masterError : masterErrors) {
                            errors.add(Map.of(
                                "row", String.valueOf(i + 2),
                                "message", masterError
                            ));
                        }
                        continue;
                    }

                    // Set defaults
                    if (emp.getEmployeeStatus() == null) {
                        emp.setEmployeeStatus("LIVE");
                    }

                    String empCode = emp.getEmployeeCode();
                    Employee saved;
                    if (empCode == null || empCode.isEmpty()) {
                        // New employee — generate code
                        emp.setEmployeeCode(codeGenerator.generateNextCode());
                        saved = employeeRepository.save(emp);
                        successful++;
                    } else {
                        // Check if active employee with this code exists → UPDATE
                        Optional<Employee> existingOpt = employeeRepository.findByEmployeeCode(empCode);
                        if (existingOpt.isPresent()) {
                            Employee existing = existingOpt.get();
                            mergeEmployeeFields(existing, emp);
                            saved = employeeRepository.save(existing);
                            successful++;
                        } else if (employeeRepository.existsByEmployeeCodeIncludingDeleted(empCode)) {
                            // Code belongs to a soft-deleted employee
                            errors.add(Map.of(
                                "row", String.valueOf(i + 2),
                                "message", "Employee code " + empCode + " is already used by a deleted employee. Use a different code or leave blank."
                            ));
                            continue;
                        } else {
                            // Code is free — create new
                            saved = employeeRepository.save(emp);
                            successful++;
                        }
                    }
                    // Save languages from Excel import
                    if (emp.getImportLanguages() != null && !emp.getImportLanguages().isEmpty()) {
                        saveEmployeeLanguages(saved.getId(), emp.getImportLanguages());
                        updateLanguagesCanSpeakField(saved.getId());
                    }
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

    private void mergeEmployeeFields(Employee existing, Employee source) {
        if (source.getPrefix() != null) existing.setPrefix(source.getPrefix());
        if (source.getFirstName() != null) existing.setFirstName(source.getFirstName());
        if (source.getSurname() != null) existing.setSurname(source.getSurname());
        if (source.getGender() != null) existing.setGender(source.getGender());
        if (source.getMaritalStatus() != null) existing.setMaritalStatus(source.getMaritalStatus());
        if (source.getFatherHusbandName() != null) existing.setFatherHusbandName(source.getFatherHusbandName());
        if (source.getFMH() != null) existing.setFMH(source.getFMH());
        if (source.getOccupationKin() != null) existing.setOccupationKin(source.getOccupationKin());
        if (source.getOccupationKinSub() != null) existing.setOccupationKinSub(source.getOccupationKinSub());
        if (source.getRationCard() != null) existing.setRationCard(source.getRationCard());
        if (source.getDoj() != null) existing.setDoj(source.getDoj());
        if (source.getHighestQualification() != null) existing.setHighestQualification(source.getHighestQualification());
        if (source.getLevelOfEducation() != null) existing.setLevelOfEducation(source.getLevelOfEducation());
        if (source.getYearOfPassing() != null) existing.setYearOfPassing(source.getYearOfPassing());
        if (source.getPercentageMarks() != null) existing.setPercentageMarks(source.getPercentageMarks());
        if (source.getDob() != null) existing.setDob(source.getDob());
        if (source.getPresentAddress() != null) existing.setPresentAddress(source.getPresentAddress());
        if (source.getPermanentAddress() != null) existing.setPermanentAddress(source.getPermanentAddress());
        if (source.getEmail() != null) existing.setEmail(source.getEmail());
        if (source.getMobile() != null) existing.setMobile(source.getMobile());
        if (source.getCloseRelativeName() != null) existing.setCloseRelativeName(source.getCloseRelativeName());
        if (source.getCloseRelativeMobile() != null) existing.setCloseRelativeMobile(source.getCloseRelativeMobile());
        if (source.getReligion() != null) existing.setReligion(source.getReligion());
        if (source.getSocialCategory() != null) existing.setSocialCategory(source.getSocialCategory());
        if (source.getSocialSubcategory() != null) existing.setSocialSubcategory(source.getSocialSubcategory());
        if (source.getHasTv() != null) existing.setHasTv(source.getHasTv());
        if (source.getHasFridge() != null) existing.setHasFridge(source.getHasFridge());
        if (source.getHasLaptop() != null) existing.setHasLaptop(source.getHasLaptop());
        if (source.getHasWifi() != null) existing.setHasWifi(source.getHasWifi());
        if (source.getHas2wheeler() != null) existing.setHas2wheeler(source.getHas2wheeler());
        if (source.getHas4wheeler() != null) existing.setHas4wheeler(source.getHas4wheeler());
        if (source.getBloodGroup() != null) existing.setBloodGroup(source.getBloodGroup());
        if (source.getAadharNumber() != null) existing.setAadharNumber(source.getAadharNumber());
        if (source.getPanNumber() != null) existing.setPanNumber(source.getPanNumber());
        if (source.getSscStatus() != null) existing.setSscStatus(source.getSscStatus());
        if (source.getIntermediateStatus() != null) existing.setIntermediateStatus(source.getIntermediateStatus());
        if (source.getBachelorsDegree() != null) existing.setBachelorsDegree(source.getBachelorsDegree());
        if (source.getMastersDegree() != null) existing.setMastersDegree(source.getMastersDegree());
        if (source.getAadhaarVerification() != null) existing.setAadhaarVerification(source.getAadhaarVerification());
        if (source.getPanVerification() != null) existing.setPanVerification(source.getPanVerification());
        if (source.getOsv() != null) existing.setOsv(source.getOsv());
        if (source.getRemarks() != null) existing.setRemarks(source.getRemarks());
        if (source.getBankName() != null) existing.setBankName(source.getBankName());
        if (source.getAccountNumber() != null) existing.setAccountNumber(source.getAccountNumber());
        if (source.getIfscCode() != null) existing.setIfscCode(source.getIfscCode());
        if (source.getBranch() != null) existing.setBranch(source.getBranch());
        if (source.getEmployeeStatus() != null) existing.setEmployeeStatus(source.getEmployeeStatus());
        if (source.getProcessAssigned() != null) existing.setProcessAssigned(source.getProcessAssigned());
        if (source.getDepartment() != null) existing.setDepartment(source.getDepartment());
        if (source.getEsicNo() != null) existing.setEsicNo(source.getEsicNo());
        if (source.getAadharSeeding() != null) existing.setAadharSeeding(source.getAadharSeeding());
        if (source.getUanNo() != null) existing.setUanNo(source.getUanNo());
        if (source.getPfNo() != null) existing.setPfNo(source.getPfNo());
        if (source.getUanActivation() != null) existing.setUanActivation(source.getUanActivation());
        if (source.getLanguagesCanSpeak() != null) existing.setLanguagesCanSpeak(source.getLanguagesCanSpeak());
        if (source.getFatherName() != null) existing.setFatherName(source.getFatherName());
        if (source.getFatherPhone() != null) existing.setFatherPhone(source.getFatherPhone());
        if (source.getMotherName() != null) existing.setMotherName(source.getMotherName());
        if (source.getMotherPhone() != null) existing.setMotherPhone(source.getMotherPhone());
        if (source.getSpouseName() != null) existing.setSpouseName(source.getSpouseName());
        if (source.getSpousePhone() != null) existing.setSpousePhone(source.getSpousePhone());
        if (source.getPastExperience() != null) existing.setPastExperience(source.getPastExperience());
        if (source.getOrganizationName() != null) existing.setOrganizationName(source.getOrganizationName());
        if (source.getPeriodOfEmployment() != null) existing.setPeriodOfEmployment(source.getPeriodOfEmployment());
        if (source.getRef1Name() != null) existing.setRef1Name(source.getRef1Name());
        if (source.getRef1Relationship() != null) existing.setRef1Relationship(source.getRef1Relationship());
        if (source.getRef1Address() != null) existing.setRef1Address(source.getRef1Address());
        if (source.getRef1Mobile() != null) existing.setRef1Mobile(source.getRef1Mobile());
        if (source.getRef2Name() != null) existing.setRef2Name(source.getRef2Name());
        if (source.getRef2Relationship() != null) existing.setRef2Relationship(source.getRef2Relationship());
        if (source.getRef2Address() != null) existing.setRef2Address(source.getRef2Address());
        if (source.getRef2Mobile() != null) existing.setRef2Mobile(source.getRef2Mobile());
        if (source.getDesignation() != null) existing.setDesignation(source.getDesignation());
        if (source.getDoe() != null) existing.setDoe(source.getDoe());
        if (source.getDeletionMonth() != null) existing.setDeletionMonth(source.getDeletionMonth());
        if (source.getExitType() != null) existing.setExitType(source.getExitType());
        if (source.getExitReason() != null) existing.setExitReason(source.getExitReason());
    }

    public void saveEmployeeLanguages(Long employeeId, List<EmployeeLanguageDTO> languages) {
        employeeLanguageRepository.deleteByEmployeeId(employeeId);
        if (languages == null || languages.isEmpty()) return;
        Employee employee = employeeRepository.findById(employeeId).orElse(null);
        if (employee == null) return;
        for (EmployeeLanguageDTO langDTO : languages) {
            EmployeeLanguage el = EmployeeLanguage.builder()
                .employee(employee)
                .language(langDTO.getLanguage())
                .canRead(langDTO.isCanRead())
                .canWrite(langDTO.isCanWrite())
                .canSpeak(langDTO.isCanSpeak())
                .build();
            employeeLanguageRepository.save(el);
        }
    }

    private List<EmployeeLanguageDTO> getEmployeeLanguagesAsDTO(Long employeeId) {
        return employeeLanguageRepository.findByEmployeeId(employeeId).stream()
            .map(el -> EmployeeLanguageDTO.builder()
                .language(el.getLanguage())
                .canRead(el.isCanRead())
                .canWrite(el.isCanWrite())
                .canSpeak(el.isCanSpeak())
                .build())
            .toList();
    }

    public void updateLanguagesCanSpeakField(Long employeeId) {
        List<EmployeeLanguage> languages = employeeLanguageRepository.findByEmployeeId(employeeId);
        Employee employee = employeeRepository.findById(employeeId).orElse(null);
        if (employee == null) return;
        String value = languages.stream()
            .filter(el -> el.isCanRead() || el.isCanWrite() || el.isCanSpeak())
            .map(EmployeeLanguage::getLanguage)
            .distinct()
            .reduce((a, b) -> a + ", " + b)
            .orElse(null);
        employee.setLanguagesCanSpeak(value);
        employeeRepository.save(employee);
    }
}
