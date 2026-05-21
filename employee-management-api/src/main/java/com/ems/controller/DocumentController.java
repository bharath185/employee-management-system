package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.EmployeeDocumentDTO;
import com.ems.security.CustomUserDetails;
import com.ems.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<APIResponse<List<EmployeeDocumentDTO>>> getDocuments(
            @PathVariable Long employeeId) {
        List<EmployeeDocumentDTO> docs = documentService.getDocumentsByEmployee(employeeId);
        return ResponseEntity.ok(APIResponse.success(docs));
    }

    @PostMapping("/upload/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<EmployeeDocumentDTO>> uploadDocument(
            @PathVariable Long employeeId,
            @RequestParam("documentType") String documentType,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        EmployeeDocumentDTO doc = documentService.uploadDocument(
            employeeId, documentType, file, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Document uploaded successfully", doc));
    }

    @GetMapping("/download/{documentId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long documentId) {
        Resource resource = documentService.downloadDocument(documentId);
        String filename = resource.getFilename();
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .body(resource);
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Void>> deleteDocument(@PathVariable Long documentId) {
        documentService.deleteDocument(documentId);
        return ResponseEntity.ok(APIResponse.success("Document deleted successfully", null));
    }
}
