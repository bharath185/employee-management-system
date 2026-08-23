package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.BillDTO;
import com.ems.security.CustomUserDetails;
import com.ems.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;

    @GetMapping
    public ResponseEntity<APIResponse<List<BillDTO>>> getBills(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        List<BillDTO> bills = billService.getBills(month, year);
        return ResponseEntity.ok(APIResponse.success(bills));
    }

    @GetMapping("/{id}")
    public ResponseEntity<APIResponse<BillDTO>> getBill(@PathVariable Long id) {
        BillDTO bill = billService.getBill(id);
        return ResponseEntity.ok(APIResponse.success(bill));
    }

    @PostMapping
    public ResponseEntity<APIResponse<BillDTO>> createBill(
            @RequestParam("vendorName") String vendorName,
            @RequestParam("billType") String billType,
            @RequestParam("amount") BigDecimal amount,
            @RequestParam(value = "billDate", required = false) String billDate,
            @RequestParam(value = "dueDate", required = false) String dueDate,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        LocalDate bd = billDate != null && !billDate.isEmpty() ? LocalDate.parse(billDate) : null;
        LocalDate dd = dueDate != null && !dueDate.isEmpty() ? LocalDate.parse(dueDate) : null;
        BillDTO created = billService.createBill(vendorName, billType, amount, bd, dd, description, file, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Bill created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<APIResponse<BillDTO>> updateBill(
            @PathVariable Long id,
            @RequestParam(value = "vendorName", required = false) String vendorName,
            @RequestParam(value = "billType", required = false) String billType,
            @RequestParam(value = "amount", required = false) BigDecimal amount,
            @RequestParam(value = "billDate", required = false) String billDate,
            @RequestParam(value = "dueDate", required = false) String dueDate,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        LocalDate bd = billDate != null && !billDate.isEmpty() ? LocalDate.parse(billDate) : null;
        LocalDate dd = dueDate != null && !dueDate.isEmpty() ? LocalDate.parse(dueDate) : null;
        BillDTO updated = billService.updateBill(id, vendorName, billType, amount, bd, dd, description, status, file, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Bill updated successfully", updated));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<APIResponse<BillDTO>> toggleStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        BillDTO updated = billService.toggleStatus(id, currentUser.getUsername());
        return ResponseEntity.ok(APIResponse.success("Bill status toggled", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<Void>> deleteBill(@PathVariable Long id) {
        billService.deleteBill(id);
        return ResponseEntity.ok(APIResponse.success("Bill deleted successfully", null));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> getBillFile(@PathVariable Long id) {
        BillDTO bill = billService.getBill(id);
        Resource resource = billService.getBillFile(id);
        MediaType mediaType = resolveMediaType(bill.getContentType(), bill.getFileName());
        String dispositionType = mediaType.getType().equals("image") || MediaType.APPLICATION_PDF.equals(mediaType)
            ? "inline" : "attachment";
        String fileName = bill.getFileName() != null ? bill.getFileName() : "bill";
        ContentDisposition disposition = ContentDisposition.builder(dispositionType)
            .filename(fileName, StandardCharsets.UTF_8)
            .build();
        return ResponseEntity.ok()
            .contentType(mediaType)
            .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
            .header(HttpHeaders.CACHE_CONTROL, "private, max-age=0, must-revalidate")
            .body(resource);
    }

    private MediaType resolveMediaType(String contentType, String fileName) {
        if (contentType != null && !contentType.isBlank()) {
            try {
                return MediaType.parseMediaType(contentType);
            } catch (Exception ignored) {
                // fall through to filename-based type
            }
        }
        String name = fileName != null ? fileName.toLowerCase() : "";
        if (name.endsWith(".pdf")) return MediaType.APPLICATION_PDF;
        if (name.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
        if (name.endsWith(".gif")) return MediaType.IMAGE_GIF;
        if (name.endsWith(".webp")) return MediaType.valueOf("image/webp");
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
