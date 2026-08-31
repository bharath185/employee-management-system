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
            @RequestParam String fromDate,
            @RequestParam String toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String process,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String search) {
        String filter = process != null && !process.isBlank() ? process : department;
        return ResponseEntity.ok(APIResponse.success(attendanceService.getMonthlyAttendance(
            LocalDate.parse(fromDate), LocalDate.parse(toDate), page, size, filter, search)));
    }

    @GetMapping("/processes")
    public ResponseEntity<APIResponse<List<String>>> getProcesses() {
        return ResponseEntity.ok(APIResponse.success(attendanceService.getProcesses()));
    }

    @GetMapping("/departments")
    public ResponseEntity<APIResponse<List<String>>> getDepartments() {
        return ResponseEntity.ok(APIResponse.success(attendanceService.getDepartments()));
    }

    @PostMapping("/seed-month")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> seedMonthAttendance(
            @RequestParam int year,
            @RequestParam int month) {
        Map<String, Object> res = attendanceService.seedMonthlyAttendance(year, month);
        return ResponseEntity.ok(APIResponse.success("Attendance populated successfully", res));
    }

    @PutMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Void>> bulkUpsert(@RequestBody List<AttendanceDTO> records) {
        attendanceService.bulkUpsert(records);
        return ResponseEntity.ok(APIResponse.success("Attendance updated", null));
    }

    @PostMapping("/mark-all-for-date")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> markAllForDate(
            @RequestParam String date,
            @RequestParam String status,
            @RequestParam(required = false) String process) {
        int updated = attendanceService.markAllForDate(LocalDate.parse(date), status, process);
        return ResponseEntity.ok(APIResponse.success(
            "Updated " + updated + " employees to " + status + " for " + date,
            Map.of("date", date, "status", status, "updatedCount", updated)
        ));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> exportExcel(@RequestParam String fromDate, @RequestParam String toDate) {
        byte[] data = attendanceService.exportExcel(LocalDate.parse(fromDate), LocalDate.parse(toDate));
        String filename = "Attendance_" + fromDate + "_to_" + toDate + ".xlsx";
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
            .body(data);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Map<String, Object>>> importExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam String fromDate,
            @RequestParam String toDate) {
        Map<String, Object> result = attendanceService.importExcel(file, LocalDate.parse(fromDate), LocalDate.parse(toDate));
        return ResponseEntity.ok(APIResponse.success("Import completed", result));
    }

    @DeleteMapping("/future")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Integer>> deleteFutureAttendance(@RequestParam LocalDate cutOffDate) {
        int deleted = attendanceService.deleteFutureAttendance(cutOffDate);
        return ResponseEntity.ok(APIResponse.success("Deleted " + deleted + " future records", deleted));
    }
}
