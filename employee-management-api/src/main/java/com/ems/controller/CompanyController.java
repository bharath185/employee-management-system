package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.CompanyDTO;
import com.ems.dto.CompanyDocumentDTO;
import com.ems.security.CustomUserDetails;
import com.ems.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/company")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<APIResponse<CompanyDTO>> getCompany() {
        CompanyDTO company = companyService.getCompanyDTO();
        return ResponseEntity.ok(APIResponse.success(company));
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<CompanyDTO>> updateCompany(
            @RequestPart("company") CompanyDTO companyDTO,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        CompanyDTO updated = companyService.updateCompany(companyDTO, logo, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Company updated successfully", updated));
    }

    @PostMapping("/logo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<CompanyDTO>> uploadLogo(
            @RequestParam("logo") MultipartFile logo,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        CompanyDTO updated = companyService.uploadLogo(logo, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Logo uploaded successfully", updated));
    }

    @GetMapping("/logo")
    public ResponseEntity<Resource> getLogo() {
        Path logoPath = companyService.getLogoFilePath();
        Resource resource = new FileSystemResource(logoPath);

        String contentType = "image/jpeg";
        String fileName = logoPath.getFileName().toString();
        if (fileName.toLowerCase().endsWith(".png")) {
            contentType = "image/png";
        }

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
            .body(resource);
    }

    @GetMapping("/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<CompanyDocumentDTO>>> getDocuments() {
        List<CompanyDocumentDTO> documents = companyService.getDocuments();
        return ResponseEntity.ok(APIResponse.success(documents));
    }

    @PostMapping("/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<CompanyDocumentDTO>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        CompanyDocumentDTO doc = companyService.uploadDocument(documentType, file, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Document uploaded successfully", doc));
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Void>> deleteDocument(
            @PathVariable Long id) {
        companyService.deleteDocument(id);
        return ResponseEntity.ok(APIResponse.success("Document deleted successfully", null));
    }
}
