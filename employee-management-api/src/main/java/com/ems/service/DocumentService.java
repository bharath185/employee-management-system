package com.ems.service;

import com.ems.dto.EmployeeDocumentDTO;
import com.ems.dto.SplitPdfPageDTO;
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
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final EmployeeDocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;

    @Value("${app.document.upload-dir:uploads/documents}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<EmployeeDocumentDTO> getAllDocuments(
            Long employeeId,
            List<Long> employeeIds,
            String documentType,
            List<String> documentTypes,
            String process,
            String department,
            String search) {

        List<EmployeeDocument> docs = documentRepository.findAllByOrderByUploadedAtDesc();

        if (employeeId != null) {
            docs = docs.stream()
                .filter(d -> d.getEmployee() != null && employeeId.equals(d.getEmployee().getId()))
                .collect(Collectors.toList());
        } else if (employeeIds != null && !employeeIds.isEmpty()) {
            Set<Long> idSet = new HashSet<>(employeeIds);
            docs = docs.stream()
                .filter(d -> d.getEmployee() != null && idSet.contains(d.getEmployee().getId()))
                .collect(Collectors.toList());
        }

        if (documentTypes != null && !documentTypes.isEmpty() && !documentTypes.contains("ALL")) {
            Set<String> typeSet = documentTypes.stream().map(String::toLowerCase).collect(Collectors.toSet());
            docs = docs.stream()
                .filter(d -> d.getDocumentType() != null && typeSet.contains(d.getDocumentType().toLowerCase()))
                .collect(Collectors.toList());
        } else if (documentType != null && !documentType.trim().isEmpty() && !"ALL".equalsIgnoreCase(documentType)) {
            String dt = documentType.trim();
            docs = docs.stream()
                .filter(d -> dt.equalsIgnoreCase(d.getDocumentType()))
                .collect(Collectors.toList());
        }

        if (process != null && !process.trim().isEmpty() && !"ALL".equalsIgnoreCase(process)) {
            String proc = process.trim();
            docs = docs.stream()
                .filter(d -> d.getEmployee() != null && proc.equalsIgnoreCase(d.getEmployee().getProcessAssigned()))
                .collect(Collectors.toList());
        }

        if (department != null && !department.trim().isEmpty() && !"ALL".equalsIgnoreCase(department)) {
            String dept = department.trim();
            docs = docs.stream()
                .filter(d -> d.getEmployee() != null && dept.equalsIgnoreCase(d.getEmployee().getDepartment()))
                .collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            docs = docs.stream().filter(d -> {
                String title = d.getDocumentTitle() != null ? d.getDocumentTitle().toLowerCase() : "";
                String orig = d.getOriginalName() != null ? d.getOriginalName().toLowerCase() : "";
                String type = d.getDocumentType() != null ? d.getDocumentType().toLowerCase() : "";
                String empCode = d.getEmployee() != null && d.getEmployee().getEmployeeCode() != null ? d.getEmployee().getEmployeeCode().toLowerCase() : "";
                String empName = d.getEmployee() != null ? getFullName(d.getEmployee()).toLowerCase() : "";
                String empProc = d.getEmployee() != null && d.getEmployee().getProcessAssigned() != null ? d.getEmployee().getProcessAssigned().toLowerCase() : "";
                return title.contains(q) || orig.contains(q) || type.contains(q) || empCode.contains(q) || empName.contains(q) || empProc.contains(q);
            }).collect(Collectors.toList());
        }

        return docs.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeDocumentDTO> getDocumentsByEmployee(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found");
        }
        return documentRepository.findByEmployeeIdOrderByUploadedAtDesc(employeeId)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public EmployeeDocumentDTO uploadDocument(
            Long employeeId,
            String documentType,
            String documentTitle,
            Integer pageNumber,
            String notes,
            MultipartFile file,
            String uploadedBy) {

        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (file == null || file.isEmpty()) throw new BadRequestException("File is empty");
        if (documentType == null || documentType.trim().isEmpty()) {
            documentType = "OTHER";
        }

        String ext = "";
        String originalName = file.getOriginalFilename();
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf("."));
        }

        String safeType = documentType.trim().replaceAll("[^a-zA-Z0-9_\\-]", "_");
        String pageSuffix = (pageNumber != null && pageNumber > 0) ? "_p" + pageNumber : "";
        String fileName = employee.getEmployeeCode() + "_" + safeType + pageSuffix + "_" + System.currentTimeMillis() + ext;

        Path uploadPath = Paths.get(uploadDir).resolve(employee.getEmployeeCode());
        try {
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String title = (documentTitle != null && !documentTitle.trim().isEmpty())
                ? documentTitle.trim()
                : (originalName != null ? originalName : safeType);

            EmployeeDocument doc = EmployeeDocument.builder()
                .employee(employee)
                .documentType(safeType)
                .documentTitle(title)
                .pageNumber(pageNumber)
                .notes(notes)
                .fileName(fileName)
                .originalName(originalName != null ? originalName : fileName)
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedAt(LocalDateTime.now())
                .uploadedBy(uploadedBy)
                .build();

            EmployeeDocument saved = documentRepository.save(doc);
            log.info("Document uploaded: {} ({}) for employee {}", fileName, title, employee.getEmployeeCode());
            return toDTO(saved);
        } catch (IOException e) {
            throw new FileStorageException("Failed to store document: " + e.getMessage());
        }
    }

    @Transactional
    public List<EmployeeDocumentDTO> uploadBatch(
            Long employeeId,
            List<String> documentTypes,
            List<String> documentTitles,
            List<Integer> pageNumbers,
            List<String> notesList,
            List<MultipartFile> files,
            String uploadedBy) {

        List<EmployeeDocumentDTO> results = new ArrayList<>();
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("No files provided for upload");
        }

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            String docType = (documentTypes != null && i < documentTypes.size()) ? documentTypes.get(i) : "OTHER";
            String docTitle = (documentTitles != null && i < documentTitles.size()) ? documentTitles.get(i) : null;
            Integer pageNo = (pageNumbers != null && i < pageNumbers.size()) ? pageNumbers.get(i) : (i + 1);
            String note = (notesList != null && i < notesList.size()) ? notesList.get(i) : null;

            EmployeeDocumentDTO dto = uploadDocument(employeeId, docType, docTitle, pageNo, note, file, uploadedBy);
            results.add(dto);
        }
        return results;
    }

    @Transactional
    public EmployeeDocumentDTO updateDocumentMetadata(
            Long documentId,
            String documentType,
            String documentTitle,
            Integer pageNumber,
            String notes) {

        EmployeeDocument doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        if (documentType != null && !documentType.trim().isEmpty()) {
            doc.setDocumentType(documentType.trim());
        }
        if (documentTitle != null && !documentTitle.trim().isEmpty()) {
            doc.setDocumentTitle(documentTitle.trim());
        }
        if (pageNumber != null) {
            doc.setPageNumber(pageNumber);
        }
        if (notes != null) {
            doc.setNotes(notes);
        }

        EmployeeDocument updated = documentRepository.save(doc);
        return toDTO(updated);
    }

    public Resource downloadDocument(Long documentId) {
        EmployeeDocument doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        Path filePath = Paths.get(doc.getFilePath());
        if (!Files.exists(filePath)) throw new ResourceNotFoundException("File not found on disk");
        return new FileSystemResource(filePath);
    }

    @Transactional(readOnly = true)
    public EmployeeDocument getDocumentEntity(Long documentId) {
        return documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
    }

    @Transactional(readOnly = true)
    public Resource downloadAllAsZip(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        List<EmployeeDocument> docs = documentRepository.findByEmployeeIdOrderByUploadedAtDesc(employeeId);
        if (docs.isEmpty()) {
            throw new BadRequestException("No documents available for employee: " + employee.getEmployeeCode());
        }

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            Set<String> existingNames = new HashSet<>();
            for (EmployeeDocument doc : docs) {
                Path filePath = Paths.get(doc.getFilePath());
                if (Files.exists(filePath)) {
                    String entryName = generateZipEntryName(doc, existingNames);
                    ZipEntry entry = new ZipEntry(entryName);
                    zos.putNextEntry(entry);
                    Files.copy(filePath, zos);
                    zos.closeEntry();
                }
            }
            zos.finish();
            return new ByteArrayResource(baos.toByteArray());
        } catch (IOException e) {
            throw new FileStorageException("Failed to generate documents ZIP: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Resource downloadSelectedAsZip(List<Long> documentIds) {
        if (documentIds == null || documentIds.isEmpty()) {
            throw new BadRequestException("No documents selected for ZIP download");
        }
        List<EmployeeDocument> docs = documentRepository.findAllById(documentIds);
        if (docs.isEmpty()) {
            throw new BadRequestException("No documents found for selected IDs");
        }

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            Set<String> existingNames = new HashSet<>();
            for (EmployeeDocument doc : docs) {
                Path filePath = Paths.get(doc.getFilePath());
                if (Files.exists(filePath)) {
                    String entryName = generateZipEntryName(doc, existingNames);
                    ZipEntry entry = new ZipEntry(entryName);
                    zos.putNextEntry(entry);
                    Files.copy(filePath, zos);
                    zos.closeEntry();
                }
            }
            zos.finish();
            return new ByteArrayResource(baos.toByteArray());
        } catch (IOException e) {
            throw new FileStorageException("Failed to generate documents ZIP: " + e.getMessage());
        }
    }

    private String generateZipEntryName(EmployeeDocument doc, Set<String> existingNames) {
        String empCode = (doc.getEmployee() != null && doc.getEmployee().getEmployeeCode() != null)
            ? doc.getEmployee().getEmployeeCode() : "EMP";

        String ext = "";
        if (doc.getFileName() != null && doc.getFileName().contains(".")) {
            ext = doc.getFileName().substring(doc.getFileName().lastIndexOf("."));
        } else if (doc.getOriginalName() != null && doc.getOriginalName().contains(".")) {
            ext = doc.getOriginalName().substring(doc.getOriginalName().lastIndexOf("."));
        }

        String title = (doc.getDocumentTitle() != null && !doc.getDocumentTitle().isBlank())
            ? doc.getDocumentTitle().trim()
            : (doc.getDocumentType() != null ? doc.getDocumentType() : "Document");

        title = title.replaceAll("[\\\\/:*?\"<>|]", "_").trim();

        String baseName = empCode + "_" + title;
        String finalName = baseName + ext;
        int counter = 1;
        while (existingNames.contains(finalName.toLowerCase())) {
            finalName = baseName + "_" + counter + ext;
            counter++;
        }
        existingNames.add(finalName.toLowerCase());
        return finalName;
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        EmployeeDocument doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        Path filePath = Paths.get(doc.getFilePath());
        try { Files.deleteIfExists(filePath); } catch (IOException e) { log.warn("Could not delete file: {}", doc.getFilePath()); }
        documentRepository.delete(doc);
    }

    private String getFullName(Employee emp) {
        if (emp == null) return "";
        return emp.getFullName();
    }

    public List<SplitPdfPageDTO> splitPdfPages(MultipartFile file) {
        List<SplitPdfPageDTO> pages = new ArrayList<>();
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("PDF file cannot be empty");
        }

        try {
            com.lowagie.text.pdf.PdfReader reader = new com.lowagie.text.pdf.PdfReader(file.getInputStream());
            int totalPages = reader.getNumberOfPages();
            if (totalPages == 0) {
                throw new BadRequestException("PDF has 0 pages");
            }

            for (int i = 1; i <= totalPages; i++) {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                com.lowagie.text.Document document = new com.lowagie.text.Document(reader.getPageSizeWithRotation(i));
                com.lowagie.text.pdf.PdfCopy copy = new com.lowagie.text.pdf.PdfCopy(document, baos);
                document.open();
                com.lowagie.text.pdf.PdfImportedPage page = copy.getImportedPage(reader, i);
                copy.addPage(page);
                document.close();
                copy.close();

                byte[] pageBytes = baos.toByteArray();
                String base64 = java.util.Base64.getEncoder().encodeToString(pageBytes);

                SplitPdfPageDTO dto = SplitPdfPageDTO.builder()
                    .pageNumber(i)
                    .totalPages(totalPages)
                    .fileName(String.format("page_%d.pdf", i))
                    .fileSize((long) pageBytes.length)
                    .base64Data(base64)
                    .build();
                pages.add(dto);
            }
            reader.close();
        } catch (Exception e) {
            log.error("Error splitting PDF file", e);
            throw new BadRequestException("Failed to split PDF document: " + e.getMessage());
        }
        return pages;
    }

    private EmployeeDocumentDTO toDTO(EmployeeDocument doc) {
        return EmployeeDocumentDTO.builder()
            .id(doc.getId())
            .employeeId(doc.getEmployee().getId())
            .employeeCode(doc.getEmployee().getEmployeeCode())
            .employeeName(getFullName(doc.getEmployee()))
            .documentType(doc.getDocumentType())
            .documentTitle(doc.getDocumentTitle() != null ? doc.getDocumentTitle() : doc.getOriginalName())
            .pageNumber(doc.getPageNumber())
            .fileName(doc.getFileName())
            .originalName(doc.getOriginalName())
            .fileSize(doc.getFileSize())
            .contentType(doc.getContentType())
            .notes(doc.getNotes())
            .uploadedAt(doc.getUploadedAt())
            .uploadedBy(doc.getUploadedBy())
            .build();
    }
}
