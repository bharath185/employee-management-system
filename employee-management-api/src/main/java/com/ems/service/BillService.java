package com.ems.service;

import com.ems.dto.BillDTO;
import com.ems.exception.BadRequestException;
import com.ems.exception.FileStorageException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.model.Bill;
import com.ems.repository.BillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;

    @Value("${app.bill.upload-dir:uploads/bills}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<BillDTO> getBills(Integer month, Integer year) {
        int m = month != null ? month : LocalDate.now().getMonthValue();
        int y = year != null ? year : LocalDate.now().getYear();
        return billRepository.findByMonthAndYearOrderByCreatedAtDesc(m, y)
            .stream().map(BillDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BillDTO getBill(Long id) {
        Bill bill = billRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
        return BillDTO.fromEntity(bill);
    }

    @Transactional
    public BillDTO createBill(String vendorName, String billType, BigDecimal amount,
                               LocalDate billDate, LocalDate dueDate,
                               String description, MultipartFile file, String username) {
        if (vendorName == null || vendorName.trim().isEmpty())
            throw new BadRequestException("Vendor name is required");
        if (billType == null || billType.trim().isEmpty())
            throw new BadRequestException("Bill type is required");
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new BadRequestException("Valid amount is required");

        LocalDate now = LocalDate.now();
        Bill.BillBuilder builder = Bill.builder()
            .vendorName(vendorName.trim())
            .billType(billType.trim())
            .amount(amount)
            .billDate(billDate != null ? billDate : now)
            .dueDate(dueDate)
            .month(billDate != null ? billDate.getMonthValue() : now.getMonthValue())
            .year(billDate != null ? billDate.getYear() : now.getYear())
            .status("PENDING")
            .description(description != null ? description.trim() : null)
            .createdBy(username)
            .updatedBy(username);

        if (file != null && !file.isEmpty()) {
            try {
                String ext = "";
                String originalName = file.getOriginalFilename();
                if (originalName != null && originalName.contains(".")) {
                    ext = originalName.substring(originalName.lastIndexOf("."));
                }
                String fileName = UUID.randomUUID().toString() + ext;
                Path uploadPath = Paths.get(uploadDir);
                Files.createDirectories(uploadPath);
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                builder.fileName(originalName != null ? originalName : fileName)
                    .filePath(filePath.toString())
                    .fileSize(file.getSize())
                    .contentType(file.getContentType());
            } catch (IOException e) {
                throw new FileStorageException("Failed to store bill file: " + e.getMessage());
            }
        }

        Bill saved = billRepository.save(builder.build());
        log.info("Bill created: {} - {} ({}/{})", saved.getVendorName(), saved.getAmount(), saved.getMonth(), saved.getYear());
        return BillDTO.fromEntity(saved);
    }

    @Transactional
    public BillDTO updateBill(Long id, String vendorName, String billType, BigDecimal amount,
                               LocalDate billDate, LocalDate dueDate,
                               String description, String status,
                               MultipartFile file, String username) {
        Bill bill = billRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));

        if (vendorName != null) bill.setVendorName(vendorName.trim());
        if (billType != null) bill.setBillType(billType.trim());
        if (amount != null) bill.setAmount(amount);
        if (billDate != null) {
            bill.setBillDate(billDate);
            bill.setMonth(billDate.getMonthValue());
            bill.setYear(billDate.getYear());
        }
        if (dueDate != null) bill.setDueDate(dueDate);
        if (description != null) bill.setDescription(description.trim());
        if (status != null) {
            if (!status.equals("PENDING") && !status.equals("PROCESSED"))
                throw new BadRequestException("Status must be PENDING or PROCESSED");
            bill.setStatus(status);
        }
        bill.setUpdatedBy(username);

        if (file != null && !file.isEmpty()) {
            try {
                if (bill.getFilePath() != null) {
                    Path oldFile = Paths.get(bill.getFilePath());
                    try { Files.deleteIfExists(oldFile); } catch (IOException e) { log.warn("Could not delete old file: {}", bill.getFilePath()); }
                }
                String ext = "";
                String originalName = file.getOriginalFilename();
                if (originalName != null && originalName.contains(".")) {
                    ext = originalName.substring(originalName.lastIndexOf("."));
                }
                String fileName = UUID.randomUUID().toString() + ext;
                Path uploadPath = Paths.get(uploadDir);
                Files.createDirectories(uploadPath);
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                bill.setFileName(originalName != null ? originalName : fileName);
                bill.setFilePath(filePath.toString());
                bill.setFileSize(file.getSize());
                bill.setContentType(file.getContentType());
            } catch (IOException e) {
                throw new FileStorageException("Failed to store bill file: " + e.getMessage());
            }
        }

        Bill saved = billRepository.save(bill);
        log.info("Bill updated: {} - {} ({}/{})", saved.getVendorName(), saved.getAmount(), saved.getMonth(), saved.getYear());
        return BillDTO.fromEntity(saved);
    }

    @Transactional
    public BillDTO toggleStatus(Long id, String username) {
        Bill bill = billRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
        bill.setStatus("PROCESSED".equals(bill.getStatus()) ? "PENDING" : "PROCESSED");
        bill.setUpdatedBy(username);
        Bill saved = billRepository.save(bill);
        log.info("Bill {} status toggled to {}", id, saved.getStatus());
        return BillDTO.fromEntity(saved);
    }

    @Transactional
    public void deleteBill(Long id) {
        Bill bill = billRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
        if (bill.getFilePath() != null) {
            Path filePath = Paths.get(bill.getFilePath());
            try { Files.deleteIfExists(filePath); } catch (IOException e) { log.warn("Could not delete file: {}", bill.getFilePath()); }
        }
        billRepository.delete(bill);
        log.info("Bill deleted: {}", id);
    }

    public Resource getBillFile(Long id) {
        Bill bill = billRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
        if (bill.getFilePath() == null) throw new ResourceNotFoundException("No file attached to this bill");
        Path filePath = Paths.get(bill.getFilePath());
        if (!Files.exists(filePath)) throw new ResourceNotFoundException("File not found on disk");
        return new FileSystemResource(filePath);
    }
}
