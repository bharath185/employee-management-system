package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.PendingRegistrationDTO;
import com.ems.service.PendingRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/public/register")
@RequiredArgsConstructor
public class PublicRegistrationController {

    private final PendingRegistrationService pendingRegistrationService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<APIResponse<PendingRegistrationDTO>> submitRegistration(
            @RequestParam("firstName") String firstName,
            @RequestParam(value = "middleName", required = false) String middleName,
            @RequestParam("surname") String surname,
            @RequestParam("mobile") String mobile,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "dob", required = false) String dob,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "presentAddress", required = false) String presentAddress,
            @RequestParam(value = "aadharNumber", required = false) String aadharNumber,
            @RequestParam(value = "panNumber", required = false) String panNumber,
            @RequestParam(value = "highestQualification", required = false) String highestQualification,
            @RequestParam(value = "designation", required = false) String designation,
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
            .presentAddress(presentAddress)
            .aadharNumber(aadharNumber)
            .panNumber(panNumber)
            .highestQualification(highestQualification)
            .designation(designation)
            .build();

        PendingRegistrationDTO created = pendingRegistrationService.create(dto, photo, aadharDoc, panDoc);
        return ResponseEntity.ok(APIResponse.success("Registration submitted successfully", created));
    }

    @GetMapping("/qr-data")
    public ResponseEntity<APIResponse<String>> getQrData() {
        String formUrl = "/register-new";
        return ResponseEntity.ok(APIResponse.success("QR code URL", formUrl));
    }
}
