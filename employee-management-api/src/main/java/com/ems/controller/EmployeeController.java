package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.EmployeeDTO;
import com.ems.dto.PagedResponse;
import com.ems.model.Employee;
import com.ems.security.CustomUserDetails;
import com.ems.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<APIResponse<PagedResponse<EmployeeDTO>>> getAllEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String surname,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String employeeStatus,
            @RequestParam(required = false) String designation,
            @RequestParam(required = false) String religion,
            @RequestParam(required = false) String socialCategory,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        // EMPLOYEE role can only see their own profile
        if (currentUser.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HR"))) {
            EmployeeDTO emp = employeeService.getEmployeeById(currentUser.getEmployeeId());
            PagedResponse<EmployeeDTO> paged = PagedResponse.<EmployeeDTO>builder()
                .content(List.of(emp))
                .page(0).size(1).totalElements(1).totalPages(1)
                .first(true).last(true)
                .build();
            return ResponseEntity.ok(APIResponse.success(paged));
        }

        Page<EmployeeDTO> employeePage = employeeService.getAllEmployees(
            page, size, sort, search, employeeCode, firstName,
            surname, gender, employeeStatus, designation, religion, socialCategory);

        PagedResponse<EmployeeDTO> response = PagedResponse.<EmployeeDTO>builder()
            .content(employeePage.getContent())
            .page(employeePage.getNumber())
            .size(employeePage.getSize())
            .totalElements(employeePage.getTotalElements())
            .totalPages(employeePage.getTotalPages())
            .first(employeePage.isFirst())
            .last(employeePage.isLast())
            .build();

        return ResponseEntity.ok(APIResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<EmployeeDTO>> getEmployeeById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        // EMPLOYEE can only view their own profile
        if (currentUser.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HR"))
                && !currentUser.getEmployeeId().equals(id)) {
            return ResponseEntity.status(403)
                .body(APIResponse.error("Access denied"));
        }
        EmployeeDTO employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(APIResponse.success(employee));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<EmployeeDTO>> createEmployee(
            @RequestBody EmployeeDTO employeeDTO,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        EmployeeDTO created = employeeService.createEmployee(
            employeeDTO, null, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(APIResponse.success("Employee created successfully", created));
    }

    @PostMapping(value = "/with-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<EmployeeDTO>> createEmployeeWithPhoto(
            @RequestPart("employee") EmployeeDTO employeeDTO,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        EmployeeDTO created = employeeService.createEmployee(
            employeeDTO, photo, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(APIResponse.success("Employee created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<APIResponse<EmployeeDTO>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeDTO employeeDTO,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        if (currentUser.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HR"))
                && !currentUser.getEmployeeId().equals(id)) {
            return ResponseEntity.status(403)
                .body(APIResponse.error("Access denied"));
        }
        EmployeeDTO updated = employeeService.updateEmployee(
            id, employeeDTO, null, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Employee updated successfully", updated));
    }

    @PutMapping(value = "/{id}/with-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<APIResponse<EmployeeDTO>> updateEmployeeWithPhoto(
            @PathVariable Long id,
            @RequestPart("employee") @Valid EmployeeDTO employeeDTO,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        if (currentUser.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HR"))
                && !currentUser.getEmployeeId().equals(id)) {
            return ResponseEntity.status(403)
                .body(APIResponse.error("Access denied"));
        }
        EmployeeDTO updated = employeeService.updateEmployee(
            id, employeeDTO, photo, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Employee updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Void>> deleteEmployee(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        employeeService.deleteEmployee(id, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Employee deleted successfully", null));
    }

    @PostMapping("/{id}/photo")
    public ResponseEntity<APIResponse<Map<String, Object>>> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("photo") MultipartFile photo,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        if (currentUser.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HR"))
                && !currentUser.getEmployeeId().equals(id)) {
            return ResponseEntity.status(403)
                .body(APIResponse.error("Access denied"));
        }
        Map<String, Object> result = employeeService.uploadPhoto(id, photo);
        return ResponseEntity.ok(APIResponse.success("Photo uploaded successfully", result));
    }

    @GetMapping("/sample-excel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadSampleExcel() {
        byte[] excelData = employeeService.generateSampleExcel();
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employee_sample.xlsx")
            .body(excelData);
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportToExcel(
            @RequestParam(required = false) String employeeStatus,
            @RequestParam(required = false) String designation) {
        byte[] excelData = employeeService.exportToExcel(employeeStatus, designation);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header("Content-Disposition",
                "attachment; filename=employees_export.xlsx")
            .body(excelData);
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Map<String, Object>>> importFromExcel(
            @RequestParam("file") MultipartFile file) {
        Map<String, Object> result = employeeService.importFromExcel(file);
        return ResponseEntity.ok(APIResponse.success("Import completed", result));
    }
}
