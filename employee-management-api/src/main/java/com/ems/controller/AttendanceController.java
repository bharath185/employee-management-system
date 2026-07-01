package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.AttendanceDTO;
import com.ems.dto.MonthlyAttendanceDTO;
import com.ems.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/monthly")
    public ResponseEntity<APIResponse<MonthlyAttendanceDTO>> getMonthlyAttendance(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(APIResponse.success(attendanceService.getMonthlyAttendance(year, month)));
    }

    @PutMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Void>> bulkUpsert(@RequestBody List<AttendanceDTO> records) {
        attendanceService.bulkUpsert(records);
        return ResponseEntity.ok(APIResponse.success("Attendance updated", null));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> exportExcel(@RequestParam int year, @RequestParam int month) {
        byte[] data = attendanceService.exportExcel(year, month);
        String filename = String.format("Attendance_%d_%02d.xlsx", year, month);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
            .body(data);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> importExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam int year,
            @RequestParam int month) {
        Map<String, Object> result = attendanceService.importExcel(file, year, month);
        return ResponseEntity.ok(APIResponse.success("Import completed", result));
    }
}
