package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.model.Holiday;
import com.ems.service.HolidayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/leave/holidays")
@RequiredArgsConstructor
public class HolidayController {

    private final HolidayService holidayService;

    @GetMapping
    public ResponseEntity<APIResponse<List<Holiday>>> getHolidays(@RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(APIResponse.success(holidayService.getHolidays(year)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Holiday>> createHoliday(@RequestBody Holiday holiday) {
        return ResponseEntity.ok(APIResponse.success("Holiday created", holidayService.createHoliday(holiday)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Holiday>> updateHoliday(@PathVariable Long id, @RequestBody Holiday holiday) {
        return ResponseEntity.ok(APIResponse.success("Holiday updated", holidayService.updateHoliday(id, holiday)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<APIResponse<Void>> deleteHoliday(@PathVariable Long id) {
        holidayService.deleteHoliday(id);
        return ResponseEntity.ok(APIResponse.success("Holiday deleted", null));
    }
}
