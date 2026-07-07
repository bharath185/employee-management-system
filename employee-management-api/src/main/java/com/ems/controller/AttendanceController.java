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

import java.time.LocalDate;
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
            @RequestParam int month,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String department) {
        return ResponseEntity.ok(APIResponse.success(attendanceService.getMonthlyAttendance(year, month, page, size, department)));
    }

    @GetMapping("/departments")
    public ResponseEntity<APIResponse<List<String>>> getDepartments() {
        return ResponseEntity.ok(APIResponse.success(attendanceService.getDepartments()));
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
        String filename = String.format("Attendance_%s_%d.xlsx",
            String.format("%s'%04d",
                new String[]{"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"}[month-1],
                year),
            month);
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

    @DeleteMapping("/future")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Integer>> deleteFutureAttendance(@RequestParam LocalDate cutOffDate) {
        int deleted = attendanceService.deleteFutureAttendance(cutOffDate);
        return ResponseEntity.ok(APIResponse.success("Deleted " + deleted + " future records", deleted));
    }
}
