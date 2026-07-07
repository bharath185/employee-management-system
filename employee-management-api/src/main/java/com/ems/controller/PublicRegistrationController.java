package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.MasterDataDTO;
import com.ems.dto.PendingRegistrationDTO;
import com.ems.service.MasterDataService;
import com.ems.service.PendingRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/public/register")
@RequiredArgsConstructor
public class PublicRegistrationController {

    private final PendingRegistrationService pendingRegistrationService;
    private final MasterDataService masterDataService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<APIResponse<PendingRegistrationDTO>> submitRegistration(
            @RequestParam("firstName") String firstName,
            @RequestParam(value = "middleName", required = false) String middleName,
            @RequestParam("surname") String surname,
            @RequestParam("mobile") String mobile,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "dob", required = false) String dob,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "prefix", required = false) String prefix,
            @RequestParam(value = "maritalStatus", required = false) String maritalStatus,
            @RequestParam(value = "presentAddress", required = false) String presentAddress,
            @RequestParam(value = "permanentAddress", required = false) String permanentAddress,
            @RequestParam(value = "aadharNumber", required = false) String aadharNumber,
            @RequestParam(value = "panNumber", required = false) String panNumber,
            @RequestParam(value = "highestQualification", required = false) String highestQualification,
            @RequestParam(value = "designation", required = false) String designation,
            @RequestParam(value = "doj", required = false) String doj,
            @RequestParam(value = "bankName", required = false) String bankName,
            @RequestParam(value = "accountNumber", required = false) String accountNumber,
            @RequestParam(value = "ifscCode", required = false) String ifscCode,
            @RequestParam(value = "branch", required = false) String branch,
            @RequestParam(value = "fatherName", required = false) String fatherName,
            @RequestParam(value = "fatherPhone", required = false) String fatherPhone,
            @RequestParam(value = "languages", required = false) String languages,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @RequestParam(value = "aadharDoc", required = false) MultipartFile aadharDoc,
            @RequestParam(value = "panDoc", required = false) MultipartFile panDoc) {

        PendingRegistrationDTO dto = PendingRegistrationDTO.builder()
            .firstName(firstName)
            .middleName(middleName)
            .surname(surname)
            .mobile(mobile)
            .email(email)
            .dob(dob != null && !dob.isEmpty() ? java.time.LocalDate.parse(dob) : null)
            .gender(gender)
            .prefix(prefix)
            .maritalStatus(maritalStatus)
            .presentAddress(presentAddress)
            .permanentAddress(permanentAddress)
            .aadharNumber(aadharNumber)
            .panNumber(panNumber)
            .highestQualification(highestQualification)
            .designation(designation)
            .doj(doj)
            .bankName(bankName)
            .accountNumber(accountNumber)
            .ifscCode(ifscCode)
            .branch(branch)
            .fatherName(fatherName)
            .fatherPhone(fatherPhone)
            .languages(languages)
            .build();

        PendingRegistrationDTO created = pendingRegistrationService.create(dto, photo, aadharDoc, panDoc);
        return ResponseEntity.ok(APIResponse.success("Registration submitted successfully", created));
    }

    @GetMapping("/qr-data")
    public ResponseEntity<APIResponse<String>> getQrData() {
        String formUrl = "/register-new";
        return ResponseEntity.ok(APIResponse.success("QR code URL", formUrl));
    }

    @GetMapping("/masters/{category}")
    public ResponseEntity<APIResponse<List<com.ems.dto.MasterDataDTO>>> getMasterData(
            @PathVariable String category) {
        List<com.ems.dto.MasterDataDTO> data = masterDataService.getByCategory(category.toUpperCase());
        return ResponseEntity.ok(APIResponse.success(data));
    }
}
