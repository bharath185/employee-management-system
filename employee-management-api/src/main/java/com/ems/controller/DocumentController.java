package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.EmployeeDocumentDTO;
import com.ems.model.EmployeeDocument;
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

    @GetMapping
    public ResponseEntity<APIResponse<List<EmployeeDocumentDTO>>> getAllDocuments(
            @RequestParam(value = "employeeId", required = false) Long employeeId,
            @RequestParam(value = "employeeIds", required = false) List<Long> employeeIds,
            @RequestParam(value = "documentType", required = false) String documentType,
            @RequestParam(value = "documentTypes", required = false) List<String> documentTypes,
            @RequestParam(value = "process", required = false) String process,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "search", required = false) String search) {
        List<EmployeeDocumentDTO> docs = documentService.getAllDocuments(
            employeeId, employeeIds, documentType, documentTypes, process, department, search);
        return ResponseEntity.ok(APIResponse.success(docs));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<APIResponse<List<EmployeeDocumentDTO>>> getDocuments(
            @PathVariable Long employeeId) {
        List<EmployeeDocumentDTO> docs = documentService.getDocumentsByEmployee(employeeId);
        return ResponseEntity.ok(APIResponse.success(docs));
    }

    @PostMapping("/upload/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<EmployeeDocumentDTO>> uploadDocument(
            @PathVariable Long employeeId,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "documentTitle", required = false) String documentTitle,
            @RequestParam(value = "pageNumber", required = false) Integer pageNumber,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        String username = currentUser != null ? currentUser.getUsername() : "ADMIN";
        EmployeeDocumentDTO doc = documentService.uploadDocument(
            employeeId, documentType, documentTitle, pageNumber, notes, file, username);
        return ResponseEntity.ok(APIResponse.success("Document uploaded successfully", doc));
    }

    @PostMapping("/upload-batch/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<EmployeeDocumentDTO>>> uploadBatch(
            @PathVariable Long employeeId,
            @RequestParam("documentTypes") List<String> documentTypes,
            @RequestParam(value = "documentTitles", required = false) List<String> documentTitles,
            @RequestParam(value = "pageNumbers", required = false) List<Integer> pageNumbers,
            @RequestParam(value = "notesList", required = false) List<String> notesList,
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        String username = currentUser != null ? currentUser.getUsername() : "ADMIN";
        List<EmployeeDocumentDTO> docs = documentService.uploadBatch(
            employeeId, documentTypes, documentTitles, pageNumbers, notesList, files, username);
        return ResponseEntity.ok(APIResponse.success(docs.size() + " documents uploaded successfully", docs));
    }

    @PostMapping("/split-pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<List<com.ems.dto.SplitPdfPageDTO>>> splitPdf(
            @RequestParam("file") MultipartFile file) {
        List<com.ems.dto.SplitPdfPageDTO> pages = documentService.splitPdfPages(file);
        return ResponseEntity.ok(APIResponse.success("PDF split into " + pages.size() + " page(s)", pages));
    }

    @PutMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<EmployeeDocumentDTO>> updateDocument(
            @PathVariable Long documentId,
            @RequestParam(value = "documentType", required = false) String documentType,
            @RequestParam(value = "documentTitle", required = false) String documentTitle,
            @RequestParam(value = "pageNumber", required = false) Integer pageNumber,
            @RequestParam(value = "notes", required = false) String notes) {
        EmployeeDocumentDTO doc = documentService.updateDocumentMetadata(
            documentId, documentType, documentTitle, pageNumber, notes);
        return ResponseEntity.ok(APIResponse.success("Document updated successfully", doc));
    }

    @GetMapping("/download/{documentId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long documentId) {
        Resource resource = documentService.downloadDocument(documentId);
        EmployeeDocument entity = documentService.getDocumentEntity(documentId);
        String filename = entity.getOriginalName() != null ? entity.getOriginalName() : resource.getFilename();
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .body(resource);
    }

    @GetMapping("/preview/{documentId}")
    public ResponseEntity<Resource> previewDocument(@PathVariable Long documentId) {
        Resource resource = documentService.downloadDocument(documentId);
        EmployeeDocument entity = documentService.getDocumentEntity(documentId);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (entity.getContentType() != null && !entity.getContentType().isEmpty()) {
            try {
                mediaType = MediaType.parseMediaType(entity.getContentType());
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok()
            .contentType(mediaType)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + entity.getOriginalName() + "\"")
            .body(resource);
    }

    @GetMapping("/download-all/{employeeId}")
    public ResponseEntity<Resource> downloadAllDocuments(@PathVariable Long employeeId) {
        Resource zipResource = documentService.downloadAllAsZip(employeeId);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"employee_" + employeeId + "_documents.zip\"")
            .body(zipResource);
    }

    @PostMapping("/download-zip")
    public ResponseEntity<Resource> downloadSelectedDocuments(@RequestBody List<Long> documentIds) {
        Resource zipResource = documentService.downloadSelectedAsZip(documentIds);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"selected_documents.zip\"")
            .body(zipResource);
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Void>> deleteDocument(@PathVariable Long documentId) {
        documentService.deleteDocument(documentId);
        return ResponseEntity.ok(APIResponse.success("Document deleted successfully", null));
    }
}
