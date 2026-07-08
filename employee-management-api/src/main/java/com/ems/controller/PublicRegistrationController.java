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
            @RequestParam(value = "motherName", required = false) String motherName,
            @RequestParam(value = "motherPhone", required = false) String motherPhone,
            @RequestParam(value = "spouseName", required = false) String spouseName,
            @RequestParam(value = "spousePhone", required = false) String spousePhone,
            @RequestParam(value = "closeRelativeName", required = false) String closeRelativeName,
            @RequestParam(value = "closeRelativeMobile", required = false) String closeRelativeMobile,
            @RequestParam(value = "rationCard", required = false) String rationCard,
            @RequestParam(value = "occupationKinSub", required = false) String occupationKinSub,
            @RequestParam(value = "religion", required = false) String religion,
            @RequestParam(value = "socialCategory", required = false) String socialCategory,
            @RequestParam(value = "socialSubcategory", required = false) String socialSubcategory,
            @RequestParam(value = "levelOfEducation", required = false) String levelOfEducation,
            @RequestParam(value = "yearOfPassing", required = false) String yearOfPassing,
            @RequestParam(value = "percentageMarks", required = false) String percentageMarks,
            @RequestParam(value = "hasTv", required = false) String hasTv,
            @RequestParam(value = "hasFridge", required = false) String hasFridge,
            @RequestParam(value = "hasLaptop", required = false) String hasLaptop,
            @RequestParam(value = "hasWifi", required = false) String hasWifi,
            @RequestParam(value = "has2wheeler", required = false) String has2wheeler,
            @RequestParam(value = "has4wheeler", required = false) String has4wheeler,
            @RequestParam(value = "bloodGroup", required = false) String bloodGroup,
            @RequestParam(value = "sscStatus", required = false) String sscStatus,
            @RequestParam(value = "intermediateStatus", required = false) String intermediateStatus,
            @RequestParam(value = "bachelorsDegree", required = false) String bachelorsDegree,
            @RequestParam(value = "mastersDegree", required = false) String mastersDegree,
            @RequestParam(value = "aadhaarVerification", required = false) String aadhaarVerification,
            @RequestParam(value = "panVerification", required = false) String panVerification,
            @RequestParam(value = "osv", required = false) String osv,
            @RequestParam(value = "remarks", required = false) String remarks,
            @RequestParam(value = "pastExperience", required = false) String pastExperience,
            @RequestParam(value = "organizationName", required = false) String organizationName,
            @RequestParam(value = "periodOfEmployment", required = false) String periodOfEmployment,
            @RequestParam(value = "ref1Name", required = false) String ref1Name,
            @RequestParam(value = "ref1Relationship", required = false) String ref1Relationship,
            @RequestParam(value = "ref1Address", required = false) String ref1Address,
            @RequestParam(value = "ref1Mobile", required = false) String ref1Mobile,
            @RequestParam(value = "ref2Name", required = false) String ref2Name,
            @RequestParam(value = "ref2Relationship", required = false) String ref2Relationship,
            @RequestParam(value = "ref2Address", required = false) String ref2Address,
            @RequestParam(value = "ref2Mobile", required = false) String ref2Mobile,
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
            .motherName(motherName)
            .motherPhone(motherPhone)
            .spouseName(spouseName)
            .spousePhone(spousePhone)
            .closeRelativeName(closeRelativeName)
            .closeRelativeMobile(closeRelativeMobile)
            .rationCard(rationCard)
            .occupationKinSub(occupationKinSub)
            .religion(religion)
            .socialCategory(socialCategory)
            .socialSubcategory(socialSubcategory)
            .levelOfEducation(levelOfEducation)
            .yearOfPassing(yearOfPassing)
            .percentageMarks(percentageMarks)
            .hasTv(hasTv)
            .hasFridge(hasFridge)
            .hasLaptop(hasLaptop)
            .hasWifi(hasWifi)
            .has2wheeler(has2wheeler)
            .has4wheeler(has4wheeler)
            .bloodGroup(bloodGroup)
            .sscStatus(sscStatus)
            .intermediateStatus(intermediateStatus)
            .bachelorsDegree(bachelorsDegree)
            .mastersDegree(mastersDegree)
            .aadhaarVerification(aadhaarVerification)
            .panVerification(panVerification)
            .osv(osv)
            .remarks(remarks)
            .pastExperience(pastExperience)
            .organizationName(organizationName)
            .periodOfEmployment(periodOfEmployment)
            .ref1Name(ref1Name)
            .ref1Relationship(ref1Relationship)
            .ref1Address(ref1Address)
            .ref1Mobile(ref1Mobile)
            .ref2Name(ref2Name)
            .ref2Relationship(ref2Relationship)
            .ref2Address(ref2Address)
            .ref2Mobile(ref2Mobile)
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
